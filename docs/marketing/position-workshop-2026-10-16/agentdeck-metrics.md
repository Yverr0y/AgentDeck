# AgentDeck traction metrics — `puritysb/AgentDeck`

**Collected** 2026-10-15T15:43:39Z → 2026-10-15T16:07:22Z (UTC) = 2026-10-16 00:43–01:07 KST. Read-only: GitHub/npm/store APIs and public pages, plus `git` read commands on the local checkout (`HEAD: 0bd68d80 2026-10-16T00:40:02+09:00`; no fetch, no daemon, no hardware). Every capture below carries its verbatim command, UTC timestamp and exit code in a collapsible block. Derived numbers were computed by `scripts/analyze.py` + `scripts/assemble.py` from the original `raw/` captures.

**Archive limitation.** The full `raw/` inputs were not committed. The preserved Python scripts read those inputs; they do not recollect API responses. Re-running the analysis requires a separately retained copy of the original inputs. `scripts/lib.sh` is also a historical copy, with `RAW` fixed to the original session's scratch directory. References below to files kept in `raw/` describe that collection workspace, not this checkout; this archive alone cannot reproduce the complete collection and analysis.

## 1. One-screen summary

| Area | Metric | Value |
|:---|:---|:---|
| GitHub | Stars | **264** — first 2026-02-24; +7 (7 d) · +27 (30 d) · +121 (90 d) |
| GitHub | Forks · watchers | **53** forks (REST list returned 54; 27 have a push after creation) · **3** watchers (`subscribers_count`; the legacy `watchers_count` just repeats stars) |
| GitHub | Repo | created 2026-02-20 (236 d old) · MIT · TypeScript · 10 topics · 1 Discussion · 136 Releases |
| GitHub | Issues | **95** = 5 open + 90 closed · non-owner **31** from **18** distinct authors (29 closed) |
| GitHub | Pull requests | **454** = 1 open + 430 merged + 23 closed-unmerged · non-owner **46** from **12** distinct authors (32 merged) |
| GitHub | Distinct non-owner issue/PR authors | **25** (issues ∪ PRs; 5 did both). New external authors by month of first activity: Feb 2, Mar 1, Apr 1, Jun 1, Jul 6, Aug 6, Sep 6, Oct 2 |
| GitHub | Code contributors | contributors API lists **9** = owner + 7 human accounts + `claude`; of 2,481 commits on local HEAD, **41** (1.7%) are by non-owner identities |
| GitHub | Traffic, last 14 d (2026-10-01…2026-10-14) | views **743** (323 unique) · clones **7,779** (675 unique) |
| GitHub | Top referrers (14 d, views/uniques) | Google 137/104 · github.com 42/25 · reddit.com 27/19 · puritysb.github.io 19/16 · search.brave.com 5/5 · marketplace.elgato.com 5/4 |
| Releases | GitHub Releases | **136** — npm 42 · android 22 · apple 21 · esp32 21 · streamdeck 14 · ulanzi 14 · other 2; first 2026-06-26, latest 2026-10-13 |
| Releases | GitHub asset downloads (all-time) | **1,522** — esp32 1,336 · streamdeck 86 · android 55 · ulanzi 32 · other 13 · apple/npm releases carry no assets. esp32 = firmware/OTA-manifest fetches, not user count |
| npm | @agentdeck/setup | **v1.9.2**, 45 versions, first publish 2026-02-28 · downloads last-month **2,062**, last-week **318** (API windows end 2026-10-12) · 2026-01-01…2026-10-12 total 7,948 |
| npm | Other published packages | @agentdeck/bridge last-month 2,183 · @agentdeck/shared last-month 2,306 · @agentdeck/hooks last-month 2,205 · `@agentdeck/plugin` is private (npm 404) |
| Elgato Marketplace | Listing | **live**, Free, v1.8.1 (published 2026-10-14Z) · 11 published versions since 2026-07-27 · **no install/rating figure shown** · rank #1 in Marketplace search "AgentDeck" (4 unrelated "Agent Deck" listings follow) |
| Ulanzi Marketplace | Listing | **live** (contentView/1141), v1.8.1, devices D200,D200H,D200X · page shows **no counts**; listing API fields: download=0, star=0, collect=0, hot=0 (popular=230, meaning unverified) |
| Apple App Store | Listing | **live** "AgentDeck Dashboard" v1.8.0, Free, first release 2026-07-21 · ratings in total **4**, all five-star: Mac page 3 (US 2, KR 1) + iOS record 1 (DE 1), across 43 storefronts that serve the app · #1 (Mac search) / #1 (iOS search) for "AgentDeck" (4 unrelated apps share the name) |
| Google Play | Listing | **live** `dev.agentdeck`, "10+ Downloads" bucket, Updated Oct 13, 2026, content rating Everyone · no rating shown · #1 for "AgentDeck" in Play search |
| Mentions | Third-party code/docs referencing `puritysb/AgentDeck` | **95 files in 38 other repos** (GitHub code search, none are forks; 33 of the files are i18n copies in one repo) — awesome lists, landscape docs, hardware-vendor firmware port, community integrations, users' dotfiles |
| Mentions | Media / blogs found | shiritomo (hashout.jp) 2026-06-19 — names AgentDeck + repo URL, built around an X video the article says drew 3,900+ likes · codex.danielvaughan.com 2026-07-19 (blog, presents AgentDeck as the open-source alternative to OpenAI Codex Micro) |
| Mentions | Searched, nothing found / unreadable | Hacker News (Algolia): 0 hits · Elgato editorial pages (2 checked): no mention · Reddit: **could not read** (search API 403, browser tool blocks reddit.com) though GitHub shows reddit.com referrals · queries "puritysb AgentDeck" and "AgentDeck TRMNL": nothing relevant |

### Month-by-month view (UTC month; Oct = 1–15/16)

| Month | Stars (cumulative) | Forks created | Issues ext/all | PRs ext/all | New ext. authors | GH Releases | npm `setup` downloads | Commits on HEAD |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| 2026-02 | 15 (→15) | 4 | 1/1 | 1/1 | 2 | 0 | 25 | 96 |
| 2026-03 | 23 (→38) | 2 | 1/1 | 0/0 | 1 | 0 | 57 | 217 |
| 2026-04 | 16 (→54) | 5 | 0/0 | 1/3 | 1 | 0 | 170 | 321 |
| 2026-05 | 12 (→66) | 1 | 0/0 | 0/0 | 0 | 0 | 51 | 89 |
| 2026-06 | 49 (→115) | 9 | 3/3 | 7/28 | 1 | 4 | 118 | 199 |
| 2026-07 | 52 (→167) | 9 | 5/14 | 15/40 | 6 | 20 | 1,134 | 529 |
| 2026-08 | 46 (→213) | 11 | 10/24 | 15/163 | 6 | 45 | 3,519 | 352 |
| 2026-09 | 41 (→254) | 11 | 7/34 | 6/117 | 6 | 41 | 2,264 | 443 |
| 2026-10 | 10 (→264) | 2 | 4/18 | 1/102 | 2 | 26 | 610 | 235 |

Oct npm = 1–12 Oct only (the API had not published 13–16 Oct yet; the zeros in the daily series after 12 Oct are *not yet reported*, not real). Stars/forks/issues/PRs/releases/commits run to the capture time.

### Reading the numbers (caveats that change what they mean)

