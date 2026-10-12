# 2026-10-12 — BLE permission diagnosis and bounded serial identity probes

Follow-up to [#517](https://github.com/puritysb/AgentDeck/issues/517) and
[#518](https://github.com/puritysb/AgentDeck/issues/518), after the 1.9.0 rollout.

## Measured cause and source changes

The actual TestFlight 7901 process's macOS TCC log records a Bluetooth code
requirement mismatch against the previous Development-signed app and a new
authorization prompt. Both native BLE transports logged `notDetermined`, then
reported only a powered-on timeout. The timeout now names pending consent,
denied/restricted access, or the observed adapter state, keeping existing bounded
retries. No privacy grant, signing identity, or configured device was changed.

The NM serial retry again returned no fresh identity. The earlier PySerial
probe had blocked in `flush()`/`tcdrain()`, which `write_timeout` does not bound.
The source helper now probes one port per bounded child, skips drain, retains
split JSON, and inspects only the requested port when one is specified.
Regression tests exercise stuck open/read/close followed by a responsive board,
split/noisy input, and malformed identity. These are host tests, not evidence that
the NM board was flashed.

## Hardware acceptance still required

At diagnosis time the Mac was locked, Timebox was absent from a fresh BLE scan,
and NM did not answer the leased 20-second serial probe. The user was asked to
unlock the Mac, power-cycle Timebox, and reconnect NM USB. Actual signed-app
handoff/rendering and NM's 1.9.0 boot identity remain pending those actions.
The normal Node owner remains running; iDotMatrix is connected. No NM erase or
flash was attempted. Submitted Apple build 7901 is immutable and does not include
these source changes.

## Verification record

[The clean-source receipt](verification/receipts/2026-10-12-38ca654.json) records
all 25 automated full-verification steps passing on `38ca6544` in 14m41s. This
includes coverage, Android, Apple Store and DotPreview configurations, ESP32
host/simulator/TTGO builds and clean npm installation acceptance. The three lab
gates remain unattested. Windows Node 22/24/26 passed separately in GitHub CI.

A later read-only USB-JTAG reset/ROM `read-mac` probe also received no serial
data. The NM continued to report fresh Wi-Fi telemetry with advancing uptime
and no reboot, while its serial entry remained explicitly `deviceInfoFresh:false`.
No flash/erase was attempted; the normal daemon's serial ownership was restored.
The new bounded reader itself returned without identity in 3.142 seconds on the
physical port. Physical reconnection and signed-app acceptance remain outstanding.
