# 2026-10-16 — Dashboard connection lifetime and daemon failover

The live Claude cross-session communication trial exposed two independent native
connection defects. OSLog contains healthy WebSocket tasks failing with -1001 at
120.002–120.005 seconds: `timeoutIntervalForResource = 120` capped the entire
connection, rather than idle time. The override is removed; connect/ping
watchdogs remain bounded. A real client/server XCTest exchanges frames for more
than 125 seconds to cover the former deadline.

The app also promoted itself to a 9121 fallback while the Node daemon continued
serving 9120. Replaying the old port probe on this Mac proves an IPv6 dual-stack
wildcard bind/listen with address reuse succeeds alongside an IPv4 listener.
[LocalPortProbe](apple/AgentDeck/Daemon/Session/LocalPortProbe.swift) now connects
to both loopback families. A listener or an inconclusive result retains the
external host; only refusal on both families licenses promotion. External attach
retries retain the selected host and are cancelled on stop. Startup retains its
permissive actual-bind fallback when observation itself is unavailable.

A separate three-minute wire capture saw the Node roster briefly drop from eight
to two without a socket close or failed health probe. That event's exact internal
read error was not captured. The Claude observer is hardened against one concrete
loss path: malformed/missing session metadata no longer removes an identity when
the same Claude PID is still positively observed. Valid replacements, spare/job
classification and process exit still take effect. The authenticated `/diag`
adds numeric identity-read/retention counters for runtime attribution.

Focused checks: five native socket/probe tests pass, including the 125-second
connection lifetime case; 54 passive-observer tests pass, including real temporary
session-file corruption/removal and recovery. Quick verification and all five
changed Apple configurations pass. The clean [full verification receipt](verification/receipts/2026-10-16-303c724.json)
records 24 automatic passes, two platform/opt-in skips and three unattested lab
gates; Vitest reports 5,908 passing tests.

Installed the signed app at `/Applications/AgentDeck.app` and restarted the
supervised Node daemon through `agentdeck daemon restart` at 10:36 KST. Verified
source `303c7249`, app PID 38714 (binary SHA-256
`15c85b4122be4809884adb3b7f4dd6d3c4e84aa009a2973c6c49756c9e3c3565`),
daemon PID 38774, port 9120 and build `23be58f6b98c`. The previous app bundle is
preserved under the persistent checkout's ignored `diagnostics/backups/`.

Two dedicated real Claude Code 2.1.301 sessions exchange native `SendMessage`
notifications and a reply request. The communications API records explicit
`notification` and `request` intent, including notifications in both directions
while the request remains unanswered, followed by `response` intent for the real
receiver's explicit reply. Deliberately malformed metadata for the
test receiver increments the live daemon's retained-identity counter, keeps all
ten roster rows, and returns to zero retained rows after the file is restored.
Evidence is in ignored `diagnostics/dashboard-stability/` in the persistent
checkout. No production Claude metadata was modified.

Before deployment, another active Claude session explicitly restarted the shared
daemon at 10:15 and 10:25 KST; those shutdown/reconnect/startup intervals are
separate from a warm daemon losing observations. The Mac locked during the long
native builds. UI capture reports the lock, so Collaboration/terrarium visual
verification remains pending an unlock; socket and API measurements continue
without claiming a screen check.

The deployed Node soak spans 12 minutes: 356 successful health probes (median
8 ms, p95 1,270 ms, maximum 2,850 ms), 323 roster frames all containing ten
sessions, and no health errors, observer WebSocket errors or unexpected closes.
After the real reply, only the two dedicated test CLIs were stopped; the original
eight-session roster remains on the same daemon PID/build.

Do not read this as complete app stabilization. Native CFNetwork logs contain
additional WebSocket upgrades while the Mac is locked. A later app-only relaunch
captures `Ping failed`, a keepalive timeout, and stale-data watchdog reconnects;
debugger stops used to flush/inspect diagnostics are mixed into that later run.
An HTTP socket snapshot alone cannot attribute these transitions. Active-window
reproduction and visual verification are still blocked by the screen lock, and
the exact internal cause of the original warm Node eight-to-two drop remains
unconfirmed. The app was returned to ordinary LaunchServices execution (PID
82385, stdout/stderr `/dev/null`) after diagnostics; daemon PID 38774/build
`23be58f6b98c` was retained throughout.
