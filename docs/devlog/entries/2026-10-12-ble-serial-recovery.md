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
