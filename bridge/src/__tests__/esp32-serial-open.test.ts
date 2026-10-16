import { afterEach, describe, expect, it, vi } from 'vitest';
import { openSerialFd } from '../esp32-serial.js';

describe('serial driver open deadline', () => {
  afterEach(() => vi.useRealTimers());

  it('allows a healthy driver to finish beyond the quick probe deadline', async () => {
    vi.useFakeTimers();
    let complete!: (error: NodeJS.ErrnoException | null, fd: number) => void;
    const closer = vi.fn();
    const result = openSerialFd('/dev/test-slow-healthy', undefined,
      (_port, _flags, callback) => { complete = callback; }, closer);
    await vi.advanceTimersByTimeAsync(2_000);
    complete(null, 46);
    await expect(result).resolves.toBe(46);
    expect(closer).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('times out a silent driver, blocks duplicate opens, and closes its late descriptor', async () => {
    vi.useFakeTimers();
    let complete!: (error: NodeJS.ErrnoException | null, fd: number) => void;
    const opener = vi.fn((_port, _flags, callback) => { complete = callback; });
    const closer = vi.fn();
    const result = openSerialFd('/dev/test-stalled-driver', 100, opener, closer);
    const rejected = expect(result).rejects.toThrow('timed out');
    let heartbeat = 0;
    setTimeout(() => { heartbeat += 1; }, 50);
    await vi.advanceTimersByTimeAsync(100);
    await rejected;
    expect(heartbeat).toBe(1);
    await expect(openSerialFd('/dev/test-stalled-driver', 100, opener, closer)).rejects.toThrow('still pending');
    expect(opener).toHaveBeenCalledTimes(1);
    complete(null, 42);
    expect(closer).toHaveBeenCalledExactlyOnceWith(42);
    const recovered = openSerialFd('/dev/test-stalled-driver', 100, (_p, _f, callback) => callback(null, 43), closer);
    await expect(recovered).resolves.toBe(43);
    expect(closer).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('also rejects a late completion when the timer has not run yet', async () => {
    vi.useFakeTimers({ now: 1_000 });
    let complete!: (error: NodeJS.ErrnoException | null, fd: number) => void;
    const closer = vi.fn();
    const result = openSerialFd('/dev/test-delayed-loop', 100, (_p, _f, callback) => { complete = callback; }, closer);
    const rejected = expect(result).rejects.toThrow('timed out');
    vi.setSystemTime(1_101);
    complete(null, 44);
    await rejected;
    expect(closer).toHaveBeenCalledExactlyOnceWith(44);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('returns prompt driver errors and releases the pending slot', async () => {
    vi.useFakeTimers();
    const denied = Object.assign(new Error('access denied'), { code: 'EACCES' });
    const closer = vi.fn();
    await expect(openSerialFd('/dev/test-denied', 100,
      (_p, _f, callback) => callback(denied, -1), closer)).rejects.toBe(denied);
    await expect(openSerialFd('/dev/test-denied', 100,
      () => { throw denied; }, closer)).rejects.toBe(denied);
    await expect(openSerialFd('/dev/test-denied', 100,
      (_p, _f, callback) => callback(null, 45), closer)).resolves.toBe(45);
    expect(closer).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
