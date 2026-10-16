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
session-file corruption/removal and recovery. Full verification and deployment
results are recorded after the live stability run.
