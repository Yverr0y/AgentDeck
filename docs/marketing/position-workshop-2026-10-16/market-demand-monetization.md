# AgentDeck: demand, personas, distribution and monetization

*Research memo for the product workshop. Prepared 2026-10-16. Every source was accessed on 2026-10-16. Source IDs `[Sx]` resolve in §7.*

**Method.** I ran 43 web searches and fetched the key primary pages. I also queried four public APIs on 2026-10-16: the GitHub REST API (stars, issue reactions), the npm downloads API, the HN Algolia API (points and comments), and the iTunes Search API (US App Store ratings). Numbers from those APIs are snapshots taken on that date. I did not read the AgentDeck repo.

**Evidence labels.** **UNVERIFIED** marks a claim that rests on one secondary source, a search snippet, or a page I could not open. *(inference)* marks my own analysis rather than a sourced fact.

**Reddit gap.** Reddit could not be reached. The JSON API returned 403 and the search tool refuses reddit.com. Reddit sentiment therefore appears only through secondary summaries. To make up for it, the memo leans on GitHub issue reactions and HN threads, which are quantitative and checkable.

---

## 0. Executive summary

1. **Running several agents in parallel is real, but most developers still don't.** Stack Overflow's Pulse survey (April 2026, n≈1,100) found that 69% use a single agent, 17% use multiple specialized agents and 16% use multiple coordinated agents. Among multi-agent users, 85% and 77% respectively coordinate or monitor them daily. 60% block agents from unapproved system changes, so permission prompts are the norm [S5].
2. **The best-evidenced pain is quota and usage anxiety.**
   - On HN, "Claude Code weekly rate limits" drew 609 points and 705 comments [S4].
   - Claude Code issue #16157 ("Instantly hitting usage limits with Max subscription") has 695 👍 and 1,499 comments [S15].
   - Codex issue #28879 (5-hour window drained after a June 2026 cost change) has 365 👍 [S16].
   - ccusage has 19.0k★ and 878k npm downloads in 30 days; CodexBar has 22.5k★ [S12][S13].
3. **The vendors themselves have validated "which agent is waiting on me?"**
   - Claude Code's creator runs 5 numbered terminal tabs plus 5–10 web sessions and uses system notifications "to know when a Claude needs input" [S1].
   - Anthropic shipped *agent view* on 2026-05-11, pitched as "See at a glance which agents are waiting on you" [S6].
   - OpenAI's Codex app (2026-02-02) is marketed as a multi-agent "command center" [S9][S10].
4. **The physical form factor has been validated by OpenAI.** The Codex Micro is a $230 macro pad made with Work Louder (2026-07-15). It has RGB keys that show live agent state, accept/reject keys, and a dial for reasoning effort. It reached 306 points and 253 comments on HN, and press reports say it sold out (that part is UNVERIFIED) [S17].
5. **The same facts are a platform-absorption risk.** First-party tools now cover much of AgentDeck's software layer:
   - Claude Code Remote Control: phone approvals, February 2026 [S44]
   - status-line `rate_limits`, April 2026 [S43]
   - a waiting-for-input hook, August 2026 [S15]
   - agent view, and the Codex Micro

   The defensible gap *(inference)* is cross-vendor coverage on hardware people already own, local-first operation, and evaluation for a team or PM.
6. **Willingness to pay for software is low; it is higher for hardware.** Free tools dominate (ccusage, CodexBar, Happy, Agent Vitals). VibeDeck, the closest paid Stream Deck competitor, dropped $5/month for a $19 one-time licence and got 1 upvote on Product Hunt [S19]. Buyers do pay $230 for the Codex Micro and $139 for a TRMNL [S17][S49].
7. **Elgato Marketplace is free-only from Korea.** The split is 70/30, paid out through Stripe Connect in 49 countries, and South Korea is not one of them [S22][S23].
8. **Correction to the earlier memo.** Stripe will not open *merchant* accounts in Korea [S34]. Stripe Connect *cross-border payouts* do reach Korean residents, though. GitHub Sponsors lists South Korea and charges 0% on personal sponsorships [S28]. Polar lists South Korea as a payout country [S29].
9. **The most feasible way to earn from Korea:**
   - Start GitHub Sponsors now.
   - Sell a one-time "Pro/Supporter" licence through Polar.sh as merchant of record (5% + 50¢) [S29].
   - Paid tiers on the App Store and Google Play are also open to Korean developers (KRW proceeds, 15% small-business rate) [S36][S37].

---

## 1. Demand signals (2025–2026)

### 1.1 How common is the "N agents in parallel" workflow?

