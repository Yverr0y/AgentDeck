# 2026-10-13 — Background work on downstream displays

The device projections now carry background-task counts independently of the
child-agent census. The presentation policy in
[shared/src/background-work-presentation.ts](shared/src/background-work-presentation.ts)
generates Swift, Kotlin and C++ mirrors. Missing or invalid counts retain the
same session's last value; explicit zero clears running work. New connections
must not inherit old counts. Android decodes invalid count fields locally rather
than rejecting the entire roster.

Android LCD aquariums show bounded cyan orbits and a short completion ring;
Android/e-ink firmware use stable count/status text. Pixoo carries bounded orbit
cues, with Tide phase tied to its closed loop. Session keys expose exact counts.
iDotMatrix's information board replaces the recent-result tally with background
tasks (`WAIT / WORK / BG / LIVE`, with error priority and unknown dashes). TC001
alternates each usage window's percentage and reset countdown while preserving
the provider glyph and usage rail. Reset text is clipped away from the mark.

## Evidence collected before release

- Signed candidate installed in place on Lenovo HVA095B4, Pantone
  AA007422R24C1300039 and Crema CREMAA21W09235. All three registered against an
  isolated loopback WebSocket fixture through temporary ADB reverse mappings.
- Actual screenshots captured the running count, decrease and explicit completion.
  Lenovo showed `BG 5` plus cyan cues, then the completion ring; Crema/Pantone
  displayed stable count/completion text. Unknown after reconnect removed stale
  count/effects. Each device's production `9120 -> 9120` mapping was restored.
- Android decoder/motion tests cover malformed values, missing updates, zero and
  reconnect. Node/Swift matrix sequence parity includes background count changes.
  TC001 simulator renders `R2H15M` and a fleet background count. These are simulator
  evidence, not physical-panel observation.
- macOS Debug passed 1,141 tests (four skipped) before final release preparation.
  Full verification and actual firmware/BLE deployment remain separate gates.
- Onboarding PR [#523](https://github.com/puritysb/AgentDeck/pull/523) passed its
  applicable CI checks and was merged. The new device branch must include it
  before preparing the coordinated Apple candidate.
- Store readback: iOS 1.9.0 is Ready for Distribution; macOS 1.9.0 is Waiting for
  Review. Candidate 1.10.0 is not yet uploaded or submitted.

## Verification runner correction

The marketing palette rule recursively scanned native build output and pnpm
packages for several minutes, despite filtering those findings out afterwards.
It now reuses the linter's source-file scope. The tracked-file baseline remains
89; this changes traversal cost, not the accepted palette rules.
