import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocketServer } from 'ws';
import { capturePeerTimeline, loadHandoverTimeline } from '../daemon-timeline-handover.js';
import { BridgeTimelineStore } from '../timeline-store.js';

const prior = process.env.AGENTDECK_DATA_DIR;
let dir: string;
let server: WebSocketServer;
afterEach(async () => {
  if (server) {
    for (const client of server.clients) client.terminate();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  if (dir) rmSync(dir, { recursive: true, force: true });
  if (prior === undefined) delete process.env.AGENTDECK_DATA_DIR;
  else process.env.AGENTDECK_DATA_DIR = prior;
});
async function setup() {
  dir = mkdtempSync(join(tmpdir(), 'timeline-handover-'));
  process.env.AGENTDECK_DATA_DIR = dir;
  server = new WebSocketServer({ port: 0 });
  await new Promise<void>((resolve) => server.on('listening', resolve));
  const address = server.address();
  if (typeof address === 'string') throw new Error('unexpected socket');
  return address.port;
}
describe('Swift timeline handover', () => {
  it('stages the global snapshot without writing timeline.json, then merges both histories', async () => {
    const port = await setup();
    const old = { ts: 1000, type: 'chat_response', raw: 'CLI done', sessionId: 'one' };
    const newer = { ts: 2000.5, type: 'chat_response', raw: 'Swift done', sessionId: 'codex:two' };
    writeFileSync(join(dir, 'timeline.json'), JSON.stringify([old]));
    let receivedUrl = '';
    server.on('connection', (socket, request) => {
      receivedUrl = request.url!;
      socket.send(JSON.stringify({ type: 'timeline_history', sessionId: 'unrelated', entries: [] }));
      socket.send(JSON.stringify({ type: 'timeline_history', entries: [newer] }));
    });
    expect(await capturePeerTimeline(port, 'test token')).toBe(true);
    expect(receivedUrl).toBe('/?token=test+token');
    expect(JSON.parse(readFileSync(join(dir, 'timeline.json'), 'utf8'))).toEqual([old]);
    const store = new BridgeTimelineStore();
    store.loadPersistedEntries(loadHandoverTimeline());
    store.loadPersistedFile(join(dir, 'timeline.json'));
    expect(store.getHistory().map((row) => row.raw)).toEqual(['CLI done', 'Swift done']);
  });
  it('bounds a silent peer and retains the previous staged snapshot on failure', async () => {
    const port = await setup();
    writeFileSync(join(dir, 'timeline-handover.json'), '[{"raw":"keep"}]');
    expect(await capturePeerTimeline(port, undefined, 50)).toBe(false);
    expect(loadHandoverTimeline()).toEqual([{ raw: 'keep' }]);
  });
  it('accepts an explicitly empty global history', async () => {
    const port = await setup();
    server.on('connection', (socket) => socket.send('{"type":"timeline_history","entries":[]}'));
    expect(await capturePeerTimeline(port, undefined)).toBe(true);
    expect(loadHandoverTimeline()).toEqual([]);
  });
});
