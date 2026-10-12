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

## Final display-priority review

- Idle compact companion cards now keep showing known background counts and explicit completion instead of falling back to an older milestone. A host regression covers idle, completion, approval and error states.
- Firmware does not prefix CI activity with background status. E-ink glance/focus pages include background counts in their durable work summary, so count changes also participate in the existing repaint hash without adding animation. The native TRMNL preview follows the same projection.
- Signed Android 1.10.0 (27) upgraded Lenovo, Crema and Pantone in place. The live Lenovo dashboard showed a real background count of three with three orbiting dots; the directly launched Codex acceptance turn appeared in its timeline.
- Installed npm 1.10.0 candidate serves build `edd35a089b37`. iDotMatrix and Timebox report connected with recent successful pushes, and Pixoo reports online. These are transport observations, not physical-panel visual acceptance or public release claims.
- A direct Claude acceptance turn was blocked by the configured API usage limit; a direct Codex turn completed successfully instead.

## Android visual parity correction

The owner rejected the Android LCD candidate: three cyan dots and a permanent
BG DONE badge did not match the established macOS jar buddies. Transport and
count tests had passed but did not prove visual parity. Replaced the LCD cues
with generated Apple jar artwork and dimensions, a 12-second depth orbit,
additional pearl tasks and per-buddy endings. The native 3D path uses actual
Filament entities rather than screen-space dots. E-ink remains static. Android
publication is held while the revised device flow and animation are verified.

Lenovo candidate verification: real Filament jars render with the live production
BG 3 session, then an isolated loopback fixture exercises 5 → 2 → permission →
resume → 0. Approval hides jars; completion leaves no permanent tank badge.
The 2D default view also renders the exported clay artwork in two passes.
Five motion regression tests pass. Gfxinfo steady-scene samples measured median
38 ms / p90 57 ms with both zero and three tasks; five tasks measured 40 / 61 ms.
These are Android UI frame statistics, not a claim of smooth 60 fps GPU output.
The existing 3D frame budget remains a release-quality limitation.

Final signed APK installed in place on Lenovo, Crema and Pantone (1.10.0/27).
The final Android suite passed 496 tests, including five jar motion regressions;
`verify:quick` and final scoped `verify:changed` passed. On Lenovo, setting system
animation duration to zero froze the aquarium: two captures one second apart
had identical pixels in the aquarium region. The original setting, 3D dashboard
selection and production 9120 connection were restored; the fixture was stopped.
Crema retained the static background count in its high-contrast session column.
No 1.10.0 store release was submitted by this correction.

## Native Android frame pacing follow-up

The remaining 3D lag came from competing frame gates and GPU shadow/render-target
cost, not the Compose FPS counter. Filament now owns cadence, its pacing target
and dynamic-resolution interval agree, and the mobile HDR/MSAA/upscaling path
keeps HUD text at full display resolution. Thermal/power-constrained rendering
uses a 30 Hz budget without sampled shadows. Sustained missed 60 Hz submissions
also select that budget until resume, after a loading grace period. Shared GLB
instances and immutable materials replace per-buddy geometry/resource loading;
hidden instances return to a bounded high-water pool across roster changes.

Signed Lenovo measurements used SurfaceFlinger SurfaceView presentation stats:
previous production scene 13.238 FPS; revised 8-session × 12-task scene 29.855 FPS,
693 displayed frames and zero dropped frames in the measured interval. Thermal
status was SEVERE (3), with no override; this proves the constrained 30 Hz budget,
not unconstrained 60 FPS or identical macOS hardware performance. A separate
25-second sample measured 29.854 FPS / 739 frames / zero drops. Release profiling
also exposed a Filament JNI FrameInfo/R8 field-lookup abort; the optional GPU
history probe was removed and signed trace capture was rerun successfully.

Three roster-identity/reconnect cycles kept the native instance high-water mark
at 144. Physical captures cover 5 → 2 → approval → resume → 0, with jars hidden
for approval and no permanent completion badge in the aquarium. Reduced motion
produced identical aquarium-region pixels one second apart; the original system
setting was restored. Android's 501 tests include warmup, sustained-capacity,
resume and thermal-recovery budget cases plus immutable GLB material checks.
The final full release gate and store delivery are recorded separately.
