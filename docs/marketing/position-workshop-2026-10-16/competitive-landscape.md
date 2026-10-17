# AgentDeck: competitive landscape (workshop memo)

**Prepared:** 2026-10-16 (KST) · **For:** AgentDeck product workshop · **Scope:** four quadrants. (1) Agent session managers and orchestrators. (2) Monitoring, usage and eval. (3) Deck and peripheral integrations. (4) Ambient and desk-companion hardware.

**Evidence conventions**
- **GitHub numbers** were pulled from the GitHub REST API on 2026-10-15, 15:30–15:47 UTC (2026-10-16 KST). "★" means stars.
- **npm downloads** come from `api.npmjs.org` "last-month", covering 2026-09-13 to 2026-10-12.
- **Web pages** were all accessed on 2026-10-16 KST. They are numbered `[S#]` in §10.
- **UNVERIFIED** marks a claim from a single vendor or third party, a claim where sources conflict, or an analyst inference.
- **Limits of the proxies.** Stars are a noisy proxy and are not adjusted for star campaigns. npm counts include CI runs and mirrors.
- **AgentDeck's own capabilities** come from the workshop brief and the repo's GitHub description. The repo was intentionally not read, because another analyst covers it.

---

## Executive summary

1. **The on-screen field is saturated; the off-screen field is thin.**
   - There are 15+ parallel-agent orchestrators. The largest are Multica (52.9k★), Vibe Kanban (28.4k★) and cmux (28.2k★).
   - There are 15+ usage and monitoring tools. The largest are Claude HUD (28.5k★), CodexBar (22.5k★) and ccusage (19.0k★, 878k npm downloads a month).
   - Repos that put agent state on hardware top out at about 2–3k★.
2. **2026 platform moves validated the physical-approval niche:**
   - Anthropic's **Claude Desktop Buddy** BLE "Hardware Buddy" API (Apr 2026, 2.65k★). It is an ESP32 desk pet with approve/deny buttons.
   - **Elgato Stream Deck MCP** (May 2026).
   - **Logitech MX Keypad** for developers ($99.99, 2026-09-08), with community Claude Code and Codex plugins.
   - Claude Code **Agent View** and **Remote Control**.
3. **Positioning axes.** X runs from on-screen software to off-screen physical/ambient. Y runs from "observes sessions" to "owns and orchestrates sessions".
   - The on-screen orchestrator corner is crowded.
   - AgentDeck sits right of centre: it observes, approves, injects and launches.
   - It is the only product found that serves many heterogeneous surfaces at once.
4. **The three closest substitutes:**
   - **VibeDeck**: a Stream Deck plugin for 6 agents with approve and model/effort keys. Its price is listed as both $5/mo and $19 one-time. The free, Claude-only **Agent Vitals** fills the same slot.
   - **Notch control centres**: Vibe Island (about $20, 25–26 agents), open-vibe-island (2.0k★) and Vibe Notch (2.5k★).
   - **The free default stack**: cmux, CodexBar, and Claude Code Agent View with Remote Control.
5. **Watch list:** Claude Desktop Buddy (official, Claude-only, desktop-app sessions), the Logitech MX Keypad, and Elgato's MCP Deck.
6. **White space:**
   - One local daemon driving many kinds of surface at once.
   - Vendor-neutral agent support on hardware. Almost nobody covers OpenCode, Kiro or OpenClaw.
   - Product-grade agent integrations for e-ink and pixel displays (TRMNL, Pixoo, AWTRIX, LaMetric).
   - Ulanzi decks.
   - Local session-quality eval fed back into an ambient signal.
   - Agent boards for a team or a household.
   - A vendor-neutral device protocol.
7. **Crowded, not white space:** the creature and pet metaphor in software (Clawd on Desk, 6.45k★), notch apps (7+), and usage widgets (10+).
8. **AgentDeck's traction:**
   - 264★ and 53 forks; the repo was created 2026-02-20, which is about 34★ a month.
   - npm: @agentdeck/setup 2,062 and @agentdeck/bridge 2,183 downloads a month.
   - It is the largest open-source agent-on-a-deck project found. agentsd has 10★ and Agent Vitals 7★.
   - It is about 10% of the hardware-repo leaders and about 1% of cmux.
9. **Name collision:** asheshgoplani/agent-deck is a 1.1k★ TUI session manager with the same job description. At least 8 other GitHub repos are also named "AgentDeck".

---

## 1. Quadrant 1: agent session managers and orchestrators for parallel coding agents

| # | Product | What it does | OSS / pricing | Traction (date) | Last release | Overlap | Does better than AgentDeck | Lacks vs AgentDeck |
|---|---|---|---|---|---|---|---|---|
| 1 | **cmux** (Manaflow, YC S24): github.com/manaflow-ai/cmux | Ghostty-based macOS terminal with vertical tabs. The pane gets a ring and the tab lights up when an agent needs input. A sidebar shows branch, PR status, ports and the last notification. A CLI lets agents spawn workspaces and other agents [S7, S8] | Open source; GitHub reports the licence as NOASSERTION (custom or undetected); free. Funding: $500K from YC; no later round found [S7] | 28,188★ / 2,507 forks (2026-10-15). About 3.3k★/month since 2026-01-28. Manaflow claims "thousands of builders" (**UNVERIFIED**) | v0.65.1 (2026-10-12) | **Med–High**: same "which agent needs me" job, on screen | Sits where the work happens; scriptable by agents; very fast adoption | No off-screen or physical surface, no quota view, macOS only, sees only sessions running inside cmux |
| 2 | **Conductor** (Melty Labs, YC S24): conductor.build | Mac app that runs Claude Code, Codex and Cursor agents in parallel, each in an isolated worktree, with review and merge [S1] | Closed source. A third party says it is free with your own subscription and Apple Silicon only (**UNVERIFIED**) [S4]. Pricing and Enterprise pages exist, plus "Conductor Cloud" [S1, S5] | "100,000+ builders by Aug 2026" (Simplify, **UNVERIFIED**). Funding conflicts (**UNVERIFIED**): Simplify reports a $22M Series A on 2026-03-30 led by Spark and Matrix; DevTune says about $24.5M total [S2, S3] | n/a (closed source) | **Med** | End-to-end workspace (diffs, run environment, merge); funded team | Manages only the sessions it launched; no ambient, physical or phone surface; Mac only |
| 3 | **Vibe Kanban** (BloopAI) | Kanban board that dispatches coding agents into worktrees | Apache-2.0, run with `npx vibe-kanban`. **The company shut down on 2026-04-10.** The project is now community-maintained and the hosted cloud ended [S9] | 28,373★ / 3,035 forks; 10,858 npm downloads/month | v0.1.44 (2026-04-24) | Low–Med | Planning surface; large installed base | Maintenance risk; no ambient or hardware surface |
| 4 | **Superset** (YC P26) | "Agentic IDE to orchestrate 100+ coding agents in parallel", using your own subscriptions | Source-available. A third party says Elastic License 2.0 (GitHub: NOASSERTION), so "open source" is contested. Reports an $11M seed (company claim, **UNVERIFIED**) [S10] | 15,223★ / 1,356 forks | desktop-v1.38.0 (2026-10-14) | Med | Scale (100+ agents); review inside the IDE | Desktop-bound; no physical surface; no eval |
| 5 | **Multica** | Agents work as teammates: they get profiles, take tasks from a board, comment and flag blockers. Vendor-neutral (Claude Code, Codex, OpenClaw, OpenCode), self-hostable, live progress over WebSocket [S6] | Open source (GitHub: NOASSERTION); free to self-host | **52,897★ / 6,919 forks**, the largest in Q1 | v0.6.2 (2026-10-13) | Low–Med | Team and task layer; agent identity; reusable skills | Not an attention or ambient tool; no hardware |
| 6 | **Claude Squad** | tmux TUI that manages Claude Code, Codex, OpenCode and Amp in worktrees | AGPL-3.0, free | 8,608★ | v1.0.20 (2026-08-20) | Med | Keyboard-native; minimal footprint | Terminal only; no quota, phone or physical surface |
| 7 | **Emdash** (YC W26) | Open-source "Agentic Development Environment" for running agents in parallel | Apache-2.0 | 5,992★ | v1.2.8 (2026-10-10) | Low–Med | Integrated development environment | No ambient or physical surface |
| 8 | **Xum (formerly Mux)**, by Coder | Desktop "coding agent multiplexer" for isolated parallel agent development | AGPL-3.0 | 2,054★. The repo is now `coder/xum`; README badges still point to coder/mux. Reason for the rename **UNVERIFIED** | v0.31.0 (2026-10-09) | Low–Med | Backed by an enterprise vendor | No ambient or physical surface |
| 9 | **Nimbalyst (formerly Crystal)** | Visual workspace for Claude Code, Codex and OpenCode; parallel agents in worktrees | MIT | Nimbalyst 1,906★. Crystal 3,131★, frozen since 2026-02-26 | — | Low–Med | Visual review | No ambient or physical surface |
| 10 | **workmux** / **worktrunk** | workmux pairs git worktrees with tmux windows. worktrunk is a worktree CLI whose `wt list` marks Claude sessions as working or waiting | MIT / NOASSERTION; both free | workmux 2,841★ (v0.1.276, 2026-10-14). worktrunk 9,249★ | — | Low; complementary, since they create the sessions AgentDeck observes | Lightweight | No status surface outside the terminal |
| 11 | **Agent Deck** (asheshgoplani). **Name collision** | TUI session manager for Claude, Gemini, OpenCode and Codex | MIT | 1,089★ / 195 forks | v1.16.28 (2026-10-10) | Med, plus brand confusion | Terminal-native; multi-agent | No hardware or ambient surface |
| 12 | **Agent of Empires** | Manages Claude Code and OpenCode agents from a TUI or a web UI that works on mobile | MIT | 3,353★ | v1.19.0 (2026-10-08) | Med | Mobile web access | No physical surface |
| 13 | **Long tail:** CCManager, NTM, container-use (Dagger), Sculptor (Imbue) | tmux and container multiplexers for agents | Open source | 1,263★ / 458★ / 4,070★ / 239★ | — | Low | — | — |
| 14 | **Mobile and remote clients:** Happy (slopus), CloudCLI (also called Claude Code UI, siteboon), opcode (winfunc), Omnara | Happy: "Orchestrate Claude, Codex and Grok in one app". CloudCLI: Claude Code, OpenCode, Cursor CLI and Codex on mobile and web. opcode: a GUI for Claude Code. Omnara now presents itself as an open-source managed-agent platform; its earlier mobile-first positioning is **UNVERIFIED** | MIT / AGPL-3.0 / AGPL-3.0 / Apache-2.0 | Happy 24,160★ (cli-1.2.5, 2026-09-22). CloudCLI 14,106★ (v1.37.4, 2026-10-09). opcode 22,418★, but its last release is v0.2.0 from 2025-08-31 (stale). Omnara 2,918★ | — | Med–High; Happy covers approvals from the phone | Phone-first control; reuses existing subscriptions | Nothing off-screen or ambient; one app per agent |
| 15 | **Harness-native (brief)** | **Claude Code Agent View** (`claude agents`) is one table of background sessions grouped by state, including "needs input"; each dispatched session gets its own worktree; it is a research preview [S11]. **Claude Code Remote Control** (`/remote-control`) makes a local session reachable at claude.ai/code and in the Claude mobile app [S12]. The **OpenAI Codex app** is a macOS desktop app with a worktree per thread; a third party gives the launch as 2026-02-02 (**UNVERIFIED**) [S13]. The **Cursor 3 Agents Window** went GA on 2026-04-02, per a docs mirror (**UNVERIFIED**) [S14]. **Google Antigravity Agent Manager** is a mission-control view of each agent's status, artifacts and pending approvals, in public preview [S15] | Bundled with the plan | Market size: @anthropic-ai/claude-code had 55.1M and @openai/codex 99.1M npm downloads in the month | A third party dates Agent View to 2026-05-11, v2.1.139 (**UNVERIFIED**) | **High** for single-vendor users | Nothing to install; first-party; native approvals | One vendor each; on-screen only; no ambient surface and no quota view across agents |