- **Owner-driven volume is not traction.** 408 of 454 PRs and 64 of 95 issues are by `puritysb` (agent-assisted work included); 2,440 of 2,481 commits are owner identities (`SeungBeom Choi` + `samuel.choi`). The external signal is the 25 distinct outside issue/PR authors and the 41 outside commits.
- **Clones ≠ users.** 7,779 clones from 675 unique cloners in 14 days (≈11.5 per cloner) is consistent with automated clones (CI, mirrors, agent sandboxes, the owner's own machines — GitHub does not separate them); one day alone (2026-10-06) accounts for 3,187 of the 7,779 clones; views (323 uniques) are the better human proxy.
- **npm counts are tarball downloads**, including mirrors/CI/bots; the four packages move together (installing `setup` pulls the rest), and single days spike (max day 676 on 2026-08-07). Not unique users.
- **GitHub asset downloads for esp32 are firmware images and `manifest.json` fetches** (OTA/web-flasher traffic incl. the owner's own boards), so the human-installable figures are streamdeck 86 + android 55 + ulanzi 32 = 173 over all releases.
- **Store installs are small or hidden:** Play shows only the "10+" bucket (≥10 and <50), Apple shows 4 ratings in total (Mac 3, iOS 1), Ulanzi's page shows no counts and its API says 0 downloads (semantics unverified), Elgato shows nothing. None of these is an install count.
- **The star curve has a visible external burst:** 6 stars in the 20 days 2026-05-25…06-13, then 1 / 2 on 06-16 / 06-17, **11 on 06-18 and 6 on 06-19** — the dates of the X video (06-18) and the shiritomo article (06-19) in §7.1 — and 12 on 06-24 (no cause found). June total 49 vs May 12. Timing coincidence only; causation not established. Since then: Jul 52, Aug 46, Sep 41, Oct 1–15 10.
- **The name is crowded.** `gh search repos agentdeck` returns 100+ repos; this one leads by stars (264 vs 12 for the runner-up `darknecrocities/Agentdeck`), but Apple, Play, Elgato and HN all contain *unrelated* "AgentDeck/Agent Deck" products, so every mention count here uses the slug `puritysb/AgentDeck`, the product page URL or the app id, never the bare name.

## 2. GitHub — repository, traffic, stars, forks

### 2.1 Repository facts

| Field | Value |
|:---|:---|
| created / last push | 2026-02-20T15:48:57Z / 2026-10-15T15:41:39Z |
| stars · forks · watchers | 264 · 53 · 3 (`subscribers_count`) |
| issues (GraphQL) | 95 total: 5 open, 90 closed |
| pull requests (GraphQL) | 454 total: 1 open, 430 merged, 23 closed-unmerged |
| `open_issues_count` (REST) | 6 (= 5 issues + 1 PR; REST mixes them) |
| license · language | MIT · TypeScript |
| topics | ai-agents, android, claude-code, developer-tools, esp32, hardware, iot, monorepo, stream-deck, swiftui |
| homepage · discussions | https://puritysb.github.io/AgentDeck/ · enabled, 1 discussion |

<details><summary>raw · gh api repos/puritysb/AgentDeck · <code>2026-10-15T15:43:39Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh api repos/puritysb/AgentDeck
```

_Projection of `raw/repo.out` (6,183 bytes): 18 of ~95 fields kept (the rest are URL templates and owner object). Full file kept in `raw/`._

Output:

```json
{
 "full_name": "puritysb/AgentDeck",
 "created_at": "2026-02-20T15:48:57Z",
 "pushed_at": "2026-10-15T15:41:39Z",
 "stargazers_count": 264,
 "watchers_count": 264,
 "subscribers_count": 3,
 "forks_count": 53,
 "open_issues_count": 6,
 "license": {
  "spdx_id": "MIT",
  "name": "MIT License"
 },
 "topics": [
  "ai-agents",
  "android",
  "claude-code",
  "developer-tools",
  "esp32",
  "hardware",
  "iot",
  "monorepo",
  "stream-deck",
  "swiftui"
 ],
 "visibility": "public",
 "default_branch": "master",
 "has_discussions": true,
 "archived": false,
 "size": 1152361,
 "language": "TypeScript",
 "homepage": "https://puritysb.github.io/AgentDeck/",
 "description": "Local dashboards and physical controls for AI coding agents — native 3D aquariums, Stream Deck, Apple/Android apps, e-ink, ESP32 and LED displays."
}
```

</details>

<details><summary>raw · GraphQL exact totals (supplement to the REST numbers) · <code>2026-10-15T15:43:39Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh api graphql -f query='{ repository(owner:"puritysb", name:"AgentDeck") { createdAt pushedAt stargazerCount forkCount watchers { totalCount } licenseInfo { spdxId name } primaryLanguage { name } repositoryTopics(first: 50) { nodes { topic { name } } } issuesAll: issues { totalCount } issuesOpen: issues(states: OPEN) { totalCount } issuesClosed: issues(states: CLOSED) { totalCount } prsAll: pullRequests { totalCount } prsOpen: pullRequests(states: OPEN) { totalCount } prsMerged: pullRequests(states: MERGED) { totalCount } prsClosed: pullRequests(states: CLOSED) { totalCount } discussions { totalCount } releases { totalCount } } }'
```

Output:

```json
{"data":{"repository":{"createdAt":"2026-02-20T15:48:57Z","pushedAt":"2026-10-15T15:41:39Z","stargazerCount":264,"forkCount":53,"watchers":{"totalCount":3},"licenseInfo":{"spdxId":"MIT","name":"MIT License"},"primaryLanguage":{"name":"TypeScript"},"repositoryTopics":{"nodes":[{"topic":{"name":"ai-agents"}},{"topic":{"name":"android"}},{"topic":{"name":"claude-code"}},{"topic":{"name":"developer-tools"}},{"topic":{"name":"esp32"}},{"topic":{"name":"hardware"}},{"topic":{"name":"iot"}},{"topic":{"name":"monorepo"}},{"topic":{"name":"stream-deck"}},{"topic":{"name":"swiftui"}}]},"issuesAll":{"totalCount":95},"issuesOpen":{"totalCount":5},"issuesClosed":{"totalCount":90},"prsAll":{"totalCount":454},"prsOpen":{"totalCount":1},"prsMerged":{"totalCount":430},"prsClosed":{"totalCount":23},"discussions":{"totalCount":1},"releases":{"totalCount":136}}}}
```

</details>


### 2.2 Traffic (owner-only endpoints; GitHub retains 14 days only)

Views 743 / 323 unique; clones 7,779 / 675 unique. Daily series (date: views/uniques · clones/uniques):

| Day | Views | Unique viewers | Clones | Unique cloners |
|:---|:---|:---|:---|:---|
| 2026-10-01 | 50 | 28 | 162 | 38 |
| 2026-10-02 | 67 | 37 | 312 | 63 |
| 2026-10-03 | 46 | 26 | 137 | 53 |
| 2026-10-04 | 38 | 27 | 223 | 51 |
| 2026-10-05 | 57 | 35 | 387 | 76 |
| 2026-10-06 | 49 | 29 | 3,187 | 88 |
| 2026-10-07 | 79 | 29 | 488 | 50 |
| 2026-10-08 | 82 | 36 | 283 | 83 |
| 2026-10-09 | 42 | 24 | 471 | 112 |
| 2026-10-10 | 32 | 16 | 223 | 34 |
| 2026-10-11 | 53 | 25 | 538 | 119 |
| 2026-10-12 | 48 | 27 | 545 | 88 |
| 2026-10-13 | 57 | 31 | 668 | 98 |
| 2026-10-14 | 43 | 25 | 155 | 47 |

Referrers (top 10, 14 d):

| Referrer | Views | Uniques |
|:---|:---|:---|
| Google | 137 | 104 |
| github.com | 42 | 25 |
| reddit.com | 27 | 19 |
| puritysb.github.io | 19 | 16 |
| search.brave.com | 5 | 5 |
| marketplace.elgato.com | 5 | 4 |
| my.feishu.cn | 4 | 2 |
| npmjs.com | 2 | 2 |
| DuckDuckGo | 2 | 1 |
| anker-in.feishu.cn | 2 | 1 |

Popular paths (top 10, 14 d):

| Path | Views | Uniques |
|:---|:---|:---|
| `/puritysb/AgentDeck` | 383 | 271 |
| `/puritysb/AgentDeck/issues` | 46 | 22 |
| `/puritysb/AgentDeck/blob/master/docs/streamdeck-layout.md` | 25 | 19 |
| `/puritysb/AgentDeck/tree/master` | 17 | 11 |
| `/puritysb/AgentDeck/blob/master/docs/media/desk-overview.jpg` | 14 | 13 |
| `/puritysb/AgentDeck/releases` | 14 | 7 |
| `/puritysb/AgentDeck/blob/master/docs/media/tui-dashboard.png` | 13 | 12 |
| `/puritysb/AgentDeck/blob/master/docs/media/streamdeck-plus.jpg` | 10 | 9 |
| `/puritysb/AgentDeck/blob/master/docs/windows.md` | 10 | 4 |
| `/puritysb/AgentDeck/blob/master/docs/android.md` | 9 | 8 |

<details><summary>raw · traffic/views · <code>2026-10-15T15:43:41Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh api repos/puritysb/AgentDeck/traffic/views
```

Output:

```json
{"count":743,"uniques":323,"views":[{"timestamp":"2026-10-01T00:00:00Z","count":50,"uniques":28},{"timestamp":"2026-10-02T00:00:00Z","count":67,"uniques":37},{"timestamp":"2026-10-03T00:00:00Z","count":46,"uniques":26},{"timestamp":"2026-10-04T00:00:00Z","count":38,"uniques":27},{"timestamp":"2026-10-05T00:00:00Z","count":57,"uniques":35},{"timestamp":"2026-10-06T00:00:00Z","count":49,"uniques":29},{"timestamp":"2026-10-07T00:00:00Z","count":79,"uniques":29},{"timestamp":"2026-10-08T00:00:00Z","count":82,"uniques":36},{"timestamp":"2026-10-09T00:00:00Z","count":42,"uniques":24},{"timestamp":"2026-10-10T00:00:00Z","count":32,"uniques":16},{"timestamp":"2026-10-11T00:00:00Z","count":53,"uniques":25},{"timestamp":"2026-10-12T00:00:00Z","count":48,"uniques":27},{"timestamp":"2026-10-13T00:00:00Z","count":57,"uniques":31},{"timestamp":"2026-10-14T00:00:00Z","count":43,"uniques":25}]}
```

</details>

<details><summary>raw · traffic/clones · <code>2026-10-15T15:43:41Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh api repos/puritysb/AgentDeck/traffic/clones
```

Output:

```json
{"count":7779,"uniques":675,"clones":[{"timestamp":"2026-10-01T00:00:00Z","count":162,"uniques":38},{"timestamp":"2026-10-02T00:00:00Z","count":312,"uniques":63},{"timestamp":"2026-10-03T00:00:00Z","count":137,"uniques":53},{"timestamp":"2026-10-04T00:00:00Z","count":223,"uniques":51},{"timestamp":"2026-10-05T00:00:00Z","count":387,"uniques":76},{"timestamp":"2026-10-06T00:00:00Z","count":3187,"uniques":88},{"timestamp":"2026-10-07T00:00:00Z","count":488,"uniques":50},{"timestamp":"2026-10-08T00:00:00Z","count":283,"uniques":83},{"timestamp":"2026-10-09T00:00:00Z","count":471,"uniques":112},{"timestamp":"2026-10-10T00:00:00Z","count":223,"uniques":34},{"timestamp":"2026-10-11T00:00:00Z","count":538,"uniques":119},{"timestamp":"2026-10-12T00:00:00Z","count":545,"uniques":88},{"timestamp":"2026-10-13T00:00:00Z","count":668,"uniques":98},{"timestamp":"2026-10-14T00:00:00Z","count":155,"uniques":47}]}
```

</details>

<details><summary>raw · traffic/popular/referrers · <code>2026-10-15T15:43:41Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh api repos/puritysb/AgentDeck/traffic/popular/referrers
```

Output:

```json
[{"referrer":"Google","count":137,"uniques":104},{"referrer":"github.com","count":42,"uniques":25},{"referrer":"reddit.com","count":27,"uniques":19},{"referrer":"puritysb.github.io","count":19,"uniques":16},{"referrer":"search.brave.com","count":5,"uniques":5},{"referrer":"marketplace.elgato.com","count":5,"uniques":4},{"referrer":"my.feishu.cn","count":4,"uniques":2},{"referrer":"npmjs.com","count":2,"uniques":2},{"referrer":"DuckDuckGo","count":2,"uniques":1},{"referrer":"anker-in.feishu.cn","count":2,"uniques":1}]
```

</details>

<details><summary>raw · traffic/popular/paths · <code>2026-10-15T15:43:42Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh api repos/puritysb/AgentDeck/traffic/popular/paths
```

Output:

```json
[{"path":"/puritysb/AgentDeck","title":"Overview","count":383,"uniques":271},{"path":"/puritysb/AgentDeck/issues","title":"/issues","count":46,"uniques":22},{"path":"/puritysb/AgentDeck/blob/master/docs/streamdeck-layout.md","title":"/blob/master/docs/streamdeck-layout.md","count":25,"uniques":19},{"path":"/puritysb/AgentDeck/tree/master","title":"/tree/master","count":17,"uniques":11},{"path":"/puritysb/AgentDeck/blob/master/docs/media/desk-overview.jpg","title":"/blob/master/docs/media/desk-overview.jpg","count":14,"uniques":13},{"path":"/puritysb/AgentDeck/releases","title":"/releases","count":14,"uniques":7},{"path":"/puritysb/AgentDeck/blob/master/docs/media/tui-dashboard.png","title":"/blob/master/docs/media/tui-dashboard.png","count":13,"uniques":12},{"path":"/puritysb/AgentDeck/blob/master/docs/media/streamdeck-plus.jpg","title":"/blob/master/docs/media/streamdeck-plus.jpg","count":10,"uniques":9},{"path":"/puritysb/AgentDeck/blob/master/docs/windows.md","title":"/blob/master/docs/windows.md","count":10,"uniques":4},{"path":"/puritysb/AgentDeck/blob/master/docs/android.md","title":"/blob/master/docs/android.md","count":9,"uniques":8}]
```

</details>


### 2.3 Stargazers by month

Command differs from the brief only by `--slurp` (merges the 3 pages of 100 into one valid JSON array). 264 stargazer records, 264 distinct users.

| Month | New stars | Cumulative |
|:---|:---|:---|
| 2026-02 | 15 | 15 |
| 2026-03 | 23 | 38 |
| 2026-04 | 16 | 54 |
| 2026-05 | 12 | 66 |
| 2026-06 | 49 | 115 |
| 2026-07 | 52 | 167 |
| 2026-08 | 46 | 213 |
| 2026-09 | 41 | 254 |
| 2026-10 | 10 | 264 |

Busiest days: 2026-06-24 (12), 2026-06-18 (11), 2026-02-25 (10), 2026-07-16 (9), 2026-07-18 (8), 2026-06-19 (6). First star 2026-02-24T20:33:17Z, latest 2026-10-15T09:37:04Z.

<details><summary>raw · stargazers (all 264 `starred_at` dates, sorted) · <code>2026-10-15T15:43:42Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh api "repos/puritysb/AgentDeck/stargazers?per_page=100" -H "Accept: application/vnd.github.star+json" --paginate --slurp
```

_Projection of `raw/stargazers.out` (262,721 bytes): `user` objects dropped, dates kept. Full file kept in `raw/`._

Output:

```
2026-02-24 2026-02-25 2026-02-25 2026-02-25 2026-02-25 2026-02-25 2026-02-25 2026-02-25 2026-02-25 2026-02-25
2026-02-25 2026-02-26 2026-02-26 2026-02-27 2026-02-27 2026-03-03 2026-03-03 2026-03-05 2026-03-06 2026-03-06
2026-03-07 2026-03-08 2026-03-09 2026-03-12 2026-03-13 2026-03-16 2026-03-17 2026-03-17 2026-03-17 2026-03-17
2026-03-18 2026-03-21 2026-03-21 2026-03-21 2026-03-24 2026-03-27 2026-03-28 2026-03-31 2026-04-03 2026-04-09
2026-04-09 2026-04-09 2026-04-11 2026-04-12 2026-04-14 2026-04-14 2026-04-14 2026-04-15 2026-04-16 2026-04-22
2026-04-25 2026-04-27 2026-04-28 2026-04-30 2026-05-06 2026-05-06 2026-05-07 2026-05-08 2026-05-10 2026-05-13
2026-05-13 2026-05-14 2026-05-24 2026-05-25 2026-05-27 2026-05-29 2026-06-04 2026-06-05 2026-06-11 2026-06-16
2026-06-17 2026-06-17 2026-06-18 2026-06-18 2026-06-18 2026-06-18 2026-06-18 2026-06-18 2026-06-18 2026-06-18
2026-06-18 2026-06-18 2026-06-18 2026-06-19 2026-06-19 2026-06-19 2026-06-19 2026-06-19 2026-06-19 2026-06-20
2026-06-20 2026-06-21 2026-06-22 2026-06-22 2026-06-23 2026-06-23 2026-06-23 2026-06-23 2026-06-23 2026-06-23
2026-06-24 2026-06-24 2026-06-24 2026-06-24 2026-06-24 2026-06-24 2026-06-24 2026-06-24 2026-06-24 2026-06-24
2026-06-24 2026-06-24 2026-06-26 2026-06-28 2026-06-29 2026-07-01 2026-07-03 2026-07-03 2026-07-04 2026-07-04
2026-07-06 2026-07-06 2026-07-07 2026-07-08 2026-07-08 2026-07-08 2026-07-11 2026-07-13 2026-07-15 2026-07-15
2026-07-15 2026-07-16 2026-07-16 2026-07-16 2026-07-16 2026-07-16 2026-07-16 2026-07-16 2026-07-16 2026-07-16
2026-07-17 2026-07-17 2026-07-17 2026-07-17 2026-07-18 2026-07-18 2026-07-18 2026-07-18 2026-07-18 2026-07-18
2026-07-18 2026-07-18 2026-07-19 2026-07-19 2026-07-20 2026-07-20 2026-07-20 2026-07-21 2026-07-21 2026-07-22
2026-07-23 2026-07-23 2026-07-23 2026-07-24 2026-07-27 2026-07-28 2026-07-31 2026-08-01 2026-08-02 2026-08-02
2026-08-03 2026-08-04 2026-08-04 2026-08-04 2026-08-04 2026-08-04 2026-08-05 2026-08-06 2026-08-06 2026-08-07
2026-08-07 2026-08-08 2026-08-08 2026-08-09 2026-08-09 2026-08-09 2026-08-09 2026-08-09 2026-08-10 2026-08-11
2026-08-11 2026-08-11 2026-08-11 2026-08-13 2026-08-14 2026-08-14 2026-08-14 2026-08-15 2026-08-15 2026-08-17
2026-08-17 2026-08-20 2026-08-20 2026-08-20 2026-08-21 2026-08-22 2026-08-24 2026-08-24 2026-08-26 2026-08-26
2026-08-30 2026-08-31 2026-08-31 2026-09-03 2026-09-03 2026-09-03 2026-09-03 2026-09-04 2026-09-04 2026-09-05
2026-09-05 2026-09-05 2026-09-07 2026-09-07 2026-09-07 2026-09-07 2026-09-08 2026-09-08 2026-09-08 2026-09-10
2026-09-10 2026-09-10 2026-09-12 2026-09-12 2026-09-13 2026-09-14 2026-09-15 2026-09-16 2026-09-17 2026-09-18
2026-09-20 2026-09-21 2026-09-22 2026-09-22 2026-09-23 2026-09-24 2026-09-25 2026-09-26 2026-09-27 2026-09-28
2026-09-28 2026-09-29 2026-09-29 2026-09-30 2026-10-03 2026-10-04 2026-10-08 2026-10-08 2026-10-09 2026-10-09
2026-10-12 2026-10-12 2026-10-13 2026-10-15
```

</details>


### 2.4 Forks

54 forks listed by the REST forks endpoint (repo `forks_count` = 53); 27 show a push after creation (heuristic: `pushed_at` later than `created_at`); only 2 forks carry a star of their own. By creation month: 2026-02=4, 2026-03=2, 2026-04=5, 2026-05=1, 2026-06=9, 2026-07=9, 2026-08=11, 2026-09=11, 2026-10=2.

<details><summary>raw · forks (54 rows) · <code>2026-10-15T15:43:43Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh api "repos/puritysb/AgentDeck/forks?per_page=100&sort=newest" --paginate --slurp
```

_Projection of `raw/forks.out` (288,500 bytes): owner, created, last push, stars. Full file kept in `raw/`._

Output:

```
owner | created | last push | stars
cpiprint | 2026-02-25 | 2026-02-24 | 1
r-dent | 2026-02-25 | 2026-02-25 | 0
billroy | 2026-02-25 | 2026-02-24 | 0
staylorwr | 2026-02-27 | 2026-02-27 | 0
sglim | 2026-03-09 | 2026-03-05 | 0
ronangill | 2026-03-30 | 2026-03-26 | 0
jesse-peters | 2026-04-01 | 2026-03-26 | 0
dzarlax | 2026-04-08 | 2026-04-08 | 0
ctmakc | 2026-04-08 | 2026-04-08 | 0
pakuda | 2026-04-10 | 2026-04-10 | 0
mdaraban | 2026-04-16 | 2026-04-15 | 0
0xJk | 2026-05-29 | 2026-07-10 | 0
1056674754 | 2026-06-14 | 2026-06-14 | 0
MilanVojnovic95 | 2026-06-18 | 2026-06-18 | 0
doug-w | 2026-06-19 | 2026-08-04 | 0
autosolutionsai-didac | 2026-06-24 | 2026-06-24 | 0
ashosborne | 2026-06-24 | 2026-06-24 | 0
rt-heroku | 2026-06-24 | 2026-06-24 | 0
orbisai0security | 2026-06-26 | 2026-06-26 | 0
bryanwills | 2026-06-28 | 2026-09-29 | 0
amadrzyk | 2026-06-29 | 2026-06-30 | 0
leonj1 | 2026-07-08 | 2026-07-08 | 1
eprouveze | 2026-07-08 | 2026-08-24 | 0
aovereem | 2026-07-10 | 2026-07-10 | 0
shotaisaam | 2026-07-11 | 2026-07-11 | 0
mumer92 | 2026-07-18 | 2026-07-18 | 0
otsune | 2026-07-18 | 2026-07-18 | 0
rajanbharti | 2026-07-20 | 2026-07-20 | 0
jhkoning | 2026-07-25 | 2026-07-25 | 0
Roja430 | 2026-07-26 | 2026-08-08 | 0
torifo | 2026-08-02 | 2026-08-02 | 0
su1feng | 2026-08-03 | 2026-08-02 | 0
cskwork | 2026-08-04 | 2026-10-09 | 0
gmarchand | 2026-08-06 | 2026-08-06 | 0
jcarberator | 2026-08-07 | 2026-08-09 | 0
IAMAl | 2026-08-11 | 2026-09-24 | 0
uto-usui | 2026-08-12 | 2026-08-12 | 0
AliAkrami1375 | 2026-08-14 | 2026-08-13 | 0
slash28cu | 2026-08-14 | 2026-08-14 | 0
tju-wang | 2026-08-23 | 2026-09-14 | 0
kasuteru | 2026-08-27 | 2026-08-27 | 0
bhardwajRahul | 2026-09-05 | 2026-09-29 | 0
joshuadweck124 | 2026-09-08 | 2026-09-09 | 0
heliotropeRD | 2026-09-08 | 2026-09-07 | 0
jurri | 2026-09-09 | 2026-09-14 | 0
Yverr0y | 2026-09-10 | 2026-10-04 | 0
epicsagas | 2026-09-11 | 2026-09-11 | 0
dudziakl | 2026-09-14 | 2026-10-13 | 0
infobull | 2026-09-15 | 2026-09-15 | 0
pjodoin | 2026-09-15 | 2026-09-22 | 0
Reverbr8 | 2026-09-23 | 2026-09-23 | 0
kohei-tsukano | 2026-09-23 | 2026-09-23 | 0
andremarquezz | 2026-10-07 | 2026-10-08 | 0
huhao121 | 2026-10-13 | 2026-10-13 | 0
```

</details>


## 3. Contributors, issues and PRs

### 3.1 Code contributors

| GitHub login (contributors API) | Contributions |
|:---|:---|
| `puritysb` (owner) | 2,447 |
| `doug-w` | 25 |
| `dudziakl` | 6 |
| `jcarberator` | 4 |
| `pjodoin` | 2 |
| `claude` | 1 |
| `r-dent` | 1 |
| `jurri` | 1 |
| `uto-usui` | 1 |

`git shortlog -sn --since=2026-01-01 HEAD` on the local checkout (HEAD: 0bd68d80 2026-10-16T00:40:02+09:00; the checkout may trail the remote by a few commits — API owner count is 2,447 vs 2,440 here). `HEAD` was added to the command because `git shortlog` without a revision waits on stdin when not run in a terminal. The repo's first commit is 2026-02-21 so `--since=2026-01-01` is the whole history.

```
2058	SeungBeom Choi
   382	samuel.choi
    18	doug-w
     7	Doug Warren
     6	Lukasz D
     4	jcarberator
     2	pjodoin
     1	Claude
     1	Roman Schlagowsky
     1	jurri
     1	uto
```

Identity mapping: `SeungBeom Choi` + `samuel.choi` = owner; `doug-w` + `Doug Warren` = GitHub `doug-w` (25); `Lukasz D` = `dudziakl` (6); `Roman Schlagowsky` = `r-dent`; `uto` = `uto-usui`; `Claude` = the `claude` account (1 commit).

<details><summary>raw · contributors API · <code>2026-10-15T15:43:45Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh api "repos/puritysb/AgentDeck/contributors?per_page=100" --paginate --slurp
```

_Projection of `raw/contributors.out` (8,459 bytes): login, contributions, type. Full file kept in `raw/`._

Output:

```
puritysb	2447	User
doug-w	25	User
dudziakl	6	User
jcarberator	4	User
pjodoin	2	User
claude	1	User
r-dent	1	User
jurri	1	User
uto-usui	1	User
```

</details>

<details><summary>raw · git shortlog since 2026-01-01 · <code>2026-10-15T15:43:46Z</code> · exit 0</summary>

Command (verbatim):

```bash
git -C /Users/puritysb/github/AgentDeck shortlog -sn --since=2026-01-01 HEAD
```

Output:

```
  2058	SeungBeom Choi
   382	samuel.choi
    18	doug-w
     7	Doug Warren
     6	Lukasz D
     4	jcarberator
     2	pjodoin
     1	Claude
     1	Roman Schlagowsky
     1	jurri
     1	uto
```

</details>

<details><summary>raw · git history meta (commit totals, per-month commits) · <code>2026-10-15T15:43:46Z</code> · exit 0</summary>

Command (verbatim):

```bash
cd /Users/puritysb/github/AgentDeck && echo "HEAD: $(git rev-parse --short HEAD) $(git log -1 --format=%cI)" && echo "total commits on HEAD: $(git rev-list --count HEAD)" && echo "first commit: $(git log --reverse --format='%cI %h' | head -1)" && echo "commits since 2026-01-01: $(git rev-list --count --since=2026-01-01 HEAD)" && echo "-- commits per month (committer date, since 2026-01-01) --" && git log --since=2026-01-01 --format='%cd' --date=format:%Y-%m | sort | uniq -c
```

Output:

```
HEAD: 0bd68d80 2026-10-16T00:40:02+09:00
total commits on HEAD: 2481
first commit: 2026-02-21T00:15:46+09:00 92618897
commits since 2026-01-01: 2481
-- commits per month (committer date, since 2026-01-01) --
  96 2026-02
 217 2026-03
 321 2026-04
  89 2026-05
 199 2026-06
 529 2026-07
 352 2026-08
 443 2026-09
 235 2026-10
```

</details>


### 3.2 Issue and PR authors (owner = `puritysb`)

Both lists were fetched with `--limit 1000` (the brief's `--limit 300` would have truncated: there are 454 PRs). `authorAssociation` is not a valid `gh pr list --json` field in gh 2.96, so the first PR attempt failed (kept as `raw/prs_failed_authorAssociation.*`) and the field was dropped. No bot authors appear in either list.

| Author | Issues | PRs | PRs merged | First activity | Last activity |
|:---|:---|:---|:---|:---|:---|
| `puritysb` (owner) | 64 | 408 | 398 | 2026-04-28 | 2026-10-15 |
| `doug-w` | 5 | 24 | 19 | 2026-06-19 | 2026-08-04 |
| `jcarberator` | 3 | 7 | 4 | 2026-08-06 | 2026-08-09 |
| `dudziakl` | 3 | 4 | 4 | 2026-09-14 | 2026-10-13 |
| `neW1-` | 3 | 0 | 0 | 2026-07-13 | 2026-08-04 |
| `shin-sforzando` | 3 | 0 | 0 | 2026-10-14 | 2026-10-14 |
| `eprouveze` | 1 | 1 | 0 | 2026-03-19 | 2026-07-08 |
| `houtacheng` | 2 | 0 | 0 | 2026-08-17 | 2026-08-20 |
| `jurri` | 1 | 1 | 1 | 2026-09-09 | 2026-09-09 |
| `pjodoin` | 0 | 2 | 2 | 2026-09-15 | 2026-09-22 |
| `Roja430` | 0 | 2 | 0 | 2026-07-26 | 2026-08-08 |
| `bruna-peteco` | 0 | 1 | 0 | 2026-07-29 | 2026-07-29 |
| `ckirk` | 1 | 0 | 0 | 2026-09-16 | 2026-09-16 |
| `dakipro` | 1 | 0 | 0 | 2026-07-01 | 2026-07-01 |
| `Daou` | 1 | 0 | 0 | 2026-02-25 | 2026-02-25 |
| `gmarchand` | 1 | 0 | 0 | 2026-08-04 | 2026-08-04 |
| `jamesUBDau` | 1 | 0 | 0 | 2026-07-16 | 2026-07-16 |
| `Madfater` | 1 | 0 | 0 | 2026-10-03 | 2026-10-03 |
| `MargoHospitality` | 1 | 0 | 0 | 2026-08-01 | 2026-08-01 |
| `pakuda` | 0 | 1 | 0 | 2026-04-10 | 2026-04-10 |
| `r-dent` | 0 | 1 | 1 | 2026-02-25 | 2026-02-25 |
| `Reverbr8` | 1 | 0 | 0 | 2026-09-23 | 2026-09-23 |
| `shotaisaam` | 0 | 1 | 0 | 2026-07-11 | 2026-07-11 |
| `stefanvn` | 1 | 0 | 0 | 2026-08-10 | 2026-08-10 |
| `uto-usui` | 0 | 1 | 1 | 2026-08-12 | 2026-08-12 |
| `webdany2k` | 1 | 0 | 0 | 2026-09-03 | 2026-09-03 |

Totals: issues 95 = owner 64 + non-owner 31; PRs 454 = owner 408 + non-owner 46. Distinct non-owner authors: issues 18, PRs 12, union 25, both 5 (`doug-w`, `dudziakl`, `eprouveze`, `jcarberator`, `jurri`).

| Month | Issues owner | Issues external | PRs owner | PRs external | New external authors |
|:---|:---|:---|:---|:---|:---|
| 2026-02 | 0 | 1 | 0 | 1 | 2 |
| 2026-03 | 0 | 1 | 0 | 0 | 1 |
| 2026-04 | 0 | 0 | 2 | 1 | 1 |
| 2026-05 | 0 | 0 | 0 | 0 | 0 |
| 2026-06 | 0 | 3 | 21 | 7 | 1 |
| 2026-07 | 9 | 5 | 25 | 15 | 6 |
| 2026-08 | 14 | 10 | 148 | 15 | 6 |
| 2026-09 | 27 | 7 | 111 | 6 | 6 |
| 2026-10 | 14 | 4 | 101 | 1 | 2 |

<details><summary>raw · issue list — external issues only (31 of 95) · <code>2026-10-15T15:43:46Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh issue list --repo puritysb/AgentDeck --state all --limit 1000 --json number,author,createdAt,closedAt,state,title,labels
```

_Projection of `raw/issues.out` (39,678 bytes): rows for non-owner authors; all 95 are in the raw file. Full file kept in `raw/`._

Output:

```
#1    CLOSED  2026-02-25 Daou              pnpm build fails on fresh clone — missing @types/node in shared package
#3    CLOSED  2026-03-19 eprouveze         posix_spawnp failed on Node.js 24 — prebuilt node-pty binary incompatible
#9    CLOSED  2026-06-19 doug-w            Detail view renders the MODEL tile twice (Claude PROCESSING + OpenClaw idle)
#12   CLOSED  2026-06-19 doug-w            Daemon crashes on Windows: uncaught EHOSTUNREACH to mDNS multicast (224.0.0.251:5353)
#24   CLOSED  2026-06-26 doug-w            Attach remote sessions to a central daemon and control them from one Stream Deck (mDNS + explicit ho
#39   CLOSED  2026-07-01 dakipro           Any chance for a regular (non +) stream deck plugin?
#63   CLOSED  2026-07-13 neW1-             StreamDeck mini support
#65   CLOSED  2026-07-16 jamesUBDau        TestFlight invite request — iOS dashboard app
#85   CLOSED  2026-07-29 neW1-             iDotMatrix scripts missing from npm
#88   CLOSED  2026-07-30 doug-w            AgentDeck v1.0.2 on Elgato Marketplace marked as Mac Only
#94   CLOSED  2026-08-01 MargoHospitality  Stream Deck + XL (36 keys / 6 dials) support?
#99   CLOSED  2026-08-02 doug-w            Surface Claude per-model scoped usage limits (weekly caps) on the E2 encoder + a keypad button
#103  CLOSED  2026-08-04 gmarchand         feat(kiro): support Kiro CLI and Kiro IDE as first-class agents
#115  CLOSED  2026-08-04 neW1-             BLE discovery only matches device names starting with "IDM-" — iPixel displays not picked up
#145  CLOSED  2026-08-06 jcarberator       Security feedback
#149  CLOSED  2026-08-07 jcarberator       security feedback #2
#171  CLOSED  2026-08-09 jcarberator       Can't get mobile app to work
#174  CLOSED  2026-08-10 stefanvn          Ulanzi D200X support
#221  CLOSED  2026-08-17 houtacheng        [Feature]: "Menu bar only" mode (hide the Dock icon)
#246  CLOSED  2026-08-20 houtacheng        Community integration: Bitfocus Companion module for AgentDeck
#281  CLOSED  2026-09-03 webdany2k         Windows: install/runtime Node drift leaves better-sqlite3 unusable and APME disabled
#303  CLOSED  2026-09-09 jurri             [Bug]: Connected: AgentDeck [DISCONNECTED]
#331  CLOSED  2026-09-14 dudziakl          Windows: every Claude Code hook fails — Git Bash strips $variables from the inline PowerShell -Comma
#332  CLOSED  2026-09-14 dudziakl          Windows: observed-session roster flashes then empties, and the hub latches at disconnected
#339  CLOSED  2026-09-15 dudziakl          Windows: daemon autostart leaves a permanent console window (Task Scheduler action is the daemon its
#343  CLOSED  2026-09-16 ckirk             [Feature]: Access to full Claude Code hook data
#367  CLOSED  2026-09-23 Reverbr8          observed Claude session can remain idle during live hook-driven work
#445  CLOSED  2026-10-03 Madfater          Ulanzi plugin stays OFFLINE when the daemon runs in WSL2 (daemon.json discovery only)
#541  OPEN    2026-10-14 shin-sforzando    [Feature]: Deliver voice prompts to Claude Code sessions running in cmux
#544  OPEN    2026-10-14 shin-sforzando    [Feature]: Telling apart sessions that share a project name on the deck
#545  CLOSED  2026-10-14 shin-sforzando    [Bug]: A session ending or an app restart leaves the working session stuck at "disconnected"
```

</details>

<details><summary>raw · PR list — external PRs only (46 of 454) · <code>2026-10-15T15:44:45Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh pr list --repo puritysb/AgentDeck --state all --limit 1000 --json number,author,createdAt,closedAt,mergedAt,state,title,isDraft
```

_Projection of `raw/prs.out` (143,641 bytes): rows for non-owner authors; all 454 are in the raw file. Full file kept in `raw/`._

Output:

```
#2    MERGED  2026-02-25 r-dent            fix: node-pty spawn-helper permissions on macOS with pnpm
#4    CLOSED  2026-04-10 pakuda            fix: session slots empty on first launch (4 root causes)
#8    CLOSED  2026-06-19 doug-w            Windows 11 port (bridge, hooks, plugin, setup)
#10   MERGED  2026-06-19 doug-w            fix(plugin): render MODEL detail tile exactly once
#11   MERGED  2026-06-19 doug-w            docs(readme): document -c passthrough for resume / remote-control
#13   MERGED  2026-06-19 doug-w            fix(bridge): tolerate mDNS EHOSTUNREACH multicast failure on Windows
#14   MERGED  2026-06-19 doug-w            fix(plugin): hide READY/idle tile while a session is PROCESSING
#22   MERGED  2026-06-26 doug-w            fix(mdns): pin multicast egress to LAN interface on Windows
#23   MERGED  2026-06-26 doug-w            feat(bridge): Windows daemon autostart via per-user Scheduled Task
#43   MERGED  2026-07-03 doug-w            fix(codex): Windows support for Codex hooks (PowerShell lifecycle hooks + working notify fallback)
#50   CLOSED  2026-07-08 eprouveze         docs: trim CLAUDE.md to <120 lines
#51   CLOSED  2026-07-09 doug-w            fix(claude): UTF-8 stdin + POST body in Windows hook one-liner
#52   CLOSED  2026-07-09 doug-w            feat(sessions): --weight sort override to pin deck/tab order
#53   MERGED  2026-07-10 doug-w            feat(bridge): opt-in remote daemon attach for cross-machine sessions
#54   MERGED  2026-07-10 doug-w            feat(bridge): Linux port — systemd daemon autostart + POSIX fixes
#55   CLOSED  2026-07-10 doug-w            fix(bridge): correctly render AskUserQuestion / permission / diff prompts on the deck
#56   MERGED  2026-07-11 doug-w            fix(windows): make Claude Code hooks preserve UTF-8 payloads
#61   CLOSED  2026-07-11 shotaisaam        feat(codex): Stream Deck監視をCLIとDesktopに対応
#62   MERGED  2026-07-12 doug-w            feat(sessions): --weight sort override to pin deck/tab order (resubmit of #52)
#80   CLOSED  2026-07-26 Roja430           fix(windows): protocol generator, console flashing, and the hooks response channel
#81   MERGED  2026-07-28 doug-w            fix(apme): disable user diff drivers in judge/artifact git diffs
#82   MERGED  2026-07-28 doug-w            fix(apme): judge failure backoff + skip darwin-only judge backends off-macOS
#83   CLOSED  2026-07-28 doug-w            fix(docs): re-render hardware spec cards (unbreaks the design-system gate on master)
#86   CLOSED  2026-07-29 bruna-peteco      Surface per-model weekly usage limits (Fable) on the Pixoo HUD
#93   MERGED  2026-08-01 doug-w            feat(cli): env-var default args for session commands
#95   MERGED  2026-08-01 doug-w            fix(tests): green the Windows suite — LF working tree + platform-aware tests
#96   MERGED  2026-08-01 doug-w            feat(plugin): cross-platform system layer — Windows joins macOS
#97   MERGED  2026-08-02 doug-w            feat(plugin): Stream Deck + XL and XL first-class support (DeviceType 13/2)
#98   MERGED  2026-08-02 doug-w            fix(bridge): resolve Claude usage OAuth credentials on Windows/Linux
#102  MERGED  2026-08-04 doug-w            feat(usage): surface Claude per-model scoped usage limits (#99)
#150  MERGED  2026-08-07 jcarberator       fix(security): stop leaking pairing credentials over UDP and logs
#161  CLOSED  2026-08-08 jcarberator       fix(plugin): reject expired Claude usage windows
#162  MERGED  2026-08-08 jcarberator       fix(observer): expire silent Claude processing states
#163  CLOSED  2026-08-08 jcarberator       feat(codex): surface persistent goals as read-only tiles
#164  MERGED  2026-08-08 jcarberator       feat(plugin): add device-aware Stream Deck profiles
#165  CLOSED  2026-08-08 Roja430           Windows codex micro
#168  CLOSED  2026-08-09 jcarberator       feat: add read-only Hermes session observation
#170  MERGED  2026-08-09 jcarberator       feat(plugin): label Claude and Codex usage encoders
#176  MERGED  2026-08-12 uto-usui          fix(bridge): preserve multi-byte UTF-8 across stdin chunk boundaries
#304  MERGED  2026-09-09 jurri             docs(windows): run the checkout CLI without a global link
#329  MERGED  2026-09-14 dudziakl          fix(hooks): invoke the Windows hook as a script file, not an inline -Command
#330  MERGED  2026-09-14 dudziakl          fix(bridge): stop blanking the observed roster and latching the hub at disconnected
#336  MERGED  2026-09-14 dudziakl          fix(windows): run the autostart daemon with no console window
#342  MERGED  2026-09-15 pjodoin           fix(streamdeck): keep Claude usage views per action
#363  MERGED  2026-09-22 pjodoin           fix(usage): retry Claude recovery and honor CLI override
#534  MERGED  2026-10-13 dudziakl          fix(cli): resolve the agentdeck binary with `where` on Windows
```

</details>

<details><summary>raw · FAILED first attempt (unsupported field) · <code>2026-10-15T15:43:47Z</code> · exit 1</summary>

Command (verbatim):

```bash
gh pr list --repo puritysb/AgentDeck --state all --limit 1000 --json number,author,createdAt,closedAt,mergedAt,state,title,isDraft,authorAssociation
```

stderr / status line:

```
Unknown JSON field: "authorAssociation"
Available fields:
  additions
  assignees
  author
  autoMergeRequest
  baseRefName
  baseRefOid
  body
  changedFiles
  closed
  closedAt
  closingIssuesReferences
  comments
  commits
  createdAt
  deletions
  files
  fullDatabaseId
  headRefName
  headRefOid
  headRepository
  headRepositoryOwner
  id
  isCrossRepository
  isDraft
  labels
  latestReviews
  maintainerCanModify
  mergeCommit
  mergeStateStatus
  mergeable
  mergedAt
  mergedBy
  milestone
  number
  potentialMergeCommit
  projectCards
  projectItems
  reactionGroups
  reviewDecision
  reviewRequests
  reviews
  state
  statusCheckRollup
  title
  updatedAt
  url
```

Output:

```

```

</details>


## 4. Releases and downloads

`gh release list` returned 136 releases (limit raised to 1000); the asset call matched every one of them (no release without an asset record, none missing). Channels by tag prefix:

| Channel | Releases | First published | Last published | Pre-releases | Assets | Asset downloads |
|:---|:---|:---|:---|:---|:---|:---|
| `apple-v*` | 21 | 2026-07-10 (apple-v0.1.0) | 2026-10-13 (apple-v1.9.1) | 0 | 0 | 0 |
| `android-v*` | 22 | 2026-06-26 (android-v0.1.0) | 2026-10-13 (android-v1.10.1) | 0 | 22 | 55 |
| `esp32-v*` | 21 | 2026-06-26 (esp32-v0.1.1) | 2026-10-13 (esp32-v1.9.2) | 0 | 1032 | 1,336 |
| `npm-v*` | 42 | 2026-07-20 (npm-v1.0.0) | 2026-10-13 (npm-v1.9.2) | 0 | 0 | 0 |
| `streamdeck-v*` | 14 | 2026-06-26 (streamdeck-v0.1.0) | 2026-10-13 (streamdeck-v1.8.1) | 0 | 14 | 86 |
| `ulanzi-v*` | 14 | 2026-06-26 (ulanzi-v0.1.0) | 2026-10-13 (ulanzi-v1.8.1) | 0 | 14 | 32 |
| other | 2 | 2026-07-30 (verification-streamdeck-v1.0.3-windows.1) | 2026-10-01 (assets-hermes-character-candidate) | 2 | 13 | 13 |
| **total** | 136 | 2026-06-26 | 2026-10-13 | 2 | 1095 | 1,522 |

`other` = `verification-streamdeck-v1.0.3-windows.1` and `assets-hermes-character-candidate` (both pre-releases). Downloads on the latest release of each channel: npm `npm-v1.9.2` = 0, esp32 `esp32-v1.9.2` = 78, apple `apple-v1.9.1` = 0, android `android-v1.10.1` = 1, streamdeck `streamdeck-v1.8.1` = 3, ulanzi `ulanzi-v1.8.1` = 2, other `assets-hermes-character-candidate` = 9.

Releases published per month by channel:

| Channel | 2026-06 | 2026-07 | 2026-08 | 2026-09 | 2026-10 |
|:---|:---|:---|:---|:---|:---|
| apple | 0 | 4 | 6 | 7 | 4 |
| android | 1 | 3 | 6 | 7 | 5 |
| esp32 | 1 | 1 | 7 | 7 | 5 |
| npm | 0 | 6 | 19 | 12 | 5 |
| streamdeck | 1 | 3 | 3 | 4 | 3 |
| ulanzi | 1 | 2 | 4 | 4 | 3 |
| other | 0 | 1 | 0 | 0 | 1 |

Where the downloads sit (channel / asset type: downloads over assets): android `.apk` 55 (22 assets); esp32 `.bin` 989 (999 assets); esp32 `.txt` 28 (19 assets); esp32 `manifest.json` 319 (14 assets); other `.streamDeckPlugin` 4 (1 assets); other `misc (png/glb/usdz/blend/SHA256SUMS)` 9 (12 assets); streamdeck `.streamDeckPlugin` 86 (14 assets); ulanzi `.zip` 32 (14 assets). Top individual assets: esp32-v1.4.0/manifest.json = 42; esp32-v1.8.0/manifest.json = 41; esp32-v1.6.0/manifest.json = 38; esp32-v1.3.0/manifest.json = 37; esp32-v1.2.2/manifest.json = 32; esp32-v1.0.8/manifest.json = 28. 720 of 1095 assets have ≥1 download.

**Elgato Marketplace releases** (not GitHub; read from the product-page payload): 11 published versions, first publish 2026-07-27, latest 2026-10-14; the first submission (v1, created 2026-07-19) was rejected. v1.8.1 2026-10-14, v1.8 2026-10-08, v1.6 2026-10-02, v1.4 2026-10-08, v1.3 2026-09-14, v1.2 2026-09-02, v1.0.6 2026-08-18, v1.0.5 2026-08-10, v1.0.4 2026-08-05, v1.0.3 2026-07-31, v1.0.2 2026-07-27.

<details><summary>raw · gh release list (136 rows) · <code>2026-10-15T15:43:48Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh release list --repo puritysb/AgentDeck --limit 1000 --json tagName,name,publishedAt,createdAt,isPrerelease,isDraft,isLatest
```

_Projection of `raw/releases_list.out` (25,418 bytes): tag, published date, prerelease flag. Full file kept in `raw/`._

Output:

```
npm-v1.9.2                                   2026-10-13 
esp32-v1.9.2                                 2026-10-13 
apple-v1.9.1                                 2026-10-13 
npm-v1.9.1                                   2026-10-13 
android-v1.10.1                              2026-10-13 
esp32-v1.9.1                                 2026-10-13 
streamdeck-v1.8.1                            2026-10-13 
ulanzi-v1.8.1                                2026-10-13 
android-v1.10.0                              2026-10-12 
npm-v1.9.0                                   2026-10-12 
esp32-v1.9.0                                 2026-10-12 
android-v1.9.0                               2026-10-12 
apple-v1.9.0                                 2026-10-12 
esp32-v1.8.0                                 2026-10-06 
npm-v1.8.0                                   2026-10-06 
apple-v1.8.0                                 2026-10-06 
streamdeck-v1.8.0                            2026-10-06 
ulanzi-v1.8.0                                2026-10-06 
android-v1.8.0                               2026-10-06 
npm-v1.7.0                                   2026-10-04 
esp32-v1.7.0                                 2026-10-04 
ulanzi-v1.7.0                                2026-10-04 
android-v1.7.0                               2026-10-04 
streamdeck-v1.7.0                            2026-10-04 
apple-v1.7.0                                 2026-10-02 
assets-hermes-character-candidate            2026-10-01 PRE
npm-v1.6.0                                   2026-09-27 
esp32-v1.6.0                                 2026-09-27 
apple-v1.6.0                                 2026-09-27 
ulanzi-v1.6.0                                2026-09-27 
streamdeck-v1.6.0                            2026-09-27 
android-v1.6.1                               2026-09-27 
android-v1.6.0                               2026-09-27 
npm-v1.4.2                                   2026-09-23 
npm-v1.4.1                                   2026-09-23 
android-v1.5.0                               2026-09-23 
npm-v1.4.0                                   2026-09-21 
esp32-v1.4.0                                 2026-09-21 
ulanzi-v1.4.0                                2026-09-21 
android-v1.4.0                               2026-09-21 
streamdeck-v1.4.0                            2026-09-21 
apple-v1.4.0                                 2026-09-20 
npm-v1.3.5                                   2026-09-15 
npm-v1.3.4                                   2026-09-14 
npm-v1.3.3                                   2026-09-13 
apple-v1.3.2                                 2026-09-13 
esp32-v1.3.0                                 2026-09-13 
apple-v1.3.1                                 2026-09-13 
android-v1.3.1                               2026-09-13 
npm-v1.3.2                                   2026-09-12 
npm-v1.3.1                                   2026-09-12 
npm-v1.3.0                                   2026-09-12 
ulanzi-v1.3.0                                2026-09-12 
esp32-v1.2.3                                 2026-09-12 
apple-v1.3.0                                 2026-09-12 
android-v1.3.0                               2026-09-12 
streamdeck-v1.3.0                            2026-09-12 
esp32-v1.2.2                                 2026-09-07 
apple-v1.2.1                                 2026-09-07 
npm-v1.2.1                                   2026-09-07 
esp32-v1.2.1                                 2026-09-04 
esp32-v1.2.0                                 2026-09-01 
apple-v1.2.0                                 2026-09-01 
android-v1.2.0                               2026-09-01 
npm-v1.2.0                                   2026-09-01 
streamdeck-v1.2.0                            2026-09-01 
ulanzi-v1.2.0                                2026-09-01 
npm-v1.1.0                                   2026-08-26 
esp32-v1.0.8                                 2026-08-26 
ulanzi-v1.0.5                                2026-08-25 
ulanzi-v1.0.4                                2026-08-24 
npm-v1.0.24                                  2026-08-23 
npm-v1.0.23                                  2026-08-22 
esp32-v1.0.7                                 2026-08-22 
apple-v1.0.8                                 2026-08-22 
npm-v1.0.22                                  2026-08-22 
esp32-v1.0.6                                 2026-08-19 
esp32-v1.0.5                                 2026-08-17 
apple-v1.0.7                                 2026-08-17 
android-v1.0.10                              2026-08-17 
streamdeck-v1.0.6                            2026-08-17 
npm-v1.0.21                                  2026-08-17 
android-v1.0.9                               2026-08-14 
npm-v1.0.20                                  2026-08-13 
npm-v1.0.19                                  2026-08-12 
apple-v1.0.6                                 2026-08-12 
npm-v1.0.18                                  2026-08-12 
esp32-v1.0.4                                 2026-08-09 
npm-v1.0.17                                  2026-08-09 
streamdeck-v1.0.5                            2026-08-09 
apple-v1.0.5                                 2026-08-09 
android-v1.0.8                               2026-08-09 
ulanzi-v1.0.3                                2026-08-09 
npm-v1.0.15                                  2026-08-08 
npm-v1.0.13                                  2026-08-07 
npm-v1.0.12                                  2026-08-07 
esp32-v1.0.3                                 2026-08-07 
android-v1.0.6                               2026-08-07 
npm-v1.0.11                                  2026-08-07 
apple-v1.0.4                                 2026-08-07 
npm-v1.0.10                                  2026-08-07 
android-v1.0.5                               2026-08-07 
npm-v1.0.9                                   2026-08-07 
npm-v1.0.8                                   2026-08-06 
npm-v1.0.7                                   2026-08-05 
ulanzi-v1.0.2                                2026-08-05 
apple-v1.0.3                                 2026-08-05 
android-v1.0.4                               2026-08-05 
streamdeck-v1.0.4                            2026-08-05 
npm-v1.0.6                                   2026-08-05 
npm-v1.0.5                                   2026-08-05 
apple-v1.0.2                                 2026-07-22 
esp32-v1.0.2                                 2026-08-01 
streamdeck-v1.0.3                            2026-07-30 
verification-streamdeck-v1.0.3-windows.1     2026-07-30 PRE
android-v1.0.3                               2026-07-29 
npm-v1.0.4                                   2026-07-29 
npm-v1.0.3                                   2026-07-28 
streamdeck-v1.0.2                            2026-07-22 
android-v1.0.2                               2026-07-22 
npm-v1.0.2                                   2026-07-22 
esp32-v1.0.1                                 2026-07-22 
ulanzi-v1.0.1                                2026-07-21 
android-v1.0.1                               2026-07-21 
streamdeck-v1.0.1                            2026-07-21 
npm-v1.0.1                                   2026-07-21 
apple-v1.0.1                                 2026-07-21 
apple-v1.0.0                                 2026-07-20 
ulanzi-v1.0.0                                2026-07-20 
npm-v1.0.0                                   2026-07-20 
npm-v0.2.3                                   2026-07-22 
apple-v0.1.0                                 2026-07-10 
ulanzi-v0.1.0                                2026-06-26 
streamdeck-v0.1.0                            2026-06-26 
esp32-v0.1.1                                 2026-06-26 
android-v0.1.0                               2026-06-26 
```

</details>

<details><summary>raw · release asset download counts (per-release sums) · <code>2026-10-15T15:43:49Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh api repos/puritysb/AgentDeck/releases --paginate --jq '.[] | {tag: .tag_name, assets: [.assets[] | {name, download_count}]}'
```

_Projection of `raw/releases_assets.out` (72,469 bytes): per-release asset count and summed `download_count`; per-asset counts are in the raw file. Full file kept in `raw/`._

Output:

```
ulanzi-v1.8.1                                assets=1   downloads=2
streamdeck-v1.8.1                            assets=1   downloads=3
npm-v1.9.2                                   assets=0   downloads=0
npm-v1.9.1                                   assets=0   downloads=0
esp32-v1.9.2                                 assets=62  downloads=78
esp32-v1.9.1                                 assets=62  downloads=71
apple-v1.9.1                                 assets=0   downloads=0
android-v1.10.1                              assets=1   downloads=1
npm-v1.9.0                                   assets=0   downloads=0
esp32-v1.9.0                                 assets=62  downloads=79
apple-v1.9.0                                 assets=0   downloads=0
android-v1.9.0                               assets=1   downloads=1
android-v1.10.0                              assets=1   downloads=1
ulanzi-v1.8.0                                assets=1   downloads=6
streamdeck-v1.8.0                            assets=1   downloads=5
npm-v1.8.0                                   assets=0   downloads=0
esp32-v1.8.0                                 assets=62  downloads=114
apple-v1.8.0                                 assets=0   downloads=0
android-v1.8.0                               assets=1   downloads=2
ulanzi-v1.7.0                                assets=1   downloads=0
streamdeck-v1.7.0                            assets=1   downloads=1
npm-v1.7.0                                   assets=0   downloads=0
esp32-v1.7.0                                 assets=62  downloads=34
android-v1.7.0                               assets=1   downloads=5
apple-v1.7.0                                 assets=0   downloads=0
assets-hermes-character-candidate            assets=12  downloads=9
ulanzi-v1.6.0                                assets=1   downloads=2
streamdeck-v1.6.0                            assets=1   downloads=4
npm-v1.6.0                                   assets=0   downloads=0
esp32-v1.6.0                                 assets=61  downloads=55
apple-v1.6.0                                 assets=0   downloads=0
android-v1.6.1                               assets=1   downloads=9
android-v1.6.0                               assets=1   downloads=4
npm-v1.4.2                                   assets=0   downloads=0
npm-v1.4.1                                   assets=0   downloads=0
android-v1.5.0                               assets=1   downloads=1
ulanzi-v1.4.0                                assets=1   downloads=1
streamdeck-v1.4.0                            assets=1   downloads=4
npm-v1.4.0                                   assets=0   downloads=0
esp32-v1.4.0                                 assets=62  downloads=111
android-v1.4.0                               assets=1   downloads=1
apple-v1.4.0                                 assets=0   downloads=0
npm-v1.3.5                                   assets=0   downloads=0
npm-v1.3.4                                   assets=0   downloads=0
npm-v1.3.3                                   assets=0   downloads=0
esp32-v1.3.0                                 assets=62  downloads=168
apple-v1.3.2                                 assets=0   downloads=0
apple-v1.3.1                                 assets=0   downloads=0
android-v1.3.1                               assets=1   downloads=1
ulanzi-v1.3.0                                assets=1   downloads=2
streamdeck-v1.3.0                            assets=1   downloads=6
npm-v1.3.2                                   assets=0   downloads=0
npm-v1.3.1                                   assets=0   downloads=0
npm-v1.3.0                                   assets=0   downloads=0
esp32-v1.2.3                                 assets=62  downloads=148
apple-v1.3.0                                 assets=0   downloads=0
android-v1.3.0                               assets=1   downloads=1
npm-v1.2.1                                   assets=0   downloads=0
esp32-v1.2.2                                 assets=62  downloads=163
apple-v1.2.1                                 assets=0   downloads=0
esp32-v1.2.1                                 assets=62  downloads=143
ulanzi-v1.2.0                                assets=1   downloads=2
streamdeck-v1.2.0                            assets=1   downloads=11
npm-v1.2.0                                   assets=0   downloads=0
esp32-v1.2.0                                 assets=62  downloads=11
apple-v1.2.0                                 assets=0   downloads=0
android-v1.2.0                               assets=1   downloads=2
npm-v1.1.0                                   assets=0   downloads=0
esp32-v1.0.8                                 assets=52  downloads=37
ulanzi-v1.0.5                                assets=1   downloads=1
ulanzi-v1.0.4                                assets=1   downloads=1
npm-v1.0.24                                  assets=0   downloads=0
npm-v1.0.23                                  assets=0   downloads=0
npm-v1.0.22                                  assets=0   downloads=0
esp32-v1.0.7                                 assets=52  downloads=35
apple-v1.0.8                                 assets=0   downloads=0
esp32-v1.0.6                                 assets=31  downloads=3
streamdeck-v1.0.6                            assets=1   downloads=3
npm-v1.0.21                                  assets=0   downloads=0
esp32-v1.0.5                                 assets=31  downloads=6
apple-v1.0.7                                 assets=0   downloads=0
android-v1.0.10                              assets=1   downloads=3
android-v1.0.9                               assets=1   downloads=3
npm-v1.0.20                                  assets=0   downloads=0
npm-v1.0.19                                  assets=0   downloads=0
npm-v1.0.18                                  assets=0   downloads=0
apple-v1.0.6                                 assets=0   downloads=0
ulanzi-v1.0.3                                assets=1   downloads=3
streamdeck-v1.0.5                            assets=1   downloads=5
npm-v1.0.17                                  assets=0   downloads=0
esp32-v1.0.4                                 assets=31  downloads=3
apple-v1.0.5                                 assets=0   downloads=0
android-v1.0.8                               assets=1   downloads=1
npm-v1.0.15                                  assets=0   downloads=0
npm-v1.0.9                                   assets=0   downloads=0
npm-v1.0.13                                  assets=0   downloads=0
npm-v1.0.12                                  assets=0   downloads=0
npm-v1.0.11                                  assets=0   downloads=0
npm-v1.0.10                                  assets=0   downloads=0
esp32-v1.0.3                                 assets=31  downloads=0
apple-v1.0.4                                 assets=0   downloads=0
android-v1.0.6                               assets=1   downloads=0
android-v1.0.5                               assets=1   downloads=0
npm-v1.0.8                                   assets=0   downloads=0
ulanzi-v1.0.2                                assets=1   downloads=1
streamdeck-v1.0.4                            assets=1   downloads=3
npm-v1.0.7                                   assets=0   downloads=0
npm-v1.0.6                                   assets=0   downloads=0
npm-v1.0.5                                   assets=0   downloads=0
apple-v1.0.3                                 assets=0   downloads=0
android-v1.0.4                               assets=1   downloads=0
apple-v1.0.2                                 assets=0   downloads=0
esp32-v1.0.2                                 assets=31  downloads=68
streamdeck-v1.0.3                            assets=1   downloads=8
verification-streamdeck-v1.0.3-windows.1     assets=1   downloads=4
npm-v1.0.4                                   assets=0   downloads=0
android-v1.0.3                               assets=1   downloads=10
npm-v1.0.3                                   assets=0   downloads=0
streamdeck-v1.0.2                            assets=1   downloads=16
npm-v1.0.2                                   assets=0   downloads=0
esp32-v1.0.1                                 assets=21  downloads=0
android-v1.0.2                               assets=1   downloads=0
ulanzi-v1.0.1                                assets=1   downloads=3
streamdeck-v1.0.1                            assets=1   downloads=0
npm-v1.0.1                                   assets=0   downloads=0
apple-v1.0.1                                 assets=0   downloads=0
android-v1.0.1                               assets=1   downloads=1
ulanzi-v1.0.0                                assets=1   downloads=0
npm-v1.0.0                                   assets=0   downloads=0
apple-v1.0.0                                 assets=0   downloads=0
npm-v0.2.3                                   assets=0   downloads=0
apple-v0.1.0                                 assets=0   downloads=0
ulanzi-v0.1.0                                assets=1   downloads=8
streamdeck-v0.1.0                            assets=1   downloads=17
esp32-v0.1.1                                 assets=9   downloads=9
android-v0.1.0                               assets=1   downloads=8
```

</details>


## 5. npm

All four published packages share the same release train; `@agentdeck/plugin` and `plugin-ulanzi` are `private: true` and `npm view @agentdeck/plugin` returns E404 as expected. Download figures come from `api.npmjs.org` (counts lag ~3 days; windows are stated per row).

| Package | Latest | Versions | First publish | Last modified | Downloads last-month (2026-09-13…2026-10-12) | last-week (2026-10-06…2026-10-12) | 2026-01-01…2026-10-12 |
|:---|:---|:---|:---|:---|:---|:---|:---|
| `@agentdeck/setup` | 1.9.2 | 45 | 2026-02-28 | 2026-10-13 | 2,062 | 318 | 7,948 |
| `@agentdeck/bridge` | 1.9.2 | 47 | 2026-02-28 | 2026-10-13 | 2,183 | 317 | 8,731 |
| `@agentdeck/shared` | 1.9.2 | 45 | 2026-02-28 | 2026-10-13 | 2,306 | 301 | 8,398 |
| `@agentdeck/hooks` | 1.9.2 | 44 | 2026-04-27 | 2026-10-13 | 2,205 | 306 | 8,038 |

Downloads per calendar month (range endpoint bucketed by month; Oct = 1–12 only):

| Month | `setup` | `bridge` | `shared` | `hooks` | versions published (setup) |
|:---|:---|:---|:---|:---|:---|
| 2026-01 | 0 | 0 | 0 | 0 | 0 |
| 2026-02 | 25 | 26 | 30 | 0 | 1 |
| 2026-03 | 57 | 57 | 51 | 0 | 0 |
| 2026-04 | 170 | 403 | 186 | 70 | 1 |
| 2026-05 | 51 | 87 | 56 | 29 | 0 |
| 2026-06 | 118 | 141 | 103 | 26 | 0 |
| 2026-07 | 1,134 | 1,233 | 1,133 | 1,097 | 6 |
| 2026-08 | 3,519 | 3,740 | 3,699 | 3,754 | 20 |
| 2026-09 | 2,264 | 2,384 | 2,429 | 2,417 | 12 |
| 2026-10 | 610 | 660 | 711 | 645 | 5 |

`setup` concentration: top 5 days = 2,182 of 7,948 (27%): 2026-08-07 (676), 2026-09-12 (490), 2026-08-05 (387), 2026-08-08 (341), 2026-08-22 (288). Days with ≥1 download in the last-month window (2026-09-13…2026-10-12): 27 of 30.

<details><summary>raw · npm view @agentdeck/setup version time --json · <code>2026-10-15T15:43:51Z</code> · exit 0</summary>

Command (verbatim):

```bash
npm view @agentdeck/setup version time --json
```

Output:

```json
{
  "version": "1.9.2",
  "time": {
    "created": "2026-02-28T03:19:42.573Z",
    "modified": "2026-10-13T18:17:57.362Z",
    "0.1.0": "2026-02-28T03:19:42.843Z",
    "0.2.0": "2026-04-27T16:16:21.043Z",
    "0.2.3": "2026-07-11T11:28:51.897Z",
    "1.0.0": "2026-07-19T17:17:12.881Z",
    "1.0.1": "2026-07-20T00:19:50.501Z",
    "1.0.2": "2026-07-22T13:00:11.308Z",
    "1.0.3": "2026-07-28T23:09:06.170Z",
    "1.0.4": "2026-07-29T22:38:37.641Z",
    "1.0.5": "2026-08-05T00:23:21.449Z",
    "1.0.6": "2026-08-05T00:36:45.927Z",
    "1.0.7": "2026-08-05T23:50:56.177Z",
    "1.0.8": "2026-08-06T15:23:44.938Z",
    "1.0.9": "2026-08-07T00:26:27.467Z",
    "1.0.10": "2026-08-07T09:56:11.388Z",
    "1.0.11": "2026-08-07T10:41:09.068Z",
    "1.0.12": "2026-08-07T16:51:57.082Z",
    "1.0.13": "2026-08-07T22:39:49.365Z",
    "1.0.14": "2026-08-08T01:23:59.260Z",
    "1.0.15": "2026-08-08T01:30:09.053Z",
    "1.0.17": "2026-08-09T22:05:11.232Z",
    "1.0.18": "2026-08-12T13:59:10.560Z",
    "1.0.19": "2026-08-12T15:09:57.918Z",
    "1.0.20": "2026-08-13T20:57:09.063Z",
    "1.0.21": "2026-08-17T22:36:32.582Z",
    "1.0.22": "2026-08-22T03:52:08.039Z",
    "1.0.23": "2026-08-22T17:05:14.279Z",
    "1.0.24": "2026-08-23T01:15:58.807Z",
    "1.1.0": "2026-08-26T14:15:44.261Z",
    "1.2.0": "2026-09-01T16:19:26.270Z",
    "1.2.1": "2026-09-07T00:27:12.540Z",
    "1.3.0": "2026-09-12T08:09:08.388Z",
    "1.3.1": "2026-09-12T14:31:50.771Z",
    "1.3.2": "2026-09-12T15:35:38.131Z",
    "1.3.3": "2026-09-13T11:52:30.239Z",
    "1.3.4": "2026-09-14T15:37:17.591Z",
    "1.3.5": "2026-09-15T10:08:00.619Z",
    "1.4.0": "2026-09-21T14:04:11.414Z",
    "1.4.1": "2026-09-23T03:00:33.462Z",
    "1.4.2": "2026-09-23T10:46:30.697Z",
    "1.6.0": "2026-09-27T19:45:47.800Z",
    "1.7.0": "2026-10-04T07:03:19.916Z",
    "1.8.0": "2026-10-06T06:18:34.479Z",
    "1.9.0": "2026-10-12T05:15:37.100Z",
    "1.9.1": "2026-10-13T10:43:17.971Z",
    "1.9.2": "2026-10-13T18:17:56.501Z"
  }
}
```

</details>

<details><summary>raw · npm view @agentdeck/bridge version time --json · <code>2026-10-15T15:43:52Z</code> · exit 0</summary>

Command (verbatim):

```bash
npm view @agentdeck/bridge version time --json
```

Output:

```json
{
  "version": "1.9.2",
  "time": {
    "created": "2026-02-28T03:19:36.460Z",
    "modified": "2026-10-13T18:17:53.223Z",
    "0.1.0": "2026-02-28T03:19:36.728Z",
    "0.2.0": "2026-04-27T16:16:14.247Z",
    "0.2.1": "2026-04-27T16:20:38.150Z",
    "0.2.2": "2026-04-27T16:26:40.377Z",
    "0.2.3": "2026-07-11T11:28:47.995Z",
    "1.0.0": "2026-07-19T17:17:00.088Z",
    "1.0.1": "2026-07-21T17:24:24.359Z",
    "1.0.2": "2026-07-22T12:59:56.887Z",
    "1.0.3": "2026-07-28T23:08:58.275Z",
    "1.0.4": "2026-07-29T22:38:29.582Z",
    "1.0.5": "2026-08-05T00:23:00.926Z",
    "1.0.6": "2026-08-05T00:36:43.267Z",
    "1.0.7": "2026-08-05T23:50:50.550Z",
    "1.0.8": "2026-08-06T15:23:43.419Z",
    "1.0.9": "2026-08-07T00:26:25.601Z",
    "1.0.10": "2026-08-07T09:56:09.529Z",
    "1.0.11": "2026-08-07T10:41:07.485Z",
    "1.0.12": "2026-08-07T16:51:24.542Z",
    "1.0.13": "2026-08-07T22:39:36.197Z",
    "1.0.14": "2026-08-08T01:23:56.868Z",
    "1.0.15": "2026-08-08T01:30:06.577Z",
    "1.0.17": "2026-08-09T22:05:08.726Z",
    "1.0.18": "2026-08-12T13:59:05.098Z",
    "1.0.19": "2026-08-12T15:09:53.319Z",
    "1.0.20": "2026-08-13T20:57:03.755Z",
    "1.0.21": "2026-08-17T22:36:27.008Z",
    "1.0.22": "2026-08-22T03:52:00.820Z",
    "1.0.23": "2026-08-22T17:05:08.308Z",
    "1.0.24": "2026-08-23T01:15:53.213Z",
    "1.1.0": "2026-08-26T14:15:38.885Z",
    "1.2.0": "2026-09-01T16:19:20.862Z",
    "1.2.1": "2026-09-07T00:27:04.732Z",
    "1.3.0": "2026-09-12T08:09:02.907Z",
    "1.3.1": "2026-09-12T14:31:45.485Z",
    "1.3.2": "2026-09-12T15:35:32.990Z",
    "1.3.3": "2026-09-13T11:52:24.904Z",
    "1.3.4": "2026-09-14T15:37:12.241Z",
    "1.3.5": "2026-09-15T10:06:59.908Z",
    "1.4.0": "2026-09-21T14:07:19.921Z",
    "1.4.1": "2026-09-23T03:03:21.171Z",
    "1.4.2": "2026-09-23T10:46:25.823Z",
    "1.6.0": "2026-09-27T19:46:44.491Z",
    "1.7.0": "2026-10-04T07:01:15.620Z",
    "1.8.0": "2026-10-06T06:23:44.923Z",
    "1.9.0": "2026-10-12T05:13:32.666Z",
    "1.9.1": "2026-10-13T10:45:28.790Z",
    "1.9.2": "2026-10-13T18:17:52.811Z"
  }
}
```

</details>

<details><summary>raw · npm view @agentdeck/shared version time --json · <code>2026-10-15T15:43:53Z</code> · exit 0</summary>

Command (verbatim):

```bash
npm view @agentdeck/shared version time --json
```

Output:

```json
{
  "version": "1.9.2",
  "time": {
    "created": "2026-02-28T03:19:29.728Z",
    "modified": "2026-10-13T18:16:16.761Z",
    "0.1.0": "2026-02-28T03:19:29.977Z",
    "0.2.0": "2026-04-27T16:15:55.945Z",
    "0.2.3": "2026-07-11T11:28:33.470Z",
    "1.0.0": "2026-07-19T17:16:17.565Z",
    "1.0.1": "2026-07-21T17:24:13.017Z",
    "1.0.2": "2026-07-22T12:59:42.333Z",
    "1.0.3": "2026-07-28T23:08:36.726Z",
    "1.0.4": "2026-07-29T22:38:19.780Z",
    "1.0.5": "2026-08-05T00:22:49.963Z",
    "1.0.6": "2026-08-05T00:36:32.440Z",
    "1.0.7": "2026-08-05T23:50:35.791Z",
    "1.0.8": "2026-08-06T15:23:39.602Z",
    "1.0.9": "2026-08-07T00:26:14.234Z",
    "1.0.10": "2026-08-07T09:56:05.089Z",
    "1.0.11": "2026-08-07T10:41:03.668Z",
    "1.0.12": "2026-08-07T16:51:17.584Z",
    "1.0.13": "2026-08-07T22:38:42.944Z",
    "1.0.14": "2026-08-08T01:23:44.731Z",
    "1.0.15": "2026-08-08T01:30:00.831Z",
    "1.0.17": "2026-08-09T22:05:01.984Z",
    "1.0.18": "2026-08-12T13:58:51.744Z",
    "1.0.19": "2026-08-12T15:09:41.628Z",
    "1.0.20": "2026-08-13T20:56:47.894Z",
    "1.0.21": "2026-08-17T22:36:14.448Z",
    "1.0.22": "2026-08-22T03:51:44.953Z",
    "1.0.23": "2026-08-22T17:04:55.793Z",
    "1.0.24": "2026-08-23T01:15:40.904Z",
    "1.1.0": "2026-08-26T14:15:25.441Z",
    "1.2.0": "2026-09-01T16:19:06.399Z",
    "1.2.1": "2026-09-07T00:26:45.967Z",
    "1.3.0": "2026-09-12T08:10:04.159Z",
    "1.3.1": "2026-09-12T14:32:47.226Z",
    "1.3.2": "2026-09-12T15:36:55.333Z",
    "1.3.3": "2026-09-13T11:53:05.890Z",
    "1.3.4": "2026-09-14T15:42:05.954Z",
    "1.3.5": "2026-09-15T10:09:24.245Z",
    "1.4.0": "2026-09-21T14:04:13.389Z",
    "1.4.1": "2026-09-23T03:00:16.009Z",
    "1.4.2": "2026-09-23T10:44:09.622Z",
    "1.6.0": "2026-09-27T19:47:31.122Z",
    "1.7.0": "2026-10-04T06:59:29.374Z",
    "1.8.0": "2026-10-06T06:19:25.789Z",
    "1.9.0": "2026-10-12T05:11:22.479Z",
    "1.9.1": "2026-10-13T10:43:43.125Z",
    "1.9.2": "2026-10-13T18:16:16.240Z"
  }
}
```

</details>

<details><summary>raw · npm view @agentdeck/hooks version time --json · <code>2026-10-15T15:43:54Z</code> · exit 0</summary>

Command (verbatim):

```bash
npm view @agentdeck/hooks version time --json
```

Output:

```json
{
  "version": "1.9.2",
  "time": {
    "created": "2026-04-27T16:16:05.778Z",
    "modified": "2026-10-13T18:16:01.197Z",
    "0.2.0": "2026-04-27T16:16:06.021Z",
    "0.2.3": "2026-07-11T12:23:51.067Z",
    "1.0.0": "2026-07-19T17:16:55.169Z",
    "1.0.1": "2026-07-21T17:24:21.790Z",
    "1.0.2": "2026-07-22T12:57:49.750Z",
    "1.0.3": "2026-07-28T23:08:46.165Z",
    "1.0.4": "2026-07-29T22:38:00.569Z",
    "1.0.5": "2026-08-05T00:22:35.801Z",
    "1.0.6": "2026-08-05T00:36:29.541Z",
    "1.0.7": "2026-08-05T23:50:42.907Z",
    "1.0.8": "2026-08-06T15:23:33.674Z",
    "1.0.9": "2026-08-07T00:26:12.012Z",
    "1.0.10": "2026-08-07T09:56:02.516Z",
    "1.0.11": "2026-08-07T10:41:01.691Z",
    "1.0.12": "2026-08-07T16:51:11.343Z",
    "1.0.13": "2026-08-07T22:39:12.250Z",
    "1.0.14": "2026-08-08T01:23:52.839Z",
    "1.0.15": "2026-08-08T01:30:02.895Z",
    "1.0.17": "2026-08-09T22:05:04.632Z",
    "1.0.18": "2026-08-12T13:58:57.110Z",
    "1.0.19": "2026-08-12T15:09:46.566Z",
    "1.0.20": "2026-08-13T20:56:52.792Z",
    "1.0.21": "2026-08-17T22:36:19.960Z",
    "1.0.22": "2026-08-22T03:51:51.442Z",
    "1.0.23": "2026-08-22T17:05:01.323Z",
    "1.0.24": "2026-08-23T01:15:46.220Z",
    "1.1.0": "2026-08-26T14:15:31.465Z",
    "1.2.0": "2026-09-01T16:19:12.234Z",
    "1.2.1": "2026-09-07T00:26:54.364Z",
    "1.3.0": "2026-09-12T08:08:53.900Z",
    "1.3.1": "2026-09-12T14:31:36.993Z",
    "1.3.2": "2026-09-12T15:35:24.453Z",
    "1.3.3": "2026-09-13T11:52:16.256Z",
    "1.3.4": "2026-09-14T15:37:02.610Z",
    "1.3.5": "2026-09-15T10:08:27.797Z",
    "1.4.0": "2026-09-21T14:03:57.040Z",
    "1.4.1": "2026-09-23T03:00:00.624Z",
    "1.4.2": "2026-09-23T10:44:15.749Z",
    "1.6.0": "2026-09-27T19:44:43.569Z",
    "1.7.0": "2026-10-04T06:59:03.085Z",
    "1.8.0": "2026-10-06T06:20:31.889Z",
    "1.9.0": "2026-10-12T05:11:07.686Z",
    "1.9.1": "2026-10-13T10:43:06.468Z",
    "1.9.2": "2026-10-13T18:16:00.784Z"
  }
}
```

</details>

<details><summary>raw · npm view @agentdeck/plugin (expected 404 — private package) · <code>2026-10-15T15:43:55Z</code> · exit 1</summary>

Command (verbatim):

```bash
npm view @agentdeck/plugin version time --json
```

stderr / status line:

```
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/@agentdeck%2fplugin - Not found
npm error 404
npm error 404  The requested resource '@agentdeck/plugin@*' could not be found or you do not have permission to access it.
npm error 404
npm error 404 Note that you can also install from a
npm error 404 tarball, folder, http url, or git url.
npm error A complete log of this run can be found in: /Users/puritysb/.npm/_logs/2026-10-15T15_43_55_279Z-debug-0.log
```

Output:

```
{
  "error": {
    "code": "E404",
    "summary": "Not Found - GET https://registry.npmjs.org/@agentdeck%2fplugin - Not found",
    "detail": "The requested resource '@agentdeck/plugin@*' could not be found or you do not have permission to access it.\n\nNote that you can also install from a\ntarball, folder, http url, or git url."
  }
}
```

</details>

<details><summary>raw · npm downloads setup: month/week/range (range endpoint shown; point endpoints are in raw/npm_dl_month_setup.out and npm_dl_week_setup.out) · <code>2026-10-15T15:43:58Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/range/2026-01-01:2026-10-16/@agentdeck/setup
```

stderr / status line:

```
HTTP 200
```

_Projection of `raw/npm_dl_range_setup.out` (10,308 bytes): monthly buckets and last-14-day tail computed from the daily JSON. Full file kept in `raw/`._

Output:

```
last-month: 2,062 (2026-09-13..2026-10-12)
last-week : 318 (2026-10-06..2026-10-12)
range total 2026-01-01..2026-10-16: 7,948
by month: 2026-01=0, 2026-02=25, 2026-03=57, 2026-04=170, 2026-05=51, 2026-06=118, 2026-07=1,134, 2026-08=3,519, 2026-09=2,264, 2026-10=610
last 14 daily values: 10-03=48, 10-04=215, 10-05=0, 10-06=0, 10-07=29, 10-08=20, 10-09=11, 10-10=6, 10-11=9, 10-12=243, 10-13=0, 10-14=0, 10-15=0, 10-16=0
```

</details>

<details><summary>raw · npm downloads bridge: month/week/range (range endpoint shown; point endpoints are in raw/npm_dl_month_bridge.out and npm_dl_week_bridge.out) · <code>2026-10-15T15:44:00Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/range/2026-01-01:2026-10-16/@agentdeck/bridge
```

stderr / status line:

```
HTTP 200
```

_Projection of `raw/npm_dl_range_bridge.out` (10,312 bytes): monthly buckets and last-14-day tail computed from the daily JSON. Full file kept in `raw/`._

Output:

```
last-month: 2,183 (2026-09-13..2026-10-12)
last-week : 317 (2026-10-06..2026-10-12)
range total 2026-01-01..2026-10-16: 8,731
by month: 2026-01=0, 2026-02=26, 2026-03=57, 2026-04=403, 2026-05=87, 2026-06=141, 2026-07=1,233, 2026-08=3,740, 2026-09=2,384, 2026-10=660
last 14 daily values: 10-03=48, 10-04=228, 10-05=33, 10-06=0, 10-07=47, 10-08=25, 10-09=20, 10-10=5, 10-11=16, 10-12=204, 10-13=0, 10-14=0, 10-15=0, 10-16=0
```

</details>

<details><summary>raw · npm downloads shared: month/week/range (range endpoint shown; point endpoints are in raw/npm_dl_month_shared.out and npm_dl_week_shared.out) · <code>2026-10-15T15:44:02Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/range/2026-01-01:2026-10-16/@agentdeck/shared
```

stderr / status line:

```
HTTP 200
```

_Projection of `raw/npm_dl_range_shared.out` (10,311 bytes): monthly buckets and last-14-day tail computed from the daily JSON. Full file kept in `raw/`._

Output:

```
last-month: 2,306 (2026-09-13..2026-10-12)
last-week : 301 (2026-10-06..2026-10-12)
range total 2026-01-01..2026-10-16: 8,398
by month: 2026-01=0, 2026-02=30, 2026-03=51, 2026-04=186, 2026-05=56, 2026-06=103, 2026-07=1,133, 2026-08=3,699, 2026-09=2,429, 2026-10=711
last 14 daily values: 10-03=80, 10-04=214, 10-05=80, 10-06=0, 10-07=32, 10-08=28, 10-09=12, 10-10=8, 10-11=15, 10-12=206, 10-13=0, 10-14=0, 10-15=0, 10-16=0
```

</details>

<details><summary>raw · npm downloads hooks: month/week/range (range endpoint shown; point endpoints are in raw/npm_dl_month_hooks.out and npm_dl_week_hooks.out) · <code>2026-10-15T15:44:04Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/range/2026-01-01:2026-10-16/@agentdeck/hooks
```

stderr / status line:

```
HTTP 200
```

_Projection of `raw/npm_dl_range_hooks.out` (10,301 bytes): monthly buckets and last-14-day tail computed from the daily JSON. Full file kept in `raw/`._

Output:

```
last-month: 2,205 (2026-09-13..2026-10-12)
last-week : 306 (2026-10-06..2026-10-12)
range total 2026-01-01..2026-10-16: 8,038
by month: 2026-01=0, 2026-02=0, 2026-03=0, 2026-04=70, 2026-05=29, 2026-06=26, 2026-07=1,097, 2026-08=3,754, 2026-09=2,417, 2026-10=645
last 14 daily values: 10-03=38, 10-04=219, 10-05=46, 10-06=0, 10-07=30, 10-08=27, 10-09=15, 10-10=3, 10-11=13, 10-12=218, 10-13=0, 10-14=0, 10-15=0, 10-16=0
```

</details>


## 6. Stores

Page reads used `curl` (plus the iTunes JSON API); the three client-rendered pages (Elgato search, Elgato product, Ulanzi) were additionally read in a browser tab (Claude-in-Chrome, opened and closed by this task). The tab group was left empty afterwards.

### 6.1 Elgato Marketplace

- Product page `https://marketplace.elgato.com/product/agentdeck-dce3806b-176e-40f2-be7d-e029bec0f464` — HTTP 200 via curl and via browser: title "AgentDeck | Stream Deck Plugins | Elgato Marketplace", author Serendipity Bound, price 0 USD, OS macOS, Windows, size 780 KB, version 1.8.1, "Dial support: Yes", "Profiles: Yes".
- **No download/install count, rating or review element exists in the page** (checked in the server HTML and in the rendered page text) — so there is no public install figure for this channel. The only public numbers are the version history above.
- Marketplace search for "AgentDeck" (rendered in a browser; KRW prices → Korean storefront): AgentDeck by Serendipity Bound is the first plugin result, followed by "Agent Deck for Claude Code" (Barbanson Data Solutions, ₩3,000) and three "Agent Deck" profiles by panda studio. The curl copy of the search page is only the empty shell (results load client-side).
- Adjacent listings the Marketplace recommends on the product page: Codex Shortcuts Plugin, ChatGato, ChatGPT & Codex (Elgato), Fingertip Agent — i.e. the Codex-on-Stream-Deck niche is crowded.
- Elgato editorial pages checked for a mention (`explorer/.../control-claude-with-stream-deck-for-faster-workflows`, `.../what-is-an-ai-controller`): neither names AgentDeck.

<details><summary>raw · Elgato product page (curl) · <code>2026-10-15T15:45:06Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code} final=%{url_effective}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' "https://marketplace.elgato.com/product/agentdeck-dce3806b-176e-40f2-be7d-e029bec0f464"
```

stderr / status line:

```
HTTP 200 final=https://marketplace.elgato.com/product/agentdeck-dce3806b-176e-40f2-be7d-e029bec0f464
```

_Projection of `raw/page_elgato_product.out` (207,578 bytes): extracted facts; the 207 kB HTML is in the raw file. Full file kept in `raw/`._

Output:

```
HTTP: HTTP 200 final=https://marketplace.elgato.com/product/agentdeck-dce3806b-176e-40f2-be7d-e029bec0f464
size: 207,494 chars
ld+json SoftwareApplication: {"name": "AgentDeck", "operatingSystem": "macOS, Windows", "softwareVersion": "1.8.1", "fileSize": "780 KB", "author": {"@type": "Organization", "name": "Serendipity Bound"}, "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}, "applicationSubCategory": "Stream Deck Plugins"}
versions payload (version, status, publish_date): 1.8.1 published 2026-10-14; 1.8 published 2026-10-08; 1.6 published 2026-10-02; 1.4 published 2026-10-08; 1.3 published 2026-09-14; 1.2 published 2026-09-02; 1.0.6 published 2026-08-18; 1.0.5 published 2026-08-10; 1.0.4 published 2026-08-05; 1.0.3 published 2026-07-31; 1.0.2 published 2026-07-27; 1 rejected -
counts of the strings 'download'/'install'/'rating'/'review' in the visible page text: 0/0/0/0
```

</details>

<details><summary>raw · Elgato search page (curl) — empty client-side shell · <code>2026-10-15T15:45:08Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code} final=%{url_effective}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' "https://marketplace.elgato.com/search?q=AgentDeck"
```

stderr / status line:

```
HTTP 200 final=https://marketplace.elgato.com/search?q=AgentDeck
```

_Projection of `raw/page_elgato_search.out` (134,324 bytes): shell only. Full file kept in `raw/`._

Output:

```
HTTP: HTTP 200 final=https://marketplace.elgato.com/search?q=AgentDeck
size: 134,320 chars
result list is not in the server HTML (heading only: Search results for "AgentDeck"); see the browser read below
```

</details>

<details><summary>raw · browser reads (transcribed): Elgato search + Elgato product page</summary>

```
SOURCE: Claude-in-Chrome get_page_text (<main> element) of https://marketplace.elgato.com/search?q=AgentDeck
READ: 2026-10-15 UTC, between 15:49:12Z and 15:53:01Z (bounds = raw/ulanzi_api_resources.ts and raw/gh_search_repos_v2.ts)
NOTE: transcribed from the tool output; blank lines collapsed, wording unchanged. Prices are in KRW and "Not available in your region" tags show the browser session is on a Korean storefront.
------------------------------------------------------------------------
Search results for "AgentDeck"
All | Plugins | Profiles

Top results
  AgentDeck                                   by Serendipity Bound   ∙ Plugins  ∙ Development   Free
  Agent Deck for Claude Code                  by Barbanson Data Solutions ∙ Plugins ∙ Development  ₩3,000   Not available in your region
  Agent Deck Lite (Free) — MK.2 (Mac)         by panda studio        ∙ Profiles ∙ Productivity   Free
  Agent Deck One — MK.2 (Mac)                 by panda studio        ∙ Profiles ∙ Productivity   ₩10,224  Not available in your region
  Agent Deck Two — MK.2 (Mac)                 by panda studio        ∙ Profiles ∙ Productivity   ₩7,668   Not available in your region

Plugins (View all)
  AgentDeck                                   by Serendipity Bound   ∙ Development   Free
  Agent Deck for Claude Code                  by Barbanson Data Solutions ∙ Development  ₩3,000  Not available in your region

Profiles (View all)
  Agent Deck Lite (Free) — MK.2 (Mac)         by panda studio  ∙ Profiles ∙ Productivity  Free
  Agent Deck One — MK.2 (Mac)                 by panda studio  ∙ Profiles ∙ Productivity  ₩10,224  Not available in your region
  Agent Deck Two — MK.2 (Mac)                 by panda studio  ∙ Profiles ∙ Productivity  ₩7,668   Not available in your region
(no download / install / rating / review counts appear anywhere in the page text)
```

```
SOURCE: Claude-in-Chrome get_page_text (<article> element) of https://marketplace.elgato.com/product/agentdeck-dce3806b-176e-40f2-be7d-e029bec0f464
READ: 2026-10-15 UTC, between 15:49:12Z and 15:53:01Z (bounds = raw/ulanzi_api_resources.ts and raw/gh_search_repos_v2.ts)
NOTE: transcribed from the tool output, abridged where marked [...]; the Overview prose is cut (it is in raw/page_elgato_product.out as ld+json). Dates are shown in the viewer's local time (KST), so "Oct 15, 2026" = publish_date 2026-10-14T23:55:30Z in the page payload.
------------------------------------------------------------------------
Development
AgentDeck
by Serendipity Bound
Open in Stream Deck
Overview
  [...] (AgentDeck turns Stream Deck and Stream Deck + into a live control surface for AI coding agents. Session keys show Claude Code, Codex, OpenCode, OpenClaw, Kiro, and Antigravity activity ... AgentDeck is a thin client and needs the free AgentDeck daemon on the same computer ... The plugin bundles no daemon and collects no analytics.) [...]
What's new?
  Completes background-work indicators on session keys. [...]
  Version 1.8.1   Oct 15, 2026
Details
  Type: Development
  OS: Mac, Windows
  Compatibility: Stream Deck 6.9 or later
  Size: 780 KB
  Version: 1.8.1  (Show history)
  Language: English
  Support: Get help
  Neo Infobar support: No
  Dial support: Yes
  Profiles: Yes
  Additional links: Privacy Policy
You might also like (adjacent listings shown by the Marketplace):
  Codex Shortcuts Plugin (KAWAII), ChatGato (Marco Ieni), awork (Hypercode), ChatGPT & Codex (Elgato), Stashio Lite (Magoo),
  Marbles Tools (Jackstmc), Roon: Dialed Up (Vulkandr), Fingertip Agent (Feine Bande)   -- all "Free"
(no download / install / rating / review counts appear anywhere in the page text)
```

</details>

### 6.2 Ulanzi Marketplace (Ulanzi Studio UGC)

- Public page `https://ugc.ulanzistudio.com/contentView/1141` is a client-rendered app. curl returns an empty shell; in a browser the page renders AgentDeck v1.8.1, category Plugins/AI, system Windows/Mac, devices D200,D200H,D200X. **The rendered page shows no download/like/view/rating numbers.**
- The same page's own data call (`GET /api/api/resources?id=1141`, no login) returns JSON with `download=0`, `star=0`, `collect=0`, `hot=0`, `popular=230`, `status=1`, `version=1.8.1`, `updateTime=2026-10-13 17:17:59`. What each counter measures is not documented and the page does not display them, so read `download=0` as "counter reads zero", not "zero installs"; `popular=230` is an unlabeled number (possibly a view/popularity score).
- Probe note: my first guess at the endpoint (`/api/resources?id=1141`) was redirected to the vendor's *admin login* page; I did not touch that page and used the path the public SPA actually calls. That first response is kept as `raw/ulanzi_api_resources_single_prefix.out` for the record.

<details><summary>raw · Ulanzi listing JSON (GET /api/api/resources?id=1141) · <code>2026-10-15T15:49:12Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sS --max-redirs 0 --fail-with-body -w '%{stderr}HTTP %{http_code} redirect=%{redirect_url}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' -H 'Accept: application/json' -H 'Referer: https://ugc.ulanzistudio.com/contentView/1141' "https://ugc.ulanzistudio.com/api/api/resources?id=1141"
```

stderr / status line:

```
HTTP 200 redirect=
```

_Projection of `raw/ulanzi_api_resources.out` (21,260 bytes): counter/version fields kept; localized descriptions, file paths and the e-mail fields dropped. Full file kept in `raw/`._

Output:

```
{
 "createTime": "2026-08-22 20:28:29",
 "updateTime": "2026-10-13 17:17:59",
 "additionalLink": "https://puritysb.github.io/AgentDeck/",
 "collect": 0,
 "id": "1141",
 "os": 3,
 "version": "1.8.1",
 "device": "D200,D200H,D200X",
 "uuid": "com.ulanzi.ulanzistudio.agentdeck",
 "popular": 230,
 "language": "Portugal,SouthKorea,Spain,Japanese,Chinese,English,German",
 "cateId": "457067174939463680",
 "status": 1,
 "star": 0,
 "hot": 0,
 "download": 0,
 "support": "Windows,macOS (Apple Silicon),macOS (Intel)",
 "classify": 13,
 "top_level": {
  "download": 0,
  "code": 200,
  "star": 0,
  "collect": 0
 }
}
```

</details>

<details><summary>raw · Ulanzi first probe (redirected to the vendor admin login page — not pursued) · <code>2026-10-15T15:48:19Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code} final=%{url_effective}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' -H 'Accept: application/json' "https://ugc.ulanzistudio.com/api/resources?id=1141"
```

stderr / status line:

```
HTTP 200 final=http://api.ulanzistudio.com:80/admin/login
```

_Projection of `raw/ulanzi_api_resources_single_prefix.out` (5,089 bytes): response not reproduced on purpose. Full file kept in `raw/`._

Output:

```
curl followed a redirect to http://api.ulanzistudio.com:80/admin/login and returned that login page's HTML (not reproduced).
```

</details>

<details><summary>raw · browser read (transcribed): Ulanzi content page</summary>

```
SOURCE: Claude-in-Chrome get_page_text (<body>) of https://ugc.ulanzistudio.com/contentView/1141
READ: 2026-10-15 UTC, between 15:49:12Z and 15:53:01Z (bounds = raw/ulanzi_api_resources.ts and raw/gh_search_repos_v2.ts)
NOTE: transcribed from the tool output; the first two reads (immediately after navigation) returned only the empty SPA shell ("Category: / Version:" with no values); the third read, after the client-side app had loaded, returned the content below. The long Overview prose is cut.
------------------------------------------------------------------------
Ulanzi Studio | Ulanzi Developer | Download | Forum | PixelGrid | Upload Works | EN
All | Profile | Plugins | Icons | 3D Printable | Pixel Assets
/ Plugins / AgentDeck
AgentDeck
Preview
Overview
  Stop Chatting. Start Steering. [...] AgentDeck brings your AI coding agents out of the terminal and onto the D200H or D200X ... [...]
Information
  Category: Plugins
  Category: AI
  Version: 1.8.1
  System: Windows, Mac
  Supported devices: D200, D200H, D200X
  Author: <email address shown on the page; redacted here>
  Additional Link: puritysb.github.io/AgentDeck/
Use Tutorial | Common Questions
(no download / like / view / rating counts appear anywhere in the page text)
```

</details>

### 6.3 Apple App Store / Mac App Store

- Listed: **AgentDeck Dashboard** (id 6784822497, bundle `bound.serendipity.agent.deck`, seller Serendipity Bound), Free, v1.8.0 (current version date 2026-10-06), first release 2026-07-21. One App Store record spans Mac, iPhone and iPad; the iTunes lookup returns it as `kind: software` and its version/ratings describe the **iOS** side only (the repo's own RELEASING.md notes the Mac side is not readable through lookup). Storefront titles are "AgentDeck Dashboard" (US/GB/DE/FR/CA/AU…) and "AgentDeck" (KR/JP).
- Search term `AgentDeck`: `entity=macSoftware` → 40 results, AgentDeck Dashboard **#1**; `entity=software` → 43 results, **#1**. Unrelated apps with the same name in the iOS results: AgentDeck: Chat w/ Your Agent (晔斌 范); AgentDeck - Paramount TPA (PARAMOUNT HEALTH SERVICES & INSURANCE TPA PRIVATE LIMITED); AgentDeck Mobile (Marc Khoury); AgentDeck CRM (Daniel Ledon).
- Ratings, iOS side: iTunes lookup in 44 storefronts (43 serve the app; not served: CN) → **1 rating** (DE: 1, average 5). The US iOS page's own `productRatings` block agrees: average 0, total 0, histogram [0,0,0,0,0], status "not enough ratings to display an overview".
- Ratings, Mac side: the Mac pages (`https://apps.apple.com/<cc>/app/id6784822497?platform=mac`) fetched for 44 storefronts (43 serve the app; not served: CN) carry their own `productRatings` block → **3 ratings** (US: 2, average 5, KR: 1, average 5); every other storefront shows 0. So the visible total is **4** (all five-star). App Store Connect (downloads, impressions, units) is owner-only and was not read.

<details><summary>raw · iTunes lookup id=6784822497 (US) — full record · <code>2026-10-15T15:45:03Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/lookup?id=6784822497&country=us"
```

stderr / status line:

```
HTTP 200
```

Output:

```json



{
 "resultCount":1,
 "results": [
{"artistViewUrl":"https://apps.apple.com/us/developer/serendipity-bound/id1831232346?uo=4", 
"artworkUrl60":"https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/d9/c9/f0/d9c9f0ab-9b35-ca1d-f950-f43b0d82a9a2/AppIcon-0-0-1x_U007epad-0-1-85-220.png/60x60bb.jpg", 
"artworkUrl100":"https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/d9/c9/f0/d9c9f0ab-9b35-ca1d-f950-f43b0d82a9a2/AppIcon-0-0-1x_U007epad-0-1-85-220.png/100x100bb.jpg", "isGameCenterEnabled":false, 
"supportedDevices":["MacDesktop-MacDesktop", "iPhone5s-iPhone5s", "iPadAir-iPadAir", "iPadAirCellular-iPadAirCellular", "iPadMiniRetina-iPadMiniRetina", "iPadMiniRetinaCellular-iPadMiniRetinaCellular", "iPhone6-iPhone6", "iPhone6Plus-iPhone6Plus", "iPadAir2-iPadAir2", "iPadAir2Cellular-iPadAir2Cellular", "iPadMini3-iPadMini3", "iPadMini3Cellular-iPadMini3Cellular", "iPodTouchSixthGen-iPodTouchSixthGen", "iPhone6s-iPhone6s", "iPhone6sPlus-iPhone6sPlus", "iPadMini4-iPadMini4", "iPadMini4Cellular-iPadMini4Cellular", "iPadPro-iPadPro", "iPadProCellular-iPadProCellular", "iPadPro97-iPadPro97", "iPadPro97Cellular-iPadPro97Cellular", "iPhoneSE-iPhoneSE", "iPhone7-iPhone7", "iPhone7Plus-iPhone7Plus", "iPad611-iPad611", "iPad612-iPad612", "iPad71-iPad71", "iPad72-iPad72", "iPad73-iPad73", "iPad74-iPad74", "iPhone8-iPhone8", "iPhone8Plus-iPhone8Plus", "iPhoneX-iPhoneX", "iPad75-iPad75", "iPad76-iPad76", "iPhoneXS-iPhoneXS", "iPhoneXSMax-iPhoneXSMax", "iPhoneXR-iPhoneXR", "iPad812-iPad812", "iPad834-iPad834", "iPad856-iPad856", "iPad878-iPad878", "iPadMini5-iPadMini5", "iPadMini5Cellular-iPadMini5Cellular", "iPadAir3-iPadAir3", "iPadAir3Cellular-iPadAir3Cellular", "iPodTouchSeventhGen-iPodTouchSeventhGen", "iPhone11-iPhone11", "iPhone11Pro-iPhone11Pro", "iPadSeventhGen-iPadSeventhGen", "iPadSeventhGenCellular-iPadSeventhGenCellular", "iPhone11ProMax-iPhone11ProMax", "iPhoneSESecondGen-iPhoneSESecondGen", "iPadProSecondGen-iPadProSecondGen", "iPadProSecondGenCellular-iPadProSecondGenCellular", "iPadProFourthGen-iPadProFourthGen", "iPadProFourthGenCellular-iPadProFourthGenCellular", "iPhone12Mini-iPhone12Mini", "iPhone12-iPhone12", "iPhone12Pro-iPhone12Pro", "iPhone12ProMax-iPhone12ProMax", "iPadAir4-iPadAir4", "iPadAir4Cellular-iPadAir4Cellular", "iPadEighthGen-iPadEighthGen", "iPadEighthGenCellular-iPadEighthGenCellular", "iPadProThirdGen-iPadProThirdGen", "iPadProThirdGenCell
… [truncated; 10,360 bytes total — full file: raw/apple_lookup_id_us.out]
```

</details>

<details><summary>raw · iTunes lookup, other storefronts (8 explicit calls + 35-storefront sweep)</summary>

```
storefront | resultCount | trackName | version | userRatingCount | averageUserRating
us | 1 | AgentDeck Dashboard | 1.8.0 | 0 | 0
kr | 1 | AgentDeck | 1.8.0 | 0 | 0
jp | 1 | AgentDeck | 1.8.0 | 0 | 0
gb | 1 | AgentDeck Dashboard | 1.8.0 | 0 | 0
de | 1 | AgentDeck Dashboard | 1.8.0 | 1 | 5
fr | 1 | AgentDeck Dashboard | 1.8.0 | 0 | 0
ca | 1 | AgentDeck Dashboard | 1.8.0 | 0 | 0
au | 1 | AgentDeck Dashboard | 1.8.0 | 0 | 0

sweep (country, resultCount, ratings, avg):
it 1 0 0
es 1 0 0
nl 1 0 0
se 1 0 0
ch 1 0 0
at 1 0 0
be 1 0 0
dk 1 0 0
no 1 0 0
fi 1 0 0
ie 1 0 0
nz 1 0 0
tw 1 0 0
hk 1 0 0
sg 1 0 0
in 1 0 0
br 1 0 0
mx 1 0 0
ru 1 0 0
tr 1 0 0
pl 1 0 0
pt 1 0 0
cz 1 0 0
il 1 0 0
za 1 0 0
ae 1 0 0
sa 1 0 0
th 1 0 0
vn 1 0 0
id 1 0 0
my 1 0 0
ph 1 0 0
ar 1 0 0
cl 1 0 0
co 1 0 0
cn 0 None -
```

Commands: `curl -sS --fail-with-body "https://itunes.apple.com/lookup?id=6784822497&country=<cc>"` for cc in us kr jp gb de fr ca au (ids `apple_lookup_id_<cc>`), and the loop recorded in `raw/apple_lookup_sweep.cmd` for the other 36 storefronts; the Mac-page loop is `raw/apple_mac_page_sweep.cmd`.

</details>

<details><summary>raw · iTunes search term=AgentDeck entity=macSoftware · <code>2026-10-15T15:44:59Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/search?term=AgentDeck&entity=macSoftware"
```

stderr / status line:

```
HTTP 200
```

_Projection of `raw/apple_search_mac.out` (289,241 bytes): first 12 of the results. Full file kept in `raw/`._

Output:

```
rank | trackName | seller | ratings
1 | AgentDeck Dashboard | Serendipity Bound | 0
2 | Cypher 007 | Tilting Point LLC | 7751
3 | Spades Lite | fishdog.net, LLC | 0
4 | Cards Royale: Classic Games | Avalinx LLC | 2
5 | Computer Solitaire | Austin Smith | 1
6 | Limitless AI ChatBot Assistant | AGI Applications Inc. | 1
7 | Card Fever: Solitaire & Hearts | Eswar Venigalla | 0
8 | Cookey - Help Agents In | 子衎 王 | 0
9 | AgentAura | ExtraOrdinary Technology LLC | 4
10 | AgentChat Hub | ANANYA BANERJEE | 1
11 | TealKit: Private AI Agents | Laszlo Schaffer | 1
12 | Active Agent App | ZooKeeper Media LLC | 1
```

</details>

<details><summary>raw · iTunes search term=AgentDeck entity=software · <code>2026-10-15T15:45:01Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/search?term=AgentDeck&entity=software"
```

stderr / status line:

```
HTTP 200
```

_Projection of `raw/apple_search_software.out` (437,380 bytes): first 12 of the results. Full file kept in `raw/`._

Output:

```
rank | trackName | seller | ratings
1 | AgentDeck Dashboard | Serendipity Bound | 0
2 | AgentDeck: Chat w/ Your Agent | 晔斌 范 | 0
3 | AgentDeck - Paramount TPA | PARAMOUNT HEALTH SERVICES & INSURANCE TPA PRIVATE LIMITED | 0
4 | AgentDeck Mobile | Marc Khoury | 0
5 | AgentDeck CRM | Daniel Ledon | 0
6 | Card Shark Collection™ | Easy 8 Software | 13396
7 | Dodge Agent | Lion Studios LLC | 23087
8 | Hokm, Tarneeb & Spades | Wumbagic Studios Private Limited | 1174
9 | Mr Spy : Undercover Agent | MADBOX | 9944
10 | Ascension: Deckbuilding Game | Playdek, Inc. | 1107
11 | Blackjack by MobilityWare+ | MobilityWare | 10495
12 | Nerts | Earthshine Labs, LLC | 895
```

</details>

<details><summary>raw · iTunes lookup by bundleId=bound.serendipity.agent.deck (US) · <code>2026-10-15T15:45:02Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/lookup?bundleId=bound.serendipity.agent.deck&country=us"
```

stderr / status line:

```
HTTP 200
```

_Projection of `raw/apple_lookup_bundle_us.out` (10,360 bytes): same record. Full file kept in `raw/`._

Output:

```
resultCount=1 (same record as id lookup)
```

</details>

<details><summary>raw · Mac App Store page ratings by storefront (…?platform=mac) · <code>2026-10-15T16:07:22Z</code> · exit 0</summary>

Command (verbatim):

```bash
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
for cc in us kr jp gb de fr ca au it es nl se ch at be dk no fi ie nz tw hk sg in br mx ru tr pl pt cz il za ae sa th vn id my ph ar cl co cn; do
  code=$(curl -sSL --max-time 30 -A "$UA" -o /tmp/.agentdeck_mac_page.$$ -w '%{http_code}' "https://apps.apple.com/$cc/app/id6784822497?platform=mac" 2>&1)
  printf '%s\tHTTP %s\t' "$cc" "$code"
  python3 -I -c '
import re,sys
h=open(sys.argv[1],encoding="utf-8",errors="replace").read()
m=re.search(r"\"productId\":\"6784822497\",\"ratingAverage\":([\d.]+),\"totalNumberOfRatings\":(\d+),\"context\":\"productPage\",\"ratingCounts\":\[([\d,]+)\]",h)
t=re.search(r"<title[^>]*>(.*?)</title>",h,re.S)
print("ratings=%s avg=%s hist=[%s]" % (m.group(2),m.group(1),m.group(3)) if m else "no ratings block | title=%s" % (t.group(1).strip()[:60] if t else None))
' /tmp/.agentdeck_mac_page.$$
done
rm -f /tmp/.agentdeck_mac_page.$$
```

Output:

```
us	HTTP 200	ratings=2 avg=5 hist=[2,0,0,0,0]
kr	HTTP 200	ratings=1 avg=5 hist=[1,0,0,0,0]
jp	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
gb	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
de	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
fr	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
ca	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
au	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
it	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
es	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
nl	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
se	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
ch	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
at	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
be	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
dk	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
no	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
fi	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
ie	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
nz	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
tw	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
hk	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
sg	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
in	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
br	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
mx	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
ru	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
tr	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
pl	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
pt	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
cz	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
il	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
za	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
ae	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
sa	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
th	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
vn	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
id	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
my	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
ph	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
ar	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
cl	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
co	HTTP 200	ratings=0 avg=0 hist=[0,0,0,0,0]
cn	HTTP 404	no ratings block | title=None
```

</details>

### 6.4 Google Play

- `https://play.google.com/store/apps/details?id=dev.agentdeck` — HTTP 200: **"10+ Downloads"** (Play's public bucket: at least 10, fewer than 50), Updated on Oct 13, 2026, content rating Everyone, price Free, author Serendipity Bound. No star rating or review count is shown. Exact installs, store-listing visitors and conversion need the Play Console (owner login) and were not read.
- Play search `https://play.google.com/store/search?q=AgentDeck&c=apps`: `dev.agentdeck` is result **#1** of 50 app links on the page; the next results are unrelated apps (com.mantou.agentdeck, com.codeagent.mobile, com.cosmovex.agentpager, ovh.tenjo.agentphone, com.solai.agent …).

<details><summary>raw · Google Play details page (curl) · <code>2026-10-15T15:45:10Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code} final=%{url_effective}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' -H 'Accept-Language: en-US,en;q=0.9' "https://play.google.com/store/apps/details?id=dev.agentdeck&hl=en&gl=US"
```

stderr / status line:

```
HTTP 200 final=https://play.google.com/store/apps/details?id=dev.agentdeck&hl=en&gl=US
```

_Projection of `raw/page_play_details.out` (1,060,873 bytes): extracted facts; 1.06 MB HTML in the raw file. Full file kept in `raw/`._

Output:

```
HTTP: HTTP 200 final=https://play.google.com/store/apps/details?id=dev.agentdeck&hl=en&gl=US
ld+json: {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "AgentDeck", "url": "https://play.google.com/store/apps/details/AgentDeck?id=dev.agentdeck&hl=en", "description": "Coding-agent dashboard — requires AgentDeck running on your computer.", "operatingSystem": "ANDROID", "applicationCategory": "TOOLS", "image": "https://play-lh.googleusercontent.com/HaZh4trUb9SP3A754YG2g8zsinlNoh8V8GtKCPoizPRPkUgQOcRd4GN_6x3BFJ7M_ehdEeemi8gcr4jrqIxhZos", "contentRating": "Everyone", "author": {"@type": "Person", "name": "Serendipity Bound", "url": "https://puritysb.github.io/AgentDeck/"}, "offers": [{"@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.o
visible text cue: '10+ Downloads', 'Updated on Oct 13, 2026'
no rating / review-count text present
```

</details>

<details><summary>raw · Google Play search page (curl) · <code>2026-10-15T15:45:10Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code} final=%{url_effective}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' -H 'Accept-Language: en-US,en;q=0.9' "https://play.google.com/store/search?q=AgentDeck&c=apps&hl=en&gl=US"
```

stderr / status line:

```
HTTP 200 final=https://play.google.com/store/search?q=AgentDeck&c=apps&hl=en&gl=US
```

_Projection of `raw/page_play_search.out` (1,386,656 bytes): package ids extracted. Full file kept in `raw/`._

Output:

```
HTTP: HTTP 200 final=https://play.google.com/store/search?q=AgentDeck&c=apps&hl=en&gl=US
linked package ids in page order: dev.agentdeck, com.mantou.agentdeck, com.codeagent.mobile, com.cosmovex.agentpager, ovh.tenjo.agentphone, com.solai.agent, io.maindeck.mobileinspection, com.rivafarabi.deckboard.pro, net.agentlock.app, com.thequarterdeck, com.anthropic.claude, com.vibepocket.app, ai.x.grok, ai.soloflux.muxagent, com.openai.chatgpt, com.agentboard.app, com.zillow.android.streeteasy.industry, com.erudapro, com.mugenesis.codedeck, org.deckbox.app …
```

</details>


## 7. Mentions

### 7.1 Where outside parties talk about AgentDeck (verified one by one)

| Date | Where | What it says | Evidence |
|---|---|---|---|
| 2026-06-19 (updated 2026-08-21) | shiritomo / hashout.jp — https://hashout.jp/ai/2290/ | Japanese tech-culture article about product designer Go Ando's X video (2026-06-18) of a Stream Deck+ showing Claude Code sessions; says his setup is based on AgentDeck and links `github.com/puritysb/AgentDeck`; title/body claim the X post drew 3,900+ likes (figure is the article's, not verified). | curl: `datePublished 2026-06-19T06:15+09:00`, `dateModified 2026-08-21`; text contains AgentDeck ×9 and the repo slug |
| 2026-07-19 | codex.danielvaughan.com — https://codex.danielvaughan.com/2026/07/19/codex-micro-physical-control-surfaces-ai-coding-agents-hardware-moat-developer-ergonomics/ | Blog on OpenAI's Codex Micro; presents AgentDeck as the open-source alternative for physical agent controls with multi-agent support, in a comparison table. | post source read via GitHub (lines 72–78, 148) |
| 2026-09-10 / 2026-09-22 | RockBase-iot (hardware vendor) — `RockBase-iot/ESPWebApps/agentdeck/` and `RockBase-iot/wiki-documents` | Vendor ships an AgentDeck firmware build for its NM-EPD-420 4.2" tri-colour e-ink panel in its web flasher (a commit adding AgentDeck and a black-and-white demo to the vendor's web-flasher app list, authored by the vendor account) and its wiki lists it as a third-party build of puritysb/AgentDeck. | `gh api` commit history + file contents |
| 2026-08-20 → | `houtacheng/companion-module-agentdeck` | Community Bitfocus-Companion module for AgentDeck (README: maintained in its own repo, daemon from upstream); author also opened AgentDeck issues #221 and #246. | repo metadata, README line |
| 2026 | Derivative / attribution | `nickboy/claudedeck` and `nickboy/herddeck` NOTICE files credit AgentDeck (borrowed `pty-ringbuffer.ts`; usage-API approach); `alejandrosnz/claude-deck` README acknowledges AgentDeck as reference for Claude Code integration and usage API; `Boyapati13/Octopus-Agent-System` has a bridge entry file headed as an AgentDeck-style bridge that points to the AgentDeck monorepo for the full daemon; `lstutzman/agentdeck-omp` AGENTS.md pins an AgentDeck commit. | file contents via `gh api` |
| 2026-10 | Users' dotfiles | `shin-sforzando/dotfiles` TROUBLESHOOTING.md documents running the AgentDeck daemon + Ulanzi D200X plugin (same user opened #541/#544/#545 on 2026-10-14); `danielmoraes/dotfiles` documents replacing AgentDeck's session slot with a custom plugin and notes AgentDeck can then be uninstalled entirely (a former user). | file contents via `gh api` |
| 2026 | Landscape / competitor write-ups | `fugitivelabs/cockpit` (lists AgentDeck with a 157-star snapshot, i.e. written ~July), `stevebargelt/forge` (assessment doc: rates AgentDeck the better candidate for a bounded, read-only integration experiment), `fridiculous/the-score`, `zm2231/agenthail`, `wookat/attnbox`, `technicalpickles/bowerbird`, `taiyun668/gogoke`, `niclasvestlund-YT/vibepulse`, `Selva-Corp/agenttap`, `vaddisrinivas/codecks`, `ValentinNikolaev/research-vault`. | code-search fragments (context of the lines not all opened) |
| 2026 | Catalogs / awesome lists | `itgoyo/Awesome-VibeCoding` (entry at 229★), `Arnon-hs/open-source` (auto-generated page `aiml/puritysb-agentdeck.md`), `yplam/osrtos` (OSRTOS directory page, image dated 2026-04), `parkerluxu/Awesome-agent-cases` (hardware cases), `arthurspk/guiadoconhecimento` (33 files = translations), `baigao417/awesome-dot`, `lzpgood123/agent-ecoradar`, `GooPxel77/agent-skills-hub`, `sudosubin/agents.nix`, `mgraf77/agent-stack`, `adminbjkai/n50`. | code search |
| 2026-08-27 / 09-07 | Issues in other repos linking the slug | `PowerUp-ToolBox/Power_Up_UR_Coding` (closed issue proposing outreach to the maintainers of ClaudeGamepad, VibePad and AgentDeck), `Jacob-Lasky/pocket-dev` (open). | `gh search issues` |

Counts: GitHub code search for `"puritysb/AgentDeck" -repo:puritysb/AgentDeck` → 95 files in 38 repos (`incomplete_results: false`; code search is approximate); `"@agentdeck/setup"` → 4 files in 3 repos; link to `puritysb.github.io/AgentDeck` → 6 files in 5 repos. 0 of the 38 repos are forks.

### 7.2 Looked for, not found / could not read

- **Hacker News** (Algolia API): query `puritysb/AgentDeck` → 0 hits; `puritysb.github.io` in the URL field → 0 hits. The 63 story hits for `AgentDeck` are other projects (asheshgoplani/agent-deck, agentdeck/agentdeck, …).
- **Reddit**: **could not read.** `reddit.com/search.json` returned HTTP 403 and the browser tool refused `reddit.com` ("site not allowed"). GitHub's own referrer list does show `reddit.com` (27 views / 19 uniques in 14 days), so some Reddit page links the repo — thread not located. A standard and an extended web search for it found nothing.
- **X/Twitter, YouTube, Bluesky**: not searchable with the available tools (the only X item is the Go Ando post cited by the article above).
- **Elgato editorial pages** (2 checked, last updated 2026-07-30 and 2026-08-07): no mention of AgentDeck.
- **Web searches that returned nothing relevant:** "puritysb AgentDeck", "AgentDeck TRMNL" (TRMNL results are TRMNL's own coverage and unrelated `agent-deck` projects), Korean and Chinese-language queries, and a Zenn/Qiita/note/velog/dev.to/Medium query. DeepWiki has an auto-generated page (`deepwiki.com/puritysb/AgentDeck`), and one fork (`bhardwajRahul/AgentDeck`) surfaced in results.

### 7.3 Namesakes (do not count these)

- GitHub: `darknecrocities/Agentdeck` (12★), `DuarteSantos8/agentdeck` (8★), `AliceLJY/agentdeck` (6★), `mantou132/AgentDeck` (5★), `agentdecksdk/agentdeck` (4★), `Jimmy-web169/AgentDeck` (4★) … — different products. App Store: AgentDeck: Chat w/ Your Agent (晔斌 范); AgentDeck - Paramount TPA (PARAMOUNT HEALTH SERVICES & INSURANCE TPA PRIVATE LIMITED); AgentDeck Mobile (Marc Khoury); AgentDeck CRM (Daniel Ledon). Elgato: "Agent Deck for Claude Code", panda studio "Agent Deck" profiles. Stream Deck-specific namesake: `fernandobelotto/AgentDeck` (Gemini/Claude Stream Deck plugin, created 2026-01-07, 1★).

<details><summary>raw · gh search repos agentdeck --sort stars (top 25 of 100) · <code>2026-10-15T15:53:01Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh search repos agentdeck --limit 100 --sort stars --json fullName,description,stargazersCount,forksCount,isFork,createdAt,pushedAt,url,language
```

_Projection of `raw/gh_search_repos_v2.out` (33,045 bytes): first 25 rows. Full file kept in `raw/`._

Output:

```
stars | forks | fork? | created | repo | description
264 | 53 | False | 2026-02-20 | puritysb/AgentDeck | Local dashboards and physical controls for AI coding agents — native 3D aquariums, Stream 
12 | 3 | False | 2026-08-28 | darknecrocities/Agentdeck | Local-First Remote AI Engineering Control Plane Monitor, prompt, and control AI coding age
8 | 4 | False | 2026-07-02 | DuarteSantos8/agentdeck | Self-hosted browser terminal deck for long-running Claude Code and shell agents — every se
6 | 0 | False | 2026-04-14 | AliceLJY/agentdeck | Web terminal for Claude Code, Codex, Kimi and Antigravity CLIs — a tab each. tmux-backed s
5 | 0 | False | 2026-08-16 | mantou132/AgentDeck | Your coding agents, in your pocket. Control Claude Code, Codex, Cursor or any ACP agent on
4 | 7 | False | 2026-07-26 | agentdecksdk/agentdeck | AgentDeck SDK: the execution layer for agentic software. Agents, tools and workflows as pl
4 | 2 | False | 2026-06-08 | Jimmy-web169/AgentDeck | 
4 | 0 | False | 2026-03-09 | Wintersta7e/agentdeck | Electron desktop app for managing AI coding agents in WSL — split terminals, visual workfl
4 | 0 | False | 2026-06-24 | bass131/AgentDeck | Claude Code · Codex 듀얼 백엔드 데스크톱 AI 코딩 IDE — Electron · React · TypeScript · Claude Agent S
3 | 0 | False | 2026-07-02 | ShenAC-SAC/agentdeck | A control deck for managing local and remote coding-agent sessions.
3 | 0 | False | 2026-08-16 | soya-miyoshi/agentdeck | 
3 | 0 | False | 2026-07-20 | GitHubxsy/agentdeck | Native SwiftUI controller for Codex agents with App Intents and a local authenticated Mac 
3 | 0 | False | 2026-04-29 | zhou-ran/AgentDeck | 
2 | 2 | False | 2026-09-13 | jghwang2/tabby-agentdeck | Run AI coding agents side by side in Tabby - a live deck of agent sessions with status, a 
2 | 0 | False | 2026-02-20 | yanhs/agentdeck | AgentDeck — Claude Code on your VPS, in your browser and Telegram. Many agents in parallel
2 | 0 | False | 2026-06-26 | razuberiii/agentdeck | Mobile-first PWA gateway for Codex
2 | 0 | False | 2026-05-24 | shenyangs/agentdeck | Wrap any deck into a single-file HTML presenter with enhanced controls.
2 | 0 | False | 2025-11-24 | agentdeck/agentdeck | The game console for AI agents — open execution, recording, and replay infrastructure for 
2 | 0 | False | 2026-06-18 | woguaiwo/AgentDeck | Remote control plane for AI agent teams
2 | 0 | False | 2026-08-30 | heis1696/AgentDeck | 
2 | 0 | False | 2026-07-18 | ictashik/AgentDeck | 
2 | 1 | False | 2026-05-26 | arilink/AgentDeck | 
1 | 0 | False | 2026-09-02 | visualabsai/agentdeck | Agent Manager tool to manage Claude Code, Codex and other AI providers from one place. 
1 | 0 | False | 2026-09-26 | SyntaxError403/agentdeck | 
1 | 0 | False | 2026-09-03 | JasonBates/agentdeck | Glanceable dashboard for Herdr coding-agent sessions, served from a Mac to any device on y
```

</details>

<details><summary>raw · GitHub code search: &quot;puritysb/AgentDeck&quot; outside the repo · <code>2026-10-15T15:53:59Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh api -X GET search/code -f q='"puritysb/AgentDeck" -repo:puritysb/AgentDeck' -f per_page=100 --jq '[.items[] | {repo: .repository.full_name, fork: .repository.fork, path: .path, url: .html_url}]'
```

_Projection of `raw/gh_code_api_slug.out` (21,942 bytes): one row per repository. Full file kept in `raw/`._

Output:

```
repo | files | example path
Arnon-hs/open-source | 1 | aiml/puritysb-agentdeck.md
niclasvestlund-YT/vibepulse | 1 | docs/companion-features-brainstorm.md
yplam/osrtos | 1 | src/content/projects/agentdeck.md
paultyng/agentsd | 1 | README.md
RockBase-iot/ESPWebApps | 2 | agentdeck/README.md
nickboy/claudedeck | 5 | NOTICE.md
houtacheng/companion-module-agentdeck | 4 | README.md
nickboy/herddeck | 2 | NOTICE.md
RockBase-iot/NM-EPD-420 | 2 | README.md
RockBase-iot/wiki-documents | 4 | docs/platform/web-flasher.md
Boyapati13/Octopus-Agent-System | 3 | bridge/src/index.ts
taiyun668/gogoke | 1 | docs/research/upstream-reference-map.md
lstutzman/agentdeck-omp | 2 | AGENTS.md
cruftbox/yolodeck | 1 | PLAN.md
itgoyo/Awesome-VibeCoding | 2 | README.md
fugitivelabs/cockpit | 1 | docs/reference/landscape.md
alejandrosnz/claude-deck | 2 | README.md
Davie521/claude-skills | 1 | plugins/dev-workflow/skills/cleanup/SKILL.md
parkerluxu/Awesome-agent-cases | 2 | collections/hardware/ai-agent-embedded-design-cases.en.md
YWzzq/claudepet | 1 | README.md
susyimes/auto4researh | 2 | scans/20260711T040156Z.md
stevebargelt/forge | 3 | docs/research/competitive/agentdeck-forge-assessment.md
wookat/attnbox | 1 | docs/COMPARISON.md
technicalpickles/bowerbird | 1 | docs/research/README-draft.md
arthurspk/guiadoconhecimento | 33 | ia/profissoes/maker.md
fridiculous/the-score | 1 | docs/research/agent-activity-daemon-landscape.md
zm2231/agenthail | 1 | docs/research/mobile-agent-clients-2026-09.md
Selva-Corp/agenttap | 1 | docs/companion-features-brainstorm.md
vaddisrinivas/codecks | 1 | .planning/2026-07-20-codecks-top-15-research/findings.md
sudosubin/agents.nix | 1 | data/agent-plugins/sources.json
ValentinNikolaev/research-vault | 4 | 01-discovery/streamdeck-breakout-product-research/research/sources.md
baigao417/awesome-dot | 1 | data/curation.json
lzpgood123/agent-ecoradar | 1 | data/raw/github-initial/unique-repos.json
danielvaughan/codex-blog | 1 | _posts/2026-07-19-codex-micro-physical-control-surfaces-ai-coding-agents-hardware-moat-developer-ergonomics.md
GooPxel77/agent-skills-hub | 1 | frontend/public/sitemap-mid.xml
mgraf77/agent-stack | 1 | catalog/repositories.csv
brennancheung/streamdeck-bridge | 1 | docs/deep-research/stream-deck-xl-direct-control/novel-use-cases-and-ideas/developer-productivity.md
adminbjkai/n50 | 1 | _tmp/set186_v3_verified_audit.json
```

</details>

<details><summary>raw · code-search total count · <code>2026-10-15T15:53:41Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh api -X GET search/code -f q='"puritysb/AgentDeck" -repo:puritysb/AgentDeck' -f per_page=1 --jq '{total_count, incomplete_results}'
```

Output:

```json
{"incomplete_results":false,"total_count":95}
```

</details>

<details><summary>raw · GitHub code search: &quot;@agentdeck/setup&quot; outside the repo · <code>2026-10-15T15:54:00Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh api -X GET search/code -f q='"@agentdeck/setup" -repo:puritysb/AgentDeck' -f per_page=100 --jq '[.items[] | {repo: .repository.full_name, fork: .repository.fork, path: .path, url: .html_url}]'
```

_Projection of `raw/gh_code_api_npm.out` (898 bytes). Full file kept in `raw/`._

Output:

```
houtacheng/companion-module-agentdeck | docs/feature-request-hide-dock-icon.md
houtacheng/companion-module-agentdeck | companion/HELP.md
shin-sforzando/dotfiles | TROUBLESHOOTING.md
danielmoraes/dotfiles | streamdeck/plugins/sessions/README.md
```

</details>

<details><summary>raw · GitHub code search: puritysb.github.io/AgentDeck outside the repo · <code>2026-10-15T15:54:00Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh api -X GET search/code -f q='"puritysb.github.io/AgentDeck" -repo:puritysb/AgentDeck' -f per_page=100 --jq '{total: .total_count, items: [.items[] | {repo: .repository.full_name, fork: .repository.fork, path: .path}]}'
```

_Projection of `raw/gh_code_api_site.out` (520 bytes): total 6. Full file kept in `raw/`._

Output:

```
y5862000/threaddeck-for-codex | docs/ALTERNATIVES.md
yplam/osrtos | src/content/projects/agentdeck.md
y5862000/threaddeck-for-codex | docs/ALTERNATIVES.ko.md
RockBase-iot/ESPWebApps | agentdeck/README.md
houtacheng/companion-module-agentdeck | src/companion/system.ts
itgoyo/Awesome-VibeCoding | data/repos.json
```

</details>

<details><summary>raw · Third-party files opened to check context (verbatim lines kept in raw/, not reproduced here) · <code>2026-10-15T15:55:10Z</code> · exit 0</summary>

Command (verbatim):

```bash
for spec in "RockBase-iot/ESPWebApps:agentdeck/README.md" "RockBase-iot/wiki-documents:docs/platform/web-flasher.md" "danielmoraes/dotfiles:streamdeck/plugins/sessions/README.md" "shin-sforzando/dotfiles:TROUBLESHOOTING.md" "danielvaughan/codex-blog:_posts/2026-07-19-codex-micro-physical-control-surfaces-ai-coding-agents-hardware-moat-developer-ergonomics.md" "Arnon-hs/open-source:aiml/puritysb-agentdeck.md" "yplam/osrtos:src/content/projects/agentdeck.md" "fugitivelabs/cockpit:docs/reference/landscape.md" "itgoyo/Awesome-VibeCoding:README.md"; do
  repo="${spec%%:*}"; path="${spec#*:}"
  echo "##### $repo :: $path"
  gh api "repos/$repo/contents/$path" --jq '.content' 2>&1 | base64 -d 2>/dev/null | grep -n -i -E "agentdeck|puritysb" | head -6 | cut -c1-330
done
```

_Projection of `raw/gh_third_party_files.out` (5,794 bytes): file and number of lines matching AgentDeck/puritysb; third-party text deliberately not copied into this report. Full file kept in `raw/`._

Output:

```
RockBase-iot/ESPWebApps :: agentdeck/README.md | 5 matching lines
RockBase-iot/wiki-documents :: docs/platform/web-flasher.md | 1 matching lines
danielmoraes/dotfiles :: streamdeck/plugins/sessions/README.md | 6 matching lines
shin-sforzando/dotfiles :: TROUBLESHOOTING.md | 6 matching lines
danielvaughan/codex-blog :: _posts/2026-07-19-codex-micro-physical-control-surfaces-ai-coding-agents-hardware-moat-developer-ergonomics.md | 6 matching lines
Arnon-hs/open-source :: aiml/puritysb-agentdeck.md | 6 matching lines
yplam/osrtos :: src/content/projects/agentdeck.md | 6 matching lines
fugitivelabs/cockpit :: docs/reference/landscape.md | 3 matching lines
itgoyo/Awesome-VibeCoding :: README.md | 1 matching lines
```

</details>

<details><summary>raw · Authorship / dates of third-party references · <code>2026-10-15T15:55:48Z</code> · exit 0</summary>

Command (verbatim):

```bash
echo "## RockBase-iot/ESPWebApps agentdeck/ commit authors"
gh api "repos/RockBase-iot/ESPWebApps/commits?path=agentdeck&per_page=10" --jq '.[] | "\(.commit.author.date[:10])  \(.author.login // .commit.author.name)  \(.commit.message | split("\n")[0][:90])"'
echo "## RockBase-iot/wiki-documents web-flasher.md commit authors"
gh api "repos/RockBase-iot/wiki-documents/commits?path=docs/platform/web-flasher.md&per_page=5" --jq '.[] | "\(.commit.author.date[:10])  \(.author.login // .commit.author.name)  \(.commit.message | split("\n")[0][:90])"'
echo "## RockBase-iot/ESPWebApps repo"
gh api repos/RockBase-iot/ESPWebApps --jq '"\(.full_name) stars=\(.stargazers_count) homepage=\(.homepage) pushed=\(.pushed_at[:10])"'
echo "## danielvaughan/codex-blog"
gh api repos/danielvaughan/codex-blog --jq '"\(.full_name) stars=\(.stargazers_count) homepage=\(.homepage) created=\(.created_at[:10])"'
echo "## houtacheng/companion-module-agentdeck"
gh api repos/houtacheng/companion-module-agentdeck --jq '"\(.full_name) stars=\(.stargazers_count) created=\(.created_at[:10]) pushed=\(.pushed_at[:10]) desc=\(.description)"'
echo "## nickboy/claudedeck, nickboy/herddeck"
gh api repos/nickboy/claudedeck --jq '"\(.full_name) stars=\(.stargazers_count) created=\(.created_at[:10]) desc=\(.description)"'
gh api repos/nickboy/herddeck --jq '"\(.full_name) stars=\(.stargazers_count) created=\(.created_at[:10]) desc=\(.description)"'
echo "## alejandrosnz/claude-deck"
gh api repos/alejandrosnz/claude-deck --jq '"\(.full_name) stars=\(.stargazers_count) created=\(.created_at[:10]) desc=\(.description)"'
echo "## bhardwajRahul/AgentDeck (fork; shown in web search)"
gh api repos/bhardwajRahul/AgentDeck --jq '"\(.full_name) fork=\(.fork) stars=\(.stargazers_count) created=\(.created_at[:10]) pushed=\(.pushed_at[:10])"'
```

Output:

```
## RockBase-iot/ESPWebApps agentdeck/ commit authors
2026-09-10  RockBase-iot  support agentdeck and nm-epd420-bw-demo
## RockBase-iot/wiki-documents web-flasher.md commit authors
2026-09-22  RockBase-iot  [0.2.1]update nm-epd-420-4c and projects
2026-08-17  RockBase-iot  [0.1.0]add platform, projects; add k230-vision, nm-solar
## RockBase-iot/ESPWebApps repo
RockBase-iot/ESPWebApps stars=5 homepage=null pushed=2026-10-13
## danielvaughan/codex-blog
danielvaughan/codex-blog stars=1 homepage=null created=2026-04-07
## houtacheng/companion-module-agentdeck
houtacheng/companion-module-agentdeck stars=0 created=2026-08-20 pushed=2026-09-14 desc=null
## nickboy/claudedeck, nickboy/herddeck
nickboy/claudedeck stars=0 created=2026-04-19 desc=Stream Deck MK.2 plugin + Bun daemon for monitoring Claude Code sessions, permission prompts, and Claude Max plan usage (macOS + Ghostty)
nickboy/herddeck stars=0 created=2026-08-07 desc=Stream Deck control surface for herdr agent sessions (local + remote)
## alejandrosnz/claude-deck
alejandrosnz/claude-deck stars=0 created=2026-05-12 desc=An OpenDeck / Stream Deck plugin that shows Claude Code usage stats
## bhardwajRahul/AgentDeck (fork; shown in web search)
bhardwajRahul/AgentDeck fork=true stars=0 created=2026-09-05 pushed=2026-09-29
```

</details>

<details><summary>raw · gh search issues &quot;AgentDeck&quot; --limit 30 (brief&#x27;s command; mostly namesake projects + this repo&#x27;s own issues) · <code>2026-10-15T15:44:53Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh search issues "AgentDeck" --limit 30 --json repository,title,author,createdAt,state,url,isPullRequest
```

_Projection of `raw/gh_search_issues.out` (12,207 bytes): all 30 rows, title cut to 70 chars. Full file kept in `raw/`._

Output:

```
weibolin10-byte/AgentDeck | issue | open | 2026-08-21 | agentdeck演示视频
yuanyang7/agentdeck | issue | open | 2026-10-07 | [feedback] Auto permission mode no longer auto-approves (regression)
asheshgoplani/agent-deck | issue | open | 2026-10-10 | Cross-profile launch from inside a session runs on the caller's Claude
eerovil/homr | issue | open | 2026-10-06 | fixturecheck: engrave off the deck host (cluster pod or heavy-slot lea
puritysb/AgentDeck | issue | open | 2026-10-14 | [Feature]: Deliver voice prompts to Claude Code sessions running in cm
puritysb/AgentDeck | issue | open | 2026-10-14 | Voice: no microphone prompt when the daemon runs from the LaunchAgent
dodid/AgentDeck | issue | open | 2026-09-02 | Upstream compatibility canary is failing
Jassy930/AgentDeck | issue | open | 2026-09-22 | 规划 Codex 运行时来源与版本兼容提示
asheshgoplani/agent-deck | issue | open | 2026-10-10 | Evaluate a benchmark-gated Bubble Tea v2 migration
ruanyf/weekly | issue | open | 2026-09-30 | 【开源自荐】AgentDeck：用手机远程操作 Claude Code / Codex / Cursor 等编码代理
agentdecksdk/agentdeck | issue | open | 2026-09-02 | api: agentdeck.events, a public typed payload surface for bindings
yuanyang7/agentdeck | issue | open | 2026-10-13 | [feedback] Codex chats don't continue by themselves after a usage limi
yuanyang7/agentdeck | issue | open | 2026-10-07 | [feedback] Codex chats don't show what a turn left running in the back
yuanyang7/agentdeck | issue | open | 2026-10-07 | [feedback] opencode chats don't show what a turn left running in the b
Jiawang1209/AgentDeck | issue | open | 2026-07-28 | Question: portable signed receipts for selected Mission / Worker hando
agentdecksdk/agentdeck | issue | open | 2026-08-12 | cli: a read path — list the approval inbox, read a run, answer from th
Jassy930/AgentDeck | issue | open | 2026-09-23 | desktop: #22 后续——侧栏键盘滚动跳屏、点击会话抢走 composer 焦点等
agentdecksdk/agentdeck | issue | open | 2026-08-20 | example: demonstrate session persistence across process runs
agentdecksdk/agentdeck | issue | open | 2026-08-16 | control: add Redis ControlPort support
agentdecksdk/agentdeck | issue | open | 2026-08-29 | client: @agentdeck/client, a JS client for the Native wire
agentdecksdk/agentdeck | issue | open | 2026-08-20 | docs: add an agent-with-mcp example and guide
agentdecksdk/agentdeck | issue | open | 2026-08-16 | leases: add Postgres LeasePort support
agentdecksdk/agentdeck | issue | open | 2026-08-21 | example: demonstrate structured progress reporting with Reporter
agentdecksdk/agentdeck | issue | open | 2026-08-29 | mcp: redesign credential and tool-surface scoping from scratch (supers
agentdecksdk/agentdeck | issue | open | 2026-08-16 | control: add Postgres ControlPort support
agentdecksdk/agentdeck | issue | open | 2026-09-01 | test: AG-UI conformance with the official JS clients (AGUI-7)
puritysb/AgentDeck | issue | open | 2026-10-04 | Release delivery: 1.8.0 channels and store reviews
agentdecksdk/agentdeck | issue | open | 2026-09-04 | finding: SLOP012 blocks a prose correction to a bodyless port file but
agentdecksdk/agentdeck | issue | open | 2026-08-16 | leases: add Redis LeasePort support
DapperMickie/AgentDeck | issue | open | 2026-05-18 | Reference: full local-first AgentDeck feature set
```

</details>

<details><summary>raw · gh search issues &quot;puritysb/AgentDeck&quot; excluding this repo · <code>2026-10-15T15:53:44Z</code> · exit 0</summary>

Command (verbatim):

```bash
gh search issues '"puritysb/AgentDeck"' --limit 50 --json repository,title,author,createdAt,state,url,isPullRequest -- -repo:puritysb/AgentDeck
```

_Projection of `raw/gh_issues_slug.out` (1,366 bytes). Full file kept in `raw/`._

Output:

```
Jacob-Lasky/pocket-dev | issue | open | 2026-09-07 | One skills shelf and one rules body across both CLIs in the image: Codex current
PowerUp-ToolBox/Power_Up_UR_Coding | issue | closed | 2026-08-27 | Reach out to ClaudeGamepad, VibePad, and AgentDeck maintainers
anthropics/claude-code | issue | closed | 2026-07-01 | Harmless local task blocked by overly aggressive safety refusal (codex image-gen
```

</details>

<details><summary>raw · Hacker News Algolia: puritysb/AgentDeck · <code>2026-10-15T15:55:08Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://hn.algolia.com/api/v1/search?query=puritysb%2FAgentDeck&hitsPerPage=50"
```

stderr / status line:

```
HTTP 200
```

Output:

```json
{"exhaustive":{"nbHits":false,"typo":false},"exhaustiveNbHits":false,"exhaustiveTypo":false,"hits":[],"hitsPerPage":50,"nbHits":0,"nbPages":0,"page":0,"params":"query=puritysb%2FAgentDeck&hitsPerPage=50&advancedSyntax=true&analyticsTags=backend","processingTimeMS":14,"processingTimingsMS":{"_request":{"queue":13,"roundTrip":20},"fetch":{"query":12,"total":13},"total":14},"query":"puritysb/AgentDeck","serverTimeMS":27}
```

</details>

<details><summary>raw · Hacker News Algolia: puritysb.github.io in url · <code>2026-10-15T15:56:14Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://hn.algolia.com/api/v1/search?query=puritysb.github.io&restrictSearchableAttributes=url&hitsPerPage=20"
```

stderr / status line:

```
HTTP 200
```

Output:

```json
{"exhaustive":{"nbHits":false,"typo":false},"exhaustiveNbHits":false,"exhaustiveTypo":false,"hits":[],"hitsPerPage":20,"nbHits":0,"nbPages":0,"page":0,"params":"query=puritysb.github.io&restrictSearchableAttributes=url&hitsPerPage=20&advancedSyntax=true&analyticsTags=backend","processingTimeMS":10,"processingTimingsMS":{"_request":{"queue":1,"roundTrip":18},"fetch":{"query":9,"total":10},"total":11},"query":"puritysb.github.io","serverTimeMS":12}
```

</details>

<details><summary>raw · Reddit search.json (blocked) · <code>2026-10-15T15:55:09Z</code> · exit 22</summary>

Command (verbatim):

```bash
curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' "https://www.reddit.com/search.json?q=puritysb+AgentDeck&limit=25&sort=new"
```

stderr / status line:

```
curl: (22) The requested URL returned error: 403
HTTP 403
```

_Projection of `raw/reddit_search.out` (189,908 bytes): body dropped. Full file kept in `raw/`._

Output:

```
HTTP 403 — response body is Reddit's block page (not reproduced)
```

</details>


<details><summary>raw · web searches run (WebSearch tool, 2026-10-15/16)</summary>

| # | Query | Mode | Relevant to this project | Notes |
|:---|:---|:---|:---|:---|
| 1 | AgentDeck Stream Deck Claude Code | standard | Apple listing; shiritomo article | other results are namesakes/competitors (cskwork/streamdeck-agent-cockpit, tomevault, Agent Vitals) |
| 2 | puritysb AgentDeck | standard | none | returned asheshgoplani/agent-deck pages |
| 3 | AgentDeck TRMNL | standard | none | TRMNL's own coverage + unrelated agent-deck projects |
| 4 | AgentDeck Codex Stream Deck | standard | Apple listing | competitors: AgentStreamDeck, VibeDeck (paid), Muxboard, Stream Deck Agent Cockpit |
| 5 | reddit AgentDeck Stream Deck+ Claude Code sessions dashboard e-ink ESP32 open source puritysb | extended | GitHub repo/releases, puritysb.github.io, deepwiki.com/puritysb/AgentDeck, fork bhardwajRahul/AgentDeck | no Reddit thread found |
| 6 | AgentDeck Stream Deck+ Claude Code 動画 いいね AI いっぱい飼っている | standard | shiritomo article | — |
| 7 | AgentDeck 스트림덱 Claude Code Codex 대시보드 오픈소스 puritysb | standard | Apple listing, shiritomo article | no Korean-language article found |
| 8 | AgentDeck Stream Deck+ AI 编码 Agent 物理控制器 puritysb 知乎 掘金 微信 | standard | codex.danielvaughan.com post | no Chinese-language article found |
| 9 | "puritysb/AgentDeck" OR "AgentDeck" Stream Deck Claude Code Zenn OR Qiita OR note.com OR velog OR dev.to OR Medium | standard | Apple listing, shiritomo article | no Zenn/Qiita/note/velog/dev.to/Medium page |

</details>

<details><summary>raw · hashout.jp article (curl) — verification of the claims in 7.1 · <code>2026-10-15T15:55:08Z</code> · exit 0</summary>

Command (verbatim):

```bash
curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code} final=%{url_effective}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' "https://hashout.jp/ai/2290/"
```

stderr / status line:

```
HTTP 200 final=https://hashout.jp/ai/2290/
```

_Projection of `raw/page_hashout.out` (111,725 bytes): facts extracted from the 104 kB page. Full file kept in `raw/`._

Output:

```
HTTP: HTTP 200 final=https://hashout.jp/ai/2290/
ld+json datePublished 2026-06-19T06:15:45+09:00; dateModified 2026-08-21T15:17:27+09:00
visible text: 'AgentDeck' x9, 'puritysb/AgentDeck' x1, '3900' x4, '@goando' x2 (embedded X post dated 2026年6月18日)
```

</details>

## 8. What errored, was substituted, or could not be read

| Item | What happened | Handling |
|---|---|---|
| `gh pr list --json …authorAssociation` | `Unknown JSON field: "authorAssociation"` (exit 1) | field dropped; first attempt kept as `raw/prs_failed_authorAssociation.*` |
| `gh pr list --limit 300` | would silently truncate: 454 PRs exist | used `--limit 1000`; counts reconcile with the GraphQL totals (454 PRs, 95 issues) |
| `git shortlog -sn --since=… ` | without a revision it reads stdin when not on a TTY | added `HEAD` |
| stargazers pagination | `--paginate` alone emits concatenated JSON arrays | added `--slurp` |
| `npm view @agentdeck/plugin` | E404 | expected: package is `private: true` |
| npm download windows | API ended 2026-10-12 although asked for …10-16; later days read 0 | zeros after 10-12 treated as not-yet-reported; Oct = 1–12 |
| Ulanzi first API probe | redirected to the vendor admin login page | stopped; used the public page's own call path; login page untouched |
| Ulanzi / Elgato search pages via curl | client-rendered shells | read in a browser tab (3 pages), tab closed; transcribed under `raw/browser_*.txt` |
| Reddit | search API HTTP 403; browser tool blocked the domain | **could not read** — not inferred absent |
| Apple storefront CN | lookup returned 0 results | recorded as not served in that storefront, ratings unknown |
| Owner-only data | traffic endpoints worked (owner token); App Store Connect, Play Console, Elgato Maker and Ulanzi UGC owner dashboards were **not** accessed | those hold the real install/impression numbers |

## 9. Capture index (every command, verbatim, with UTC time)

| id (raw/<id>.out) | UTC | exit | bytes | command (first 150 chars) |
|:---|:---|:---|:---|:---|
| `graphql_totals` | 2026-10-15T15:43:39Z | 0 | 855 | `gh api graphql -f query='{ repository(owner:"puritysb", name:"AgentDeck") { createdAt pushedAt stargazerCount forkCount watchers { totalCount } licens…` |
| `repo` | 2026-10-15T15:43:39Z | 0 | 6,183 | `gh api repos/puritysb/AgentDeck` |
| `traffic_views` | 2026-10-15T15:43:41Z | 0 | 891 | `gh api repos/puritysb/AgentDeck/traffic/views` |
| `traffic_referrers` | 2026-10-15T15:43:41Z | 0 | 522 | `gh api repos/puritysb/AgentDeck/traffic/popular/referrers` |
| `traffic_clones` | 2026-10-15T15:43:41Z | 0 | 910 | `gh api repos/puritysb/AgentDeck/traffic/clones` |
| `traffic_paths` | 2026-10-15T15:43:42Z | 0 | 1,160 | `gh api repos/puritysb/AgentDeck/traffic/popular/paths` |
| `stargazers` | 2026-10-15T15:43:42Z | 0 | 262,721 | `gh api "repos/puritysb/AgentDeck/stargazers?per_page=100" -H "Accept: application/vnd.github.star+json" --paginate --slurp` |
| `forks` | 2026-10-15T15:43:43Z | 0 | 288,500 | `gh api "repos/puritysb/AgentDeck/forks?per_page=100&sort=newest" --paginate --slurp` |
| `contributors` | 2026-10-15T15:43:45Z | 0 | 8,459 | `gh api "repos/puritysb/AgentDeck/contributors?per_page=100" --paginate --slurp` |
| `git_shortlog_all` | 2026-10-15T15:43:46Z | 0 | 187 | `git -C /Users/puritysb/github/AgentDeck shortlog -sn HEAD` |
| `issues` | 2026-10-15T15:43:46Z | 0 | 39,678 | `gh issue list --repo puritysb/AgentDeck --state all --limit 1000 --json number,author,createdAt,closedAt,state,title,labels` |
| `git_meta` | 2026-10-15T15:43:46Z | 0 | 325 | `cd /Users/puritysb/github/AgentDeck && echo "HEAD: $(git rev-parse --short HEAD) $(git log -1 --format=%cI)" && echo "total commits on HEAD: $(git rev…` |
| `git_shortlog_2026` | 2026-10-15T15:43:46Z | 0 | 187 | `git -C /Users/puritysb/github/AgentDeck shortlog -sn --since=2026-01-01 HEAD` |
| `prs_failed_authorAssociation` | 2026-10-15T15:43:47Z | 1 | 0 | `gh pr list --repo puritysb/AgentDeck --state all --limit 1000 --json number,author,createdAt,closedAt,mergedAt,state,title,isDraft,authorAssociation` |
| `releases_list` | 2026-10-15T15:43:48Z | 0 | 25,418 | `gh release list --repo puritysb/AgentDeck --limit 1000 --json tagName,name,publishedAt,createdAt,isPrerelease,isDraft,isLatest` |
| `releases_assets` | 2026-10-15T15:43:49Z | 0 | 72,469 | `gh api repos/puritysb/AgentDeck/releases --paginate --jq '.[] \| {tag: .tag_name, assets: [.assets[] \| {name, download_count}]}'` |
| `npm_view_setup` | 2026-10-15T15:43:51Z | 0 | 1,987 | `npm view @agentdeck/setup version time --json` |
| `npm_view_bridge` | 2026-10-15T15:43:52Z | 0 | 2,069 | `npm view @agentdeck/bridge version time --json` |
| `npm_view_shared` | 2026-10-15T15:43:53Z | 0 | 1,987 | `npm view @agentdeck/shared version time --json` |
| `npm_view_hooks` | 2026-10-15T15:43:54Z | 0 | 1,946 | `npm view @agentdeck/hooks version time --json` |
| `npm_view_plugin` | 2026-10-15T15:43:55Z | 1 | 339 | `npm view @agentdeck/plugin version time --json` |
| `npm_dl_month_setup` | 2026-10-15T15:43:57Z | 0 | 87 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/point/last-month/@agentdeck/setup` |
| `npm_dl_range_setup` | 2026-10-15T15:43:58Z | 0 | 10,308 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/range/2026-01-01:2026-10-16/@agentdeck/setup` |
| `npm_dl_week_setup` | 2026-10-15T15:43:58Z | 0 | 86 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/point/last-week/@agentdeck/setup` |
| `npm_dl_month_bridge` | 2026-10-15T15:43:59Z | 0 | 88 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/point/last-month/@agentdeck/bridge` |
| `npm_dl_week_bridge` | 2026-10-15T15:43:59Z | 0 | 87 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/point/last-week/@agentdeck/bridge` |
| `npm_dl_range_bridge` | 2026-10-15T15:44:00Z | 0 | 10,312 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/range/2026-01-01:2026-10-16/@agentdeck/bridge` |
| `npm_dl_month_shared` | 2026-10-15T15:44:01Z | 0 | 88 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/point/last-month/@agentdeck/shared` |
| `npm_dl_week_shared` | 2026-10-15T15:44:01Z | 0 | 87 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/point/last-week/@agentdeck/shared` |
| `npm_dl_month_hooks` | 2026-10-15T15:44:02Z | 0 | 87 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/point/last-month/@agentdeck/hooks` |
| `npm_dl_range_shared` | 2026-10-15T15:44:02Z | 0 | 10,311 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/range/2026-01-01:2026-10-16/@agentdeck/shared` |
| `npm_dl_week_hooks` | 2026-10-15T15:44:03Z | 0 | 86 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/point/last-week/@agentdeck/hooks` |
| `npm_dl_range_hooks` | 2026-10-15T15:44:04Z | 0 | 10,301 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' https://api.npmjs.org/downloads/range/2026-01-01:2026-10-16/@agentdeck/hooks` |
| `prs` | 2026-10-15T15:44:45Z | 0 | 143,641 | `gh pr list --repo puritysb/AgentDeck --state all --limit 1000 --json number,author,createdAt,closedAt,mergedAt,state,title,isDraft` |
| `gh_search_repos` | 2026-10-15T15:44:49Z | 0 | 19,650 | `gh search repos agentdeck --limit 50 --json fullName,description,stargazersCount,createdAt,pushedAt,url,owner` |
| `gh_search_repos_quoted` | 2026-10-15T15:44:52Z | 0 | 20,760 | `gh search repos "AgentDeck" --limit 50 --sort stars --json fullName,description,stargazersCount,createdAt,pushedAt,url,owner` |
| `gh_search_issues` | 2026-10-15T15:44:53Z | 0 | 12,207 | `gh search issues "AgentDeck" --limit 30 --json repository,title,author,createdAt,state,url,isPullRequest` |
| `gh_search_issues_ext` | 2026-10-15T15:44:55Z | 0 | 20,544 | `gh search issues "AgentDeck" --limit 50 --json repository,title,author,createdAt,state,url,isPullRequest -- -repo:puritysb/AgentDeck` |
| `gh_search_code_slug` | 2026-10-15T15:44:56Z | 0 | 17,349 | `gh search code "puritysb/AgentDeck" --limit 50 --json repository,path,url -- -repo:puritysb/AgentDeck` |
| `apple_search_mac` | 2026-10-15T15:44:59Z | 0 | 289,241 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/search?term=AgentDeck&entity=macSoftware"` |
| `apple_search_software` | 2026-10-15T15:45:01Z | 0 | 437,380 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/search?term=AgentDeck&entity=software"` |
| `apple_lookup_bundle_us` | 2026-10-15T15:45:02Z | 0 | 10,360 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/lookup?bundleId=bound.serendipity.agent.deck&country=us"` |
| `apple_lookup_id_us` | 2026-10-15T15:45:03Z | 0 | 10,360 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/lookup?id=6784822497&country=us"` |
| `apple_lookup_id_jp` | 2026-10-15T15:45:03Z | 0 | 11,040 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/lookup?id=6784822497&country=jp"` |
| `apple_lookup_id_kr` | 2026-10-15T15:45:03Z | 0 | 10,494 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/lookup?id=6784822497&country=kr"` |
| `apple_lookup_id_fr` | 2026-10-15T15:45:04Z | 0 | 10,373 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/lookup?id=6784822497&country=fr"` |
| `apple_lookup_id_gb` | 2026-10-15T15:45:04Z | 0 | 10,360 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/lookup?id=6784822497&country=gb"` |
| `apple_lookup_id_de` | 2026-10-15T15:45:04Z | 0 | 10,365 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/lookup?id=6784822497&country=de"` |
| `apple_lookup_id_ca` | 2026-10-15T15:45:04Z | 0 | 10,360 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/lookup?id=6784822497&country=ca"` |
| `apple_lookup_id_au` | 2026-10-15T15:45:05Z | 0 | 10,360 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://itunes.apple.com/lookup?id=6784822497&country=au"` |
| `page_apple_us` | 2026-10-15T15:45:05Z | 0 | 513,655 | `curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code}\n' -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gec…` |
| `page_elgato_product` | 2026-10-15T15:45:06Z | 0 | 207,578 | `curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code} final=%{url_effective}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/60…` |
| `page_elgato_search` | 2026-10-15T15:45:08Z | 0 | 134,324 | `curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code} final=%{url_effective}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/60…` |
| `page_ulanzi_content` | 2026-10-15T15:45:09Z | 0 | 1,479 | `curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code} final=%{url_effective}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/60…` |
| `page_play_details` | 2026-10-15T15:45:10Z | 0 | 1,060,873 | `curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code} final=%{url_effective}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/60…` |
| `page_play_search` | 2026-10-15T15:45:10Z | 0 | 1,386,656 | `curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code} final=%{url_effective}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/60…` |
| `page_ulanzi_bundle` | 2026-10-15T15:47:45Z | 0 | 2,915,429 | `curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code} final=%{url_effective}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/60…` |
| `ulanzi_api_resources_single_prefix` | 2026-10-15T15:48:19Z | 0 | 5,089 | `curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code} final=%{url_effective}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/60…` |
| `ulanzi_api_resources` | 2026-10-15T15:49:12Z | 0 | 21,260 | `curl -sS --max-redirs 0 --fail-with-body -w '%{stderr}HTTP %{http_code} redirect=%{redirect_url}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7…` |
| `gh_search_repos_v2` | 2026-10-15T15:53:01Z | 0 | 33,045 | `gh search repos agentdeck --limit 100 --sort stars --json fullName,description,stargazersCount,forksCount,isFork,createdAt,pushedAt,url,language` |
| `gh_code_total_slug` | 2026-10-15T15:53:41Z | 0 | 46 | `gh api -X GET search/code -f q='"puritysb/AgentDeck" -repo:puritysb/AgentDeck' -f per_page=1 --jq '{total_count, incomplete_results}'` |
| `gh_code_slug_v2` | 2026-10-15T15:53:42Z | 0 | 2,324 | `gh search code '"puritysb/AgentDeck"' --limit 100 --json repository,path,url,textMatches -- -repo:puritysb/AgentDeck` |
| `gh_code_total_npm` | 2026-10-15T15:53:43Z | 0 | 45 | `gh api -X GET search/code -f q='"@agentdeck/setup" -repo:puritysb/AgentDeck' -f per_page=1 --jq '{total_count, incomplete_results}'` |
| `gh_issues_slug` | 2026-10-15T15:53:44Z | 0 | 1,366 | `gh search issues '"puritysb/AgentDeck"' --limit 50 --json repository,title,author,createdAt,state,url,isPullRequest -- -repo:puritysb/AgentDeck` |
| `gh_code_api_slug` | 2026-10-15T15:53:59Z | 0 | 21,942 | `gh api -X GET search/code -f q='"puritysb/AgentDeck" -repo:puritysb/AgentDeck' -f per_page=100 --jq '[.items[] \| {repo: .repository.full_name, fork: .…` |
| `gh_code_api_npm` | 2026-10-15T15:54:00Z | 0 | 898 | `gh api -X GET search/code -f q='"@agentdeck/setup" -repo:puritysb/AgentDeck' -f per_page=100 --jq '[.items[] \| {repo: .repository.full_name, fork: .re…` |
| `gh_code_api_site` | 2026-10-15T15:54:00Z | 0 | 520 | `gh api -X GET search/code -f q='"puritysb.github.io/AgentDeck" -repo:puritysb/AgentDeck' -f per_page=100 --jq '{total: .total_count, items: [.items[] …` |
| `gh_code_api_slug_fragments` | 2026-10-15T15:54:24Z | 0 | 121,549 | `gh api -X GET search/code -H 'Accept: application/vnd.github.text-match+json' -f q='"puritysb/AgentDeck" -repo:puritysb/AgentDeck' -f per_page=100 --j…` |
| `page_hashout` | 2026-10-15T15:55:08Z | 0 | 111,725 | `curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code} final=%{url_effective}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/60…` |
| `hn_algolia_slug` | 2026-10-15T15:55:08Z | 0 | 422 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://hn.algolia.com/api/v1/search?query=puritysb%2FAgentDeck&hitsPerPage=50"` |
| `hn_algolia_name` | 2026-10-15T15:55:09Z | 0 | 74,457 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://hn.algolia.com/api/v1/search?query=AgentDeck&tags=story&hitsPerPage=50"` |
| `reddit_search` | 2026-10-15T15:55:09Z | 22 | 189,908 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Geck…` |
| `gh_third_party_files` | 2026-10-15T15:55:10Z | 0 | 5,794 | `for spec in "RockBase-iot/ESPWebApps:agentdeck/README.md" "RockBase-iot/wiki-documents:docs/platform/web-flasher.md" "danielmoraes/dotfiles:streamdeck…` |
| `gh_third_party_meta` | 2026-10-15T15:55:48Z | 0 | 1,289 | `echo "## RockBase-iot/ESPWebApps agentdeck/ commit authors" ⏎ gh api "repos/RockBase-iot/ESPWebApps/commits?path=agentdeck&per_page=10" --jq '.[] \| "\…` |
| `hn_algolia_user` | 2026-10-15T15:55:51Z | 0 | 85,571 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://hn.algolia.com/api/v1/search?query=puritysb&hitsPerPage=50"` |
| `hn_algolia_url` | 2026-10-15T15:56:13Z | 0 | 18,692 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://hn.algolia.com/api/v1/search?query=puritysb&restrictSearchableAttributes=url&hits…` |
| `hn_algolia_url_name` | 2026-10-15T15:56:14Z | 0 | 451 | `curl -sS --fail-with-body -w '%{stderr}HTTP %{http_code}\n' "https://hn.algolia.com/api/v1/search?query=puritysb.github.io&restrictSearchableAttribute…` |
| `apple_lookup_sweep` | 2026-10-15T15:56:36Z | 0 | 1,188 | `for cc in it es nl se ch at be dk no fi ie nz tw hk sg in br mx ru tr pl pt cz il za ae sa th vn id my ph ar cl co cn; do ⏎   body=$(curl -sS --max-ti…` |
| `page_apple_us_mac` | 2026-10-15T16:06:58Z | 0 | 557,762 | `curl -sSL --fail-with-body -w '%{stderr}HTTP %{http_code}\n' -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gec…` |
| `apple_mac_page_sweep` | 2026-10-15T16:07:22Z | 0 | 1,977 | `UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' ⏎ for cc in us kr jp gb de …` |

Not in this index: the 9 WebSearch queries (table in 7.2/7.3), 3 WebFetch reads of the hashout and Elgato editorial pages, and the browser reads (transcribed to `raw/browser_*.txt`).
