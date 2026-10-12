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
