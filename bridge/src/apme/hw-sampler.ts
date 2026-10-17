/**
 * APME Hardware Sampler.
 *
 * Samples the machine's approximate resource state so the recommender can
 * factor in "is the Mac Studio free enough to run a local MLX judge right
 * now?" when ranking candidates.
 *
 * macOS-only for v1 — uses `sysctl`, `vm_stat`, and `sw_vers`. Anything that
 * needs elevated privileges (powermetrics, IOReport) is deliberately avoided.
 * On other platforms we return a minimal snapshot and callers fall back to
 * neutral behavior.
 */

import { execFileText } from './process.js';
import { debug } from '../logger.js';

export interface HwSnapshot {
  platform: NodeJS.Platform;
  /** Total physical RAM in bytes, if available. */
  memTotal?: number;
  /** Resident RAM in use (active+wired+compressed) in bytes, if available. */
  memUsed?: number;
  /** Normalized CPU load (0..1) — 1-minute average divided by logical CPU count. */
  cpuLoad?: number;
  /** Logical CPU count. */
  cpuCount?: number;
  /** Hardware model, e.g. "Mac14,14" (Mac Studio M2 Max). */
  model?: string;
  timestamp: number;
}

async function safeSysctl(key: string): Promise<string | null> {
  try {
    return (await execFileText('sysctl', ['-n', key], { timeout: 1000 })).trim();
  } catch {
    return null;
  }
}

async function readMacMemory(): Promise<{ total?: number; used?: number }> {
  const total = await safeSysctl('hw.memsize');
  let memTotal: number | undefined;
  if (total) {
    const n = Number(total);
    if (isFinite(n) && n > 0) memTotal = n;
  }

  let memUsed: number | undefined;
  try {
    const out = await execFileText('vm_stat', [], { timeout: 1000 });
    // vm_stat prints "page size of N bytes" on the first line, then
    // "Pages active:   N." style lines.
    const pageSizeMatch = out.match(/page size of (\d+) bytes/);
    const pageSize = pageSizeMatch ? parseInt(pageSizeMatch[1], 10) : 4096;
    const pickPages = (label: string): number => {
      const re = new RegExp(`${label}:\\s+(\\d+)\\.?`);
      const m = out.match(re);
      return m ? parseInt(m[1], 10) : 0;
    };
    const active = pickPages('Pages active');
    const wired = pickPages('Pages wired down');
    const compressed = pickPages('Pages occupied by compressor');
    memUsed = (active + wired + compressed) * pageSize;
  } catch {
    /* ignore */
  }
  return { total: memTotal, used: memUsed };
}

async function readMacCpu(): Promise<{ load?: number; count?: number }> {
  const count = await safeSysctl('hw.logicalcpu');
  let cpuCount: number | undefined;
  if (count) {
    const n = Number(count);
    if (isFinite(n) && n > 0) cpuCount = n;
  }

  let cpuLoad: number | undefined;
  try {
    // `uptime` prints "... load averages: 1.23 1.45 1.67"
    const out = await execFileText('uptime', [], { timeout: 1000 });
    const m = out.match(/load averages?:\s+([0-9.]+)/);
    if (m && cpuCount) {
      const load1 = parseFloat(m[1]);
      if (isFinite(load1) && load1 >= 0) {
        cpuLoad = Math.min(1, load1 / cpuCount);
      }
    }
  } catch {
    /* ignore */
  }
  return { load: cpuLoad, count: cpuCount };
}

export class ApmeHwSampler {
  private pending: Promise<HwSnapshot> | null = null;
  snapshot(): Promise<HwSnapshot> {
    if (this.pending) return this.pending;
    const pending = this.sample().finally(() => { if (this.pending === pending) this.pending = null; });
    this.pending = pending;
    return pending;
  }

  private async sample(): Promise<HwSnapshot> {
    const snap: HwSnapshot = { platform: process.platform, timestamp: Date.now() };
    if (process.platform !== 'darwin') return snap;
    try {
      const [mem, cpu, model] = await Promise.all([readMacMemory(), readMacCpu(), safeSysctl('hw.model')]);
      snap.memTotal = mem.total;
      snap.memUsed = mem.used;
      snap.cpuLoad = cpu.load;
      snap.cpuCount = cpu.count;
      if (model) snap.model = model;
    } catch (err) {
      debug('APME', `hw-sampler failed: ${String(err)}`);
    }
    return snap;
  }
}
