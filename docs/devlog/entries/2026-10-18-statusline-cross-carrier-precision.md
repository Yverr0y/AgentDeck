# 2026-10-18 — Claude status-line relay: an exact cross-carrier compare locked the relay out

**What was seen.** The morning after #556 merged with its review fixes, this
desk's Node daemon (build `664216f14081`, master `de8800ee`, started 02:36 KST)
read `/health.claudeUsage.source: oauth` 47 minutes in. The last accepted
status-line reading was from 02:40, posted by a headless verification session
(`claude -p --session-id 0000c0de-…`), and none after it, although this
interactive session's relay kept posting through every API response. The poll
the relay exists to quiet was running every minute: `oauthPolls` attempted 49,
suppressed 8, and 19 OAuth network fetches since the restart. The lock let go
by itself at 03:46: an OAuth read came back with the 5h reset at
`20:49:59.609113` instead of `20:50:00.323175`, and the next status-line
document, 15 s later, was accepted. By then the daemon had made 31 network
fetches in 70 minutes with sessions active.

**Why.** The review fix added a cross-session ordering check to
[shared/src/claude-statusline.ts](shared/src/claude-statusline.ts): a status-line
reading may not replace a fresh account reading with an older reset, or with a
lower percent for the same reset. The reading it compares against is whatever
feeds the gauge, OAuth included, and the two carriers do not share a
precision. The status line stamps resets in whole epoch seconds. OAuth stamps
them in microseconds, and its sub-second part sits on either side of that
second (`usage-cache.json`):
- For more than an hour it read `.323175` above it. Every status-line reset
  parsed older and was refused. A refused document does not renew the
  status-line clock, so the reading aged past five minutes, the 60 s poll
  resumed, and each OAuth read kept the comparison reading fresh. The lock
  lasts as long as OAuth's fraction stays above the second.
- Below the second, the same exact compare reads a whole-second reset as a
  newer window. A stale status-line document with a lower percent then beats
  the newer OAuth reading.

The vectors could not see either case, because every fixture built both
resets with the same `toISOString()`. The Swift daemon runs the same generated
check and parses the microseconds identically, so it behaves the same way
whenever a sibling Node relay feeds it.

**Fix.** The ordering check is told which carrier the comparison reading came
from. Between status-line readings it stays exact. Against an OAuth-family
reading (`oauth`, `relay`, or unknown), resets within 1 s are one window in
either direction, and a status-line percent up to one point lower is the same
observation:
- OAuth's 5h/7d utilization has arrived as whole percent in every reading on
  this desk: 7 and 40 at 02:40, 18 and 42 at 03:46, 49 and 23 on 10-16.
- The first relayed frame on 10-16 read the weekly window one point under
  OAuth.

Older windows and larger drops are still refused, now also when OAuth's
fraction lands below the second. Both suites replay the new vectors, which are
copied from the live cache on both sides of the second.

**Rejected alternatives.**
- **Restoring the 10-16 fold**, where an OAuth read only refreshes the scoped
  caps while the status line is live. The review made a newer successful
  account read authoritative for every window on purpose (account changes,
  legitimate decreases), and this lock can be fixed without reopening that
  decision.
- **Rounding every comparison to whole seconds and whole percent.** Concurrent
  status-line sessions share a precision, and between them a lower reading for
  the same window really is the older one.

**Left open.** The ten-minute OAuth revalidation still replaces the live
windows with OAuth's rounded numbers until the next status-line document puts
the finer ones back, so an active desk can repaint a one-point difference
twice in ten minutes.
