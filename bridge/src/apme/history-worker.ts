import { parentPort, workerData } from 'node:worker_threads';
import { ApmeStore } from './store.js';
import { historyProjection, type HistoryKind } from './history-projection.js';

const store = new ApmeStore((workerData as { dbPath: string }).dbPath);
if (!(await store.init({ readOnly: true }))) throw new Error('APME history store unavailable');
const port = parentPort;
if (!port) throw new Error('APME history worker requires a parent');
port.on('message', ({ id, kind, params }: { id: number; kind: HistoryKind; params: string }) => {
  try {
    if (kind !== 'tasks' && kind !== 'communications') throw new Error('Unknown history projection');
    const body = store.readSnapshot(() => historyProjection(store, kind, new URLSearchParams(params)));
    const bytes = new TextEncoder().encode(JSON.stringify(body));
    port.postMessage({ id, bytes: bytes.buffer }, [bytes.buffer]);
  } catch {
    port.postMessage({ id, error: 'APME history read failed' });
  }
});
port.on('close', () => store.close());
