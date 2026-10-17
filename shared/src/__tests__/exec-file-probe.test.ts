import { afterEach, describe, expect, it, vi } from 'vitest';
const io = vi.hoisted(() => ({ done: undefined as undefined | ((error: Error | null, output: string) => void), kill: vi.fn(), unref: vi.fn(), destroy: vi.fn() }));
vi.mock('node:child_process', () => ({ execFile: vi.fn((_file, _args, _options, done) => {
  io.done = done; return { kill: io.kill, unref: io.unref, stdout: { destroy: io.destroy }, stderr: { destroy: io.destroy } };
}) }));
import { execFile } from 'node:child_process';
import { execFileProbe } from '../exec-file-probe.js';
afterEach(() => { io.done?.(new Error('cleanup'), ''); vi.useRealTimers(); vi.clearAllMocks(); });
describe('bounded local process probes', () => {
  it('settles at the deadline even if SIGKILL never produces an exit, without spawning repeated children', async () => {
    vi.useFakeTimers();
    const first = execFileProbe('stuck', [], { timeout: 1000 });
    expect(execFileProbe('stuck', [], { timeout: 1000 })).toBe(first);
    const rejected = expect(first).rejects.toMatchObject({ code: 'ETIMEDOUT' });
    await vi.advanceTimersByTimeAsync(1000); await rejected;
    expect(io.kill).toHaveBeenCalledWith('SIGKILL');
    expect(io.unref).toHaveBeenCalledOnce();
    expect(execFileProbe('stuck', [], { timeout: 1000 })).toBe(first);
    expect(execFile).toHaveBeenCalledOnce();
    io.done!(new Error('finally reaped'), '');
    const retry = execFileProbe('stuck', [], { timeout: 1000 });
    expect(retry).not.toBe(first);
    io.done!(null, 'recovered');
    expect(await retry).toBe('recovered');
  });
});
