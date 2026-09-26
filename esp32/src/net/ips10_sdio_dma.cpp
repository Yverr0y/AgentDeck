#include "../../boards/board_config.h"
#if defined(BOARD_IPS10)
#include <atomic>
#include <cstring>
#include <esp_attr.h>
#include <esp_log.h>
#include <sdmmc_cmd.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include "sdio_dma_stage.h"

// ESP-Hosted can lend a TX buffer which fails the P4 SDMMC cache-alignment
// check. IDF returns INVALID_ARG; Hosted then restarts the whole display.
// Keep PSRAM pools (needed for RX headroom), but stage a misaligned TX through
// one device-lifetime internal DMA buffer. No per-packet heap allocation.
namespace {
constexpr size_t MAX_TX = 1536; // three SDIO blocks; Hosted transport maximum
DMA_ATTR alignas(64) uint8_t alignedTx[MAX_TX];
std::atomic_flag txBusy = ATOMIC_FLAG_INIT;
unsigned stagedCount = 0;
}

extern "C" esp_err_t __real_sdmmc_io_write_blocks(sdmmc_card_t*, uint32_t,
                                                  uint32_t, const void*, size_t);
extern "C" esp_err_t __wrap_sdmmc_io_write_blocks(sdmmc_card_t* card, uint32_t fn,
                                                  uint32_t addr, const void* src, size_t size) {
    // Preserve validation and the zero-copy path for valid DMA buffers.
    if (!card || !card->host.check_buffer_alignment ||
        !Net::needsSdioStaging(src, size, MAX_TX,
            src && size && card->host.check_buffer_alignment(card->host.slot, src, size))) {
        return __real_sdmmc_io_write_blocks(card, fn, addr, src, size);
    }
    while (txBusy.test_and_set(std::memory_order_acquire)) vTaskDelay(1);
    const esp_err_t result = Net::writeStagedSdio(alignedTx, src, size,
        [&](const void* data, size_t bytes) {
            return __real_sdmmc_io_write_blocks(card, fn, addr, data, bytes);
        });
    const unsigned count = ++stagedCount;
    txBusy.clear(std::memory_order_release);
    // Bounded numeric evidence, never packet contents. First and powers of two.
    if ((count & (count - 1)) == 0 || result != ESP_OK)
        ESP_LOGW("ips10_sdio_dma", "staged=%u bytes=%u result=%d", count, unsigned(size), int(result));
    return result;
}
#endif
