# 2026-10-13 — Android 1.10.0 native 3D and Play delivery

[PR #524](https://github.com/puritysb/AgentDeck/pull/524) merged at `bfe3a935`
after all CI checks passed. The implementation uses Filament-owned pacing,
adaptive GPU resolution and shared/recycled background geometry. Severe
thermal pressure and persistent overload select a stable 30 Hz budget.
The clean [full verification receipt](verification/receipts/2026-10-12-31b7c06.json)
passed in 14m43s, including 501 Android tests and native Store/Dot checks.

The [Android 1.10.0 GitHub release](https://github.com/puritysb/AgentDeck/releases/tag/android-v1.10.0)
is public. Its downloaded APK has version code 27, the registered upload-key
signature and SHA-256 `bbe28b3095dfc8b1c520ef869bd9310a16b29eeb75ae616b765004614f4c2d68`.
Crema and Pantone upgraded in place and display live static background counts.

The owner approved replacing only Lenovo's sideload installation with Play.
The initial Play download was public 1.9.0; appearance, USB connection and ready
steps passed. After internal-test enrollment and refreshing Play's cache,
Play offered 1.10.0. The installed package reports `com.android.vending` and
its pulled base APK has Google's `cefed158…` signing certificate. The upgrade
preserved the selected 3D dashboard and connection settings.

At OS thermal status 3, the actual Play build measured 29.620 FPS in its native
SurfaceView under eight sessions with twelve background tasks each: 733 frames,
zero drops. The first live sample including startup was 29.806 FPS / 707 frames /
two drops. After real-host restoration and warm-up, it measured 30.269 FPS /
749 frames / zero drops. Earlier signed-candidate live/crowded samples were 30.176/29.855 FPS
with no drops; the pre-fix baseline was 13.238 FPS. This is a measured 30 Hz
path, not a claim of unthrottled 60 FPS on Lenovo.

Play runtime checks passed 5 → 2 → approval → resume → 0, three identity and
reconnect cycles with a 144-instance high-water mark (1,397 trace samples),
and reduced-motion pixel equality. Test settings and the real USB host were
restored. Local captures/traces are in `diagnostics/background-effects/play-*`.

Production 27 (1.10.0) is submitted for full rollout; publishing overview says
Changes in review. Managed publishing is off, so approval publishes it.
English/Korean/Japanese notes were verified. Store review is not public
availability; public Play was last verified as 1.9.0. Other channel candidates
were not published in this Android delivery. Details: [release receipt](RELEASING.md#android-1100-delivery-readback-2026-10-13)
and [Play record](marketplace/play/LISTING.md#1100-submitted-2026-10-13).

The owner corrected the version classification: this Android release primarily
completed the promised 1.9 behavior and should have been 1.9.1. Published 1.10.0
is retained. The canonical policy, root agent map, PR template and Android build
workflow now require a version decision before a bump/tag/upload: shared named
minor milestones, target-specific fixes as patches regardless of effort, and
separate build identities for unreleased retries. Existing unshipped candidate
numbers must be reassessed instead of copied across channels.

The merge's local-main deployment first stopped before replacing the installed
app because the CLI still pointed at the prior packaged-candidate installation.
The old link and staged app were preserved, the CLI was linked back to the
persistent main checkout, and the supported workflow retry
[passed](https://github.com/puritysb/AgentDeck/actions/runs/38320528631).
Its receipt confirms main `bfe3a935`, the running Mac app, daemon build
`edd35a089b37` on 9120, and the Stream Deck runtime. This is local development
deployment, not Apple or plugin marketplace publication.
