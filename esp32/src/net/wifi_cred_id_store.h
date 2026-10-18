#pragma once
#include <stddef.h>
#include <string.h>
#include "wifi_cred_id.generated.h"

// The board's record of which `wifi_provision` its stored WiFi credentials came
// from (`credId`, reported back as `device_info.wifiCredId`). Header-only over a
// two-call storage backend so the ordering below runs in the host tests
// (esp32/sim/tests/wifi_cred_id_test.cpp); wifi_manager.cpp backs it with
// Preferences. No allocation: one HEX_LENGTH+1 mirror, read on every
// device_info without touching NVS. C++11 (led8x32 builds at gnu++11).
//
// The rule every write keeps: the record may be missing while the board does
// hold the daemon's credentials — that costs one redundant provision — but it
// must never name credentials the board does not hold, or the daemon would
// never send it the ones it needs. Hence:
//  - a provision forgets the old id BEFORE its credentials are written (unless
//    it carries that same id) and records its own only once they were, so a
//    reset between the two writes leaves "none", never a stale id;
//  - anything that is not a valid id is recorded as none;
//  - a re-join of credentials already stored (credId == nullptr) leaves it alone;
//  - a failed write re-reads storage instead of trusting the mirror.
//
// Backend: bool load(char* out, size_t outLen) — false when nothing is stored
// or it cannot be read; bool save(const char* id) — "" removes the record.
namespace WifiCredId {

template <typename Backend>
class Store {
public:
    explicit Store(Backend& backend) : backend_(backend), loaded_(false) { mirror_[0] = '\0'; }

    // The recorded id ("" = none), NUL-terminated into out.
    void load(char* out, size_t outLen) {
        if (out == nullptr || outLen == 0) return;
        ensureLoaded();
        strncpy(out, mirror_, outLen - 1);
        out[outLen - 1] = '\0';
    }

    // A provision carrying `credId` ("" when it carried none) is about to write
    // credentials.
    void beforeWrite(const char* credId) {
        if (credId == nullptr) return;
        ensureLoaded();
        if (valid(credId) && strcmp(mirror_, credId) == 0) return;
        record("");
    }

    // ...and wrote them, or failed to (`written`).
    void afterWrite(const char* credId, bool written) {
        if (credId == nullptr) return;
        record(written && valid(credId) ? credId : "");
    }

    // The stored credentials may change without a provision (captive portal,
    // reset): the record can no longer vouch for them.
    void forget() { record(""); }

private:
    void ensureLoaded() {
        if (loaded_) return;
        loaded_ = true;
        mirror_[0] = '\0';
        // One spare byte, so an over-long stored value reads as invalid rather
        // than as its first HEX_LENGTH characters.
        char stored[HEX_LENGTH + 2];
        stored[0] = '\0';
        if (backend_.load(stored, sizeof(stored))) {
            stored[sizeof(stored) - 1] = '\0';
            if (valid(stored)) copyId(stored);
        }
    }

    void record(const char* id) {
        ensureLoaded();
        if (strcmp(mirror_, id) == 0) return;
        if (!backend_.save(id)) {
            // What storage holds now is unknown: read it back on next use
            // rather than report an id these credentials may not have.
            loaded_ = false;
            return;
        }
        copyId(id);
    }

    void copyId(const char* id) {
        strncpy(mirror_, id, HEX_LENGTH);
        mirror_[HEX_LENGTH] = '\0';
    }

    Backend& backend_;
    char mirror_[HEX_LENGTH + 1];
    bool loaded_;
};

}  // namespace WifiCredId