| Evidence | What it says | Strength |
|---|---|---|
| Stack Overflow Pulse Survey, fielded late April 2026, published 2026-05-27, n≈1,100 [S5] | 69% use a single agent, 17% multiple *specialized* agents, 16% multiple *overlapping or coordinated* agents. The three figures sum to 102%, so they are rounded or multi-select. Multi-agent users coordinate or monitor daily (85% and 77%); single-agent users do so at 54%. 68% *prefer* predictable single-agent setups. 63% rarely or never let agents run on autopilot. 60% block unapproved system changes. | Strong; the cleanest parallel-use number found |
| Pragmatic Engineer AI tooling survey, 2026-01-27 to 02-17, ~906–1,000 respondents [S8] | "Most engineers juggle two to four tools at once." 55% regularly use AI agents. Claude Code leads usage. | Medium; paywalled, overview only |
| JetBrains Developer Ecosystem 2026, ~15k respondents, May–July 2026 [S7] | 90% of professional developers use AI coding agents at least weekly; 68% daily. No figure on parallel use. | **UNVERIFIED**: the page returned 403, so this comes from a search snippet |
| Boris Cherny (creator of Claude Code), X thread, 2026-01-02 [S1] | "I run 5 Claudes in parallel in my terminal. I number my tabs 1-5, and use system notifications to know when a Claude needs input." Also "I also run 5-10 Claudes on claude.ai/code, in parallel with my local Claudes." | Strong qualitative signal, and it set the norm for many followers |
| Anthropic rate-limit notice, 2025-07-28; limits took effect 2025-08-28 [S2][S3] | Some of the biggest Claude Code fans run it "continuously in the background, 24/7". Weekly caps were expected to hit "<5% of subscribers". | Strong; a vendor statement that sizes the heavy-user tail |
| OpenAI Codex app, 2026-02-02 [S9][S10] | Framed as a "command center for agents", with parallel agents in separate worktrees. "More than a million developers used Codex in the month before launch." | Medium; the 1M figure is secondary |
| Anthropic agent view, 2026-05-11 [S6] | Problem statement: users "manage multiple terminal tabs, a tmux grid, and an overloaded mental ledger." Promise: "See at a glance which agents are waiting on you." | Strong; first-party definition of the problem |
| Scale proxy: npm downloads, 30 days to 2026-10-12 [S12] | `@anthropic-ai/claude-code` 55.1M, `@openai/codex` 99.1M, `opencode-ai` 11.9M, `ccusage` 0.88M. Downloads are not users: CI, auto-updates and native installers distort them. | Directional only |
| Claude Code business metrics [S11] | Run-rate above $1B by November 2025 and above $2.5B on 2026-02-12. Weekly active users doubled after 2026-01-01; business subscriptions grew 4×. | Medium; secondary sources (the primary is the Series G announcement, which I did not fetch) |

**Takeaway** *(inference)*: about one in three agent users already runs multiple agents, and that group supervises them daily. It is a minority, but it is the high-intensity, high-spend minority, and the same people the 5-hour and weekly caps hit first.

### 1.2 Pain points, ranked by strength of evidence

**(a) Quota and usage anxiety: the best-evidenced pain**
- HN "Claude Code weekly rate limits": 609 points, 705 comments, 2025-07-28 [S4].
- anthropics/claude-code issues (👍 counts as of 2026-10-16) [S15]:
  - #16157 "Instantly hitting usage limits with Max subscription": **+695 👍, 1,499 comments**, opened 2026-01-03, still open
  - #38335 "Claude Max plan session limits exhausted abnormally fast since March 23, 2026": +476, 877 comments
  - #9424 "Weekly Usage Limits Making Claude Subscriptions Unusable": +115
  - #35744 "Auto-continue after subscription rate limit resets": +103
  - #20636 "Expose rate limit usage (session %, weekly %) to statusLine": +59, **closed as completed 2026-04-24**
- openai/codex issues [S16]:
  - #28879 "rate-limit cost per token jumped ~10-20x since June 16, draining the 5h…": +365, 211 comments
  - #34035 "Make the temporary removal of the 5-hour usage limit permanent": +166 (July 2026)
  - #2448 "Plus users hitting usage limits extremely quickly": +90 (August 2025)
  - #21073 "Auto-resume CLI session when usage limit resets": +78
- Tool adoption [S13]:
  - ccusage: 19.0k★, created 2025-05-29, 877,566 npm downloads in 30 days
  - CodexBar (menu-bar limits for Codex and Claude): 22.5k★, created 2025-11-16
  - Claude-Code-Usage-Monitor: 8.7k★
- Paid usage monitors on the Mac App Store barely register. US ratings counts [S45]:
  - "CodexBar Usage Monitor" ($3.99): 3
  - "Usage for Claude" (free): 5
  - "Nowdex": 10

  *(inference)* The pain is real, but software usage gauges are commoditized and free.

**(b) Knowing which agent is waiting on you, and notification fatigue**
- The Cherny thread and agent view above [S1][S6].
- claude-code issues [S15]:
  - #13024 "Add hook for when Claude is waiting for user input": +81, closed as completed 2026-08-17
  - #57230 "[VSCode] Add native system/toast notifications when Claude needs attention": +49, open
  - #29438 "Remote Control: Push notifications on iOS when permission approval is needed": +59
  - #8985 "Notification hook doesn't work in VS Code extension 'native UI' mode": +67
- openai/codex: #32908 "Codex Remote Control push notifications not delivered on iOS" (+18, July 2026) and #7083 "notifications on completion like Cursor" (+19) [S16].
- Many small notifier tools draw little attention on HN [S14]: "Ccnotifs" (2026-03-01, 2 points), "Peon-ping – Claude Code notifications that uses Warcraft III Peon voice lines" (2026-02-10), "Claude Code CLI notification script" (2026-03-26). There are also how-to guides such as dev.to's "How to know when a Claude Code agent needs your approval without watching the terminal" [S53].
- One r/ClaudeAI post presented an open-source notifier covering Claude Code, Codex, Gemini CLI and OpenCode. According to a summary, replies said the problem "gets worse when they run several agent sessions in parallel" [S52]. **UNVERIFIED**: the summary is secondary and Reddit was unreachable.

**(c) Babysitting permission prompts**
- 60% block unapproved system changes and 63% rarely or never use autopilot [S5]. Approval prompts are therefore the default state of supervised agent work.
- claude-code issue #10906 (the built-in Plan agent keeps re-prompting for pre-approved permissions, +48) and #11799 (auto-approve WebSearch, +47) [S15].
- Claude Code Remote Control deliberately does not support `--dangerously-skip-permissions`, so approvals stay human [S44]. That is secondary reporting.

**(d) Context switching between terminals and boards.** Tools aimed at the switching problem drew large audiences [S13][S14]:
- Vibe Kanban: 28.4k★, Show HN 195 points
- Claudia (now opcode): 22.4k★, HN 501 points
- claude-squad: 8.6k★
- Sculptor: Show HN 176 points
- "A local merge queue for parallel Claude Code agents": Show HN 42 points, 2026-07-30

