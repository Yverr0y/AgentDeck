# How AI coding-agent harnesses evolved in 2026, and what that means for AgentDeck

*Research memo for the AgentDeck product workshop. Prepared 2026-10-16. **All URLs accessed 2026-10-16**; source IDs in `[brackets]` resolve in §7.*

**Confidence legend.** *official* = vendor docs, changelog or press release. *press* = trade press. *secondary* = blogs, aggregators and doc mirrors. **UNVERIFIED** = the claim rests only on secondary sources, sources conflict, or it is an absence-of-evidence finding. Treat UNVERIFIED rows as hypotheses to check before you act on them.

---

## 0. Executive summary

1. **One-tap remote approve/deny is now native at the three largest vendors.** Claude Code Remote Control forwards permission prompts to the Claude phone app and web, and keeps them open until you answer [C1]. Codex Remote in the ChatGPT app became generally available on 2026-06-25 [X1]. Copilot CLI remote control went GA on 2026-05-18 with "Approve or deny permission requests based on your settings" [H4].
2. **Per-vendor fleet views are everywhere:**
   - Claude Code: a desktop sidebar for parallel sessions (2026-04-14) [C5], the `claude agents` agent view [C2], and a Remote Control server that runs up to 32 concurrent sessions [C1].
   - Codex: the app (2026-02-02), which became part of the ChatGPT desktop app on 2026-07-09 [X3][X1].
   - Others: Cursor 3 Agents Window (2026-04-02) [U1], Antigravity 2.0 (2026-05-19) [G3], Devin Desktop Agent Command Center [D1][D2], Zed Threads Sidebar [Z1], and GitHub Agent HQ mission control [H1].
3. **Attention filtering is partly absorbed.** Claude Code has separate push toggles for "actions required" and "Claude decides". It skips pushes while you are at the terminal and accepts a `CLAUDE_CLIENT_PRESENCE_FILE` presence marker [C1]. Codex added per-category notification sounds for completions, permission requests and questions on 2026-09-22 [X1]. GitHub Mobile shows Live Activities for Copilot CLI sessions (2026-07-08) [H5].
4. **Quota display is moving onto the phone, but only for each vendor's own plan.** Codex iOS Lock Screen and Home Screen widgets show "remaining usage and reset times" (2026-10-02) [X1]. Claude Code passes `rate_limits` (5-hour and 7-day windows) to the status-line script, though users report gaps [C16][C17][C19]. **No harness shows quota across providers.**
5. **The unmet core:** an agent-agnostic single view combined with physical/ambient presence and local-first operation. No vendor shows a rival's local sessions or lets you approve them:
   - Warp covers Claude Code, Codex and OpenCode, but only inside Warp [W2].
   - Zed and Devin Desktop reach other agents through ACP, but only inside their own IDE [Z1][D2].
   - Agent HQ covers cloud agents hosted on GitHub [H1].
   - No vendor ships hardware for agent state. Elgato's May 2026 "MCP Deck" goes the other way: AI assistants trigger deck actions [E1][E3].
6. **Hooks that can make decisions now exist across harnesses.** This makes observation cheap and makes PTY scraping obsolete:
   - Claude Code: `PermissionRequest` and `Notification` hooks [C11], plus HTTP hooks (UNVERIFIED version) [C14].
   - Codex: 12 hook events, enabled by default; `PermissionRequest` can allow or deny [X2].
   - Cursor: loads Claude Code hooks [U4].
   - Also Gemini CLI `Notification` [G1], Copilot CLI declarative hooks [H6], and Kiro global hooks (UNVERIFIED) [K2].
7. **Multi-harness use is the norm:**
   - JetBrains (August 2026, 15,000+ developers): 90% use agents weekly. Claude Code is at 39% and Codex at 16% [S1].
   - Pragmatic Engineer: 70% use 2–4 AI tools at the same time [S2].
   - Every vendor's remote path is a separate app and a separate cloud relay. A household running 2–3 harnesses therefore juggles 2–3 phone apps.
8. **Risks:**
   - **Terms of service:** Anthropic's February 2026 terms limit subscription OAuth tokens to Claude Code and Claude.ai. It enforced this against OpenCode (2026-03-19) and OpenClaw (2026-04-04) [T2][T3][T4].
   - **Churn:**
     - Consumer access to Gemini CLI ended 2026-06-18 [G3].
     - `codex mcp-server` was removed on 2026-09-05 [X1].
     - Claude Code's CHANGELOG is already at 2.1.300 [C2].
     - Hook regressions were reported in Claude Code and Cursor [C13][U7].
   - **Admin gating:** Remote Control is off by default on Claude Team/Enterprise [C1]. Codex trusts hooks by hash [X2].

**Single most important implication:** vendors have absorbed AgentDeck's single-agent remote-control loop of see, get pinged and approve. AgentDeck's durable position is a **cross-harness, local-first "who needs me now" layer with a physical one-tap answer**. To get there it should:
- rebuild observation on the official decision hooks and app-server APIs (and stop relying on PTY parsing or undocumented usage endpoints);
- act as the presence oracle that tells each vendor's push system when you are at the desk.

---

## Method

- **Scope:** 41 web searches and 11 page fetches (8 returned content), from 2026-10-15 to 2026-10-16. The AgentDeck repository was deliberately not read.
- **Official pages read directly:**
  - Claude Code Remote Control docs [C1] and the CHANGELOG [C2] (first ~100K characters, versions ≈2.1.290–2.1.300).
  - Codex changelog [X1] (2026-05-14 → 2026-10-14) and hooks docs [X2].
  - Cursor hooks reference [U4] and the GitHub changelog [H4].
- **Fetch failures:**
  - openai.com [X7] returned 403, so it is cited from its search snippet.
  - Warp's notification page [W2] returned 404, so it is cited from its search snippet and marked UNVERIFIED.
- **Gaps:** usage exposure and evaluation features for Cursor, Copilot, Antigravity, Amp, Factory and Devin were not researched in depth. They are marked `?`.
- **First-hand observation [OBS]:** the Claude Code build running this research (2026-10-16) has tools that:
  - list and message "other local Claude sessions on this machine", "Claude sessions running in the cloud" and "Remote Control sessions on other machines" (`ListAgents`/`SendMessage`);
  - send a `PushNotification`.

  Its agent picker also names a "FleetView". This is direct evidence that fleet addressing and cross-session messaging are native. It is not public documentation, so it is UNVERIFIED as a product claim.