**Read-out:** Orchestration consolidated fast in 2026.
- The harnesses absorbed the core of it: Agent View, the Codex app, Cursor 3 and Antigravity.
- One well-starred standalone, Vibe Kanban, lost its company.
- Nearly every entry is on-screen and owns the session it shows.
- None of them pushes state off the screen, and none takes approvals from hardware.
- workmux and worktrunk complement AgentDeck rather than compete with it.

---

## 2. Quadrant 2: monitoring, usage and eval for individual developers and small teams

| # | Product | What it does | OSS / pricing | Traction (date) | Last release | Overlap | Does better | Lacks vs AgentDeck |
|---|---|---|---|---|---|---|---|---|
| 1 | **ccusage** (ccusage/ccusage) | CLI that reports tokens and cost from local agent logs; the de facto standard, with a Raycast extension [S38] | Open source (GitHub: NOASSERTION); free | 19,015★; **877,566 npm downloads/month** | v20.0.34 (2026-10-15) | Med (quota and cost) | Ubiquitous; ecosystem | No live state, no control, nothing ambient |
| 2 | **CodexBar** (steipete) | macOS menu-bar app showing Codex and Claude Code usage windows (5-hour and weekly), with no login | MIT, free | 22,527★ / 2,117 forks | v0.75.0 (2026-10-14) | **Med–High** (quota widget) | Polished, zero-config, covers several providers | No session states or approvals; screen only |
| 3 | **Claude HUD** (jarrodwatts) | Claude Code plugin statusline: context, active tools, running subagents, todo progress, usage limits | MIT, free | 28,548★ (created 2026-01-02) | — | Med | Deep detail on one session, inside the terminal | One session and one vendor; on screen |
| 4 | **ccstatusline** | Customizable Claude Code statusline | MIT | 13,297★; 202,712 npm downloads/month | — | Low–Med | — | — |
| 5 | **Claude Code Usage Monitor** (Maciek-roboblog) | Real-time terminal usage monitor that predicts burn rate | MIT | 8,743★ | v4.0.0 (2026-06-27) | Med | Predictions | Claude only |
| 6 | **Claude Usage Tracker** (hamed-elfayome) / **Usagebar** | Native macOS menu-bar Claude limits / a paid Claude-limits app | MIT / $9 one-time (**UNVERIFIED**) [S38] | 3,657★ (v3.3.0, 2026-08-29) / n/a | — | Med | Native menu bar | Claude only |
| 7 | **tokscale** | Token usage across coding agents, with a global leaderboard | MIT | 5,683★; 182,342 npm downloads/month | v4.19.1 (2026-10-15) | Low–Med | Social leaderboard | No live state |
| 8 | **Raycast extensions:** ccusage, PromptCast, Claudecast [S38] | Limits and reset times for Claude Code and Codex in Raycast and the menu bar. PromptCast also sends prompts and manages sessions | Free community extensions | Raycast store counts not collected | — | Med | Launcher-native | Screen only |
| 9 | **agentsview** (kenn-io; the repo redirects from wesm/agentsview) | Local-first session search, analytics, "insights" and token stats across coding agents | MIT | 6,119★ (created 2026-02-19) | v0.45.0 (2026-10-09) | **Med** (vs AgentDeck's timeline and APME) | Search and analytics depth | No live control, nothing ambient; no LLM-judge scoring seen (**UNVERIFIED**) |
| 10 | **claude-code-hooks-multi-agent-observability** (disler) | Hook events feed a real-time web dashboard for several Claude Code agents | No licence; free | 1,548★; last push 2026-02-08 | — | Med; same hook-ingestion architecture | Simple reference design | Little recent activity; Claude only |
| 11 | **Sniffly** (Chip Huyen) | Claude Code dashboard: usage stats, error analysis, shareable reports | MIT | 1,276★; last push 2025-08-08 (dormant) | — | Low–Med | Error analysis | Dormant |
| 12 | **Entire Checkpoints** (entireio/cli) | Captures agent sessions (prompts, transcripts) into git, on a separate `entire/checkpoints/v1` branch with commit trailers. Supports Claude Code, Codex, Gemini CLI, OpenCode and Pi [S40] | MIT CLI, free. A third party reports a **$60M seed at a $300M valuation** on 2026-02-10, led by Felicis (**UNVERIFIED**) | 5,181★ | v0.11.5 (2026-10-14) | Low–Med | Provenance and audit trail; well funded | Not live, not ambient |
| 13 | **vibe-log-cli** / **splitrail** / **ccflare** | Session productivity analysis / real-time token tracker / Claude Code proxy | MIT | 339★ / 223★ / 1,052★ | — | Low | — | — |
| 14 | **Eval stacks:** Promptfoo's coding-agent guide, Datadog LLM Observability Claude Code skills, the Judgeval Claude plugin, Braintrust, NeoLabHQ's agent-evaluation skill [S39] | Score agent trajectories; LLM-as-judge; session classification. Mostly hosted or do-it-yourself | Mixed: open source and SaaS | n/a | — | **Med in concept, Low in audience** (vs APME) | Rigour; enterprise integrations | Not local-first for individuals; no feedback into an ambient signal |
| 15 | **peon-ping** | Warcraft III peon voice lines when Claude Code, Codex or an IDE needs you | MIT | 5,078★ (created 2026-02-09) | — | Med; the "stop babysitting" job, by audio | Zero setup; viral | One-way; no state view |
| 16 | **Notch and menu-bar control centres:** Vibe Island (paid), open-vibe-island (open source), Vibe Notch (formerly "Claude Island"), AgentPeek, Chimlo, Bezel, Coucou, Atoll, Aignals [S26] | Live sessions in the MacBook notch. Approve or deny, sometimes with "Always Allow". Jump back to the exact terminal tab. Quota tracking | Vibe Island about $14.99–19.99 one-time; sources conflict. The rest are free or open source | Vibe Island: 25–26 agents. It can approve for Claude Code, OpenCode and MiMoCode; it is read-only for Codex, Gemini and Cursor. No user count. open-vibe-island 2,047★ (GPL-3.0). Vibe Notch 2,525★ (v1.3.2, 2026-04-20) | — | **High** | No hardware; always visible on a MacBook; many agents | macOS only; tied to the screen, so invisible when you are away or the lid is closed; no phone, deck or e-ink; no eval |

**Read-out:** Usage and quota data has become a commodity.
- ccusage, CodexBar, Claude HUD and ccstatusline together have more than 80k★.
- ccusage alone has about 0.9M npm downloads a month.
- Notch apps are the fastest-growing *control* surface: they approve, jump back and track quota.
- Session-quality evaluation for individuals is nearly empty. agentsview and vibe-log do analytics. Datadog, Braintrust and Judgeval do evaluation, but they are hosted, team-oriented tools.

---

## 3. Quadrant 3: deck and peripheral integrations

| # | Product | What it does | OSS / pricing | Traction (date) | Date / last release | Overlap | Does better | Lacks vs AgentDeck |
|---|---|---|---|---|---|---|---|---|
| 1 | **VibeDeck** (getvibedeck.com, Daniel Polak) | Stream Deck plugin that is a live "inbox" for 6 agents: Claude Code, Codex, Cursor, Copilot CLI, Antigravity, OpenCode. Amber means waiting, green means done. Session keys are auto-assigned; it jumps to the terminal, has a Swarm view and shows burn rate for Claude/Codex limits. It can approve prompts, switch model and reasoning effort, and run commands. Local only, no telemetry; macOS 13+ and Windows 10+ [S17] | Closed source. Pricing conflicts (**UNVERIFIED**): $5/month after a 7-day trial (Product Hunt, Peerlist) vs $19 one-time (Indie Hackers) | Product Hunt launch; no public install count | 2026 (exact date **UNVERIFIED**) | **Very high**; the closest feature twin | Commercial polish, Windows support, simple purchase | Stream Deck only. Its control is deepest for Claude Code and managed Codex on macOS. No e-ink, pixel, ESP32 or phone; no eval; not open source |
| 2 | **Agent Vitals** (tapparello/agent-vitals) | Stream Deck plugin for Claude Code. Gauges: 5-hour and weekly limits, per-model split, burn rate, local token and cost totals. Five session states refreshed every 5 s: Needs approval, Input needed, Working, Finished, Idle. Allow / Always Allow / Deny keys; launcher keys [S16] | MIT, free; macOS 11+ and Windows 10+ | 7★ / 2 forks; v1.8.1 | repo created 2026-07-24 | High (Claude only) | Free and simple; Windows | Claude only; one surface |
| 3 | **Elgato Marketplace Claude items**, promoted in an Elgato editorial updated 2026-08-07 [S18] | "Claude Code Usage" plugin: spend, limits, session countdowns, starts sessions, monitors background agents. **Windows only.** Also the "Claude Peak Ticker" plugin, a "Claude Code Shortcut Profile" (57 slash-command keys and 4 dials, one for permission mode) and a prompt-template profile | Free and paid; per-item prices **UNVERIFIED** | Distributed through Elgato's own editorial | — | Med–High | First-party distribution | No approvals described; the usage plugin is Windows only |
| 4 | **Elgato Stream Deck MCP ("MCP Deck")** | Stream Deck exposes a virtual 32-key "MCP Deck" so AI assistants can trigger actions the user has chosen. Launch partners: NVIDIA Project G-Assist and Aitum [S19] | Free in the Stream Deck software | Corsair calls Stream Deck the "action layer for AI" | Late May 2026 (Business Wire release dated 2026-05-28) | Low–Med today; **strategic** | Platform-level and first-party | Information flows from AI to actions, not from agent state to keys |
| 5 | **agentsd** (Paul Tyng), plus **yolodeck**, a Windows fork | Stream Deck plugin built on Claude Code HTTP hooks. A PermissionRequest is held open for 120 s so the hardware can approve or deny [S20] | MIT | 10★ (created 2026-03-25) | last push 2026-08-12 | High; same architecture | — | Tiny; Claude only |
| 6 | **fernandobelotto/AgentDeck**. **Name collision** | Stream Deck plugin for Claude Code sessions: animated status, terminal focus | No licence | 1★ | last push 2026-10-13 | High, but tiny | — | — |
| 7 | **Logitech MX Keypad** ($99.99, announced 2026-09-08) | Keypad with 9 colour-LCD keys, marketed as a "multi-app AI control center" for developers. **Native GitHub Copilot / VS Code integration**, plus 3 free months of Copilot Pro+. Logitech: "The community has already published plugins for Claude Code and OpenAI Codex to the Logi Marketplace… real-time agent status tracking and CLI control." PCGH reports a beta Claude Code plugin that shows sessions, grants approvals and switches sessions. The Logi Actions SDK has AI-friendly docs [S21] | Retail hardware; community plugins | Logitech retail distribution; no sales figures | 2026-09-08 | **High; platform threat** | Retail reach; a developer-targeted SKU; GitHub partnership | Claude and Codex only through community plugins; nothing ambient or e-ink; one device |
| 8 | **Vizhi** (vizhi.dev) | Plugin for the Logitech MX Creative Keypad plus a browser dashboard. Keys turn amber when approval is needed; one press answers, after checking the TTY matches. Local Whisper voice prompts. Supports Codex CLI; it grew out of an earlier Claude Code tool, "claude-console" [S22] | Free; Mac and Windows | Product Hunt launch 2026-07-23 | — | High | Voice input; a safety check on approvals | Codex-centric (Claude Code support **UNVERIFIED**); one device |
| 9 | **VibeKeys** | Dedicated macropad with 6 mechanical keys and a knob. $29 wired, $49 Bluetooth + Wi-Fi, $69 with an OLED status display. Claims Claude Code, Cursor and Codex support [S23] | Commercial | n/a | — | Med | Purpose-built and cheap | Vendor claims **UNVERIFIED**; minimal status display |
| 10 | **VibePad** / **ClaudePad** | VibePad maps a gamepad to shortcuts: X approves, O rejects, L2 is hold-to-talk dictation. ClaudePad drives Claude Code from an Xbox controller over MCP: A approves, B denies [S24] | Free, open source | n/a | — | Low–Med | Fun and cheap | No status display |
| 11 | **Ulanzi decks (D200 / D200H / D200X)** | No agent plugin found. The only hit is a Claude Code *skill for building* Ulanzi Studio plugins (ukinora, 2★) [S25] | — | — | — | **White space** | — | — |
| 12 | **DIY agent status lights:** semaphore, the Makerworld "Claude Code session status light", claude-beacon (changes the terminal background), Claudelk (BLE LED) [S37] | Map hook events (Stop, Notification) to LED colours | Free, open source or a 3D-print model | A few ★ at most | — | Med | Readable at a glance | One signal only; DIY |

**Read-out:** This is AgentDeck's home quadrant.
- Agent integrations are numerous but low-traction. No open-source deck plugin for agents has more than about 50★.
- Commercial plugins (VibeDeck, Vizhi) publish no install counts.
- The structural change is that **peripheral makers have moved in themselves**. Elgato added MCP in May 2026 and editorialises Claude plugins. Logitech launched a developer keypad with GitHub as its anchor partner in September 2026.
- Ulanzi has nothing yet.

---

## 4. Quadrant 4: ambient and desk-companion hardware used for status

| # | Product | What it does | OSS / pricing | Traction (date) | Date | Overlap | Does better | Lacks vs AgentDeck |
|---|---|---|---|---|---|---|---|---|
| 1 | **Claude Desktop Buddy**, the "Hardware Buddy" BLE API (Anthropic): github.com/anthropics/claude-desktop-buddy | Official reference for a BLE API in the Claude desktop app (Cowork and Claude Code Desktop). The device receives status, recent entries, token counts and permission prompts, and sends approve or deny back. Protocol: Nordic UART Service with newline-delimited JSON. Reference firmware is an ESP32 "desk pet" on an M5StickC Plus (about $30). The user turns it on under Developer Mode → Hardware Buddy [S27] | Public repo (GitHub: NOASSERTION); free | **2,653★ / 471 forks** (created 2026-04-09; last push 2026-04-16). Community ports: LilyGo T-Lora Pager and T-Keyboard S3 Pro, plus Hackster, DFRobot and circuit.rocks build guides | Apr 2026 | **Very high**: both a platform threat and a validation | First-party; built into the Claude app; cheap reference hardware; a sanctioned protocol | Claude only, and covers **desktop-app** sessions; whether terminal CLI sessions appear is **UNVERIFIED**. One BLE device; maker-grade; repo idle since April |
| 2 | **VibeBuddy / Vibe Buddy** | Commercial desk device showing Claude Code and Codex status and usage limits; one listing adds GitHub Actions. One listing says USB-C; another says battery and Bluetooth [S28] | $59 at launch; a maker comment says $49. Sources conflict (**UNVERIFIED**) | Product Hunt launch; no counts | 2026 | High | A finished consumer product | Apple Silicon Macs on macOS 14+ only; approvals not mentioned |
| 3 | **DIY ESP32 agent desk displays** [S29, S30] | **TamaClaude**: a "Cheap Yellow Display" over BLE mirroring live Claude Code session state, with a macOS menu-bar companion. **VibeOrb**: ESP32-S3 round LCD over USB showing idle / working / waiting / errored, with tones; Claude Code and Codex. **StackChan agent-notify**: M5Stack CoreS3 driven by hooks. **FreakStudio "ClaudeAssistant"** on Tindie: LED, voice and screen over BLE or Wi-Fi | Open source / Tindie kit | TamaClaude 41★; the others n/a | 2026 | High, but one device each | Cheap and hackable | One board and usually one vendor; no fleet |
| 4 | **Clawdmeter** / **claude-usage-stick** | ESP32 displays of Claude Code usage and rate limits | No licence / MIT | **2,260★** (created 2026-05-11) / 120★ | — | Med (quota only) | Shows how high a hardware repo's stars can go | No session state or control |
| 5 | **TRMNL**: original 7.5" $139; TRMNL X 10.3" $189 pre-order, $219 list [S31] | E-ink dashboard with open firmware, bring-your-own-server options and a plugin/"recipe" ecosystem. Also has an AI agent that builds plugins from a prompt (public beta) | Open firmware (GPL-3.0) plus paid hardware; a BYOD licence | "10s of 1000s of homes and offices" (TRMNL, 2025-12-17). Plugins grew from about 60 to 700+ during 2025; the page's metadata says 1,000+. 1,500+ BYOD web-app users. Team of 25+. "50,000+ devices shipped" (B2B page, undated; **UNVERIFIED**). "6,000+ TRMNL X pre-orders" (product page; **UNVERIFIED**). Firmware repo 1,192★ (v1.8.17, 2026-10-02); terminus 745★; larapaper 436★ | — | Med; a surface AgentDeck targets | Attractive consumer device; community ecosystem; a B2B channel | No agent-aware plugin found; "TRMNLcast", a Claude Code token-usage bridge, is **UNVERIFIED**. Refreshes in minutes; no control |
| 6 | **Divoom Pixoo** (16 / 64 and others) | Pixel-art LED displays plus an app community [S33] | Commercial; the app is free | Divoom claims 200M+ registered app users and 500,000+ Pixoo 16 set-ups. Both are self-reported (**UNVERIFIED**) | — | Low–Med (a surface) | Huge consumer base | No agent integration found; IFTTT webhook applets only [S34] |
| 7 | **Ulanzi TC001 + AWTRIX** | 32×8 pixel clock with open firmware. AWTRIX 3 is discontinued and superseded by AWTRIX NG. An AWTRIX MCP server lets agents push status and build alerts [S35] | Open firmware (GitHub: NOASSERTION) | awtrix3 2,354★; awtrix-ng 397★ (created 2026-08-03) | AWTRIX NG Aug 2026 | Med (a surface) | Cheap and hackable; MQTT and HTTP | DIY only |
| 8 | **LaMetric Time / SKY** | Smart clock with a registered-app API and a local API. The community `lametric-cli` can be used as an agent skill; there is a notifier for the pi agent and IFTTT applets for GitHub [S34] | Commercial | No sales figures found | — | Low–Med | Polished hardware with an API | No first-party agent integration |
| 9 | **Tidbyt → Modal; Tronbyt** | Pixel display. The team joined Modal on 2024-11-07, manufacturing paused, and Tidbyt said it had "shipped out 100,000 Tidbyt devices". The community runs Tronbyt firmware and a local server, and hard-forked the app repo [S32] | Tronbyt is Apache-2.0 | **100,000 devices** (2024-11-07); tronbyt/server 220★, firmware 111★ | Nov 2024 | Low | Shows the market ceiling for ambient pixel displays | Platform risk |
| 10 | **Presence lights:** Luxafor (cloud and local webhook API), Kuando Busylight and Embrava (through the open-source `busylight-for-humans` library), blink(1) [S36] | USB and Bluetooth presence lights | Commercial hardware plus open-source libraries | n/a | — | Low–Med | Cheap; readable at a glance | No vendor agent integration found |
| 11 | **Software desk pets:** Clawd on Desk (a pixel pet that watches Claude Code, Codex, Cursor and others; Windows 11 and macOS), OpenPets, agent-paperclip, Claude Code Tamagotchi (a statusline pet that interrupts misbehaviour) | — | AGPL-3.0 / — / MIT / MIT | **Clawd on Desk 6,453★** (created 2026-03-18, about 930★/month); paperclip 31★; tamagotchi 434★ | — | **Med–High** (same creature metaphor) | Shows the creature metaphor is popular in software | Tied to the screen |
| 12 | **General AI-companion hardware:** xiaozhi-esp32 (an MCP-based ESP32 voice chatbot), Stack-chan | — | MIT / Apache-2.0 | 31,183★ / 1,779★ | — | Low | Huge maker base | Does not show agent status |

**Read-out:** Ambient display platforms reach large numbers of homes and offices.
- Tidbyt shipped 100k devices. TRMNL reports "tens of thousands" of homes and offices. Divoom claims hundreds of millions of app users.
- None of these platforms has a product-grade coding-agent integration.
- The agent-specific hardware that exists is either Anthropic's official, Claude-only BLE reference or single-board DIY builds and small commercial gadgets (VibeBuddy, VibeKeys).
- The creature and pet idea is already popular in **software** (Clawd on Desk) and in Anthropic's own reference device. AgentDeck's creatures are therefore not novel in themselves. What would be distinctive is the **same creatures appearing consistently across every device on the desk**.

---

## 5. Positioning map

**Proposed axes.** These two separate the field most cleanly:
- **X: where the signal lives.** On-screen software (terminal, IDE, menu bar, notch, phone app) at the left, off-screen physical and ambient presence (deck keys, desk devices, wall or e-ink displays) at the right.
- **Y: relationship to the session.** At the bottom, the product *observes* sessions started elsewhere: it reads state and at most answers prompts. At the top, it *owns and orchestrates* them: it spawns them, creates worktrees and keeps task boards.
- **Secondary encodings, not drawn:** agent breadth (one vendor or many) and surface count (one or many).

```
                    OWNS / ORCHESTRATES THE SESSION
                                  ▲
 Multica · Conductor · Superset   │
 Vibe Kanban · Emdash · Xum       │            (almost empty)
 Nimbalyst · Claude Squad         │   Elgato "MCP Deck": AI→deck actions,
 Agent of Empires · agent-deck    │   not agent state
 Codex app · Cursor 3 Agents Win. │   Logitech MX Keypad + community
 Antigravity Mgr · Claude Agent   │   Claude/Codex plugins (CLI control)
 View · workmux · worktrunk       │
 cmux (terminal + attention ring) │
 Happy · CloudCLI · Remote Control│                    ★ AgentDeck
ON-SCREEN ────────────────────────┼─────────────────────────────── OFF-SCREEN
SOFTWARE                          │   (observe + approve + inject   PHYSICAL /
                                  │    + launch; many surfaces)     AMBIENT
 Notch apps: Vibe Island ·        │   VibeDeck · Agent Vitals · agentsd
 open-vibe-island · Vibe Notch ·  │   Vizhi (MX Creative Keypad) · VibeKeys
 AgentPeek · Chimlo               │   Claude Desktop Buddy (BLE) · VibeBuddy
 peon-ping (audio)                │   TamaClaude · VibeOrb · StackChan notify
 Clawd on Desk (desktop pet)      │   Clawdmeter · claude-usage-stick
 CodexBar · Claude HUD ·          │   TRMNL · Pixoo · AWTRIX/TC001 · LaMetric
 ccstatusline · ccusage ·         │   Tidbyt/Tronbyt · Luxafor/Busylight
 tokscale · agentsview · Entire   │   (generic ambient: observe only)
                                  ▼
                 OBSERVES (reads state; at most answers prompts)
```

**Where AgentDeck sits.** It is on the right half, just above the midline. It observes sessions it did not start, but also writes back: approve/deny, mode switch, text and voice injection, and launching sessions.
- It is the only product that spreads **horizontally** across many off-screen surfaces at once: Stream Deck, Ulanzi, ESP32 LCDs, TRMNL e-ink, Pixoo, an Android launcher and Apple apps.
- Every other right-half product occupies **one point**: one deck, one board or one display.
- The top-right quadrant (physical *and* orchestrating) is almost empty. Elgato and Logitech are approaching it from the hardware side.

---

## 6. The three closest substitutes a user would actually pick instead of AgentDeck

1. **VibeDeck, or the free Agent Vitals if they only use Claude.** This is the like-for-like substitute on the same hardware.
   - **Why a user picks it:** a Stream Deck owner searching the Elgato Marketplace finds a one-click plugin covering 6 agents. It has waiting/done colours, approve keys, model and reasoning-effort switching, burn rate, jump-to-terminal and Windows support [S16, S17].
   - **What they give up:** every other surface (Ulanzi, e-ink, pixel, ESP32, phone and tablet), voice and text injection, the creature UI and APME. VibeDeck is also closed source, and its price is unclear: $5/month or $19 once.
2. **A notch control centre: Vibe Island (paid), open-vibe-island (OSS, 2,047★) or Vibe Notch (2,525★).** These do the same job with no hardware purchase.
   - **Why a user picks it:** a MacBook user gets live sessions for 25–26 agents, approve or deny (with Always Allow), a jump back to the exact terminal tab, and quota for Claude, Codex, Kimi, GLM and DeepSeek. All of it sits in the notch they already look at [S26].
   - **What they give up:** awareness when they are away from the screen or the lid is closed, physical keys, phone and Android surfaces, and Windows and Linux. Several agents are read-only in these apps.
3. **The free default stack: cmux (28.2k★), CodexBar (22.5k★) and Claude Code Agent View / Remote Control.** This is the "do nothing new" substitute.
   - **Why a user picks it:** it is free, mainstream and needs no new device. Panes ring when an agent needs input. A menu-bar meter shows Claude and Codex quota. `claude agents` lists every background session by state. Remote Control approves from the Claude phone app [S7, S11, S12].
   - **What they give up:** a single place to approve across vendors, any ambient presence away from the screen, and hardware.

**Watch list; these could become top-3 substitutes quickly:**
- **Anthropic Claude Desktop Buddy.** It is official, bidirectional and a $30 device, and it is already a "desk pet". Today it is Claude-only and covers desktop-app sessions.
- **Logitech MX Keypad.** $99.99 retail, positioned for developers, with community Claude Code and Codex plugins that have approvals in beta.
- **Elgato Stream Deck MCP.** Elgato now calls Stream Deck the "action layer for AI".

---

## 7. White space nobody occupies yet

1. **One local daemon feeding many kinds of surface at once,** with one visual language across all of them. Every competitor found is a single surface: one deck, one notch, one ESP32 sketch or one menu bar.
2. **Vendor-neutral agents on hardware.**
   - Hardware integrations are Claude-first: Agent Vitals, Desktop Buddy, Clawdmeter, TamaClaude, claude-usage-stick.
   - Vizhi is Codex-first.
   - Multi-agent coverage exists only on Stream Deck (VibeDeck, 6 agents) and in on-screen notch apps (Vibe Island, 26 agents).
   - On a physical device, OpenCode, Kiro and OpenClaw are essentially unserved.
3. **Product-grade e-ink and pixel-matrix agent status.**
   - No polished TRMNL, Pixoo, AWTRIX/TC001 or LaMetric integration for coding agents was found. There are only DIY pieces: TRMNLcast (**UNVERIFIED**), an AWTRIX MCP server, a pi-agent LaMetric notifier and IFTTT applets.
   - These platforms reach tens of thousands of homes and offices (TRMNL) to 100k+ devices (Tidbyt).
4. **Ulanzi decks** (D200 family; cheaper Stream Deck alternatives). No agent plugin was found [S25].
5. **Session *quality*, not just quantity, for individuals.**
   - Usage tools count tokens and dollars. Eval stacks (Datadog, Braintrust, Judgeval, Promptfoo) are hosted or DIY and aimed at teams.
   - Nobody runs a local LLM-judge score per session and feeds it back into an ambient signal, or into a per-task agent or model recommendation, for a single developer. AgentDeck's APME is positioned here; its maturity needs checking with the repo analyst.
6. **An agent board for a shared room** (small team or household). TRMNL sells B2B displays and Multica sells a team task layer. Nobody shows *live agent presence* on a shared wall or e-ink display.
7. **Physical status on Windows and Linux.**
   - Notch apps, VibeBuddy and the TamaClaude companion are macOS-only.
   - On Windows: Elgato's Claude Code Usage plugin is Windows-only, and VibeDeck and Agent Vitals support it.
   - On Linux: no physical-status option was found at all.
8. **An open, vendor-neutral protocol from agent state to device.**
   - The only published wire protocol found is Anthropic's Hardware Buddy BLE protocol. It is Claude-only and tied to the desktop app.
   - Elgato and Logitech publish SDKs but no schema for agent state.
   - A documented, multi-agent device contract that third-party boards could implement is unclaimed.

**Not white space; this is crowded:**
- Desktop pets and creature metaphors in software: Clawd on Desk (6.45k★), the Desktop Buddy pet, Claude Code Tamagotchi.
- Notch apps (7+).
- Usage and quota widgets (10+).
- Parallel-agent orchestrators (15+).

---

## 8. Traction benchmarks

### 8a. AgentDeck today (GitHub API, 2026-10-15 UTC; npm 2026-09-13 to 10-12)

| Metric | Value |
|---|---|
| Stars / forks / watchers / open issues | **264★ / 53 forks / 3 watchers / 6 open issues** |
| Created; latest release | 2026-02-20; `npm-v1.9.2` (2026-10-13) |
| Star velocity | about **34★/month** (264★ over about 7.8 months) |
| npm downloads per month | @agentdeck/setup **2,062**; @agentdeck/bridge **2,183** |
| Topics | ai-agents, android, claude-code, developer-tools, esp32, hardware, iot, monorepo, stream-deck, swiftui |
| Fork ratio | 20% (53/264). That is in line with hardware and maker repos (Desktop Buddy 18%, Clawdmeter 17%, claude-usage-stick 50%) and well above software tools (cmux 9%, CodexBar 9%, ccusage 5%). One reading is people forking to adapt their own hardware (**UNVERIFIED** inference) |

### 8b. Leaders by quadrant (★ as of 2026-10-15 UTC)

| Quadrant | Leaders | Rough "breakout" bar | Typical niche project | AgentDeck relative position |
|---|---|---|---|---|
| Q1 Orchestrators | Multica 52.9k · Vibe Kanban 28.4k · cmux 28.2k · Happy 24.2k · opcode 22.4k · Superset 15.2k · CloudCLI 14.1k · worktrunk 9.2k · Claude Squad 8.6k · Emdash 6.0k | ≥10k★ | 1–3k★: Agent of Empires 3.4k, workmux 2.8k, Xum 2.1k, CCManager 1.3k, agent-deck 1.1k | 264★ is about **0.9% of cmux** |
| Q2 Monitoring and usage | Claude HUD 28.5k · CodexBar 22.5k · ccusage 19.0k (877.6k npm/mo) · ccstatusline 13.3k (202.7k npm/mo) · Usage Monitor 8.7k · agentsview 6.1k · tokscale 5.7k (182.3k npm/mo) · Entire 5.2k · peon-ping 5.1k | ≥5k★, or ≥100k npm downloads/month | 1–3k★: Vibe Notch 2.5k, open-vibe-island 2.0k, disler 1.5k, Sniffly 1.3k | AgentDeck's npm total is about **0.24% of ccusage** (2,062 vs 877,566) |
| Q3 Decks and peripherals | No open-source breakout: streamdeck-mcp 52★, agentsd 10★, Agent Vitals 7★, fernandobelotto/AgentDeck 1★. Commercial products (VibeDeck, Vizhi, VibeKeys) publish no numbers. Corporate entrants: Logitech MX Keypad (2026-09-08) and Elgato MCP (May 2026) | n/a | <100★ | **AgentDeck is the largest open-source agent-deck project found**: about 26× agentsd and 38× Agent Vitals |
| Q4 Ambient hardware | Claude Desktop Buddy 2.65k · AWTRIX3 2.35k · Clawdmeter 2.26k · TRMNL firmware 1.19k ("10s of 1000s" of homes/offices) · Tidbyt 100k devices shipped (2024) · Divoom 200M+ app users (self-reported) · Clawd on Desk 6.45k (software) · xiaozhi-esp32 31.2k (adjacent) | About 2–3k★ for an agent-hardware repo | <150★: claude-usage-stick 120, TamaClaude 41 | About **10% of Desktop Buddy**, **12% of Clawdmeter** |

### 8c. Star velocity: approximate ★/month since repo creation (to 2026-10-15)

| Repo | ★/month | Note |
|---|---|---|
| Multica | about 5,800 | created 2026-01-13 |
| cmux | about 3,300 | created 2026-01-28 |
| Claude HUD | about 3,000 | created 2026-01-02 |
| Clawd on Desk | about 930 | created 2026-03-18; closest to the creature metaphor |
| agentsview | about 780 | created 2026-02-19 |
| peon-ping | about 620 | created 2026-02-09 |
| Clawdmeter | about 440 | created 2026-05-11 |
| Claude Desktop Buddy | about 430 | created 2026-04-09; most stars came at launch |
| open-vibe-island | about 320 | created 2026-04-02 |
| **AgentDeck** | **about 34** | created 2026-02-20 |

### 8d. Market-size denominators (npm, 2026-09-13 to 10-12)

- `@openai/codex`: 99.1M downloads/month.
- `@anthropic-ai/claude-code`: 55.1M downloads/month.
- These are inflated by CI. They are useful only as relative scale.
- **No public install base exists for decks.** Corsair/Elgato discloses no Stream Deck unit numbers. An Amazon-only estimator puts the Stream Deck MK.2 at about 2–3k units a month in the US (**UNVERIFIED**) [S41]. The Elgato Marketplace launched in Oct 2023 with "hundreds" of Stream Deck plugins [S41].

---

## 9. Implications for the workshop (analyst view, for discussion)

1. **Position AgentDeck as "the ambient layer: every agent, every surface on your desk", not as "a Stream Deck plugin".**
   - The plugin category is crowded with low-traction entries.
   - It is now being absorbed by platform moves: Elgato MCP, the Logitech MX Keypad, and Anthropic's Hardware Buddy.
2. **Bridge the platform protocols instead of fighting them.** Two candidates:
   - An AgentDeck transport for Anthropic's Hardware Buddy BLE protocol. Any Desktop Buddy device would then become an AgentDeck surface, and AgentDeck could serve Codex and OpenCode state to it.
   - A Logi Actions SDK plugin, to ride Logitech's retail distribution.
   - Protocol terms and feasibility were not checked (**UNVERIFIED**).
3. **Turn the empty niches into showcases.** TRMNL, Pixoo/AWTRIX and Ulanzi have no agent-grade integrations. A public TRMNL recipe is a distribution channel: TRMNL has a 700+ plugin catalogue, community-built, used in tens of thousands of homes and offices.
4. **APME could be the most defensible differentiator** if it is surfaced simply, for example "which agent or model did best on this kind of task this week". No individual-developer tool does that locally.
5. **Naming risk.** At least 9 GitHub repos are named AgentDeck or agent-deck. They include a 1.1k★ TUI with the same job description and a Stream Deck plugin with the exact name. Search and discovery will suffer.
6. **Benchmark traction against hardware peers, not software.**
   - Hardware peers break out at about 2–3k★: Desktop Buddy and Clawdmeter.
   - Software peers break out at 10k–50k★.
   - On star velocity, AgentDeck (about 34★/month) trails single-purpose hardware repos by about 10×.

---

## 10. Sources (all accessed 2026-10-16 KST)

**Quadrant 1**
- [S1] Conductor homepage: https://conductor.build
- [S2] Simplify company profile, Conductor (funding and users, third party): https://simplify.jobs/c/Conductor-Build
- [S3] DevTune, Conductor (funding, third party): https://devtune.ai/verticals/coding-agent-orchestration/conductor
- [S4] codepick, Conductor intro (pricing and platform, third party): https://codepick.dev/en/guides/conductor-build-intro/ · also https://www.morphllm.com/conductor-ai-coding
- [S5] Conductor brand kit ("Introducing Conductor Cloud"): https://conductor.build/brandkit
- [S6] Multica overview (third party): https://themenonlab.blog/blog/multica-open-source-managed-agents-platform · repo https://github.com/multica-ai/multica
- [S7] YC Manaflow: https://www.ycombinator.com/companies/manaflow · YC Launch: https://www.ycombinator.com/launches/PbB-cmux-the-open-source-terminal-built-for-coding-agents
- [S8] cmux article: https://noqta.tn/en/blog/cmux-macos-terminal-ai-coding-agents-parallel-sessions-2026
- [S9] Vibe Kanban shutdown: https://vibekanban.com/blog/shutdown · https://vibekanban.com/shutdown
- [S10] Superset. YC job post ($11M seed claim): https://www.ycombinator.com/companies/superset/jobs/Nd9luiP-founding-engineer · Ry Walker research (licence): https://rywalker.com/research/superset · Launch HN: https://hn.svelte.dev/item/48236770
- [S11] Claude Code Agent View docs: https://code.claude.com/docs/en/agent-view · blog: https://claude.com/blog/agent-view-in-claude-code · launch date (third party): https://pasqualepillitteri.it/en/news/2384/claude-code-agent-view-cli-dashboard-sessions-2026
- [S12] Claude Code Remote Control docs: https://code.claude.com/docs/en/remote-control · launch (third party): https://noqta.tn/en/news/anthropic-claude-code-remote-control-mobile-2026
- [S13] Codex app (third party): https://www.verdent.ai/guides/what-is-codex-app · https://verdent.ai/guides/codex-app-first-impressions-2026
- [S14] Cursor Agents Window docs mirror: https://techdevnotes.com/releases/cursor-docs/20260626-202020Z-6c7064724f5e/content/pages/agent/agents-window.txt · forum: https://forum.cursor.com/t/worktrees-in-agents-window/158956
- [S15] Google Antigravity: https://codelabs.developers.google.com/getting-started-google-antigravity · https://www.thoughtworks.com/radar/tools/google-antigravity · https://www.gend.co/blog/google-antigravity

**Quadrant 3**
- [S16] Agent Vitals note: https://notes.nicolasdeville.com/helpers/agent-vitals/ · repo https://github.com/tapparello/agent-vitals
- [S17] VibeDeck: https://www.producthunt.com/products/vibedeck-stream-deck-control-for-agents · https://peerlist.io/polsky/project/vibedeck--control-for-claude-code-codex · https://www.indiehackers.com/product/vibedeck · https://huntscreens.com/products/vibedeck
- [S18] Elgato, "Control Claude with Stream Deck" (updated 2026-08-07): https://www.elgato.com/ca/fr/explorer/products/stream-deck/control-claude-with-stream-deck-for-faster-workflows/
- [S19] Elgato Stream Deck MCP: https://www.corsair.com/newsroom/press-release/elgato-brings-ai-control-to-stream-deck-launching-with-nvidia-project-g-assist-2 · https://secure.businesswire.com/news/home/20260528256706/en/Stream-Deck-Becomes-the-Action-Layer-for-AI-Starting-with-NVIDIA-G-Assist
- [S20] agentsd: https://tomevault.io/tome/paultyng/agentsd · repo https://github.com/paultyng/agentsd
- [S21] Logitech MX Keypad: https://ir.logitech.com/news/news-details/2026/Logitech-Unveils-MX-Keypad-for-Developers-The-Customizable-Multi-App-AI-Control-Center/default.aspx · https://techradar.com/pro/logitechs-new-usd99-mx-keypad-puts-ai-coding-at-a-developers-fingertips · https://www.pcgameshardware.de/Tastaturen-Hardware-255538/News/Logitech-MX-Keypad-Codex-Claude-Code-Copilot-1553218/
- [S22] Vizhi: https://www.producthunt.com/products/vizhi · https://www.yankodesign.com/?p=646858
- [S23] VibeKeys: https://www.indiehackers.com/product/vibekeys · https://toolchase.com/tool/vibekeys/
- [S24] VibePad: https://feedbagel.com/post/vibepad-free-macos-app-for-controlling-ai-coding-assistants-with-gamepad · ClaudePad: https://cdn.jsdelivr.net/npm/claudepad@1.0.0/README.md
- [S25] Ulanzi Studio plugin skill: https://tomevault.io/tome/ukinora/ulanzi-studio-plugin-skill

**Quadrant 2: notch apps, usage, eval**
- [S26] Notch apps: https://vibeisland.app/alternatives/ (vendor-written) · https://vibecoding.app/blog/vibe-island-review · https://pushary.com/ar/vs/vibe-island · https://www.producthunt.com/p/chimlo-agents-in-your-macbook-notch/chimlo · https://www.producthunt.com/posts/agentpeek-2 · https://github.com/Louis-CFM/coucou/wiki · https://github.com/vibeislandapp/vibe-island · https://github.com/Octane0411/open-vibe-island · https://github.com/farouqaldori/vibe-notch
- [S38] Raycast and menu-bar usage: https://www.raycast.com/nyatinte/ccusage · https://raycast.com/WerrySs/codex-claude-cli · https://www.raycast.com/qazi0/claudecast · https://usagebar.com/
- [S39] Agent eval: https://promptfoo.dev/docs/guides/evaluate-coding-agents/ · https://docs.datadoghq.com/llm_observability/guide/claude_code_skills/ · https://skillselion.com/plugin/JudgmentLabs/judgeval-claude-plugin · https://smithery.ai/skills/NeoLabHQ/agent-evaluation
- [S40] Entire: https://rywalker.com/research/entire (third party; funding) · https://docs.entire.io/cli/overview · https://docs.entire.io/cli/checkpoints.md · repo https://github.com/entireio/cli

**Quadrant 4**
- [S27] Claude Desktop Buddy: https://github.com/anthropics/claude-desktop-buddy/ · https://wiki.lilygo.cc/products/t-lora-series/t-lora-pager/claude-desktop-buddy.html · https://blog.circuit.rocks/esp32-claude-bluetooth-hardware-buddy · https://www.hackster.io/tech_nickk/claude-desktop-buddy-1d38ff · https://www.yankodesign.com/2026/05/20/this-30-gadget-gives-claude-a-face-that-reacts-to-what-its-doing/amp/
- [S28] VibeBuddy: https://www.producthunt.com/products/vibe-buddy · https://chatgate.ai/post/vibe-buddy · https://www.hunted.space/product/vibe-buddy
- [S29] FreakStudio ClaudeAssistant: https://www.tindie.com/products/freakstudio/claudeassistant/
- [S30] VibeOrb: https://gitee.com/panzi/ESP32-VibeOrb · StackChan notify: https://lilting.ch/en/articles/m5stack-cores3-stackchan-agent-notify · TamaClaude: https://github.com/thaitop/tamaclaude · Clawdmeter: https://github.com/HermannBjorgvin/Clawdmeter · claude-usage-stick: https://github.com/oauramos/claude-usage-stick
- [S31] TRMNL: https://trmnl.com/blog/2025-in-review (2025-12-17) · https://trmnl.com/b2b · https://shop.trmnl.com/products/trmnl-x · https://www.notebookcheck.net/New-TRMNL-X-larger-waterproof-smart-e-ink-display-launches.1077594.0.html · https://boingboing.net/2026/07/07/trmnl-hackable-e-ink-dashboard-to-put-anywhere.html · TRMNLcast: https://community.obsidian.md/users/mprazz · TRMNL AI agent: https://zeli.app/story/48996236
- [S32] Tidbyt: https://tidbyt.com/blogs/tidbyt/tidbyt-is-joining-modal (2024-11-07) · https://hackaday.com/tag/tidbyt/ · https://github.com/orgs/tronbyt/repositories
- [S33] Divoom: https://divoom.com · https://divoom.com/products/pixoo16
- [S34] LaMetric and Pixoo hooks: https://pkg.go.dev/github.com/dedene/lametric-cli · https://pi.dev/packages/@qmxme/pi-lametric-notify?page=22 · https://ifttt.com/connect/github/lametric · https://ifttt.com/applets/eatVDh6x-show-lametric-notification-and-play-pixoo-64-channel-when-webhook-event-is-received
- [S35] AWTRIX MCP server: https://glama.ai/mcp/servers/czo2evgaj2 · AWTRIX NG: https://github.com/Blueforcer/awtrix-ng
- [S36] Presence lights: https://luxafor.helpscoutdocs.com/article/25-webhook-api-basics-and-guidelines · https://luxafor.helpscoutdocs.com/article/70-incoming-local-webhook-developer-guide · https://pypi.org/project/busylight-for-humans
- [S37] DIY status lights: https://makerworld.com/fr/models/2882595-claude-code-session-status-light · https://skillselion.com/skills/ARETI-GmbH/claude-beacon/plugins/claude-beacon · https://gitblind.noratr.app/MaceWindu/Claudelk · https://github.com/artemy/semaphore · https://github.com/Jesse1211/Aignals

**Market size**
- [S41] Stream Deck sales estimate (Amazon US, third party): https://www.asinsight.com/report/US/stream-deck · Elgato Marketplace launch (Oct 2023): https://www.corsair.com/newsroom/press-release/elgato-launches-digital-creator-marketplace

**Machine-read data**
- GitHub REST API (`https://api.github.com/repos/<owner>/<repo>` and `/releases/latest`), pulled 2026-10-15 15:30–15:47 UTC.
- npm downloads API (`https://api.npmjs.org/downloads/point/last-month/<pkg>`), window 2026-09-13 to 2026-10-12.

---

## Appendix A: GitHub pull, raw (2026-10-15 UTC)

**Licence:** "NOASSERTION" means GitHub could not detect a standard licence.

**Redirects observed:**
- ryoppippi/ccusage → ccusage/ccusage
- coder/mux → coder/xum
- farouqaldori/claude-island → vibe-notch
- njbrake → agent-of-empires org
- wesm/agentsview → kenn-io/agentsview
- tonyyont → PeonPing org

| Repo | ★ | Forks | Created | Last push | Licence | Latest release |
|---|---|---|---|---|---|---|
| puritysb/AgentDeck | 264 | 53 | 2026-02-20 | 2026-10-15 | MIT | npm-v1.9.2 (2026-10-13) |
| multica-ai/multica | 52,897 | 6,919 | 2026-01-13 | 2026-10-15 | NOASSERTION | v0.6.2 (2026-10-13) |
| 78/xiaozhi-esp32 | 31,183 | 7,291 | 2024-08-31 | 2026-10-15 | MIT | — |
| jarrodwatts/claude-hud | 28,548 | 1,329 | 2026-01-02 | 2026-10-13 | MIT | — |
| BloopAI/vibe-kanban | 28,373 | 3,035 | 2025-06-14 | 2026-09-19 | Apache-2.0 | v0.1.44 (2026-04-24) |
| manaflow-ai/cmux | 28,188 | 2,507 | 2026-01-28 | 2026-10-15 | NOASSERTION | v0.65.1 (2026-10-12) |
| slopus/happy | 24,160 | 2,065 | 2025-07-18 | 2026-10-14 | MIT | cli-1.2.5 (2026-09-22) |
| steipete/CodexBar | 22,527 | 2,117 | 2025-11-16 | 2026-10-15 | MIT | v0.75.0 (2026-10-14) |
| winfunc/opcode | 22,418 | 1,726 | 2025-06-19 | 2026-09-18 | AGPL-3.0 | v0.2.0 (2025-08-31) |
| ccusage/ccusage | 19,015 | 878 | 2025-05-29 | 2026-10-15 | NOASSERTION | v20.0.34 (2026-10-15) |
| superset-sh/superset | 15,223 | 1,356 | 2025-10-21 | 2026-10-15 | NOASSERTION | desktop-v1.38.0 (2026-10-14) |
| siteboon/claudecodeui | 14,106 | 2,040 | 2025-06-25 | 2026-10-15 | AGPL-3.0 | v1.37.4 (2026-10-09) |
| sirmalloc/ccstatusline | 13,297 | 598 | 2025-08-08 | 2026-10-13 | MIT | — |
| max-sixty/worktrunk | 9,249 | 332 | 2025-10-17 | 2026-10-15 | NOASSERTION | — |
| Maciek-roboblog/Claude-Code-Usage-Monitor | 8,743 | 462 | 2025-06-19 | 2026-07-05 | MIT | v4.0.0 (2026-06-27) |
| smtg-ai/claude-squad | 8,608 | 625 | 2025-03-09 | 2026-08-20 | AGPL-3.0 | v1.0.20 (2026-08-20) |
| rullerzhou-afk/clawd-on-desk | 6,453 | 681 | 2026-03-18 | 2026-10-15 | AGPL-3.0 | — |
| kenn-io/agentsview | 6,119 | 696 | 2026-02-19 | 2026-10-15 | MIT | v0.45.0 (2026-10-09) |
| generalaction/emdash | 5,992 | 631 | 2025-08-28 | 2026-10-14 | Apache-2.0 | v1.2.8 (2026-10-10) |
| junhoyeo/tokscale | 5,683 | 479 | 2025-12-01 | 2026-10-15 | MIT | v4.19.1 (2026-10-15) |
| entireio/cli | 5,181 | 488 | 2026-01-02 | 2026-10-15 | MIT | v0.11.5 (2026-10-14) |
| PeonPing/peon-ping | 5,078 | 395 | 2026-02-09 | 2026-10-06 | MIT | — |
| dagger/container-use | 4,070 | 212 | 2025-05-23 | 2026-09-21 | Apache-2.0 | — |
| hamed-elfayome/Claude-Usage-Tracker | 3,657 | 196 | 2025-10-25 | 2026-08-31 | MIT | v3.3.0 (2026-08-29) |
| agent-of-empires/agent-of-empires | 3,353 | 381 | 2026-01-09 | 2026-10-15 | MIT | v1.19.0 (2026-10-08) |
| stravu/crystal (→ Nimbalyst) | 3,131 | 198 | 2025-06-05 | 2026-02-26 | MIT | — |
| omnara-ai/omnara | 2,918 | 237 | 2025-07-09 | 2026-10-15 | Apache-2.0 | — |
| raine/workmux | 2,841 | 335 | 2025-11-04 | 2026-10-14 | MIT | v0.1.276 (2026-10-14) |
| anthropics/claude-desktop-buddy | 2,653 | 471 | 2026-04-09 | 2026-04-16 | NOASSERTION | — |
| farouqaldori/vibe-notch | 2,525 | 354 | 2025-12-09 | 2026-04-20 | Apache-2.0 | v1.3.2 (2026-04-20) |
| Blueforcer/awtrix3 (discontinued) | 2,354 | 231 | 2023-03-17 | 2026-09-20 | NOASSERTION | — |
| HermannBjorgvin/Clawdmeter | 2,260 | 382 | 2026-05-11 | 2026-10-15 | none | — |
| coder/xum (ex-mux) | 2,054 | 142 | 2025-09-17 | 2026-10-15 | AGPL-3.0 | v0.31.0 (2026-10-09) |
| Octane0411/open-vibe-island | 2,047 | 352 | 2026-04-02 | 2026-10-15 | GPL-3.0 | — |
| nimbalyst/nimbalyst | 1,906 | 303 | 2025-10-30 | 2026-10-14 | MIT | — |
| stack-chan/stack-chan | 1,779 | 238 | 2021-06-06 | 2026-10-15 | Apache-2.0 | — |
| disler/claude-code-hooks-multi-agent-observability | 1,548 | 384 | 2025-07-13 | 2026-02-08 | none | — |
| chiphuyen/sniffly | 1,276 | 118 | 2025-07-15 | 2025-08-08 | MIT | — |
| kbwo/ccmanager | 1,263 | 94 | 2025-06-07 | 2026-10-15 | MIT | — |
| usetrmnl/trmnl-firmware | 1,192 | 268 | 2024-01-13 | 2026-10-15 | GPL-3.0 | v1.8.17 (2026-10-02) |
| asheshgoplani/agent-deck | 1,089 | 195 | 2025-12-03 | 2026-10-14 | MIT | v1.16.28 (2026-10-10) |
| snipeship/ccflare | 1,052 | 143 | 2025-07-25 | 2026-04-19 | MIT | — |
| usetrmnl/terminus | 745 | 143 | 2025-03-12 | 2026-10-15 | MIT | — |
| Dicklesworthstone/ntm | 458 | 72 | 2025-12-10 | 2026-10-15 | NOASSERTION | — |
| usetrmnl/larapaper | 436 | 83 | 2025-03-04 | 2026-10-13 | MIT | — |
| Ido-Levi/claude-code-tamagotchi | 434 | 65 | 2025-08-14 | 2025-10-20 | MIT | — |
| Blueforcer/awtrix-ng | 397 | 32 | 2026-08-03 | 2026-10-10 | NOASSERTION | — |
| vibe-log/vibe-log-cli | 339 | 21 | 2025-08-15 | 2026-04-19 | MIT | — |
| imbue-ai/sculptor | 239 | 18 | 2025-08-07 | 2026-10-15 | MIT | — |
| Piebald-AI/splitrail | 223 | 25 | 2025-07-12 | 2026-10-14 | MIT | — |
| tronbyt/server | 220 | 65 | 2023-06-10 | 2026-10-14 | Apache-2.0 | — |
| vibeislandapp/vibe-island (issues/landing; app is paid) | 154 | 6 | 2026-04-03 | 2026-09-02 | none | — |
| oauramos/claude-usage-stick | 120 | 60 | 2026-04-23 | 2026-08-28 | MIT | — |
| tronbyt/firmware-esp32 | 111 | 34 | 2023-07-12 | 2026-10-14 | Apache-2.0 | — |
| verygoodplugins/streamdeck-mcp | 52 | 13 | 2025-12-24 | 2026-08-12 | MIT | — |
| thaitop/tamaclaude | 41 | 16 | 2026-07-27 | 2026-08-10 | MIT | — |
| fredruss/agent-paperclip | 31 | 3 | 2026-01-16 | 2026-10-01 | MIT | — |
| paultyng/agentsd | 10 | 4 | 2026-03-25 | 2026-08-12 | MIT | — |
| tapparello/agent-vitals | 7 | 2 | 2026-07-24 | 2026-09-24 | MIT | — |
| fernandobelotto/AgentDeck | 1 | 0 | 2026-01-07 | 2026-10-13 | none | — |

**Other "AgentDeck"-named repos (name-collision check, `gh search repos agentdeck`):**
- darknecrocities/Agentdeck (12★; "Local-First Remote AI Engineering Control Plane")
- DuarteSantos8/agentdeck (8★; browser terminal deck for Claude Code)
- AliceLJY/agentdeck (6★; web terminal for Claude Code, Codex, Kimi and Antigravity CLIs)
- mantou132/AgentDeck (5★; "Your coding agents, in your pocket")
- agentdecksdk/agentdeck (4★; "AgentDeck SDK")
- Jimmy-web169/AgentDeck (4★)
- Wintersta7e/agentdeck (4★; Electron app for agents in WSL)

**npm last-month downloads (2026-09-13 to 10-12):**

| Package | Downloads |
|---|---|
| @openai/codex | 99,077,505 |
| @anthropic-ai/claude-code | 55,097,186 |
| ccusage | 877,566 |
| ccstatusline | 202,712 |
| tokscale | 182,342 |
| vibe-kanban | 10,858 |
| omnara | 3,404 |
| @agentdeck/bridge | 2,183 |
| happy-coder | 2,065 (whether this is still Happy's main package is **UNVERIFIED**) |
| @agentdeck/setup | 2,062 |
