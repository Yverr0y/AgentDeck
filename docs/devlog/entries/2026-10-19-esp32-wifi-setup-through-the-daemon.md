# 2026-10-19 — ESP32 Wi-Fi setup: the macOS sheet never reached a board

**What was there.** Three paths set ESP32 Wi-Fi credentials, and none of them
reached a board when the user expected.

- The macOS sheet (Settings → ESP32 & Pixoo → ESP32 boards → Set up…) wrote
  `{"type":"wifi.config",…}` to the first `/dev/cu.*` that matched an ESP32
  USB-UART pattern. No firmware handles that type. `esp32/src/net/protocol.cpp`
  dispatches `wifi_provision`. The port was one the app's own daemon already
  held, since `ESP32Serial` opens every matching port, and two readers on one
  macOS tty steal each other's bytes. The sheet's comment said verification
  "happens via mDNS rediscovery". Nothing could be verified, because the board
  never acted on the frame.
- The app's daemon read `WifiConfigManager.load()` on each board's
  `device_info`, but nothing in the app called `save()`. Its automatic
  provisioning had no credentials unless someone wrote the container file by
  hand.
- `agentdeck wifi-setup` wrote `~/.agentdeck/wifi-config.json`, which only the
  Node daemon reads. The docs said a change applied "on its next serial
  `device_info` after the daemon restarts", and it never reached a Swift
  daemon.

**What changed.** Both daemons serve `GET`/`POST /esp32/wifi`. The gate is
loopback plus the pairing token as a bearer, the `/integrations/zai` rule. A
`POST` checks the credentials with a rule shared through the provision SSOT and
saves them where that daemon reads them. It then sends them to every live serial
board as an operator request. The provision decision gets `manual`, which
lifts the one-provision-per-connection cap and the legacy fallback, and nothing
else. Each connection records the board's `wifi_provision_ack`, and a `GET`
reports it. The sheet and the CLI both call the route on the daemon that holds
the port. Contract: [docs/esp32.md](docs/esp32.md#setting-the-credentials-esp32wifi).

**Rejected alternatives.**

- *Keep the sheet's serial write and send `wifi_provision` instead.* It would
  still race the daemon on a port the daemon holds, and the daemon would still
  have nothing saved for a board plugged in later. The serial-suspend lease is
  for flashing, and taking every port away from the daemon for one line would
  drop each board's state link to set its Wi-Fi.
- *Let the CLI find the daemon by probing ports.* A blind probe of the default
  port can answer with another account's daemon, and this request carries the
  Wi-Fi password. The CLI uses this user's registry or an explicit `--port`.
  With neither, it writes the file only and says that the macOS app keeps its
  own copy.
- *Same-machine trust as the gate.* Any local process could then replace the
  network every board joins.

**Parity traps found while porting the route to Swift.** Each is now a vector in
`shared/esp32-wifi-setup-vectors.json`.

- `as? Bool` on a `JSONSerialization` value accepts the number `1`, through
  NSNumber bridging. Node's `=== true` does not. Both the ack's `success` and
  the request's `autoProvision` now check for a CFBoolean.
- `hasPrefix("Bearer ")` compares graphemes, so a combining mark after the space
  folds into it. The scheme is now compared by Unicode scalar, as Node compares
  UTF-16 units.
- Clipping a board's text to N UTF-16 units with JS `slice` can split a
  surrogate pair. The lone half that results is something a Swift `String`
  cannot hold, so the two daemons could not answer alike. Both now back off one
  unit.

**Not covered.** No board has been driven through the new route yet. The owner
deferred device checks, and the tests cover the decision, the route and the
sheet's wording. The session bridge's `wifi_provision` handler in
`bridge/src/index.ts` is unreachable, since session bridges never open serial.
`bridge/src/wifi-config.ts` ignores `AGENTDECK_DATA_DIR`. A hand edit of the
macOS app's container file applies at the next app start, because the Swift
daemon caches what it last read or saved.