---

## 1. Harness-by-harness comparison

### Table A: fleet, attention, approval, remote

| Harness | Native multi-session / fleet | Attention UX (what tells you it's waiting) | Permission UX and remote approval | Remote / mobile control |
|---|---|---|---|---|
| **Claude Code** (CLI, desktop, web, IDE) | Desktop redesign "for parallel agents": sidebar, drag-and-drop layout (2026-04-14) [C5][C6]. `claude agents` agent view for background sessions; `/effort` and `/fast` defaults (2.1.299) [C2]. Remote Control server mode: `--capacity` default **32** sessions, `--spawn worktree` [C1]. Views are fragmented: the agent view misses sessions dispatched from mobile ("FleetView") [C3][C4]. | `Notification` hook with permission/idle/elicitation matchers [C12]. Phone push has two toggles, **"Push when actions required"** and **"Push when Claude decides"**. Pushes are skipped while you type or focus the terminal, and `CLAUDE_CLIENT_PRESENCE_FILE` suppresses them while you are at the machine [C1]. Improved status for "session waiting on a permission prompt" (2.1.295) [C2]. | `PermissionRequest` hook (since 2.0.45, Nov 2025) [C11]. Remote approval from phone and web; "keeps permission prompts and AskUserQuestion questions open until you answer them" [C1]. A phone-approval hang bug was filed 2026-04-22 (since resolved) [C21]. | Remote Control on Pro, Max, Team and Enterprise. Off by default on Team/Enterprise. Not available with API keys, Bedrock, Vertex, Foundry, or `ANTHROPIC_BASE_URL` gateways [C1]. Dispatch: a task sent from your phone can spawn a Desktop session [C1]. Routines are scheduled cloud agents (schedule, API or GitHub triggers; 2026-04-14) [C7][C8]. Channels (`--channels`) [C2] with Telegram/Discord (UNVERIFIED) [C26]. |
| **OpenAI Codex** (CLI, app, cloud, IDE) | Codex app for macOS: threads grouped per project, worktrees (2026-02-02) [X3][X4]. Background-thread coordination and subagent identicons (2026-05-29). Became part of the ChatGPT desktop app on macOS and Windows (2026-07-09). iOS widgets show recent tasks per computer (2026-10-02) [X1]. | Notification-sound setting "for task completions, permission requests, and questions" (2026-09-22). Opening a completed task from an iOS notification (2026-05-18). Fewer unread notifications during goals (2026-06-09) [X1]. The hooks page has no notification event [X2]. | Approval policies. `PermissionRequest` hook "can allow the request, deny the request, or decline to decide"; "any deny wins" [X2]. Redesigned approval picker on iOS (2026-10-07) [X1]. Phone approvals use the same gates as desktop [X8]. | Codex in the ChatGPT mobile app via a paired Mac (2026-05-14); Windows hosts (2026-05-29); **GA with one-to-one QR pairing (2026-06-25)** [X1][X7]. Third-party clients use the app-server v2 RPCs (Remodex) (UNVERIFIED) [X9]. |
| **Gemini CLI → Antigravity** | Antigravity 2.0 (I/O, 2026-05-19) is a standalone desktop app that orchestrates teams of agents in parallel and schedules background tasks. It also includes a Go CLI and an SDK [G3]. The legacy IDE's Agent Manager is being deprecated (UNVERIFIED) [G4]. | Users reported the Agent Manager Inbox missing in Feb–Mar 2026 [G5]. A third-party guide says there is no OS push when the app is minimized and that "needs you" alerts are not fully native [G6]. Gemini CLI has an advisory `Notification` hook [G1]. | In-app approvals; Gemini CLI `BeforeTool` hook can block or rewrite [G1]. Remote approval: none found (UNVERIFIED). | None found (UNVERIFIED). Consumer access to Gemini CLI and Code Assist IDE extensions **ended 2026-06-18**; Antigravity is the successor [G3]. |
| **Jules** (Google) | Web task list. The Jules Tools CLI lists sessions (Oct 2025) [G7]. | ? (none found) | Plan approval on the web (UNVERIFIED) | Asynchronous and cloud-native by design. Jules API (Oct 2025) [G7]. |
| **Cursor** | **Agents Window** (Cursor 3.0, 2026-04-02) runs many agents across repos: local, worktree, cloud and remote SSH [U1]. Automations (3.5, 2026-05-20) [U3]. Cloud subagents (3.7, 2026-06-17) [U2]. | ? (not researched) | Hooks allow, deny or ask; exit code 2 blocks [U4]. Remote approval: not confirmed. | Cloud agents reachable from web, mobile, Slack, GitHub and Linear. Pairing-based remote control of a local desktop (Sept 2026) (UNVERIFIED) [U5]. |
| **GitHub Copilot** (coding agent, CLI, Agent HQ) | **Agent HQ "mission control"** lets you "assign, steer, and track" multiple agents, including Claude and Codex (public preview Feb 2026; Pro+/Enterprise) [H1][H2]. Remote CLI sessions are listed at github.com/copilot/agents [H4]. | **GitHub Mobile live notifications** for CLI sessions: iOS Live Activities and Android live updates (2026-07-08) [H5]. | "Approve or deny permission requests based on your settings" from mobile and web [H4]. | `copilot --remote` / `/remote on`. Preview 2026-04-13, **GA 2026-05-18**. Needs an admin policy on Business/Enterprise. `/keep-alive` [H3][H4]. |
| **OpenCode** | Client/server design; the desktop app (Tauri) is a client of the HTTP server [O4]. No cross-machine fleet view found. | Desktop notifications on response-ready or error (secondary). `permission.asked` event [O1][O2]. | `permission.asked`/`permission.replied` events, so third-party approval queues are possible [O2][O3]. | Through the server API. No first-party mobile app found (UNVERIFIED). |
| **Kiro** | CLI cloud sessions preview (v2.17.0, mid-Aug 2026) (UNVERIFIED) [K3]. | ? | `/goal` loops and queue steering (v2.7.0) (UNVERIFIED) [K4]. | Cloud sessions you can resume from another machine (UNVERIFIED) [K3]. |
| **Amp** | Remote "Orbs" controlled from web, phone or CLI (UNVERIFIED) [A1][A2]. | ? | ? | Web and phone, via Orbs (UNVERIFIED). |
| **Warp (Oz)** | **Agent Management Panel** plus the Oz web "Runs" page (works on mobile), showing active, blocked and failed runs, both interactive and cloud [W1]. | Tab attention badges and native desktop notifications. **Covers Claude Code, Codex and OpenCode** after a one-time setup (UNVERIFIED: page 404 on re-fetch) [W2]. | In-terminal. Remote: ? | Oz cloud runs triggered from Slack, Linear, schedules, GitHub Actions or the API [W1][W3]. |
| **Factory Droid** | "Missions" with a Mission Control dashboard (research preview) (UNVERIFIED) [F2]. | ? | Hooks; sandboxed-hook fix in v0.167.0 (UNVERIFIED) [F1]. | `droid exec` for headless runs [F1]. |
| **Devin / Devin Desktop** (formerly Windsurf) | Windsurf 2.0 **Agent Command Center**, a Kanban board of local and cloud sessions (Apr 2026) [D1]. Renamed **Devin Desktop** on 2026-06-02, opening on the Command Center (UNVERIFIED) [D2][D3]. | ? | ? | Devin cloud (web, Slack) (UNVERIFIED). |
| **OpenClaw** | The gateway owns all session state [L3]. **2.0 (2026-08-30)** added shared sessions with creator, owner, participants and live presence, with the browser UI as the primary surface (secondary) [L1]. | ? | iOS companion "node" app supports approvals; nodes need pairing approval (secondary) [L2]. | Self-hosted gateway; Tailscale `wss://` recommended [L2]. |
| **Hermes Agent** (Nous) | ? | Messaging gateway for Slack, Telegram, WhatsApp and email [L6]. | ? | Through messaging apps; desktop app (v0.19.1, 2026-07-30) [L5]. |
| **Zed** | **Threads Sidebar** runs parallel threads grouped by project, with a status indicator and the agent's identity. The built-in agent and external agents (e.g., Claude Code) can run side by side [Z1][Z2]. | `agent.notify_when_agent_waiting` and `agent.play_sound_when_agent_done` [Z3]. | In-editor tool approval. No remote approval. | None. |

### Table B: usage, metrics, hardware, extensibility

| Harness | Usage / quota exposure | Session metrics / eval | Hardware / peripherals | Extensibility, and are third-party observers supported? |
|---|---|---|---|---|
| **Claude Code** | The status-line JSON includes `rate_limits.five_hour` and `seven_day` (`used_percentage`, `resets_at`). It arrived in 2.1.80 per an issue that quotes the changelog. It is sometimes missing for Max users, and the per-model weekly limits are not passed through [C16][C17][C18][C19]. `/usage`, and headless `rate_limit_event` warnings (2.1.295/2.1.299) [C2]. | OpenTelemetry metrics, events and optional traces (`CLAUDE_CODE_ENABLE_TELEMETRY=1`) [C20]. No native quality eval found (UNVERIFIED negative). | None native. CLI `/voice` push-to-talk (Mar 2026) [C9][C10]. | Hooks: command and HTTP handlers (HTTP since 2.1.63, UNVERIFIED) [C14][C15]. At least a dozen new events in 2026 (secondary) [C11]. Also plugins, skills, status line, Agent SDK and MCP. "Mods" with UI hooks and `$.ui.notify` (2.1.295, 2.1.300) [C2]. Observers are **de facto supported** through documented hooks; there is no dedicated observer API. |
| **Codex** | app-server `account/rateLimits/read` [X5]; multi-limit `rate_limits_by_name` (UNVERIFIED) [X6]. iOS task menu shows limits and credits (2026-07-06). **Widgets show remaining usage and reset times** (2026-10-02). Reset banking (2026-06-11) [X1]. | OpenTelemetry export (UNVERIFIED in this research). | None. Phone-ambient widgets only [X1]. | 12 hook events, **enabled by default**, trusted by hash. Managed hooks via MDM or `requirements.toml` [X2]. Plugins can bundle hooks (2026-05-21). **The app-server is the integration surface;** `codex mcp-server` was removed on 2026-09-05 [X1]. |
| **Gemini CLI / Antigravity** | AI Pro and Ultra tiers; Ultra at $100 gives 5× the Pro limits [G3]. No API exposure found. | ? | None. Antigravity 2.0 has voice commands [G3]. | Gemini CLI hooks (`BeforeTool`, `AfterAgent`, `Notification`) [G1], on by default since v0.26.0 (UNVERIFIED) [G2]. Antigravity SDK [G3]. |
| **Cursor** | ? | `stop`-hook telemetry example in the docs [U4]. Transcript search (3.11) (UNVERIFIED) [U6]. | None. | 21 hook events. "**Cursor supports loading hooks from third-party tools like Claude Code**": `CLAUDE_PROJECT_DIR` alias and exit-code-2 parity [U4]. Five cloud-agent hook events in 3.11 (UNVERIFIED) [U6]. |
| **GitHub Copilot** | Each third-party agent session costs one premium request [H1]. | Organization audit logging [H1]. | None. Live Activities are phone-ambient [H5]. | Copilot CLI declarative agent-scoped hooks (1.0.97, 2026-10-13; from a search summary, UNVERIFIED) [H6]. Listed in the ACP registry [Z4]. |
| **OpenCode** | Works with many providers. Anthropic OAuth was removed on 2026-03-19 [T3]. | ? | None. | Typed SDK, **server-sent event stream**, plugins and ACP [O1][O2][Z4]. **Third-party observers are explicitly supported.** |
| **Kiro** | ? | ? | None. | IDE hooks. CLI global hooks (v2.13.0) [K2]. CLI 3.0 harness with a hook-migration guide (official) [K1]. |
| **Warp** | Credit usage per run [W1]. | Run sessions can be inspected afterwards [W1]. | None. | Triggers, API and CLI [W1]. Hosts third-party agents [W2]. |
| **Devin Desktop** | Shared Windsurf quota (UNVERIFIED) [D1]. | ? | None. | ACP lets third-party agents run alongside Devin (UNVERIFIED) [D2]. |
| **OpenClaw / Hermes** | OpenClaw lost Claude subscription access on 2026-04-04 [T4]. | ? | None. Voice "Talk mode" on the iOS node (OpenClaw) [L2]; Hermes voice subsystem [L5]. | Gateway WebSocket protocol and operator scopes (secondary) [L2][L3]. Hermes tool gateway and messaging gateway [L4][L6]. |
| **Zed** | ? | ? | None. | **ACP**, co-maintained with JetBrains. The ACP Registry launched 2026-01-28 and lists Claude Code, Codex CLI, Copilot CLI, OpenCode and Gemini CLI [Z4][Z5]. |

**Hardware across the board:** this research found no harness that ships its own peripheral or physical status integration (UNVERIFIED negative). The physical layer is a third-party market:
- **Stream Deck plugins:**
  - Agent Vitals: free; Claude Code status and usage, plus Allow / Always Allow / Deny keys [E4].
  - VibeDeck: $5/month; six agents including Codex [E5].
  - agentsd: a `PermissionRequest` hook holds the HTTP response for 120 s while you press a button [E6].
  - StreamDeck-Claude: usage read from an undocumented OAuth endpoint [E7].
- **Notch apps:** Vibe Island ($19.99; 25 agents in v1.0.40; approve/deny) and the open-source Open Island [E8].
- **USB lights:** Semaphore, Glowbug and ThinkLight [E9].
- **Elgato itself:** Stream Deck 7.4 added **MCP support with an "MCP Deck"** of 32 virtual keys, so AI assistants can trigger deck actions. NVIDIA G-Assist is the first partner (press release 2026-05-28; one outlet says 2026-05-26) [E1][E2][E3].

---

## 2. Timeline of notable 2026 releases

| Date | Event | Src |
|---|---|---|
| 2026-01-09 | Anthropic starts blocking subscription OAuth tokens outside its own apps (secondary) | [T1] |
| 2026-01-28 | JetBrains and Zed launch the ACP Registry (beta) | [Z4][Z5] |
| 2026-02-02 | OpenAI launches the Codex app for macOS (parallel threads, worktrees) | [X3][X4] |
| 2026-02 (≈4–9) | GitHub Agent HQ adds Claude and Codex (public preview) | [H1][H2] |
| 2026-02 | Anthropic's consumer terms limit subscription OAuth tokens to Claude Code and Claude.ai (secondary) | [T2] |
| 2026-02 (late) | Claude Code Remote Control research preview (exact date UNVERIFIED) | [C24] |
| 2026-03 | Claude Code `/voice` push-to-talk, initially to ~5% of users | [C9] |
| 2026-03-19 | OpenCode removes Anthropic OAuth after legal demands (secondary) | [T3] |
| 2026-03-30 | Codex CLI hooks engine, behind a feature flag (secondary) | [X10] |
| 2026-04-02 | Cursor 3.0 Agents Window | [U1] |
| 2026-04-04 | Anthropic cuts off subscription use by OpenClaw and other third-party harnesses | [T4][T5] |
| 2026-04-13 | Copilot CLI remote control (public preview) | [H3] |
| 2026-04-14 | Claude Code desktop redesign for parallel sessions; Routines launch | [C5][C6][C7] |
| 2026-04-15/16 | Windsurf 2.0 Agent Command Center | [D1] |
| 2026-05-14 | Codex in the ChatGPT mobile app (pairs with a Mac running the Codex app) | [X1] |
| 2026-05-18 | **Copilot CLI remote control GA** (approve/deny from mobile and web) | [H4] |
| 2026-05-19 | **Antigravity 2.0** (desktop multi-agent app, Go CLI, SDK, voice); Gemini CLI consumer end of life announced | [G3] |
| 2026-05-20 | Cursor 3.5 Automations | [U3] |
| 2026-05-25 | Codex hooks GA (v0.133) (secondary) | [X11] |
| 2026-05-28 | **Elgato Stream Deck MCP support ("MCP Deck")** | [E1] |
| 2026-05-29 | Codex remote adds Windows hosts; background thread coordination | [X1] |
| 2026-06-02 | Windsurf becomes Devin Desktop (UNVERIFIED) | [D2][D3] |
| 2026-06-17 | Cursor 3.7 cloud subagents | [U2] |
| 2026-06-18 | **Consumer access to Gemini CLI ends** | [G3] |
| 2026-06-25 | **Codex Remote GA** (one-to-one QR pairing) | [X1] |
| 2026-07-08 | GitHub Mobile Live Activities for Copilot CLI | [H5] |
| 2026-07-09 | Codex becomes part of the ChatGPT desktop app (macOS and Windows) | [X1] |
| 2026-07-23 | ChatGPT Voice can coordinate tasks across Chat, Work and Codex | [X1] |
| 2026-08-18 | JetBrains adoption survey published | [S1] |
| 2026-08 (mid) | Kiro CLI v2.17 cloud sessions (UNVERIFIED). Cursor subagent hooks reported as no longer firing | [K3][U7] |
| 2026-08-30 | OpenClaw 2.0 shared sessions (secondary) | [L1] |
| 2026-09-05 | `codex mcp-server` removed; the app-server is the sole integration surface | [X1] |
| 2026-09-22 | Codex notification sounds per category (completion, permission, question); GPT-6 Sol/Luna in Codex | [X1] |
| 2026-10-02 | **Codex iOS widgets with remaining usage and reset times** | [X1] |
| 2026-10 (≈early) | Claude Code 2.1.292–2.1.300: agent-view work, Remote Control "waiting on permission" status, PushNotification fixes, mods `$.ui.notify` (per-version dates UNVERIFIED) | [C2][C25] |
| 2026-10-13 | Copilot CLI 1.0.97 declarative hooks (UNVERIFIED) | [H6] |
| 2026-10-14 | GPT-5.5 retired from Codex for ChatGPT sign-ins | [X1] |

---

## 3. Absorption map: AgentDeck values against native harness features

**A** = absorbed natively. **P** = partial (own agent only, or limited surface). **U** = unmet. **?** = no evidence either way. **U\*** = unmet on absence of evidence (UNVERIFIED negative).

| AgentDeck value | Claude Code | Codex | Copilot | Cursor | Antigravity | Warp | Devin Desktop | Zed | OpenCode | OpenClaw/Hermes |
|---|---|---|---|---|---|---|---|---|---|---|
| Fleet visibility | **A** | **A** | **A** | **A** | **A** | **A** | A (UNVERIFIED) | **A** | P | A |
| Attention on genuine waits only | **A** (phone; presence-aware) | P | P | ? | P→U | P | ? | P | P | ? |
| One-tap approve/deny (remote) | **A** | **A** | **A** | ? | U\* | ? | ? | U (local only) | P (API) | A (secondary) |
| Physical / ambient presence | U | P (phone widgets) | P (Live Activities) | U | U | U | U | U | U | U |
| Agent-agnostic single view | U | U | P (cloud agents) | U (reads Claude hooks) | U | P (inside Warp) | P (ACP, UNVERIFIED) | P (ACP) | U | U |
| Local-first privacy | P (local execution, Anthropic relay) | P (ChatGPT relay) | P (GitHub relay) | P? | ? | P | U\* | A (no remote) | **A** | **A** |
| Usage/quota across providers | P (own only) | P (own only; strong) | ? | ? | ? | P (own credits) | ? | ? | ? | U |
| Voice push-to-talk | **A** (`/voice`) | **A** (ChatGPT Voice) | ? | ? | **A** (2.0 voice) | ? | ? | ? | ? | A (Talk mode) |
| Local eval | U\* (OTel telemetry only) | ? | U\* | P? (stop-hook telemetry) | ? | U\* | ? | U\* | U\* | U\* |

### Evidence notes by value

- **Fleet visibility: ABSORBED per vendor.** Every major harness now has a native many-sessions surface. The table cells in §1 give the citations, notably [C1][C2][C5][X1][U1][G3][H1][Z1][D1][W1]. AgentDeck's residual value is only *across* vendors and *off-screen*.
- **Attention on genuine waits: ABSORBED for Claude Code, PARTIAL elsewhere.**
  - Claude Code separates "actions required" (permission prompts and questions) from "Claude decides". It suppresses pushes while you are at the terminal and exposes a presence-marker file [C1]. This is AgentDeck's "genuine waits only" principle, shipped natively.
  - Codex has per-category sounds and goal-aware unread reduction [X1].
  - Antigravity's Inbox was reported missing and has no OS push [G5][G6], so this value is weakest there.
- **One-tap approve/deny: ABSORBED by Claude Code, Codex and Copilot** [C1][X1][H4], each on its own phone app and relay. Two caveats:
  - Reliability: the Claude phone-approval hang [C21].
  - Fewer prompts: Claude Code "Auto mode" with containment rules (2.1.257, UNVERIFIED) [C25].
- **Physical / ambient presence: UNMET natively.** The closest native moves are on the phone: Codex Lock Screen widgets [X1] and GitHub Live Activities [H5]. The third-party market is crowded [E4]–[E9]. Elgato's MCP Deck lets AI drive the deck; it does not show agent state on it [E1].
- **Agent-agnostic single view: UNMET, with partial attempts:**
  - Warp, only for agents run inside Warp [W2].
  - Zed and Devin Desktop through ACP, only inside the IDE [Z1][D2].
  - GitHub Agent HQ, cloud agents only [H1].
  - Cursor *executes* Claude Code hooks but shows no Claude sessions [U4].
  - Third parties that prove demand: Vibe Island (25 agents) [E8], and a FleetView port to OpenCode, Claude and Copilot [E10].
- **Local-first privacy: PARTIAL at the big three.** Execution stays local, but control goes through the vendor's cloud relay. Claude Code Remote Control does **not** work through Bedrock, Vertex, Foundry or `ANTHROPIC_BASE_URL` gateways, is off by default on Team/Enterprise, and offers Trusted Devices [C1]. Copilot remote needs an admin policy [H4]. Self-hosted options (OpenCode server, the OpenClaw gateway over Tailscale) are fully local [O1][L2].
- **Usage/quota across providers: UNMET.**
  - Each vendor exposes only its own quota. Codex's widgets are the strongest [X1]; Claude's status-line `rate_limits` is partial and has gaps [C16]–[C19].
  - Cross-provider aggregation exists only in third-party tools, some of which use undocumented endpoints [E7].
- **Voice push-to-talk: ABSORBED for single-agent dictation:** Claude `/voice` [C9], ChatGPT Voice coordinating Codex [X1], Antigravity 2.0 voice [G3], OpenClaw Talk [L2]. **UNMET:** a host-level hardware PTT that routes to *whichever* agent is waiting.
- **Local eval: UNMET (UNVERIFIED negative).** Harnesses export telemetry (Claude OpenTelemetry [C20]; Cursor stop-hook telemetry [U4]), but none scores session quality locally with a judge.

---

## 4. Emerging opportunities

1. **Official decision hooks have converged, so AgentDeck can write once and observe everywhere.**
   - **Evidence:**
     - Claude Code: `PermissionRequest` and `Notification` hooks, plus HTTP hooks [C11][C14].
     - Codex: `PermissionRequest` allow/deny, default-on, 12 events [X2].
     - Cursor: runs Claude Code hooks [U4].
     - Also Gemini CLI `Notification`/`BeforeTool` [G1], Copilot CLI declarative hooks [H6], Kiro global hooks [K2], and the OpenCode SSE `permission.asked` event [O2].
   - **Opportunity:** make hooks and app-server connections the only observation path, and retire PTY parsing. Make AgentDeck the approval endpoint behind `PermissionRequest` for each harness, the pattern agentsd uses [E6]. Test whether AgentDeck's Claude hooks already fire inside Cursor (UNVERIFIED).

2. **AgentDeck can be the presence oracle that routes attention between desk and phone.**
   - **Evidence:** Claude Code skips phone pushes while `CLAUDE_CLIENT_PRESENCE_FILE` exists, and the docs suggest a screen-lock listener to create the file [C1].
   - **Opportunity:** the AgentDeck daemon knows whether you are at the desk: deck touches, Mac idle or lock state, device proximity. It can write the presence marker so that the desk device handles the wait while you are present and the vendor's push takes over when you leave.
   - This turns an absorbed feature into a complement. Codex and Copilot have no equivalent knob found (UNVERIFIED), which makes it a candidate upstream feature request.

3. **Multi-harness households need one queue for "who needs me now".**
   - **Evidence:**
     - Claude Code is used by 39% of professional developers and Codex by 16%; 90% use agents weekly [S1]. 70% use 2–4 AI tools at once [S2].
     - Each vendor's remote approval is siloed in its own app: the Claude app, the ChatGPT app, GitHub Mobile.
     - Third parties are growing on exactly this gap: Vibe Island, VibeDeck, a FleetView port [E5][E8][E10].
   - **Opportunity:** a cross-vendor attention queue, ranked by real waits and answered with one physical press. Elgato's MCP Deck [E1] could be a distribution channel: expose AgentDeck actions to MCP-capable assistants. It could also become a competitor if Elgato adds agent-state keys.

4. **Sanctioned quota surfaces make a cross-provider gauge safer.**
   - **Evidence:** Claude status-line `rate_limits` and headless `rate_limit_event` [C2][C16]. Codex app-server `account/rateLimits/read` [X5]. Codex's own widgets show that users want glanceable quota [X1].
   - **Opportunity:** build the multi-provider gauge only from these sanctioned surfaces, such as a status-line relay or an app-server client, and not from scraped OAuth endpoints [E7][T2].

5. **Enterprise and gateway users are locked out of vendor remote control, so a LAN-only controller fits them.**
   - **Evidence:** Claude Remote Control requires a direct connection to the Anthropic API (no Bedrock, Vertex, Foundry or LLM gateway) and is off by default on Team/Enterprise [C1]. Copilot remote needs admin enablement [H4]. Managed-hook regimes exist (Codex managed hooks [X2]; Claude 2.1.299 "managed permission and hook enforcement" [C2]).
   - **Opportunity:** a local-first, cloud-relay-free approval surface for regulated or gateway-routed teams. It must be installable as *managed* hooks so it survives trust and MDM controls.

---

## 5. Risks

1. **Native absorption of the single-agent loop.** Developers who use one harness now get a fleet view, filtered pushes, remote approve/deny and a quota display from their vendor's free app [C1][X1][H4][H5]. AgentDeck's addressable market narrows to multi-harness, physical-surface and local-first users.
2. **Hook and API churn, with silent regressions:**
   - No hook fired for Claude Code's sandbox network permission popup in 2.1.120, a regression from 2.1.76 [C13].
   - Cursor's subagent hooks stopped firing in mid-August 2026 [U7].
   - Codex hooks went from a feature flag (March) to default-on with hash-based trust (May) [X10][X2].
   - `codex mcp-server` was removed on 2026-09-05 [X1].
   - Consumer access to Gemini CLI ended on 2026-06-18 [G3].
   - Antigravity's Inbox was reported missing (Feb–Mar 2026) [G5].
   - Windsurf was renamed Devin Desktop and Cascade was retired (UNVERIFIED) [D2][D3].
   - Claude Code's CHANGELOG reached 2.1.300 [C2].
   - **Mitigation:** contract tests per harness version and probes that report "hook silent" separately from "agent idle".
3. **Terms of service and quota scraping.** Anthropic's February 2026 terms restrict Free/Pro/Max OAuth tokens to Claude Code and Claude.ai [T2]. It enforced this against OpenCode (2026-03-19) and OpenClaw (2026-04-04) [T3][T4]. Any feature that reuses a Claude login or calls undocumented usage endpoints, as StreamDeck-Claude does [E7], carries ToS and breakage risk. Remote Control itself fails when Claude Code points at a gateway [C1], which shows how tightly the vendor ties features to first-party authentication.
4. **Trust and admin gating blocks third-party installers:**
   - Codex skips new or changed non-managed hooks until the user trusts them; managed hooks bypass this through policy [X2].
   - Claude 2.1.299 tightened managed permission and hook enforcement [C2].
   - Team/Enterprise defaults are off [C1][H4].
   - A silent installer is increasingly impossible, so onboarding must include an explicit trust step.
5. **The physical niche is being commoditized:** Agent Vitals (free), VibeDeck ($5/month), agentsd (open source), Vibe Island ($19.99; 25 agents), USB lights [E4]–[E9], and Elgato's MCP Deck [E1].
   - There is also a **name collision**: a separate open-source "AgentDeck" project offers status and gesture controls for Gemini and Claude agents (UNVERIFIED) [E12].
6. **Execution is moving to the cloud.** Claude Routines [C7], Cursor cloud agents [U2], Kiro cloud sessions [K3], Warp Oz [W1], Jules [G7] and Copilot's coding agent [H1] mean that fewer sessions run where a local daemon can see them. Observing them requires vendor APIs, which is in tension with local-first.
7. **Fewer prompts reach the user.** Auto modes and approval policies (Claude auto-mode containment rules, UNVERIFIED [C25]; Codex approval policies [X2]) reduce how often a one-tap approve happens. They also make each remaining prompt more important.

---

## 6. Implications for AgentDeck (workshop prompts)

- **Reposition** from "remote control and fleet view for coding agents", which is absorbed per vendor, to **"the cross-harness, local-first attention layer with a physical answer"**.
- **Keep and sharpen:**
  - an agent-agnostic queue that shows only genuine waits;
  - one-tap approve/deny on deck, LCD or e-ink;
  - a quota gauge across providers built from sanctioned surfaces;
  - LAN-only operation for gateway and regulated users;
  - local evaluation (APME), since no harness offers it.
- **Build next:**
  1. Observation through hooks and the app-server only: Claude HTTP hooks, Codex app-server and hooks, Cursor, Copilot and Gemini hooks, and OpenCode SSE.
  2. Presence-oracle integration (`CLAUDE_CLIENT_PRESENCE_FILE`) [C1].
  3. Packaging as managed hooks for MDM.
  4. An evaluation of Elgato MCP Deck as a channel [E1].
- **De-emphasize** features a single vendor app now does well, such as remote text injection into one Claude session from a phone.
- **Questions for the room:**
  - What share of our users run two or more harnesses?
  - Should AgentDeck explicitly defer to vendor phone apps when the user is away?
  - Which hook-version contract tests do we gate releases on?

---

## 7. Sources (all accessed 2026-10-16)

**Anthropic / Claude Code**
- [C1] Remote Control docs (official): https://code.claude.com/docs/en/remote-control
- [C2] Claude Code CHANGELOG (official; top entry 2.1.300; first ~100K characters read): https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
- [C3] Issue #60437 (agent view vs FleetView): https://github.com/anthropics/claude-code/issues/60437
- [C4] Issue #61733 (FleetView zombie entries): https://github.com/anthropics/claude-code/issues/61733
- [C5] Desktop redesign (official): https://claude.com/resources/articles/claude-code-desktop-redesign
- [C6] Date corroboration (secondary): https://blog.numericcitizen.me/2026/04/15/anthropic-rebuilds-claude-code-desktop.html
- [C7] Routines launch (secondary): https://codex.danielvaughan.com/2026/04/14/claude-code-routines-launch/
- [C8] Routines guide (secondary): https://makerkit.dev/blog/tutorials/claude-code-routines-guide
- [C9] Voice mode (press): https://www.implicator.ai/anthropic-adds-voice-mode-to-claude-code-starting-with-5-of-users/
- [C10] Voice mode details (secondary): https://claudelog.com/faqs/what-is-voice-mode-in-claude-code/
- [C11] Community hook-event changelog (secondary): https://github.com/shanraisshan/claude-code-hooks
- [C12] Notification matchers (secondary): https://smartscope.blog/en/generative-ai/claude/claude-code-hooks-guide/
- [C13] Hook regression report: https://claudeissues.com/issue/68399-bug-no-hook-event-fires-for-sandbox-network-permission-popup-in-v2-1-120-regress
- [C14] HTTP hooks, 2.1.63 (secondary): https://wikidocs.net/345478
- [C15] HTTP hooks (secondary): https://techsy.io/en/blog/claude-code-hooks-guide
- [C16] Issue #40094 (status-line `rate_limits`): https://github.com/anthropics/claude-code/issues/40094
- [C17] Issue #45133 (`rate_limits` missing): https://github.com/anthropics/claude-code/issues/45133
- [C18] Field shape (secondary): https://wmedia.es/en/tips/claude-code-usage-limit-status-line
- [C19] Per-model limits not exposed: https://claudeissues.com/issue/73770-statusline-expose-per-model-weekly-rate-limits-opus-sonnet-fable-to-the-status-l
- [C20] OpenTelemetry monitoring (official): https://code.claude.com/docs/en/monitoring-usage
- [C21] Phone-approval hang: https://claudeissues.com/issue/52084-remote-control-approving-permission-from-phone-hangs-claude-code-on-host
- [C24] Remote Control launch coverage (secondary): https://noqta.tn/en/news/anthropic-claude-code-remote-control-mobile-2026
- [C25] Dated tracker (secondary): https://www.gradually.ai/en/changelogs/claude-code/
- [C26] Channels (secondary): https://levelup.gitconnected.com/claude-code-just-got-channels-is-it-enough-a10f3132593d

**Anthropic terms of service**
- [T1] VentureBeat: https://venturebeat.com/ai/anthropic-cracks-down-on-unauthorized-claude-usage-by-third-party-harnesses/
- [T2] Terms revision (secondary): https://letsdatascience.com/news/anthropic-revises-terms-to-bar-third-party-harnesses-b7377cc7
- [T3] OpenCode and Zed fallout (secondary): https://falcao.org/posts/anthropic-claude-access-crackdown-ecosystem-fallout/
- [T4] OpenClaw cutoff: https://cybersecuritynews.com/claude-ends-openclaw-subscriptions/
- [T5] OpenClaw cutoff: https://lilting.ch/en/articles/anthropic-claude-code-openclaw-third-party-paygo

**OpenAI Codex**
- [X1] Codex changelog (official; redirected from developers.openai.com/codex/changelog): https://learn.chatgpt.com/docs/changelog
- [X2] Codex hooks (official): https://learn.chatgpt.com/docs/hooks
- [X3] Codex app launch: https://www.helpnetsecurity.com/?p=355710
- [X4] Codex app launch: https://heise.de/-11165126
- [X5] PR #5302 (rate limits): https://github.com/openai/codex/pull/5302
- [X6] Mirror (UNVERIFIED): https://forge.lthn.ai/core/core-agent-ide/commit/5c680c6587e5a2c3e65b8b7b45c9df52c69bc8a6
- [X7] Announcement (official; 403 on fetch, cited from snippet): https://openai.com/index/work-with-codex-from-anywhere/
- [X8] Mobile relay (secondary): https://codex.danielvaughan.com/2026/05/15/codex-mobile-chatgpt-app-relay-architecture-remote-agent-control/
- [X9] Remote pairing and app-server (secondary): https://codex.danielvaughan.com/2026/06/06/codex-cli-remote-control-mobile-pairing-app-server-v2-remodex/
- [X10] Hooks engine (secondary): https://codex.danielvaughan.com/2026/03/30/codex-cli-hooks-engine
- [X11] Hooks after GA (secondary): https://codex.danielvaughan.com/2026/05/25/codex-cli-hooks-after-ga-event-model-trust-verification-production-patterns/

**Google**
- [G1] Gemini CLI hooks (official): https://geminicli.com/docs/hooks/
- [G2] Hooks comparison (secondary): https://lilting.ch/en/articles/gemini-cli-hooks-research
- [G3] Antigravity 2.0 (TNW): https://thenextweb.com/news/google-antigravity-2-desktop-cli-sdk-io-2026
- [G4] Antigravity 2.0 (secondary): https://mcp.directory/blog/antigravity-2-launch-google-io-2026
- [G5] Inbox forum thread: https://discuss.ai.google.dev/t/did-they-remove-the-inbox-in-agent-manager/126943
- [G6] Notification gaps (secondary): https://emberglow.dev/blog/antigravity-notifications
- [G7] Jules CLI and API (TechCrunch): https://techcrunch.com/2025/10/02/googles-jules-enters-developers-toolchains-as-ai-coding-agent-competition-heats-up

**Cursor**
- [U1] Cursor 3.0 (official): https://cursor.com/changelog/3-0
- [U2] Cursor 3.7 (official): https://cursor.com/changelog/cloud-in-agents-window
- [U3] Cursor 3.5 (official): https://cursor.com/changelog/05-20-26
- [U4] Hooks reference (official; fetched page): https://cursor.com/docs/agent/third-party-hooks
- [U5] Release tracker (secondary): https://releasebot.io/updates/cursor
- [U6] Cursor 3.11 (secondary): https://www.digitalapplied.com/blog/cursor-3-11-side-chats-agent-transcript-search-2026
- [U7] Forum report (subagent hooks): https://forum.cursor.com/t/subagentstart-and-subagentstop-hooks-never-fire-foreground-or-background-while-beforeshellexecution-from-the-same-hooks-json-works-normally/168758

**GitHub**
- [H1] Agent HQ adds Claude and Codex: https://www.i-programmer.info/news/105-artificial-intelligence/18651-github-adds-claude-and-codex-to-agent-hq.html
- [H2] Agent HQ (The New Stack): https://thenewstack.io/github-agent-hq/
- [H3] Remote control preview (official): https://github.blog/changelog/2026-04-13-remote-control-cli-sessions-on-web-and-mobile-in-public-preview/
- [H4] Remote control GA (official): https://github.blog/changelog/2026-05-18-remote-control-for-copilot-cli-sessions-now-generally-available-on-mobile-web-and-vs-code/
- [H5] Mobile live notifications (official): https://github.blog/changelog/2026-07-08-github-mobile-live-notifications-for-copilot-cli-sessions/
- [H6] Copilot CLI changelog (official): https://github.com/github/copilot-cli/blob/main/changelog.md

**OpenCode, Kiro, Amp, Warp, Factory, Devin**
- [O1] OpenCode SDK (doc mirror): https://www.mintlify.com/anomalyco/opencode/sdk/overview
- [O2] OpenCode plugins (doc mirror): https://www.mintlify.com/anomalyco/opencode/plugins
- [O3] Mobile approval queue (secondary): https://codeongrass.com/blog/opencode-permission-events-mobile-approval-queue/
- [O4] OpenCode architecture (secondary): https://gitcode.csdn.net/69d082190a2f6a37c59ce85d.html
- [K1] Kiro CLI v3 docs (official): https://kiro.dev/fr/docs/cli/v3/
- [K2] Kiro 2.13.0 (aggregator): https://www.havoptic.com/r/kiro-2.13.0
- [K3] Kiro 2.17.0 (aggregator): https://www.havoptic.com/r/kiro-2.17.0
- [K4] Kiro 2.7.0 (aggregator): https://www.havoptic.com/r/kiro-2.7.0
- [A1] Amp profile (secondary): https://amplifying.ai/coding-agents/amp
- [A2] Amp profile (secondary): https://ai.engineer/orgs/amp
- [W1] Warp: managing cloud agents (official): https://docs.warp.dev/agent-platform/cloud-agents/managing-cloud-agents
- [W2] Warp agent notifications (snippet only; 404 on fetch): https://docs.warp.dev/agent-platform/capabilities/agent-notifications.md
- [W3] Oz launch (Product Hunt): https://www.producthunt.com/p/warp/oz-by-warp
- [F1] Factory changelog (secondary): https://www.gradually.ai/en/changelogs/factory-ai/
- [F2] Factory quickstart (secondary): https://cdn.jsdelivr.net/npm/aiwg@2026.7.12/docs/integrations/factory-quickstart.md
- [D1] Windsurf 2.0: https://www.testingcatalog.com/windsurf-2-0-adds-devin-and-agent-command-center.md
- [D2] Devin Desktop rename: https://www.usecarly.com/blog/windsurf-is-now-devin-desktop
- [D3] Devin Desktop and Cascade end of life: https://businesstechnavigator.com/news/windsurf-devin-desktop-cascade-eol-2026

**OpenClaw, Hermes, Zed / ACP**
- [L1] OpenClaw 2.0: https://runtimewire.com/article/openclaw-2-browser-multiplayer-agent
- [L2] OpenClaw docs: https://docs.openclaw.ai/index.html
- [L3] OpenClaw architecture: https://theagentstack.substack.com/p/openclaw-architecture-part-1-control
- [L4] Hermes v2026.8.16: https://newreleases.io/project/github/NousResearch/hermes-agent/release/v2026.8.16
- [L5] Hermes v2026.7.30: https://newreleases.io/project/github/NousResearch/hermes-agent/release/v2026.7.30
- [L6] Hermes overview: https://getcoai.com/article/hermes-ai/
- [Z1] Zed parallel agents (official): https://zed.dev/blog/parallel-agents
- [Z2] Zed parallel agents docs (official): https://zed.dev/docs/ai/parallel-agents.html
- [Z3] Zed terminal threads (official): https://zed.dev/docs/ai/terminal-threads.md
- [Z4] ACP Registry (Zed, official): https://zed.dev/blog/acp-registry
- [Z5] ACP Registry (JetBrains, official): https://blog.jetbrains.com/ai/2026/01/acp-agent-registry/

**Hardware and ecosystem**
- [E1] Elgato press release: https://www.businesswire.com/news/home/20260528256706/en/
- [E2] Corsair newsroom: https://www.corsair.com/newsroom/press-release/elgato-brings-ai-control-to-stream-deck-launching-with-nvidia-project-g-assist-2
- [E3] MCP support coverage: https://letsdatascience.com/news/elgato-adds-mcp-support-to-stream-deck-c0d9556d
- [E4] Agent Vitals: https://notes.nicolasdeville.com/helpers/agent-vitals/
- [E5] VibeDeck: https://peerlist.io/polsky/project/vibedeck--control-for-claude-code-codex
- [E6] agentsd: https://tomevault.io/tome/paultyng/agentsd
- [E7] StreamDeck-Claude: https://github.com/Corrugator/StreamDeck-Claude
- [E8] Vibe Island: https://vibeisland.app/ and https://letsdatascience.com/news/vibe-island-1040-releases-on-releasebb-1de24c17 and https://vibeisland.app/alternatives/
- [E9] USB lights: https://awesome.ecosyste.ms/projects/github.com%2Fartemy%2Fsemaphore and https://pypi.org/project/glowbug/ and https://github.com/lichengzhe/thinklight
- [E10] FleetView ports: https://github.com/jity16/fleetview and https://github.com/costajohnt/fleetview and https://marketplace.visualstudio.com/items?itemName=MeniHillel.fleetview
- [E11] Mobile apps: https://apps.apple.com/app/id6748571505 and https://codeongrass.com/blog/is-there-a-mobile-app-for-claude-code/
- [E12] Name collision: https://tomevault.io/tome/fernandobelotto/AgentDeck

**Surveys**
- [S1] JetBrains Research, Aug 2026: https://blog.jetbrains.com/research/2026/08/ai-coding-agent-adoption-2026/
- [S2] Pragmatic Engineer: https://newsletter.pragmaticengineer.com/p/ai-tooling-2026

**First-hand**
- [OBS] Tool surface of the Claude Code session that ran this research, 2026-10-16. Not public documentation; UNVERIFIED as a product claim.
