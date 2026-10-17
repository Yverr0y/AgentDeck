import { execFile, type ChildProcess } from 'node:child_process';

const inFlight = new Map<string, Promise<string>>();

/** A child deadline must settle even when macOS cannot reap a killed process.
 * Keep that probe latched until its callback arrives, so a stuck kernel child
 * cannot create a new process on every polling tick. No command output is logged. */
export function execFileProbe(file: string, args: string[], options: {
  timeout: number; cwd?: string; maxBuffer?: number;
}): Promise<string> {
  const key = JSON.stringify([file, args, options.cwd ?? null, options.timeout, options.maxBuffer ?? null]);
  const existing = inFlight.get(key);
  if (existing) return existing;
  let reaped = false;
  let child: ChildProcess | undefined;
  const promise = new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      const error = Object.assign(new Error('Local probe deadline exceeded'), { code: 'ETIMEDOUT' });
      reject(error);
      child?.kill('SIGKILL');
      child?.stdout?.destroy();
      child?.stderr?.destroy();
      child?.unref();
    }, options.timeout);
    try {
      child = execFile(file, args, { ...options, encoding: 'utf8', killSignal: 'SIGKILL', windowsHide: true },
        (error, stdout) => {
          reaped = true;
          clearTimeout(timer);
          inFlight.delete(key);
          if (error) reject(error); else resolve(stdout);
        });
    } catch (error) {
      reaped = true;
      clearTimeout(timer);
      reject(error);
    }
  });
  if (!reaped) inFlight.set(key, promise);
  return promise;
}
