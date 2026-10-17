import { Worker } from 'node:worker_threads';
import type { HistoryKind } from './history-projection.js';

type Pending = {
  key: string;
  promise: Promise<ArrayBuffer>;
  resolve: (bytes: ArrayBuffer) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

/** A slow WAL reader must not hold up hooks, health or WebSocket heartbeats. */
export class ApmeHistoryReader {
  private worker: Worker | null = null;
  private retiring: Promise<void> | null = null;
  private pending = new Map<number, Pending>();
  private nextId = 0;
  private closed = false;
  private failures = 0;
  private timeouts = 0;

  constructor(private readonly dbPath: string, private readonly options: {
    workerUrl?: URL;
    timeoutMs?: number;
    maxPending?: number;
  } = {}) {}

  diagnostics() {
    return { pending: this.pending.size, workerActive: this.worker !== null, retiring: this.retiring !== null, failures: this.failures, timeouts: this.timeouts };
  }

  read(kind: HistoryKind, params: string): Promise<ArrayBuffer> {
    if (this.closed) return Promise.reject(new Error('APME history reader closed'));
    const key = JSON.stringify([kind, params]);
    for (const pending of this.pending.values()) if (pending.key === key) return pending.promise;
    if (this.pending.size >= (this.options.maxPending ?? 8)) return Promise.reject(new Error('APME history reader busy'));
    let worker: Worker;
    try { worker = this.ensureWorker(); }
    catch { return Promise.reject(new Error('APME history worker unavailable')); }
    const id = ++this.nextId;
    let resolve!: Pending['resolve'];
    let reject!: Pending['reject'];
    const promise = new Promise<ArrayBuffer>((ok, fail) => { resolve = ok; reject = fail; });
    const timer = setTimeout(() => {
      this.timeouts += 1;
      this.failWorker(worker, new Error('APME history read deadline'));
    }, this.options.timeoutMs ?? 10_000);
    this.pending.set(id, { key, promise, resolve, reject, timer });
    try { worker.postMessage({ id, kind, params }); }
    catch { this.failWorker(worker, new Error('APME history worker unavailable')); }
    return promise;
  }

  close(): void {
    this.closed = true;
    if (this.worker) this.failWorker(this.worker, new Error('APME history reader closed'));
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    if (this.retiring) throw new Error('APME history worker still retiring');
    const worker = new Worker(this.options.workerUrl ?? new URL('./history-worker.js', import.meta.url), {
      workerData: { dbPath: this.dbPath },
    });
    this.worker = worker;
    worker.on('message', (message: { id: number; bytes?: ArrayBuffer; error?: string }) => {
      if (this.worker !== worker) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(message.id);
      if (message.bytes instanceof ArrayBuffer) pending.resolve(message.bytes);
      else {
        this.failures += 1;
        pending.reject(new Error('APME history read failed'));
      }
    });
    worker.on('error', () => this.failWorker(worker, new Error('APME history worker failed')));
    worker.on('exit', () => this.failWorker(worker, new Error('APME history worker exited')));
    worker.unref();
    return worker;
  }

  private failWorker(worker: Worker, error: Error): void {
    if (this.worker !== worker) return;
    this.worker = null;
    if (!this.closed) this.failures += 1;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
    // Native SQLite can take time to unwind. Teardown cannot await that peer.
    worker.unref();
    const retiring = worker.terminate().then(() => {}, () => {}).finally(() => {
      if (this.retiring === retiring) this.retiring = null;
    });
    this.retiring = retiring;
  }
}
