// The WiFi credential-id record (net/wifi_cred_id_store.h) over a fake NVS:
// what a board may store, and the write order that never lets the record name
// credentials the board does not hold.
#include "net/wifi_cred_id_store.h"
#include <cassert>
#include <cstring>
#include <string>

namespace {
struct FakeNvs {
    bool present = false;
    std::string value;
    bool saveOk = true;
    int loads = 0;
    int saves = 0;
    bool load(char* out, size_t outLen) {
        ++loads;
        if (!present) return false;
        strncpy(out, value.c_str(), outLen - 1);
        out[outLen - 1] = '\0';
        return true;
    }
    bool save(const char* id) {
        ++saves;
        if (!saveOk) return false;
        present = id[0] != '\0';
        value = id;
        return true;
    }
};

FakeNvs holding(const char* id) {
    FakeNvs nvs;
    nvs.present = true;
    nvs.value = id;
    return nvs;
}

std::string recorded(WifiCredId::Store<FakeNvs>& store) {
    char out[WifiCredId::HEX_LENGTH + 1];
    store.load(out, sizeof(out));
    return out;
}

const char* const kId = "4fbb066b2801b4ae";
const char* const kOther = "7de137f03d5a8983";
}  // namespace

int main() {
    using WifiCredId::valid;
    assert(WifiCredId::HEX_LENGTH == 16);
    assert(valid(kId) && valid("0"));
    assert(!valid(nullptr) && !valid(""));
    assert(!valid("4FBB066B2801B4AE"));   // lowercase only: ids compare exactly
    assert(!valid("4fbb066b2801b4ae0"));  // longer than HEX_LENGTH
    assert(!valid("4fbb066b2801b4ag") && !valid("4fbb 66b2801b4ae"));

    {  // A provision records its id once its credentials are written.
        FakeNvs nvs;
        WifiCredId::Store<FakeNvs> store(nvs);
        assert(recorded(store).empty());
        store.beforeWrite(kId);
        assert(nvs.saves == 0);  // nothing to forget
        store.afterWrite(kId, true);
        assert(nvs.present && nvs.value == kId && recorded(store) == kId);
        const int saves = nvs.saves;
        store.beforeWrite(kId);  // the same provision again (IPS10 endpoint refresh)
        store.afterWrite(kId, true);
        assert(nvs.saves == saves);
    }
    {  // A different provision forgets the old id BEFORE its credentials land,
       // so a reset between the two writes leaves none, never a stale id.
        FakeNvs nvs = holding(kOther);
        WifiCredId::Store<FakeNvs> store(nvs);
        store.beforeWrite(kId);
        assert(!nvs.present);
        store.afterWrite(kId, true);
        assert(nvs.value == kId && recorded(store) == kId);
    }
    {  // Credentials that failed to save are not vouched for.
        FakeNvs nvs = holding(kOther);
        WifiCredId::Store<FakeNvs> store(nvs);
        store.beforeWrite(kId);
        store.afterWrite(kId, false);
        assert(!nvs.present && recorded(store).empty());
    }
    for (const char* id : {"", "NOT-HEX", "4FBB066B2801B4AE", "4fbb066b2801b4ae0"}) {
        // A provision without an id (an older daemon) or with an invalid one clears it.
        FakeNvs nvs = holding(kId);
        WifiCredId::Store<FakeNvs> store(nvs);
        store.beforeWrite(id);
        store.afterWrite(id, true);
        assert(!nvs.present && recorded(store).empty());
    }
    {  // A re-join of credentials already stored leaves it alone.
        FakeNvs nvs = holding(kId);
        WifiCredId::Store<FakeNvs> store(nvs);
        store.beforeWrite(nullptr);
        store.afterWrite(nullptr, true);
        store.afterWrite(nullptr, false);
        assert(nvs.saves == 0 && recorded(store) == kId);
    }
    {  // Portal or reset: forgotten, and forgetting twice writes once.
        FakeNvs nvs = holding(kId);
        WifiCredId::Store<FakeNvs> store(nvs);
        store.forget();
        assert(!nvs.present && recorded(store).empty());
        const int saves = nvs.saves;
        store.forget();
        assert(nvs.saves == saves);
    }
    {  // Read once: a device_info per identify does not open NVS each time.
        FakeNvs nvs = holding(kId);
        WifiCredId::Store<FakeNvs> store(nvs);
        assert(recorded(store) == kId && recorded(store) == kId);
        assert(nvs.loads == 1);
    }
    for (const char* stored : {"4FBB066B2801B4AE", "4fbb066b2801b4ae0", "zz"}) {
        // Storage that holds anything but a valid id reads as none.
        FakeNvs nvs = holding(stored);
        WifiCredId::Store<FakeNvs> store(nvs);
        assert(recorded(store).empty());
    }
    {  // A small output buffer truncates, it never overruns.
        FakeNvs nvs = holding(kId);
        WifiCredId::Store<FakeNvs> store(nvs);
        char small[5];
        store.load(small, sizeof(small));
        assert(std::string(small) == "4fbb");
    }
    {  // A failed id write re-reads storage instead of trusting the mirror.
        FakeNvs nvs = holding(kOther);
        WifiCredId::Store<FakeNvs> store(nvs);
        assert(recorded(store) == kOther);
        nvs.saveOk = false;
        store.forget();
        const int loads = nvs.loads;
        assert(recorded(store) == kOther && nvs.loads == loads + 1);
        nvs.saveOk = true;
        store.forget();
        assert(!nvs.present && recorded(store).empty());
    }
    return 0;
}
