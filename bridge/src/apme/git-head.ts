import { openSync, readSync, closeSync, fstatSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

function text(path: string, limit = 8192): string | null {
  let fd: number | undefined;
  try {
    fd = openSync(path, 'r');
    if (fstatSync(fd).size > limit) return null;
    const buffer = Buffer.alloc(limit);
    return buffer.subarray(0, readSync(fd, buffer, 0, limit, 0)).toString('utf8').trim();
  } catch { return null; }
  finally { if (fd !== undefined) { try { closeSync(fd); } catch { /* unknown */ } } }
}

/** Read the actual HEAD at the hook boundary without waiting for a Git child.
 * Unborn, malformed or unreadable metadata stays unknown. No stale hash cache. */
export function readGitHead(cwd?: string): string | null {
  if (!cwd) return null;
  let directory = resolve(cwd);
  let gitDir: string | undefined;
  while (true) {
    const marker = join(directory, '.git');
    try {
      if (statSync(marker).isDirectory()) gitDir = marker;
      else {
        const pointer = text(marker)?.match(/^gitdir:\s*(.+)$/)?.[1];
        if (!pointer) return null;
        gitDir = resolve(directory, pointer);
      }
      break;
    } catch (error) {
      // An inaccessible repository is unknown, never its parent's repository.
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return null;
    }
    const parent = dirname(directory);
    if (parent === directory) return null;
    directory = parent;
  }
  const commonPointer = text(join(gitDir, 'commondir'));
  const common = commonPointer ? resolve(gitDir, commonPointer) : gitDir;
  const hash = (value: string | null) => value && /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(value) ? value : null;
  let value = text(join(gitDir, 'HEAD'));
  const seen = new Set<string>();
  for (let depth = 0; depth < 16; depth++) {
    const head = hash(value);
    if (head) return head;
    const ref = value?.match(/^ref:\s*(refs\/\S+)$/)?.[1];
    if (!ref || ref.includes('..') || ref.includes('\\') || seen.has(ref)) return null;
    seen.add(ref);
    value = text(join(gitDir, ref)) ?? text(join(common, ref));
    if (value) continue;
    const packed = text(join(common, 'packed-refs'), 1024 * 1024);
    for (const line of packed?.split('\n') ?? []) {
      const [candidate, name] = line.split(' ');
      if (name === ref) return hash(candidate);
    }
    return null;
  }
  return null;
}