**(e) Approving from a phone**
- Omnara: Show HN "Run Claude Code from anywhere" scored 310 points and 168 comments (2025-08-12). Its Launch HN as YC S25 scored 147 points (2026-02-12) [S14].
- Happy: 24.2k★. Its free iOS app, "Happy: Codex & Claude Code App", has **1,026 US ratings averaging 4.86** and was released 2025-07-21 [S13][S45].
- Anthropic shipped **Remote Control** around 2026-02-24/25, letting users approve permissions and send messages from a phone [S44]. Codex has an equivalent, as Codex issue #32908 shows.

**(f) Physical or ambient controllers specifically**
- **OpenAI Codex Micro** [S17]:
  - $230 limited run from OpenAI Supply Co. and Work Louder, 2026-07-15
  - RGB keys show the live state of pinned Codex threads (thinking, running, waiting, done, error)
  - Joystick launches skills; rotary dial sets reasoning effort; keys for accept, reject, push-to-talk and new chat
  - Requires the ChatGPT desktop app
  - HN: 306 points, 253 comments
  - "Sold out within 48 hours" is **UNVERIFIED** (single secondary claim)
- Stream Deck competitors already exist:
  - **Agent Vitals** (free, Claude Code only): five session states and three approval keys mapped to 1/2/3, distributed as GitHub releases [S18]
  - **VibeDeck** (paid, 8 agents, sold on its own site rather than the Elgato Marketplace): switched from $5/month to "$19 once for two computers". Product Hunt shows 1 upvote and 9 followers [S19]
  - **streamdeck-claude** (shows status, cannot approve), **yolodeck/agentsd**, and usage-only plugins [S20]
- **VibeKeys**, "physical control interfaces for AI coding agents" (August 2026 blog) [S21]. **UNVERIFIED**: details are thin.

### 1.3 Counter-signals

- **Multi-agent use is a minority preference.** 68% prefer single-agent setups [S5].
- **First-party features keep shipping.** Agent view (May 2026), Remote Control (February 2026), status-line `rate_limits` (April 2026), the waiting-for-input hook (August 2026), and voice dictation, whose "hold space to speak" hint appears in the Claude Code status-line docs [S43]. On the OpenAI side: the Codex app, Codex Remote Control and the Codex Micro. Software-only notification, usage and phone tools are being absorbed by the platforms.
- **Stream Deck agent plugins have had little traction so far.** VibeDeck got 1 Product Hunt upvote. HN found no Stream Deck/Claude story with more than 1 point [S14][S19]. The Codex Micro won attention mostly through OpenAI's brand *(inference)*.

---

## 2. Personas

