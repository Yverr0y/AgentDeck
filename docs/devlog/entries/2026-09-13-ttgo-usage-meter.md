# 2026-09-13 — TTGO usage meter and small-display role review

TTGO T-Display now starts in usage-only mode. GPIO0 toggles Usage / Terrarium;
GPIO35 retains rotation. Screen rebuilds preserve the current mode; a reboot
returns to Usage. The meter renders only available Claude/Codex quota windows,
including real zero, with reset countdowns. Stale Claude data does not suppress
Codex. It pauses terrarium rendering and activity switching while selected.

Four fixed cards and static text buffers avoid per-frame text allocation on the
no-PSRAM board. IBM Plex Sans KR ASCII subsets at 12 px and 28 px are generated
with lv_font_conv 1.5.3 from the repository fonts, included only for TTGO.

Verification: TTGO firmware build; four host C++ suites; actual-renderer PNGs in
portrait/landscape, four-window, secondary-only, zero, absent and stale-Claude
scenes; twelve mode toggles/screen rebuilds. Common build, typecheck and 4,482
unit tests pass (one skipped). Protocol generation has no drift; token sync and
docs/catalog checks pass. Clean-source design lint retains the 89 baseline
findings. A host render is not a physical button/optical check.

[docs/esp32-companion-concepts.md](docs/esp32-companion-concepts.md) records
proposed refinements, not implemented redesigns: stable selected-work monitoring
on the camera-less S3-Pro, and an explicit waiting-question queue on T-Embed.
Existing pager focus, voice, history and observed-session command filtering are
already present and are not presented as new features.

Build environment: the default PlatformIO Python ran as x86_64 against an arm64
littlefs extension. Running the existing interpreter with `arch -arm64` fixed
the build without changing shared dependencies. Native C6 simulation has no
registered environment; the shared aquarium guard is checked by its actual
firmware build instead.
