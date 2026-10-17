import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const io = vi.hoisted(() => ({
  callbacks: [] as Array<(error: Error | null, output: string) => void>,
  interfaces: {} as Record<string, unknown>,
}));
vi.mock('os', async original => ({ ...await original<typeof import('os')>(), networkInterfaces: () => io.interfaces }));
vi.mock('node:child_process', () => ({ execFile: vi.fn((_file, _args, _options, callback) => { io.callbacks.push(callback); }) }));
import { execFile } from 'node:child_process';
const net = (address: string) => ({ family: 'IPv4', internal: false, address });
const routed = () => process.platform === 'win32' ? '0.0.0.0 0.0.0.0 192.0.2.1 192.0.2.10 10'
  : process.platform === 'linux' ? '1.1.1.1 via 192.0.2.1 dev en0 src 192.0.2.10' : 'interface: en0';
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks(); vi.useFakeTimers();
  io.callbacks.length = 0;
  io.interfaces = { en0: [net('192.0.2.10')], en1: [net('192.0.2.11')] };
});
afterEach(() => { vi.useRealTimers(); });
describe('default-route refresh', () => {
  it('keeps callers responsive and shares one pending route probe', async () => {
    const { getLanIp } = await import('../net-utils.js');
    for (let i = 0; i < 10; i++) expect(getLanIp()).toBe('192.0.2.11');
    expect(execFile).toHaveBeenCalledTimes(1);
    let heartbeat = false;
    setTimeout(() => { heartbeat = true; }, 10);
    await vi.advanceTimersByTimeAsync(10);
    expect(heartbeat).toBe(true);
    io.callbacks.shift()!(null, routed());
    await Promise.resolve();
    expect(getLanIp()).toBe('192.0.2.10');
    expect(execFile).toHaveBeenCalledTimes(1);
  });
  it('retains a usable route on probe failure and drops an address withdrawn by the OS', async () => {
    const { getLanIp } = await import('../net-utils.js');
    getLanIp(); io.callbacks.shift()!(null, routed());
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(3001);
    expect(getLanIp()).toBe('192.0.2.10');
    io.callbacks.shift()!(new Error('timeout'), '');
    await Promise.resolve();
    expect(getLanIp()).toBe('192.0.2.10');
    delete io.interfaces.en0;
    expect(getLanIp()).toBe('192.0.2.11');
  });
});
