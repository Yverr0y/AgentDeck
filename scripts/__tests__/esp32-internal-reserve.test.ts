import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../..', import.meta.url));
const firmware = join(root, 'esp32/src');
const reserve = join(firmware, 'util/internal_reserve.cpp');
const main = join(firmware, 'main.cpp');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(c|cpp|h|hpp)$/.test(name) ? [path] : [];
  });
}

// Comments name these calls while explaining them; only code counts.
function code(file: string): string {
  return readFileSync(file, 'utf-8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function callSites(pattern: RegExp): string[] {
  return sources(firmware).flatMap((file) =>
    code(file).split('\n').flatMap((line, i) => (pattern.test(line) ? [`${relative(root, file)}:${i + 1}`] : [])),
  );
}

describe('ESP32 internal RAM reserve', () => {
  const body = code(reserve);

  it('registers its pool at the lowest priority only, without the bit malloc() asks for', () => {
    const caps = body.match(/caps\[SOC_MEMORY_TYPE_NO_PRIOS\]\s*=\s*\{([^}]*)\}/)?.[1];
    expect(caps).toBeDefined();
    const slots = caps!.split(',').map((slot) => slot.trim());
    expect(slots).toHaveLength(3);
    // A capability in the first two slots would let a request match the pool
    // before the regular internal heaps have refused it.
    expect(slots.slice(0, 2)).toEqual(['0', '0']);
    expect(slots[2]).toContain('MALLOC_CAP_INTERNAL');
    // malloc() asks for DEFAULT, so with it the pool would drain exactly as
    // ESP-IDF's own reserve does. SPIRAM would make it a PSRAM heap.
    expect(slots[2]).not.toMatch(/MALLOC_CAP_DEFAULT|MALLOC_CAP_SPIRAM/);
  });

  it('carves the pool only out of memory that is not already the pool', () => {
    // The pool lacks DEFAULT, so asking for it keeps a second pass of the
    // carve loop from taking a block out of the region it just registered.
    expect(body).toMatch(/CARVE_CAPS\s*=[^;]*MALLOC_CAP_DEFAULT/);
    expect(body).toMatch(/heap_caps_get_largest_free_block\(CARVE_CAPS\)/);
    expect(body).toMatch(/heap_caps_malloc\(next, CARVE_CAPS\)/);
  });

  it('is the only code that adds a heap region or restarts minimum tracking', () => {
    expect(callSites(/heap_caps_add_region(_with_caps)?\s*\(/)).toEqual([
      expect.stringMatching(/^esp32\/src\/util\/internal_reserve\.cpp:/),
    ]);
    expect(callSites(/heap_caps_monitor_local_minimum_free_size_start\s*\(/)).toEqual([
      expect.stringMatching(/^esp32\/src\/util\/internal_reserve\.cpp:/),
    ]);
  });

  it('never stops minimum tracking, which would zero the pool low-water mark', () => {
    // A heap added after startup reports a minimum of 0, and stop() restores
    // the value saved by start(), which for the pool is that 0.
    expect(callSites(/heap_caps_monitor_local_minimum_free_size_stop\s*\(/)).toEqual([]);
  });

  it('is carved at the top of setup(), before Serial or anything else allocates', () => {
    const setup = code(main).match(/void setup\(\) \{([\s\S]*?)\n\}/)?.[1] ?? '';
    const begin = setup.indexOf('InternalReserve::begin();');
    expect(begin).toBeGreaterThan(setup.indexOf('HeapTelemetry::begin();'));
    expect(setup.indexOf('HeapTelemetry::begin();')).toBeGreaterThanOrEqual(0);
    for (const later of ['Serial.setRxBufferSize(', 'Serial.begin(', 'logHeap("boot")']) {
      expect(setup.indexOf(later), later).toBeGreaterThan(begin);
    }
    expect(callSites(/InternalReserve::begin\(\)/)).toHaveLength(1);
  });
});
