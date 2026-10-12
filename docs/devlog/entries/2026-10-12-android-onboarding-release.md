# 2026-10-12 — Android guided setup and additional 1.9.0 release preparation

Android previously opened directly into the dashboard. New installations now
follow Appearance → Connect → Ready, with offline previews from the production
renderers, static e-ink presentation, skippable steps and persistent completion.
Existing installations retain their appearance and pairing preferences. Settings
can reopen the guide on LCD and e-ink layouts.

The connection step reuses the dashboard connection ladder. Its startup probe
preserves a connection or host already selected during setup. Six-digit pairing
now uses the selected computer and requires a choice when discovery is ambiguous;
changing hosts clears the pending code/result. Android documentation no longer
claims a QR scanner that the app does not implement.

Four new Robolectric tests cover new-install persistence, upgrade migration,
credential retention and setup-to-dashboard connection handoff. The changed-area
gate passes, including the full TypeScript suite, real-process E2E, Android tests,
ESP32 host policies and all 14 simulator builds. The first quick run found the
surface welcome fixture still declaring server version 1.8.0; updating this
release-version mirror resolves that failure.

Signed 1.9.0 APKs upgrade Lenovo, Crema S and Pantone in place. Actual Lenovo and
Crema captures confirm readable guided setup and reachable bottom controls;
the LCD guide uses a bounded content width. Public delivery remains separately
tracked in [RELEASING.md](RELEASING.md): npm, Android and ESP32 are being prepared
at 1.9.0, with Android versionCode 26. The checked Play production version is
still 1.8.0 (25). Apple 1.9.0 remains a separate submitted release.

## Startup cost migration found during release soak

The installed npm candidate stopped answering health during SQLite work. A native
process sample pinned the event loop in `better_sqlite3` `Database::JS_exec`.
On a consistent 3.5 GB copy of the maintainer database, instrumented startup
identified repeated `cost_known` backfills: 57 ms for runs, 32 ms for tasks and
2,776 ms for sample events (2.882 s initialization). This copy measurement does
not by itself explain the entire live outage; the installed soak must pass after
the fix before npm tagging.

Node and Swift now infer historical positive costs only when the corresponding
table did not have `cost_known`. Subsequent opens preserve modern partially
priced aggregates instead of falsely marking their subtotal as fully known.
Regression coverage exercises legacy positive/zero costs and reopening on both
runtimes; Node also pins the absence of the unbounded UPDATE statement. The
Swift mirror is a follow-up after the submitted Apple 1.9.0/build 7901 and must
not be described as part of that immutable submission.

## Display fallback was the remaining live-response stall

The committed cost fix passed the complete automated pre-release check at
`fafb84ea`, but the installed fleet soak still timed out twice in 60 health
requests (5 s deadline). A temporary inspector trace of slow synchronous calls
identified 21 of 32 calls in DisplayMonitor: `pmset`, `ioreg` and `pgrep`, with
one call taking 2,695 ms. The three ran serially on the HTTP/WS event loop.
Only two SQLite writes crossed 200 ms (227/207 ms); the probe was removed and
the loopback inspector closed after measurement.

The fallback now runs three bounded asynchronous probes, preserves the last
known component on unreadable/timeout results, and accepts pgrep exit 1 as the
only no-match result. Stop/restart invalidates an in-flight poll; concurrent
polls are suppressed. Regression tests cover event-loop availability while
commands are pending, timeout/permission failure, recovery, and stale completions.
Installed-candidate soak and a fresh full receipt remain required before npm
publication.


## Additional channels delivered

Google Play **26 (1.9.0)** became available October 12 at **13:10 KST**, 100%
in 178 countries/regions. The exact public GitHub APK is installed on Lenovo,
Crema S and Pantone 6 with upgrade settings and guide completion preserved.
All four npm packages/latest tags and the twelve-board ESP32 release are public.
Registry integrity and **1297 code/type/asset file matches**, 60 firmware hashes
and 15 CI/public firmware matches were read back from their destinations.

Clean commit `8869a73e` passes 25 full automated gates in 15m16s; Windows Node
22/24/26 passes separately. Runtime `ee3f46e3890b` answers 90/90 health probes
(median 4 ms, max 1,810 ms) under concurrent full verification. CLI-only, Mac-client
and automatic Swift reclaim are observed with real work; recovery takes 145.2 s
including the documented bind cooldown. Every Android device displays the real
post-recovery reply without repairing hooks or ADB. Main auto-deploy is restored
at merge `4f00b28f` after preserving the prior staged app and restoring the CLI link.

LilyGo EPD47 and T-Display-S3-Pro directly report 1.9.0 / 79061799 after verified
writes. Full visual/touch lab acceptance is not inferred. NM serial identity is
unavailable and its old firmware is preserved ([#518](https://github.com/puritysb/AgentDeck/issues/518));
Swift-only BLE power-on timeouts are [#517](https://github.com/puritysb/AgentDeck/issues/517).
Apple 1.9.0/7901 remains Waiting for Review on both platforms. Its binary does
not contain the later APME repair. Destination and Pages details are in
[the delivery record](RELEASING.md#additional-190-delivery-readback-2026-10-12)
and [#515](https://github.com/puritysb/AgentDeck/issues/515).
