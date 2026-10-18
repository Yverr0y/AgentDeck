#include "internal_reserve.h"

#include <esp_heap_caps.h>

// The pool is built only into PSRAM environments (the ones whose build flags
// define BOARD_HAS_PSRAM). The classic ESP32 libraries set CONFIG_SPIRAM even
// for TTGO, which has no PSRAM, so begin() could only return early there, and
// TTGO's static DRAM is about 1 KB from full: no place for dead counters.
#if CONFIG_SPIRAM && defined(BOARD_HAS_PSRAM)
#define INTERNAL_RESERVE_POOL 1
#include <esp_heap_caps_init.h>
#include <heap_memory_layout.h>
#else
#define INTERNAL_RESERVE_POOL 0
#endif

#include "config.h"
#include "heap_telemetry.h"

namespace InternalReserve {

namespace {

#if INTERNAL_RESERVE_POOL
// No allocation asks for this capability (ESP-IDF does not use PIDs), so it
// changes nothing about which requests the pool serves; it only lets the
// heap_caps_get_*_size() queries read the pool apart from the rest of RAM.
constexpr uint32_t POOL_MARKER = MALLOC_CAP_PID2;
// Where the pool is carved from. DEFAULT is there to exclude the pool itself:
// it has internal DMA RAM too, and a second pass must not carve from it.
constexpr uint32_t CARVE_CAPS = MALLOC_CAP_INTERNAL | MALLOC_CAP_DMA | MALLOC_CAP_DEFAULT;
// A region smaller than this would be mostly heap bookkeeping.
constexpr size_t MIN_REGION_BYTES = 4096;
#endif

#if INTERNAL_RESERVE_POOL
// Written once by begin(), before any other task exists.
uint32_t capacity = 0;
bool minTracked = false;
uint32_t regions = 0;
uint32_t requested = 0;
#else
constexpr uint32_t capacity = 0;
constexpr bool minTracked = false;
#endif

}  // namespace

void begin() {
#if INTERNAL_RESERVE_POOL
    requested = INTERNAL_RESERVE_BYTES;
    if (requested == 0 || !psramFound()) return;

    // The pool may come back as more than one region when internal RAM is
    // already split; each is a block taken from the regular heap for good and
    // registered as a heap of its own, which is how ESP-IDF builds its reserve.
    size_t remaining = requested;
    while (remaining > 0) {
        size_t next = heap_caps_get_largest_free_block(CARVE_CAPS);
        if (next > remaining) next = remaining;
        if (next < MIN_REGION_BYTES) break;
        // Owned by the new heap below for the life of the device; never freed.
        uint8_t* block = static_cast<uint8_t*>(heap_caps_malloc(next, CARVE_CAPS));
        if (!block) break;
        // Lowest priority only, and no MALLOC_CAP_DEFAULT: an internal or DMA
        // request reaches this region after every regular internal heap has
        // refused it, and malloc() never does.
        const uint32_t caps[SOC_MEMORY_TYPE_NO_PRIOS] = {
            0, 0, MALLOC_CAP_INTERNAL | MALLOC_CAP_DMA | MALLOC_CAP_8BIT | MALLOC_CAP_32BIT | POOL_MARKER};
        if (heap_caps_add_region_with_caps(caps, reinterpret_cast<intptr_t>(block),
                                           reinterpret_cast<intptr_t>(block) + next) != ESP_OK) {
            heap_caps_free(block);
            break;
        }
        regions++;
        remaining -= next;
    }
    capacity = heap_caps_get_free_size(POOL_MARKER);
    if (capacity == 0) return;

    // A heap added after startup reports a minimum of 0 forever, so the pool's
    // low-water mark only exists if minimum tracking restarts from here. This
    // restarts it for every heap: minFreeHeapKb becomes "since setup()" on
    // these boards, which loses nothing that happened after the app began.
    minTracked = heap_caps_monitor_local_minimum_free_size_start() == ESP_OK;
#endif
}

uint32_t capacityBytes() { return capacity; }

uint32_t freeBytes() {
#if INTERNAL_RESERVE_POOL
    if (capacity == 0) return 0;
    return heap_caps_get_free_size(POOL_MARKER);
#else
    return 0;
#endif
}

bool minFreeKnown() { return minTracked; }

uint32_t minFreeBytes() {
#if INTERNAL_RESERVE_POOL
    if (!minTracked) return 0;
    return heap_caps_get_minimum_free_size(POOL_MARKER);
#else
    return 0;
#endif
}

// Formatted on the stack: Print::printf mallocs for lines over 63 bytes.
void logBoot() {
#if INTERNAL_RESERVE_POOL
    if (requested == 0) return;
    char line[128];
    snprintf(line, sizeof(line), "[Reserve] at=boot capacity=%lu regions=%lu requested=%lu tracked=%d",
             (unsigned long)capacity, (unsigned long)regions, (unsigned long)requested, minTracked ? 1 : 0);
    Serial.println(line);
#endif
}

void logBeforeRestart(const char* at) {
    if (capacity == 0 || !minTracked) return;
    char line[160];
    snprintf(line, sizeof(line), "[Reserve] at=%s capacity=%lu free=%lu min=%lu allocFailures=%lu", at,
             (unsigned long)capacity, (unsigned long)freeBytes(), (unsigned long)minFreeBytes(),
             (unsigned long)HeapTelemetry::failures());
    Serial.println(line);
}

}  // namespace InternalReserve
