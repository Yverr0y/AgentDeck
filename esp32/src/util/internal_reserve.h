#pragma once

#include <Arduino.h>

// A pool of internal RAM that plain malloc() cannot take.
//
// On the PSRAM boards a malloc of 4 KB or less tries internal RAM first
// (CONFIG_SPIRAM_MALLOC_ALWAYSINTERNAL=4096) and only then PSRAM, so ordinary
// heap churn can drain internal RAM to nothing while every one of those
// mallocs still succeeds. The WiFi driver and lwIP can only use internal RAM,
// and they are the ones that then fail: during a WiFi OTA on t_embed one WiFi
// driver allocation (914 B, caps 0x80c) failed with 1,528 B of internal RAM
// left (devlog 2026-10-18-esp32-alloc-failure-telemetry).
//
// ESP-IDF's own reserve, CONFIG_SPIRAM_MALLOC_RESERVE_INTERNAL, is 0 in the
// prebuilt Arduino libraries, and the region its 5.5 implementation registers
// carries MALLOC_CAP_DEFAULT, which lets malloc()'s internal-first attempt in.
// This pool carries no DEFAULT bit and answers only at the lowest matching
// priority, so it is the last place an internal or DMA request looks and a
// place malloc() never looks. (A request naming only 8BIT or 32BIT can reach
// it too, as it can reach ESP-IDF's reserve; malloc() is the traffic that
// matters, and it cannot.) Without PSRAM it would only take RAM away from
// malloc, so begin() does nothing there.
namespace InternalReserve {

// Carves INTERNAL_RESERVE_BYTES (config.h) out of internal RAM. Call once, at
// the top of setup(), while internal RAM is still one large free block.
void begin();

// Usable bytes in the pool right after begin(); 0 when nothing was reserved.
uint32_t capacityBytes();
uint32_t freeBytes();
// The pool's true low-water mark since begin(). Known only when begin()
// could restart ESP-IDF's minimum tracking; otherwise there is no answer,
// and minFreeBytes() returns 0, which must not be read as "drained".
bool minFreeKnown();
uint32_t minFreeBytes();

// Numeric "[Reserve] at=…" lines, the format the daemon logs under
// esp32-heap. logBoot() exists because begin() runs before Serial is up;
// logBeforeRestart() because a restart takes the low-water mark and the
// failure count with it, and the moment before an OTA reboot is when the
// WiFi driver has leaned on the pool hardest.
void logBoot();
void logBeforeRestart(const char* at);

}  // namespace InternalReserve
