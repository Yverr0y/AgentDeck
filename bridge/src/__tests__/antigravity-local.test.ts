import { afterEach, describe, expect, it, vi } from 'vitest';
const io = vi.hoisted(() => ({ callbacks: [] as Array<(error: Error | null, output: string) => void> }));
vi.mock('fs', async original => ({ ...await original<typeof import('fs')>(), existsSync: () => true }));
vi.mock('child_process', () => ({ execFile: vi.fn((_file, _args, _options, callback) => { io.callbacks.push(callback); }) }));
import { execFile } from 'child_process';
import { readAntigravityLocalStatus } from '../antigravity-local.js';
afterEach(() => { io.callbacks.length = 0; vi.clearAllMocks(); });

describe('Antigravity local status', () => {
  it('yields while sqlite is pending and reads the auth record only once', async () => {
    let done = false;
    const result = readAntigravityLocalStatus().finally(() => { done = true; });
    expect(done).toBe(false);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(done).toBe(false);
    const auth = JSON.stringify({ userStatusProtoBinaryBase64: Buffer.from('Google AI Pro').toString('base64') });
    io.callbacks.shift()!(null, Buffer.from(auth).toString('hex'));
    await Promise.resolve(); await Promise.resolve();
    expect(execFile).toHaveBeenCalledTimes(2);
    io.callbacks.shift()!(null, '');
    expect(await result).toMatchObject({ planName: 'Google AI Pro' });
    expect(execFile).toHaveBeenCalledWith('/usr/bin/sqlite3', expect.any(Array),
      expect.objectContaining({ timeout: 3000, killSignal: 'SIGKILL' }), expect.any(Function));
  });
});
