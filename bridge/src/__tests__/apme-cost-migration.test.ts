import { describe, it, expect, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import Database from 'better-sqlite3';
import { ApmeStore } from '../apme/store.js';

describe('cost provenance migration', () => {
  it('backfills legacy positive costs once, preserves unknown zero and modern partial costs on reopen', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'apme-cost-migration-'));
    const path = join(dir, 'apme.sqlite');
    const store = new ApmeStore(path);
    const tables = ['runs', 'tasks', 'sample_events'];
    try {
      expect(await store.init()).toBe(true);
      store.close();
      const db = new Database(path);
      try {
        for (const { name } of db.prepare("SELECT name FROM sqlite_master WHERE type='view'").all() as { name: string }[]) {
          db.exec(`DROP VIEW ${name}`);
        }
        for (const table of tables) db.exec(`ALTER TABLE ${table} DROP COLUMN cost_known`);
        for (const [id, cost] of [['positive', 0.5], ['zero', 0]] as const) {
          db.prepare('INSERT INTO runs(id, session_id, agent_type, started_at, cost_usd) VALUES (?, ?, ?, 1, ?)').run(id, id, 'claude-code', cost);
          db.prepare('INSERT INTO tasks(id, run_id, task_index, boundary_signal, started_at, cost_usd) VALUES (?, ?, 0, ?, 1, ?)').run(id, id, 'prompt', cost);
          db.prepare('INSERT INTO sample_events(task_id, run_id, seq, ts, kind, cost_usd) VALUES (?, ?, 0, 1, ?, ?)').run(id, id, 'usage', cost);
        }
      } finally { db.close(); }
      expect(await store.init()).toBe(true);
      store.close();
      const migrated = new Database(path);
      try {
        for (const table of tables) {
          expect(migrated.prepare(`SELECT cost_known FROM ${table} ORDER BY cost_usd`).all()).toEqual([{ cost_known: 0 }, { cost_known: 1 }]);
          // A modern total includes a priced and an unpriced call: a positive
          // subtotal does not mean the complete cost is known.
          migrated.exec(`UPDATE ${table} SET cost_known=0 WHERE cost_usd>0`);
        }
      } finally { migrated.close(); }
      const exec = vi.spyOn(Database.prototype, 'exec');
      try {
        expect(await store.init()).toBe(true);
        // Pin the absence of the unbounded startup scan, not a fixture timing.
        expect(exec.mock.calls.filter(([sql]) => /UPDATE\s+(runs|tasks|sample_events)\s+SET\s+cost_known/i.test(sql))).toEqual([]);
      } finally { exec.mockRestore(); }
      store.close();
      const reopened = new Database(path, { readonly: true });
      try {
        for (const table of tables) {
          expect(reopened.prepare(`SELECT cost_known FROM ${table}`).all()).toEqual([{ cost_known: 0 }, { cost_known: 0 }]);
        }
      } finally { reopened.close(); }
    } finally {
      store.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
