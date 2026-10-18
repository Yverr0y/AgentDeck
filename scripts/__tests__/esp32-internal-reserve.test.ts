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
    const mask = body.match(new RegExp(`constexpr uint32_t ${slots[2]}\\s*=([^;]*);`))?.[1] ?? slots[2];
    expect(mask).toContain('MALLOC_CAP_INTERNAL');
    // malloc() asks for DEFAULT, so with it the pool would drain exactly as
    // ESP-IDF's own reserve does. SPIRAM would make it a PSRAM heap. The
    // compiler holds the whole mask to that, named constants included.
    expect(mask).not.toMatch(/MALLOC_CAP_DEFAULT|MALLOC_CAP_SPIRAM/);
    expect(body).toMatch(
      new RegExp(`static_assert\\(\\(${slots[2]} & \\(MALLOC_CAP_DEFAULT \\| MALLOC_CAP_SPIRAM\\)\\) == 0`),
    );
  });

  it('reads the pool apart by a capability no allocation asks for', () => {
    // The pool's own free and low-water figures are queries for its marker
    // alone, which only the pool carries.
    expect(body).toMatch(/constexpr uint32_t POOL_MARKER = MALLOC_CAP_PID\d;/);
    expect(body).toMatch(/POOL_CAPS\s*=[^;]*POOL_MARKER/);
    expect(body).toMatch(/heap_caps_get_free_size\(POOL_MARKER\)/);
    expect(body).toMatch(/heap_caps_get_minimum_free_size\(POOL_MARKER\)/);
    expect(callSites(/MALLOC_CAP_PID\d/)).toEqual([expect.stringMatching(/^esp32\/src\/util\/internal_reserve\.cpp:/)]);
  });

  it('leaves the pool out of the internal figures the board reports', () => {
    // A plain query for INTERNAL or DMA counts the pool, whose untouched
    // 16 KB would read as headroom malloc() cannot reach.
    const direct = /heap_caps_get_(free_size|minimum_free_size|largest_free_block)\(\s*MALLOC_CAP_INTERNAL/;
    for (const file of ['net/protocol.cpp', 'util/heap_telemetry.cpp', 'util/memory.h', 'audio/speaker_playback.cpp']) {
      expect(code(join(firmware, file)), file).not.toMatch(direct);
    }
    const info = code(join(firmware, 'net/protocol.cpp'));
    for (const [field, helper] of [
      ['freeHeapKb', 'heapFreeBytes'],
      ['minFreeHeapKb', 'heapMinFreeBytes'],
      ['largestFreeBlockKb', 'heapLargestFreeBlock'],
    ]) {
      expect(info, field).toMatch(new RegExp(`resp\\["${field}"\\]\\s*=\\s*InternalReserve::${helper}\\(`));
    }
  });

  it('sends the pool fields by the rule protocol.ts states', () => {
    // Absent: no pool asked for. 0: asked for and none carved. Free and
    // low-water figures exist only for a pool that was carved.
    const info = code(join(firmware, 'net/protocol.cpp'));
    const asked = info.match(/if \(InternalReserve::requestedBytes\(\) > 0\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    expect(asked).toMatch(/^\s*resp\["internalReserveKb"\] = InternalReserve::capacityBytes\(\) \/ 1024;/);
    const carved = asked.match(/if \(InternalReserve::capacityBytes\(\) > 0\) \{([\s\S]*?)\}/)?.[1] ?? '';
    expect(carved).toMatch(/resp\["internalReserveFreeKb"\] = InternalReserve::freeBytes\(\)/);
    expect(carved).toMatch(/resp\["internalReserveMinKb"\] = InternalReserve::minFreeBytes\(\)/);
    for (const field of ['internalReserveKb', 'internalReserveFreeKb', 'internalReserveMinKb']) {
      expect(info.split(`resp["${field}"]`).length - 1, field).toBe(1);
    }
  });

  it('is built only into PSRAM boards whose config asks for it', () => {
    // Every other board compiles the helpers down to the plain heap figures.
    const gate = body.match(/^#if (.*)\n#define INTERNAL_RESERVE_POOL 1$/m)?.[1] ?? '';
    expect(gate).toContain('defined(BOARD_HAS_PSRAM)');
    expect(gate).toContain('defined(AGENTDECK_INTERNAL_RESERVE)');
    const config = code(join(firmware, 'config.h'));
    const asks = config.match(/#if ([^\n]*)\n#define AGENTDECK_INTERNAL_RESERVE 1\n(constexpr uint32_t INTERNAL_RESERVE_BYTES = [^;]*;)\n#endif/);
    expect(asks).not.toBeNull();
    expect(config.match(/INTERNAL_RESERVE_BYTES/g)).toHaveLength(1);
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
