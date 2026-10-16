import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  CLAUDE_STATUSLINE_FRESH_MS,
  claudeOAuthCarryOverFresh,
  claudeStatuslineChanged,
  classifyClaudeStatuslineAge,
  parseClaudeStatusline,
  shouldPollClaudeOAuth,
  type ClaudeStatuslineReading,
  type ClaudeStatuslineWindow,
} from '../claude-statusline.js';

interface WindowVector { usedPercent: number; resetsAt: string | null }
interface ReadingVector { fiveHour: WindowVector | null; sevenDay: WindowVector | null }

const vectors = JSON.parse(readFileSync(
  fileURLToPath(new URL('../../claude-statusline-vectors.json', import.meta.url)), 'utf8',
)) as {
  now: number;
  parse: Array<{ name: string; payload: unknown; expected: null | (ReadingVector & { sessionId: string | null; model: string | null; version: string | null }) }>;
  age: Array<{ name: string; receivedAt: number | null; age: string }>;
  poll: Array<{ name: string; statuslineReceivedAt: number | null; lastOAuthFetchAt: number | null; oauthHasScopedLimits: boolean; poll: boolean }>;
  carry: Array<{ name: string; lastOAuthFetchAt: number | null; carry: boolean }>;
  changed: Array<{ name: string; prev: ReadingVector | null; next: ReadingVector; changed: boolean }>;
};

const RECEIVED_AT = 1792108799000;

function reading(v: ReadingVector): ClaudeStatuslineReading {
  const win = (w: WindowVector | null): ClaudeStatuslineWindow | null => (w ? { usedPercent: w.usedPercent, resetsAt: w.resetsAt } : null);
  return { fiveHour: win(v.fiveHour), sevenDay: win(v.sevenDay), sessionId: null, model: null, version: null, receivedAt: RECEIVED_AT };
}

describe('claude status-line relay rules (shared vectors)', () => {
  it('has vectors in every section', () => {
    for (const section of ['parse', 'age', 'poll', 'carry', 'changed'] as const) {
      expect(vectors[section].length, section).toBeGreaterThan(0);
    }
  });

  describe('parse', () => {
    for (const v of vectors.parse) {
      it(v.name, () => {
        const got = parseClaudeStatusline(v.payload, RECEIVED_AT);
        if (v.expected === null) {
          expect(got).toBeNull();
          return;
        }
        expect(got).toEqual({ ...v.expected, receivedAt: RECEIVED_AT });
      });
    }
  });

  describe('age', () => {
    for (const v of vectors.age) {
      it(v.name, () => expect(classifyClaudeStatuslineAge(v.receivedAt, vectors.now)).toBe(v.age));
    }
    it('fresh bound is the exported constant', () => {
      expect(classifyClaudeStatuslineAge(vectors.now - CLAUDE_STATUSLINE_FRESH_MS, vectors.now)).toBe('fresh');
      expect(classifyClaudeStatuslineAge(vectors.now - CLAUDE_STATUSLINE_FRESH_MS - 1, vectors.now)).toBe('aged');
    });
  });

  describe('OAuth poll decision', () => {
    for (const v of vectors.poll) {
      it(v.name, () => expect(shouldPollClaudeOAuth({
        statuslineReceivedAt: v.statuslineReceivedAt,
        lastOAuthFetchAt: v.lastOAuthFetchAt,
        oauthHasScopedLimits: v.oauthHasScopedLimits,
        now: vectors.now,
      })).toBe(v.poll));
    }
  });

  describe('OAuth carry-over', () => {
    for (const v of vectors.carry) {
      it(v.name, () => expect(claudeOAuthCarryOverFresh(v.lastOAuthFetchAt, vectors.now)).toBe(v.carry));
    }
  });

  describe('changed', () => {
    for (const v of vectors.changed) {
      it(v.name, () => expect(claudeStatuslineChanged(v.prev ? reading(v.prev) : null, reading(v.next))).toBe(v.changed));
    }
  });
});
