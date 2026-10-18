# 2026-10-18 — ESP32: keep 16 KB of internal RAM where malloc cannot reach it

**Why.** The allocation-failure counter
([2026-10-18 entry](docs/devlog/entries/2026-10-18-esp32-alloc-failure-telemetry.md))
caught one failure in a WiFi OTA on t_embed: a 914-byte request with caps
`0x80c` (`MALLOC_CAP_INTERNAL | MALLOC_CAP_DMA | MALLOC_CAP_8BIT`, the WiFi
driver's internal allocator) at an internal low-water mark of 1,528 bytes. On
these S3 boards `CONFIG_SPIRAM_MALLOC_ALWAYSINTERNAL` is 4096, so an ordinary
`malloc` of 4 KB or less takes internal RAM first and only then PSRAM. Those
mallocs all succeed, and they can still use up the internal RAM that the WiFi
driver and lwIP cannot do without.

**What the pool is.** [esp32/src/util/internal_reserve.cpp](esp32/src/util/internal_reserve.cpp)
takes `INTERNAL_RESERVE_BYTES` (16 KB) out of internal RAM at the top of
`setup()` and registers it as a heap of its own with
`heap_caps_add_region_with_caps`. Which requests reach it follows from how
ESP-IDF 5.5.5 walks heaps (`heap_caps_malloc_base`): priority 0, then 1, then
2, and at each priority a heap is tried when it has at least one requested
capability at that priority and every requested capability overall. The pool
has capabilities only at priority 2, and none of them is `MALLOC_CAP_DEFAULT`:
- `malloc` asks for `DEFAULT | INTERNAL`, then `DEFAULT`. The pool lacks
  `DEFAULT`, so it never serves either.
- The WiFi driver's `0x80c` request meets internal RAM at priority 0 and
  pure-DRAM at priority 1 first, and reaches the pool at priority 2 only
  when both refuse.
- An added heap goes to the head of the heap list, so at priority 2 the pool
  comes before RTC RAM and PSRAM. A request naming only `8BIT` or `32BIT`
  can therefore land in it, the same as with ESP-IDF's own reserve. Those are
  rare; `malloc` is the traffic that drained internal RAM.

`MALLOC_CAP_PID2` rides along as a marker. ESP-IDF does not use PIDs, so it
changes nothing about which requests the pool serves, and it lets
`heap_caps_get_free_size` read the pool alone. The carve asks for
`MALLOC_CAP_DEFAULT` too, so a second pass of the loop cannot take a block
out of the pool it has just registered. Boards without PSRAM skip it: there
it would only take RAM from `malloc`. IPS10 is left out, because its WiFi
runs on a hosted coprocessor and that path has not been measured with it.
The pool's code is compiled only where the build flags define
`BOARD_HAS_PSRAM`, not on `CONFIG_SPIRAM` alone: the classic ESP32 libraries
set `CONFIG_SPIRAM` for TTGO too, which has no PSRAM and about 1 KB of static
DRAM left.

**A low-water mark for the pool.** A heap added after startup gets its
minimum reset to 0 (`heap_caps_add_region_with_caps` calls
`multi_heap_restore_minimum_free_bytes(heap, 0)`), and
`heap_caps_get_minimum_free_size` says it leaves such heaps out. So `begin()`
calls `heap_caps_monitor_local_minimum_free_size_start()`, which resets every
heap's minimum to its current free size. It is never stopped, because
stopping restores the saved value, and for the pool that is the 0. One
consequence: on these boards `minFreeHeapKb` is the minimum since `setup()`
rather than since boot. `device_info` carries `internalReserveKb` and
`internalReserveMinKb`, and since an OTA ends in a restart that takes both
counters with it, `handleOtaEnd` prints
`[Reserve] at=ota-end capacity=… free=… min=… allocFailures=…` first. The
Node daemon logs that line under `esp32-heap`.

**Rejected.**
- `CONFIG_SPIRAM_MALLOC_RESERVE_INTERNAL`. It is 0 in the prebuilt Arduino
  libraries, and changing it means rebuilding the framework from source in
  every environment (`custom_sdkconfig`). It would not have helped anyway:
  ESP-IDF 5.5.5 registers its reserve with
  `{0, DMA | INTERNAL, DEFAULT | 8BIT | 32BIT}`
  (`components/esp_psram/system_layer/esp_psram.c`). The `INTERNAL` bit at
  priority 1 lets `malloc`'s first attempt in, so the same churn drains it.
- `heap_caps_malloc_extmem_enable(0)` for the length of an OTA, sending every
  `malloc` to PSRAM first. It changes where all allocations go mid-flight,
  including buffers some code may hand to DMA, and it covers only the OTA,
  not other WiFi load.
- A balloon block allocated at boot and freed when an OTA begins. The freed
  block goes back to the general heap, where `malloc`'s internal-first
  attempts take it just as fast. It delays the problem without fixing it.

**Measured.** t_embed (ESP32-S3, RSSI −54 dBm) took one WiFi OTA of its own
image (`e929da2b`: 3,890 chunks of 1 KB in 231 s) while a passive observer
read its serial port:
- At boot: `capacity=15956 regions=1 requested=16384 tracked=1`. That is one
  16 KB region, 428 B of which is heap bookkeeping.
- WiFi bring-up set both low-water marks within 15 s of boot:
  `minFreeHeapKb` 14 and `internalReserveMinKb` 14. With 14 KB of internal
  RAM free in total and at least 14 KB of that in the pool, the regular
  internal heap was all but empty at that moment, and the pool took the
  overflow. A request reaches the pool only after the regular internal heaps
  have refused it.
- From then until the reboot, the whole OTA included, every 30-second
  `device_info` read 21 KB of internal RAM free (5–6 KB of it outside the
  pool), and neither low-water mark moved. At the end:
  `free=15956 min=14588 allocFailures=0`.
- The run before the pool, on the same board with `2dac4169-dirty`, moved
  3,889 chunks in 154 s, took internal RAM down to 1,528 B during the OTA,
  and had one failure: 914 B with caps `0x80c` at 82 %.

This is consistent with the mechanism: with 16 KB out of `malloc`'s reach, the
small allocations on the OTA path find the regular internal heap nearly full
and go to PSRAM, so they no longer eat what the WiFi driver needs. It is one
run on each side, though, and the two runs differ in duration and radio
conditions, so it is not a failure rate.

**Fleet build.** On this branch, the reserve built for ips35, box_86, amoled,
led8x32, nm_epd_420, lilygo_epd47, t_embed, t_display_pro, esp32_c6_147,
trmnl_75 and ips10. TTGO failed to link, but master failed the same way without
this branch: #565 and #566 together left it 8 bytes over static DRAM
([2026-10-19 entry](docs/devlog/entries/2026-10-19-esp32-ttgo-dram-combined-merge.md)).
IPS10 links at 98.0% of its 6 MB app partition (6,167,166 B). The reserve
module adds 198 B of code there, so the margin was already nearly gone before
this branch. The next IPS10 feature will run into it.

**Left open.**
- IPS10 is excluded. Its WiFi runs on a hosted coprocessor, and that path
  has not been measured under the pool.
- The Swift daemon does not parse the heap fields. `internalReserveKb` and
  `internalReserveMinKb` reach `/devices` and the `esp32-heap` log only
  through the Node daemon.
- 16 KB is a starting size. The one measured run drew 1.4 KB of it, during
  WiFi bring-up rather than the OTA. Size it from more drawdowns, on more
  boards, before tuning it either way.
