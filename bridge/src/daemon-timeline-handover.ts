/** Transport cache for a same-user daemon handover. Only the bound daemon
 * writes timeline.json; the CLI stages the peer's recent wire snapshot here. */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import WebSocket from 'ws';
import { getDataDir } from './session-registry.js';
import { BridgeTimelineStore } from './timeline-store.js';

const cachePath = () => join(getDataDir(), 'timeline-handover.json');

export function loadHandoverTimeline(): unknown[] {
  try {
    const rows: unknown = JSON.parse(readFileSync(cachePath(), 'utf8'));
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

/** Read the existing authenticated dashboard snapshot; never read the app's
 * sandbox container (which can block Node on a TCC prompt). */
export function capturePeerTimeline(port: number, token: unknown, timeoutMs = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const url = new URL(`ws://127.0.0.1:${port}`);
    if (typeof token === 'string' && token) url.searchParams.set('token', token);
    const socket = new WebSocket(url, { maxPayload: 4 * 1024 * 1024, handshakeTimeout: timeoutMs });
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.terminate();
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    socket.on('error', () => finish(false));
    socket.on('close', () => finish(false));
    socket.on('message', (data) => {
      try {
        const event = JSON.parse(data.toString());
        // Per-session snapshots must not replace the daemon-wide history.
        if (event.type !== 'timeline_history' || event.sessionId || !Array.isArray(event.entries)) return;
        const store = new BridgeTimelineStore();
        store.loadPersistedEntries(event.entries);
        mkdirSync(getDataDir(), { recursive: true });
        const path = cachePath();
        const tmp = `${path}.${process.pid}.tmp`;
        writeFileSync(tmp, JSON.stringify(store.getHistory()), { mode: 0o600 });
        renameSync(tmp, path);
        finish(true);
      } catch { finish(false); }
    });
  });
}
