# 2026-10-16 — Claude usage: a status-line relay beside the OAuth poll

**Why.** The Node daemon's Claude 5h/7d gauge read the undocumented
`/api/oauth/usage` with Claude Code's Keychain OAuth token
([bridge/src/usage-api.ts](bridge/src/usage-api.ts)) — the one gray-zone
dependency in the floor, next to Anthropic's 2026 enforcement against inference
relays — and the sandboxed macOS app had no Claude subscription gauge at all
without a sibling Node daemon (`UsageAPIClient.swift` returns no OAuth
credentials by design). Claude Code's status line is the documented carrier of
the same windows (`rate_limits.five_hour` / `seven_day`, Pro/Max only, present
after a session's first API response; docs read 2026-10-16). The owner's
decision the same day: keep today's experience, add the sanctioned source, give
each daemon the safe maximum it can have. Contract:
[.claude/rules/usage-quota.md § Claude status-line relay](.claude/rules/usage-quota.md).

**What landed.**

- A fourth installer snippet under the three-writer rule
  ([hooks/src/install.ts](hooks/src/install.ts), [setup/src/setup.ts](setup/src/setup.ts),
  `HookInstaller.swift`): the `statusLine` command forwards Claude's document to
  `POST /claude/statusline` (bounded fire-and-forget curl, `X-AgentDeck-Pid`,
  daemon.json port discovery without `$AGENTDECK_PORT`) and then runs the user's
  own status line inside `printf '%s' "$I" | { … }`, so uninstall restores it
  verbatim. Policy: wrap an existing status line by default; with none, opt in
  (`agentdeck daemon install --statusline`, `AGENTDECK_STATUSLINE=1`), because
  configuring a status line hides Claude Code's footer hints; `--no-statusline`
  removes it again. The App Store app only wraps.
- One rule module for both daemons: [shared/src/claude-statusline.ts](shared/src/claude-statusline.ts)
  → generated `ClaudeStatuslineRules.generated.swift`, with
  [shared/claude-statusline-vectors.json](shared/claude-statusline-vectors.json)
  replayed by vitest and XCTest: window parse, receipt-time freshness (5 min),
  OAuth poll suppression with one baseline read and a 10-minute refresh while
  the account carries per-model scoped caps, 30-minute carry-over of the
  OAuth-only fields, and a 0.05-point repaint threshold.
- Node: `BridgeCore.applyClaudeStatusline`, poll gating in `startApiUsagePolling`
  and `fetchUsageIfStale`, and `/health.claudeUsage` (source, reading age,
  attempted/suppressed polls, process-lifetime OAuth network fetch count).
- Swift: `POST /claude/statusline` on the in-process daemon; a reading becomes
  `cachedApiUsage` with `fetchedAt` at receipt, and a sibling relay or direct
  read that arrives while the status line is fresh only refreshes the scoped
  caps instead of replacing the live numbers. `/health.claudeUsage` names the
  source for parity, and Settings → Claude Code carries the same Wrap /
  Always / Off policy as the CLI.
- Windows: `~/.agentdeck/agentdeck-statusline.ps1`, a PowerShell file beside
  the hook script (same `$`-expansion reason); the user's own command rides as
  base64 on the command line and runs through Git Bash with the same document
  on its stdin. Exercised by the Windows CI job.

**Measured.** Isolated probe first (worktree build, `--local --loopback -p 9200
--port-window 9200-9209`, its own data dir, one WebSocket client connected): a
first reading answered `{applied: true, broadcast: true}` and the client saw a
`usage_update` carrying the posted windows and the `Claude` subscription row;
the identical reading again answered `broadcast: false`; a document without
`rate_limits` and a malformed body answered `applied: false`; a 1.4-point move
produced exactly one more broadcast. `/health.claudeUsage` read
`source: statusline` and `oauthPollSuppressed: true`, and after 80 s with the
client connected `oauthPolls` stood at `attempted 0, suppressed 1` with
`oauthNetworkFetches` still at the single baseline read — whose scoped `Fable`
cap rode along on every status-line frame. The first probe run caught the
defect the fold rule now covers: a baseline OAuth read landing 30 ms after the
first status-line POST replaced the live numbers and flipped the source back
to `oauth`.

Then this desk's launchd daemon (build `f3430ac39cda`, restarted through
`agentdeck daemon restart`), with the relay installed relay-only
(`AGENTDECK_STATUSLINE=1 node hooks/dist/install.js install`) for the two
Claude Code sessions open at the time: within a second of the install,
`/health.claudeUsage` read `source: statusline` naming the posting session,
and both sessions took turns as the newest poster. The first relayed frame
matched the OAuth cache from a minute earlier on the 5-hour window (57 %) and
differed by one point on the weekly window (23 vs 24) — the kind of
disagreement the fold rule exists for. Over the next seven minutes with
clients connected the poll stood at `attempted 0, suppressed 7`, the baseline
came from the shared file cache (0 network fetches), the scoped `Fable` cap
rode along, and the Stream Deck, Pixoo and e-ink gauges kept rendering. One
ad-hoc refresh path (a deck `query_usage`, a wake or a connect — four call
sites besides the poll) still reached the network once in that window, which
is why every refresh now goes through `refreshClaudeUsageIfAllowed`.

Second run on the unified gate (build `336ea442b879`, three Claude Code
sessions posting in turn): the restart's reconnect storm made 11 refresh
attempts in the first 17 s while the baseline OAuth read was still owed — the
first network read failed (`TypeError: fetch failed`, absorbed as a fallback
that changed nothing), usage-api's own 45 s backoff turned the rest into
cache reads, and the second network read at +60 s established the baseline.
From then on, over six minutes with clients connected: `attempted` frozen at
12, `suppressed` climbing 2 → 7, `oauthNetworkFetches` frozen at 2, `source`
always `statusline`. That is the shape the decision asked for — the
undocumented endpoint is touched once to learn the per-model caps and then
left alone for as long as sessions keep talking (the 10-minute scoped-cap
refresh will add one read per ten minutes on this account, which carries a
`Fable` cap). Not measured from here: the footer-hint change in Claude Code's
own terminal, and one `/health` that did not answer within 8 s during the
sampling (the earlier build showed the same gaps; no baseline exists for it
before this change).

**Rejected alternatives.** Dropping OAuth entirely: it loses the per-model
scoped caps (this account carries a `Fable` weekly cap the status line cannot
see) and the idle-time refresh. Default-on for users without a status line:
Claude Code's footer hints (`esc to interrupt`, `? for shortcuts`, voice)
disappear the moment one is configured. Routing the relay through
`$AGENTDECK_PORT` like the hooks: a managed session bridge does not serve the
route, and the account gauge belongs to the daemon. Backgrounding the curl with
`&`: a bounded foreground POST is what the hooks already do, and cancellation
by the next update is Claude Code's own behaviour.

**Traps met on the way.** Swift 6 refuses a shared static `ISO8601DateFormatter`
(not Sendable), so the generated mirror builds a formatter per call. A vitest
that executes the snippet against an HTTP server in the same process must not
use `execFileSync`: it starves the event loop, the `/health` probe times out,
and the relay falls back to port 9120 — the real daemon on a developer's
machine. A throwaway daemon beside the real one needs `--port-window 9200-9209`
(the singleton guard sweeps the default window and concedes to the incumbent)
and `--no-build` (newer test files read as stale sources and trigger a rebuild).

**Left open.** The status-line document also carries per-session
`context_window.used_percentage`, `cost` and `prompt_cache`; nothing reads
them yet. The Windows script's Git Bash hand-off is covered by CI, not by a
desk here.
