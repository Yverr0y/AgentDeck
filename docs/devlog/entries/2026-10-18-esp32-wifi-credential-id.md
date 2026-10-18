# 2026-10-18 — A parked ESP32 says which WiFi credentials it holds

The mDNS panic fix of the same day ([entry](docs/devlog/entries/2026-10-18-esp32-mdns-stale-netif-panic.md))
found that a board parked on USB serial was re-provisioned on every daemon serial reopen. The
daemons decided from `device_info.wifiConfigured`, and that field cannot answer the question:

- A parked board has its WiFi driver off, so `WiFi.SSID()` is empty and it reported `false`.
  Every serial reopen, lease resume and daemon restart sent it the credentials it already held.
  On most boards a provision joins the AP, which wakes a radio that the firmware's own parking
  policy then has to put back to sleep.
- A board that persists a provision for a later join (the `adwifi` store: IPS10,
  T-Display-S3-Pro, NM-EPD-420, EPD47) reported `true` from that store. The Node daemon therefore
  never sent it changed credentials.

Both failures come from the same missing answer: does this board hold the credentials this
daemon would send? A provision now carries `credId`, the first 16 hex characters of HMAC-SHA256
keyed by the pairing token, over `agentdeck-wifi-cred-v1` NUL SSID NUL password. The board stores
the id beside the credentials it came with and reports it as `device_info.wifiCredId` on serial.
The decision is `shared/src/esp32-wifi-provision.ts`; the rule is described in
[docs/esp32.md](docs/esp32.md#which-boards-get-a-wifi-provision).

## Rejected alternatives

- **An unsalted hash of SSID and password.** Anyone who sees the hash can test password guesses
  offline: a device cache file, `/devices`, a serial log, a sniffed frame. A keyed HMAC needs the
  token as well. The token can be read off loopback `/health` by any local process, so the id is
  also kept off WiFi, `/devices` and `esp32-device-cache.json`; it lives on the serial line and in
  the board's NVS only.
- **An id of the SSID alone.** After a password change the board would still read as a match and
  never receive the new password.
- **A ledger in the daemon** ("I sent board B credentials C"). A daemon cannot see a board being
  wiped, reflashed, reconfigured through the captive portal or swapped onto the same tty. Only
  the board knows what it holds.
- **Reporting `wifiConfigured: true` while parked.** Every daemon already in the field would then
  skip parked boards (its rule leaves a configured board alone), and changed credentials would
  stop reaching every board, not just the four persisted ones.

## Decisions beyond the brief, and why

- **The firmware forgets the old id before writing different credentials, and records the new
  one after.** The failure that matters is asymmetric. A missing id costs one redundant
  provision. A stale id that names credentials the board no longer holds means the daemon never
  sends the ones it needs. So a reset between the two NVS writes must leave no id. The same rule
  clears the id when the captive portal opens, not only when it connects: an open portal can
  replace the stored credentials at any moment, including with a wrong password that never joins.
  The cost is one extra provision when a board boots out of range of its AP. The write order lives
  in a header-only store (`esp32/src/net/wifi_cred_id_store.h`) so that it runs in the host tests;
  `wifi_manager.cpp` only supplies the Preferences backend.
- **Generic boards record the id after the `WiFi.begin` call, using its return value, whether or
  not the join succeeds.** `WiFi.persistent(true)` writes the driver config before connecting, and
  that config is what these boards rejoin. A `WL_CONNECT_FAILED` return records no id. That
  return also covers failures after the config was written, which errs in the safe direction.
  Persisted boards record it only once the `adwifi` credentials are saved, because that store is
  what they join first.
- **Each daemon keeps its own rule where the id cannot decide** (old firmware, or a daemon with no
  id to offer). Node keeps "skip a board reporting `wifiConfigured`". Swift keeps "once per port
  per credential set per app lifetime" (`provisionFingerprintsByPort`, now consulted only on that
  path). If Swift adopted Node's rule, changed credentials would stop reaching old persisted
  boards. If Node adopted Swift's, a parked board would be re-provisioned on every reopen. The
  vectors pin the shared decision; `ESP32Serial.shouldSendWifiProvision` pins Swift's fallback.
- **The Node-only IPS10 endpoint refresh became an input** (`refreshIps10Endpoint`), so the Swift
  daemon still never does it. `auth_provision` already carries the endpoint, and on that board a
  provision is a full WiFi rejoin.
- **Neither daemon writes WiFi credentials before a board identifies on the current connection.**
  The Swift daemon previously provisioned unidentified ports. The Node daemon accepted a
  `device_info` seeded from `esp32-device-cache.json`, which may describe a board since wiped or
  replaced. The board's own `device_info` re-runs the fan-out, since the handler runs after the
  record is set.
- **The serial `device_info` builder in `serial_client.cpp` gained the measured-buffer growth
  path from `protocol.cpp`.** The id adds 32 bytes, and a fully loaded t_display_pro frame then
  comes within a few bytes of the 896-byte stack buffer. `serializeJson` truncates silently, which
  would make the frame unparseable and the board unidentifiable.

## Not measured

No board was flashed for this change, and the hardware check is still to come. A parked board
reopened on serial should log `credentials-match` at Node debug level instead of sending a
`wifi_provision`, and `adwifi`/`cred_id` should hold the id. The design assumes both daemons on
one machine serve the same pairing token. If they diverged, each would re-provision a board the
other had provisioned, once per connection, and only when serial ownership changed hands.