| Persona | Size proxies | Willingness-to-pay evidence | How they discover tools | AgentDeck fit *(inference)* |
|---|---|---|---|---|
| **P1. Solo "agent-fleet" developer** (3–15 concurrent sessions; Max or Pro subscriber) | About a third of agent users run multiple agents [S5]. Weekly caps were aimed at the heaviest <5% of subscribers [S2]. Cherny's 5+5–10 setup [S1]. Tens of millions of CLI downloads per month [S12]. | They spend heavily on the agents themselves ($100–200/month Max plans) [S3] and will pay $230 for agent hardware [S17]. Software tooling is expected to be free (ccusage, CodexBar, Happy); the one paid comparable sells for a $19 one-time licence [S19]. | X/Twitter and influencer threads; GitHub trending; `npx` one-liners (ccusage); HN Show HN (Omnara, Claudia, Vibe Kanban); Homebrew. *(inference from the HN-points vs stars gap in §3.2)* | Core persona. Value: cross-vendor status, approvals and quota on one glanceable surface. |
| **P2. Streamers and creators who already own a Stream Deck and code on stream** | Elgato Marketplace "more than 2 million active users" (**UNVERIFIED**: from a MarketBeat summary of Corsair's Q4 2025 call) [S26]. The Stream Deck Mobile iOS app has 5,818 US ratings [S45]. Corsair FY2025 revenue was about $1.47B [S26]. No data on how many of these users code on stream. | The Marketplace supports paid plugins at a 70% maker share, which shows the habit exists [S23]. No data for coding-agent plugins specifically. | The Elgato Marketplace and its in-app store, YouTube setup videos, Discord *(inference)*. | Secondary persona. The playful visuals (creatures, aquarium) are a hook; the segment's size is unknown. |
| **P3. Team lead or PM evaluating agent output** (the maintainer's own role) | Claude Code business subscriptions grew 4× after 2026-01-01, and enterprise was more than half of Claude Code revenue (secondary) [S11]. Anthropic ships a Team/Enterprise analytics dashboard, an Analytics Admin API and OpenTelemetry export [S47]. SO: observability tools are wanted (Sentry 48% "want to use", Langfuse 28%) [S5]. | Highest willingness to pay (budget holders), but procurement and security review apply. Anthropic's analytics covers only usage inside the claude.ai organization and excludes third-party integrations [S47], which leaves a cross-vendor evaluation gap. | Peers, vendor marketplaces, LinkedIn, Pragmatic Engineer-style newsletters *(inference)*. | Possible B2B "eval tier": APME-style judging across Claude, Codex and OpenCode. It must not duplicate first-party dashboards. |
| **P4. Hardware tinkerers** (ESP32, TRMNL, Pixoo, e-ink) | Home Assistant reached 2M active installations at release 2025.5, and fewer than a quarter of users opt into analytics (661k opted-in) [S48]. ESPHome ran on 17.7% of opted-in installations in 2021 (old) [S48]. TRMNL: $139 device, 1,000+ community apps, "thousands" of BYOD licences, the TRMNL X backordered [S49]; trmnl-firmware has 1.2k★ [S13]. | They buy $139 e-ink devices and BYOD licences (historically about $50, **UNVERIFIED**) [S49]. A pre-flashed kit is plausible, but there is no direct evidence of demand for an agent-status kit. | Hackaday, maker YouTube, Home Assistant and TRMNL communities and Discords, Tindie *(inference)*. | Good fit for the ESP32 and e-ink surfaces. Their main motive is fun and tinkering, not saving time. |

---

## 3. Distribution channels: rules and economics

### 3.1 Channel table

| Channel | Rules (verified) | Economics | Feasible from Korea? | Notes |
|---|---|---|---|---|
| **Elgato Marketplace / Maker Console** | New plugins had to be DRM-compatible from **2026-01-19**, with Stream Deck ≥6.9 and manifest **SDK version ≥3**. The same rule applies to version updates from **2026-02-19** [S24]. Every product and version is reviewed; allow **4–10 working days** [S24]. | **70% maker / 30% Elgato**, paid "via Stripe Connect" on a manual, daily, weekly or monthly schedule [S22][S23]. | **Free listings only.** The Stripe Connect list covers 49 countries as of 2026-07-31, and **South Korea is not on it**: "you will not be able to list paid products on Marketplace, but can still list free products" [S22]. | Open question: Polar and GitHub Sponsors reach Korea through Stripe *cross-border* payouts, so it is worth asking Elgato (maker@elgato.com) whether it can enable them. A paid listing through a foreign entity is in §4. |
| **Ulanzi Studio store** | Official UlanziDeckPlugin SDK targets JS plugin protocol v2.1.2 and Ulanzi Studio 3.0.11 [S27]. **No public documentation found** on store submission, paid plugins or revenue share; the SDK README has only a Contact section. **UNVERIFIED** | Unknown | Unknown | A review notes that plugin and profile options are "not yet as extensive" as in other ecosystems [S27]. Treat it as a reach channel, not revenue. |
| **Apple App Store (macOS/iOS)** | Small Business Program: **15%** commission while prior-year proceeds are ≤$1M [S36]. Payment requires a Paid Apps Agreement and banking details; it arrives within 45 days of the fiscal month's end [S36]. Korean storefront proceeds have been in KRW since 2018 [S36]. Guidelines 2.5.2 (self-contained) and 4.2.3 (must work without another app) apply. | 15%/30% | **Yes.** Paid apps and in-app purchases work for Korean developers. Individual VAT and tax handling: **UNVERIFIED**, ask a tax advisor. | An iOS companion client for a CLI agent can pass review: "Happy" is free with 1,026 ratings [S45]. Paid usage monitors on the Mac App Store sell poorly [S45]. |
| **Google Play** | The South Korea row reads "✔ ✔ KRW", meaning developer *and merchant* registration are supported [S37]. | 15% on the first $1M/year; 4 points off with alternative billing in Korea [S37]. A newer Korea fee overhaul is **UNVERIFIED** [S37]. | **Yes.** | Fits the Android launcher if a paid tier is ever wanted. |
| **npm** | Free. | None | Yes | The primary install path for CLI tools: ccusage got 878k downloads in 30 days through `npx` [S12]. |
| **GitHub Releases + Sponsors** | South Korea is a supported Sponsors region; **0% fee** on sponsorships from personal accounts, up to 6% from organizations [S28]. | 0–6% | **Yes (verified).** | A no-regret step. |
| **Homebrew** | Notability rules for `homebrew/cask` [S39]: under 30 forks/watchers or under 75 stars is likely rejected; self-submission needs 3× (90/90/225); repos younger than 30 days fail `brew audit --new`. These thresholds come from a third-party summary and are **UNVERIFIED** against the official page. | Free | Yes | A self-hosted tap avoids the notability rules. |
| **Product Hunt** | n/a | Free | Yes | Weak for this niche: VibeDeck got 1 upvote [S19]. |
| **Hacker News (Show HN)** | n/a | Free | Yes | High variance; see §3.2. Codex Micro (306 points) shows the topic itself draws discussion [S14]. |
| **Raycast Store** | Free SDK and free publishing. No evidence of paid extensions; Raycast monetizes Pro and AI, not extensions [S38]. **UNVERIFIED** | Free | Yes | A reach-only add-on. |

### 3.2 Comparable OSS developer tools, 2025–2026

Stars come from the GitHub API on 2026-10-16 [S13] and HN points from the Algolia API [S14]. The "channel" column is *inference* from the gap between HN points and stars, unless a source is cited.

| Tool (created) | Stars | Best HN result | Channel that drove it | Monetization |
|---|---|---|---|---|
| **ccusage** (2025-05-29), usage CLI | 19.0k; 878k npm downloads/30 days | 75 points (2025-07-18) | `npx` plus X/word of mouth; HN was minor | Free (MIT-style) |
| **CodexBar** (2025-11-16), menu-bar limits | 22.5k | 1 point | The author's X following plus GitHub; Homebrew likely | Free. Third-party App Store clones charge $3.99 [S45] |
| **Happy** (2025-07-18), mobile client | 24.2k | Show HN 30 points (2025-08-14) | **App Store** (1,026 ratings) plus GitHub [S45] | Free |
| **Vibe Kanban** (2025-06-14) | 28.4k | Show HN 195 points / 132 comments (2025-07-11) | HN plus company backing (Bloop) | Free (Apache-2.0) |
| **Omnara** (2025-07-09), run Claude Code or Codex from anywhere | 2.9k | Show HN 310 points (2025-08-12); Launch HN 147 (2026-02-12) | HN plus YC | VC-backed SaaS; pricing **UNVERIFIED** |
| **opcode / Claudia** (2025-06-19) | 22.4k | 501 points / 226 comments (2025-08-17) | HN | Free (AGPL) |
| **claude-squad** (2025-03-09) | 8.6k | 5 points | GitHub trending and X | Free (AGPL) |
| **claude-code-router** (2025-02-25) | 37.7k | n/a | GitHub trending; probably the Chinese developer community (**UNVERIFIED**) | Free |
| Reference: **Maccy**, clipboard manager (open source, paid in the Mac App Store) | 21.9k | n/a | GitHub plus App Store | **Free on GitHub and Homebrew, $9.99 in the Mac App Store** [S45]. The cleanest "OSS core, paid store build" precedent. |
| Reference: **OpenCode** (agent) | 213.8k; 11.9M npm downloads/30 days | n/a | X plus YouTube (**UNVERIFIED**) | Free plus provider partnerships |

**Pattern** *(inference)*:
- HN is the best single *launch event* for orchestration and remote-control tools (Omnara, Claudia, Vibe Kanban, Sculptor).
- The largest *star counts* come from frictionless installs (`npx`, menu-bar apps) amplified on X.
- App Store presence is what makes the phone-companion category work (Happy).
- No Stream Deck or agent-controller project has broken out on HN or Product Hunt yet. The one hardware story that did (Codex Micro) had OpenAI's brand behind it.

---

## 4. Monetization options for a solo maintainer in Korea

| Option | Feasible from Korea? | Fees | Evidence and notes |
|---|---|---|---|
| **GitHub Sponsors** | **Yes (verified)** [S28] | 0% from personal sponsors; up to 6% from organizations | Easiest first step. Typical sponsorship income for niche tools is small *(inference)*. |
| **Polar.sh** (merchant of record: licence keys, one-time sales, subscriptions) | **Yes. South Korea is a listed payout country**, paid through Stripe Connect Express cross-border [S29]. Whether *individuals* can receive payouts depends on Stripe Express business types for Korea (**UNVERIFIED**). | Starter plan **5% + 50¢**. Pro ($20/month) 3.8% + 40¢, Growth ($100/month) 3.6% + 35¢, Scale ($400/month) 3.4% + 30¢; organizations created before 2026-05-27 keep the earlier rate [S29]. A third-party source adds +1.5% on international cards and $2 per active payout month (**UNVERIFIED**) [S29]. | Best fit for a "$19–29 Pro/Supporter licence". As merchant of record, Polar handles global VAT and sales tax. |
| **Paddle** (merchant of record) | **Likely**, for a registered **개인사업자** (sole proprietor). One Korean developer reports passing Paddle review after business registration (**UNVERIFIED**, single anecdote) [S31]. Korea is not on Paddle's exclusion list, but review is required [S31]. | 5% + 50¢. Monthly payouts in USD/EUR/GBP/AUD/CAD (not KRW), $100 minimum (third-party); a $15 SWIFT fee may apply [S31]. | A more conservative merchant of record for subscriptions; heavier onboarding. |
| **Lemon Squeezy** | **UNVERIFIED** for Korea. It is migrating merchants to **Stripe Managed Payments, which covers "35+ countries"** [S30]. | 5% + 50¢; international PayPal payout 3%, capped at $30 [S30]. | Not recommended as a long-term base: its successor depends on Stripe's country list. |
| **Gumroad** (merchant of record) | Probably. A Wise blog lists Korea among countries with direct bank deposit (**UNVERIFIED**) [S32]. | About 10% + 50¢, plus processing per some guides; 7-day payout hold [S32]. | Simple, but expensive. |
| **Ko-fi / Buy Me a Coffee** | Ko-fi pays out through PayPal or Stripe depending on region (secondary) [S33]. Korean PayPal payouts and BMC support for Korea are **UNVERIFIED**; BMC relies on Stripe, so treat it as likely unavailable. | Ko-fi 0% on one-time donations (secondary) | A low-value tip jar. |
| **Open Collective** (through a fiscal host) | Payouts go to PayPal or bank accounts in Wise-served countries [S51]. The ~10% host fee was **UNVERIFIED** in this pass. | Host fee plus Wise costs | Adds governance and transparency; worth it only if the project gains co-maintainers. |
| **Paid App Store app with a free OSS core** | **Yes**: KRW proceeds, 15% small-business rate [S36] | 15% | The Maccy precedent: free from GitHub, $9.99 in the App Store [S45]. The macOS build must stay self-contained (2.5.2/4.2.3). |
| **Google Play paid tier or in-app purchase** | **Yes** (Korean merchant registration supported) [S37] | 15% | For the Android launcher. |
| **Elgato paid plugin** | **No** for a Korean resident [S22] | 30% | Possible only through an entity in a supported country, such as a US LLC via Stripe Atlas: $500 one-time; founders from 130+ countries (archived page). Stripe warns of "significant legal complexity" for non-US LLC members [S35]. *(inference)* Not worth it until revenue justifies a US tax-filing burden. |
| **Hardware kits** (pre-flashed ESP32 or e-ink) | Commercially feasible, with a regulatory burden. **KC** applies to domestic sales; module KC IDs may carry over, but whether a finished product needs retesting is unresolved [S50]. A BLE device is an intentional radiator, so FCC and CE apply on export (forum opinion) [S50]. Tindie and Lectronz seller rules are **UNVERIFIED**. | Inventory and certification cost | *(inference)* Lower-risk version: a "works with AgentDeck" web-flasher for existing certified boards (Seeed, LILYGO, M5Stack), possibly through affiliate links (affiliate programs **UNVERIFIED**). Hold actual kits until demand is proven. |
| **B2B eval tier** | Yes, invoiced through Paddle or Polar, or by direct wire as a 사업자 | n/a | It competes with Anthropic's Team/Enterprise analytics (usage, contribution metrics, leaderboard, CSV, Admin API, OpenTelemetry) [S47]. The gap is cross-vendor evaluation plus judgement of output quality. |

**Most feasible path** *(inference, based on the verified rows)*:
1. **Now:** GitHub Sponsors (0% fee, Korea supported) and a free Elgato Marketplace listing as top-of-funnel.
2. **Next:** a one-time "Pro/Supporter" licence of about $19–29 through **Polar.sh**, which handles tax and supports Korea. The price point is anchored on VibeDeck's $19 [S19].
3. **Optional:** a paid or in-app-purchase tier for the self-contained macOS or iOS app (KRW, 15%).
4. **Later:** B2B evaluation licences invoiced through a merchant of record; hardware through partnerships before holding any inventory.

---

## 5. Risks and how comparable projects handled them

| Risk | Evidence | How comparables handled it / mitigation |
|---|---|---|
| **Anthropic terms on credentials and usage endpoints** | Anthropic's legal page (primary): "Anthropic does not permit third-party developers to offer Claude.ai login into their own applications, or to route requests through Free, Pro, or Max plan credentials on behalf of their users. Moreover, developers may not collect, store, or intermediate Claude.ai credentials or session tokens… Anthropic reserves the right to take measures to enforce these restrictions and may do so without prior notice." [S40] A server-side block on subscription tokens used outside Claude Code reportedly began 2026-01-09, and the policy was formalized around 2026-02-19 (secondary) [S41]. `/api/oauth/usage` is undocumented, and read-only monitors are called a "gray area" [S42]. | OpenCode reportedly removed Claude OAuth support (**UNVERIFIED** commit) [S41]. ccusage reads *local JSONL files*, a safe design, as its HN title says [S14]. A **sanctioned path now exists**: the Claude Code status-line JSON exposes `rate_limits.five_hour/seven_day.used_percentage` and `resets_at` for Pro and Max subscribers after the first API response [S43]. **Mitigation:** move quota reading to status-line or hook-fed local data, and never poll with the user's OAuth token. |
| **Anthropic trademark** | "You can't use the Claude Code or Anthropic names or logos as part of your own product, feature, or company name… or in a way that suggests Anthropic built, endorses, or is partnered with your product." [S40] | Keep "AgentDeck" generic. Review store listings, icons and screenshots for Claude or Anthropic logos. |
| **Platform absorption** | Claude Code: agent view (May 2026), Remote Control (February 2026), status-line rate limits (April 2026), waiting-for-input hook (August 2026), voice dictation [S6][S15][S43][S44]. OpenAI: Codex app, Remote Control, Codex Micro hardware [S9][S16][S17]. | *(inference)* Position on what no single vendor will build: **cross-vendor** status on **hardware the user already owns**, **local-first** (no cloud relay), and **team-level evaluation**. Avoid competing on single-vendor software features. |
| **Elgato SDK and DRM dependency** | DRM, SDK v3 and Stream Deck ≥6.9 have been mandatory since 2026-01-19 (new plugins) and 2026-02-19 (updates); 4–10 working-day reviews; payouts limited to Stripe Connect countries [S22][S24]. | Keep the Stream Deck plugin a thin client of the local daemon so that review delays don't block releases on other surfaces. Verify the DRM-processed build before publishing. Ulanzi provides a second deck ecosystem [S27]. |
| **Apple 2.5.2 / 4.2.3** | The macOS build must be self-contained, and an app must work without another app. That reading of 4.2.3(i), "app must work without another companion", comes from a secondary source; Apple's own text was not re-fetched this pass. | Happy shows that an *iOS* client of a remote agent can be approved [S45]. For macOS, an in-process daemon (no subprocess) keeps the app self-contained. |
| **Churn in hook and API formats** | Claude Code issue #8985 (Notification hook broken in VS Code native UI, +67) [S15]. Codex "Event Hooks" was requested in August 2025 (+524) and has since shipped [S16]. Codex #48500 (hook events misattributed under a managed app-server, September 2026) [S16]. | Contract tests per agent version; observe through multiple sources (hooks plus local logs); fail visibly ("unknown"), never silently. |
| **Volatile quota semantics** | Codex #28879 (a 10–20× jump in per-token cost against the 5-hour window, June 2026); a temporary removal of the 5-hour limit in July 2026 (#34035); Claude Max drain incidents in March 2026 (#38335) [S15][S16]. | Show the vendor's own percentage figures; avoid computing quota locally from token counts. |
| **Payment-platform drift** | Lemon Squeezy is moving to Stripe Managed Payments (35+ countries) [S30]. Polar repriced in May 2026 [S29]. | Use a merchant of record with Korea explicitly listed (Polar), and keep licence validation portable. |
| **Hardware regulation** | KC rules for finished products are unresolved [S50]; Espressif has had KC certificates invalidated over forged test reports [S50]. | Partner or flash-only first. |

---

## 6. Open questions for the workshop

1. Ask Elgato whether a maker in a country outside Stripe Connect can be paid through cross-border payouts, as GitHub Sponsors and Polar do for Korea [S22][S28][S29].
2. Ulanzi store terms: contact through the SDK repository [S27].
3. Willingness to pay: test a $19 one-time supporter licence on Polar before considering subscriptions. VibeDeck's switch away from $5/month is the only comparable data point [S19].
4. Positioning against the Codex Micro: is "works with the Stream Deck, Ulanzi, ESP32 and e-ink you already own, across Claude, Codex, OpenCode and others" a strong enough message? *(inference)*
5. Korean tax: business registration (사업자등록) and how overseas merchant-of-record payouts are treated. **UNVERIFIED**; needs a tax advisor.
6. Reddit evidence: someone with browser access should pull the top r/ClaudeAI, r/codex and r/ChatGPTCoding threads on notifications and limits to fill the gap noted at the top.

---

## 7. Sources (all accessed 2026-10-16)

- **S1** Boris Cherny thread, 2026-01-02. https://threadreaderapp.com/thread/2007179832300581177.html (original: https://x.com/bcherny/status/2007179832300581177)
- **S2** Simon Willison, "Anthropic weekly limits", 2025-07-28. https://simonwillison.net/2025/Jul/28/anthropic/
- **S3** VentureBeat, "Anthropic throttles Claude rate limits". https://venturebeat.com/ai/anthropic-throttles-claude-rate-limits-devs-call-foul
- **S4** HN, "Claude Code weekly rate limits" (609 points / 705 comments). https://news.ycombinator.com/item?id=44713757
- **S5** Stack Overflow blog, "Agents on a leash", 2026-05-27. https://stackoverflow.blog/2026/05/27/agents-on-a-leash-agentic-ai-remains-mostly-monitored-at-work/
- **S6** Anthropic, "Agent view in Claude Code", 2026-05-11. https://claude.com/blog/agent-view-in-claude-code
- **S7** JetBrains Research, "AI Coding Agents: Adoption Trends" (returned 403; snippet only). https://blog.jetbrains.com/research/2026/08/ai-coding-agent-adoption-2026/
- **S8** Pragmatic Engineer, "AI tooling 2026". https://newsletter.pragmaticengineer.com/p/ai-tooling-2026
- **S9** Implicator, Codex desktop app launch. https://www.implicator.ai/openai-launches-codex-desktop-app-for-macos-with-multi-agent-workflows-and-doubled-rate-limits/
- **S10** gend.co, Codex app as a multi-agent command centre. https://www.gend.co/blog/openai-codex-app-multi‑agent-command-centre-for-devs ; ITPro: https://itpro.com/technology/artificial-intelligence/openais-codex-app-is-now-available-on-macos-and-its-free-for-some-chatgpt-users-for-a-limited-time
- **S11** Claude Code revenue and WAU (secondary): https://www.getpanto.ai/blog/anthropic-ai-statistics ; https://www.gigazine.net/gsc_news/en/20260213-anthropic-30-billion-series-g-funding
- **S12** npm downloads API, last month (2026-09-13 to 10-12): https://api.npmjs.org/downloads/point/last-month/ccusage (and `/@anthropic-ai/claude-code`, `/@openai/codex`, `/opencode-ai`)
- **S13** GitHub REST API repo metadata, e.g. https://api.github.com/repos/ccusage/ccusage ; also steipete/CodexBar, slopus/happy, BloopAI/vibe-kanban, omnara-ai/omnara, winfunc/opcode, smtg-ai/claude-squad, musistudio/claude-code-router, Maciek-roboblog/Claude-Code-Usage-Monitor, amantus-ai/vibetunnel, siteboon/claudecodeui, anomalyco/opencode, usetrmnl/trmnl-firmware, p0deje/Maccy, rxhanson/Rectangle
- **S14** HN Algolia API, e.g. https://hn.algolia.com/api/v1/search?query=omnara&tags=story . Items: Omnara https://news.ycombinator.com/item?id=44878650 and https://news.ycombinator.com/item?id=46991591 ; Claudia https://news.ycombinator.com/item?id=44933255 ; Vibe Kanban https://news.ycombinator.com/item?id=44533004 ; Sculptor https://news.ycombinator.com/item?id=45427697 ; Happy https://news.ycombinator.com/item?id=44904039 ; ccusage https://news.ycombinator.com/item?id=44610925 ; claude-squad https://news.ycombinator.com/item?id=43575127 ; merge queue https://news.ycombinator.com/item?id=49104747 ; Ccnotifs https://news.ycombinator.com/item?id=47209148 ; Peon-ping https://news.ycombinator.com/item?id=46967773 ; Codex Micro https://news.ycombinator.com/item?id=48923079 ; Remote Control https://news.ycombinator.com/item?id=47158091
- **S15** anthropics/claude-code issues: https://github.com/anthropics/claude-code/issues/16157 , /38335 , /9424 , /41930 , /35744 , /20636 , /13024 , /29438 , /57230 , /8985 , /10906 , /11799 , /29214
- **S16** openai/codex issues: https://github.com/openai/codex/issues/28879 , /34035 , /2448 , /21073 , /2109 , /32908 , /7083 , /48500
- **S17** Codex Micro: Axios (returned 403) https://axios.com/2026/07/15/openai-keyboard-codex-agents ; https://www.techzine.eu/news/devices/142942/openai-develops-physical-controls-for-ai-agents/ ; https://fourweekmba.com/ai-openai-codex-micro-work-louder-agent-control-surface/ ; https://codex.danielvaughan.com/2026/07/19/codex-micro-physical-control-surfaces-ai-coding-agents-hardware-moat-developer-ergonomics/
- **S18** Agent Vitals: https://notes.nicolasdeville.com/helpers/agent-vitals/ ; https://github.com/tapparello/agent-vitals/releases
- **S19** VibeDeck: https://www.producthunt.com/products/vibedeck-stream-deck-control-for-agents ; https://www.indiehackers.com/product/vibedeck
- **S20** Other Stream Deck plugins: https://github.com/JulienCr/streamdeck-claude ; https://github.com/Corrugator/StreamDeck-Claude ; https://tomevault.io/tome/paultyng/agentsd ; https://notes.nicolasdeville.com/helpers/claude-deck/
- **S21** VibeKeys: https://www.indiehackers.com/product/vibekeys
- **S22** Elgato, Stripe Connect (49 countries as of 2026-07-31): https://docs.elgato.com/monetization/stripe/
- **S23** Elgato, Revenue Share (70/30): https://docs.elgato.com/monetization/revenue-share/
- **S24** Elgato Maker Console (DRM dates): https://maker.elgato.com/ ; Review process: https://docs.elgato.com/maker-console/review-process
- **S25** Elgato, Marketplace availability by country: https://help.elgato.com/hc/en-us/articles/26576111221773-Marketplace-Availability-by-Country
- **S26** Corsair Q4 2025 earnings call (MarketBeat summary): https://www.marketbeat.com/instant-alerts/corsair-gaming-q4-earnings-call-highlights-2026-02-12/
- **S27** UlanziDeckPlugin SDK: https://github.com/UlanziTechnology/UlanziDeckPlugin-SDK ; CGMag D200 review: https://www.cgmagonline.com/review/hardware/ulanzi-stream-deck-d200/
- **S28** GitHub Sponsors docs: https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors
- **S29** Polar supported countries: https://polar.sh/docs/merchant-of-record/supported-countries ; fees: https://polar.sh/docs/merchant-of-record/fees ; plans: https://polar.sh/blog/introducing-polar-plans ; third-party: https://dodopayments.com/blogs/polar-sh-review
- **S30** Lemon Squeezy 2026 update: https://www.lemonsqueezy.com/blog/2026-update ; fees: https://www.paritydeals.com/lemon-squeezy-fee-calculator/
- **S31** Paddle payouts: https://www.paddle.com/help/manage/get-paid/when-and-how-do-i-get-paid ; currencies: https://developer.paddle.com/concepts/sell/supported-currencies/ ; Korean anecdote: https://www.threads.com/@eric.kim.kr/post/DKbKGBISASm ; Korean guides: https://agentic30.app/blog/paddle-guide , https://jocohunt.com/blog/stripe-lemon-squeezy-paddle-tax-payout-guide
- **S32** Gumroad, getting paid: https://gumroad.com/help/article/13-getting-paid ; Wise: https://wise.com/us/blog/gumroad-fees
- **S33** Ko-fi vs BMC availability: https://medium.com/write-a-catalyst/what-to-do-when-buy-me-a-coffee-is-not-available-in-your-country-f6c2b25d91ae
- **S34** Stripe business locations (Korea absent): https://docs.stripe.com/payments/kr-card/accept-a-payment ; https://nqsolution.kr/en/insights/stripe-in-korea
- **S35** Stripe Atlas (archived): https://web-archive.nli.org.il/National_Library/mp_/https://stripe.com/docs/atlas
- **S36** Apple Small Business Program: https://developer.apple.com/app-store/small-business-program/ ; receiving payments: https://developer.apple.com/help/app-store-connect/getting-paid/overview-of-receiving-payments ; KRW proceeds (2018): https://www.mactech.com/2018/09/06/korean-won-now-accepted-at-the-apple-app-store ; App Review Guidelines (2.5.2, 4.2.3): https://developer.apple.com/app-store/review/guidelines/
- **S37** Google Play locations: https://support.google.com/googleplay/android-developer/answer/9306917 ; service fees: https://support.google.com/paymentscenter/answer/112622 ; Korea fee news: https://www.digitaltoday.co.kr/en/view/91887/google-cuts-google-play-fees-in-south-korea-to-as-low-as-10-percent-expands-in-app-and-external-payments
- **S38** Raycast extension guidelines: https://manual.raycast.com/extensions-guidelines
- **S39** Homebrew Acceptable Casks: https://docs.brew.sh/Acceptable-Casks ; thresholds (third-party): https://skillselion.com/skills/connorads/dotfiles/homebrew-cask-authoring
- **S40** Claude Code, Legal and compliance: https://code.claude.com/docs/en/legal-and-compliance
- **S41** OAuth crackdown (secondary): https://gigazine.net/gsc_news/en/20260220-anthropic-third-party-block ; https://alternativeto.net/news/2026/2/anthropic-officially-bans-using-subscription-authentication-for-third-party-claude-use ; https://falcao.org/posts/anthropic-claude-access-crackdown-ecosystem-fallout/
- **S42** Usage endpoint "gray area": https://zenn.dev/yktsnet/articles/202604-claude-usage-swiftbar?locale=en ; https://claudeissues.com/issue/39874-feature-request-write-rate-limit-headers-to-claude-rate-limits-json
- **S43** Claude Code status-line docs (`rate_limits` fields, voice-dictation hint): https://code.claude.com/docs/en/statusline
- **S44** Claude Code Remote Control: https://noqta.tn/en/news/anthropic-claude-code-remote-control-mobile-2026 ; https://claudefa.st/blog/guide/development/remote-control-guide
- **S45** App Store listings (iTunes Search API, US): Happy https://apps.apple.com/us/app/happy-codex-claude-code-app/id6748571505 ; Usage for Claude https://apps.apple.com/us/app/usage-for-claude/id6755173244 ; CodexBar Usage Monitor https://apps.apple.com/us/app/codexbar-usage-monitor/id6787769891 ; Nowdex https://apps.apple.com/us/app/nowdex/id6791450777 ; Stream Deck Mobile https://apps.apple.com/us/app/elgato-stream-deck-mobile/id1440014184 ; Maccy https://apps.apple.com/us/app/maccy/id1527619437
- **S47** Claude Code analytics: https://code.claude.com/docs/en/analytics ; https://support.claude.com/en/articles/12157520 ; Admin API: https://platform.claude.com/docs/en/manage-claude/claude-code-analytics-api
- **S48** Home Assistant analytics: https://analytics.home-assistant.io/ ; 2M milestone: https://lwn.net/Articles/1020427 ; 2021 ESPHome share: https://home-assistant.io/blog/2021/11/12/100k-analytics
- **S49** TRMNL: https://www.notebookcheck.net/TRMNL-Efficient-smart-display-can-run-for-months-and-is-now-available.1041327.0.html ; https://boingboing.net/2026/07/07/trmnl-hackable-e-ink-dashboard-to-put-anywhere.html ; https://enterprise.trmnl.app/blog/state-of-byod ; https://liliputing.com/trmnl-is-a-139-wifi-enabled-e-ink-display-with-open-source-firmware-you-can-also-make-one-from-a-jailbroken-kindle/
- **S50** KC/FCC for ESP32 products: https://esp32.com/viewtopic.php?p=154451 ; https://www.espressif.com/sites/default/files/advisory_downloads/AR2021-T-001%20Notice%20on%20Invalid%20KC%20Certification.pdf ; https://esp32.com/viewtopic.php?p=72587
- **S51** Open Collective payouts: https://docs.opencollective.com/help/expenses-and-getting-paid/expenses ; https://docs.opencollective.com/help/fiscal-hosts/payouts/payouts-with-transferwise
- **S52** Secondary summary of an r/ClaudeAI notifier post: https://aiweekly.co/node/2482
- **S53** dev.to guide on approval notifications: https://dev.to/pederaa/how-to-know-when-a-claude-code-agent-needs-your-approval-without-watching-the-terminal-5ekf
