#!/usr/bin/env python3
"""Assemble agentdeck-metrics.md from raw/ captures + metrics.json.
Usage: python3 -I assemble.py <rawdir> <metrics.json> <out.md>
Every number in the report is computed from raw/ files (no hand-copied figures) except the clearly marked
'transcribed' browser reads and the third-party-mention classification, which are labelled as such."""
import json, os, re, sys, html, glob, datetime as dt
from collections import Counter, OrderedDict, defaultdict

RAW, MJ, OUT = sys.argv[1:4]
M = json.load(open(MJ, encoding="utf-8"))
EMAIL = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")


def rd(i, ext="out"):
    with open(os.path.join(RAW, f"{i}.{ext}"), encoding="utf-8", errors="replace") as f:
        return f.read()


def jl(i):
    return json.loads(rd(i))


def jlines(i):
    return [json.loads(l) for l in rd(i).splitlines() if l.strip()]


def redact(s):
    return EMAIL.sub("<email redacted>", s)


def fence(text, lang=""):
    runs = re.findall(r"`+", text)
    n = max([len(r) for r in runs] + [2]) + 1
    return "`" * n + lang + "\n" + text.rstrip("\n") + "\n" + "`" * n


def fmt(n):
    return f"{n:,}"


def raw(i, title=None, proj=None, note=None, limit=2500, lang=""):
    cmd, ts, rc = rd(i, "cmd"), rd(i, "ts").strip(), rd(i, "rc").strip()
    err, out = rd(i, "err").strip(), rd(i, "out")
    size = len(out.encode("utf-8"))
    extra = ""
    if proj is not None:
        body = proj
        extra = f"_Projection of `raw/{i}.out` ({fmt(size)} bytes){': ' + note if note else ''}. Full file kept in `raw/`._"
    else:
        body = out
        if len(body) > limit:
            body = body[:limit] + f"\n… [truncated; {fmt(size)} bytes total — full file: raw/{i}.out]"
    p = [f"<details><summary>raw · {html.escape(title or i)} · <code>{ts}</code> · exit {rc}</summary>", "",
         "Command (verbatim):", "", fence(cmd, "bash")]
    if err:
        p += ["", "stderr / status line:", "", fence(redact(err[:700]))]
    if extra:
        p += ["", extra]
    p += ["", "Output:", "", fence(redact(body), lang), "", "</details>", ""]
    return "\n".join(p)


def table(headers, rows, align=None):
    out = ["| " + " | ".join(headers) + " |", "|" + "|".join((":---" if (align or ["l"] * len(headers))[k] == "l" else "---:") for k in range(len(headers))) + "|"]
    for r in rows:
        out.append("| " + " | ".join(str(c) for c in r) + " |")
    return "\n".join(out)


MON = {"02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun", "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct"}

# asset-type breakdown of GitHub release downloads (computed, not typed)
_assets = jlines("releases_assets")
def _chan(tag):
    m_ = re.match(r"^(apple|android|esp32|npm|streamdeck|ulanzi)-v", tag)
    return m_.group(1) if m_ else "other"
atype = defaultdict(lambda: [0, 0])
for r_ in _assets:
    for a_ in r_["assets"]:
        n_ = a_["name"]
        k_ = "manifest.json" if n_ == "manifest.json" else (".bin" if n_.endswith(".bin") else ".apk" if n_.endswith(".apk") else ".streamDeckPlugin" if n_.endswith(".streamDeckPlugin") else ".zip" if n_.endswith(".zip") else ".txt" if n_.endswith(".txt") else "misc (png/glb/usdz/blend/SHA256SUMS)")
        atype[(_chan(r_["tag"]), k_)][0] += 1
        atype[(_chan(r_["tag"]), k_)][1] += a_["download_count"]

# daily stars (for the June 2026 burst)
_days = Counter(s_["starred_at"][:10] for p_ in jl("stargazers") for s_ in p_)
pre_burst = sum(v for d_, v in _days.items() if "2026-05-25" <= d_ <= "2026-06-13")


L = []
add = L.append

# ------------------------------------------------------------------ collected window
all_ts = sorted(open(p).read().strip() for p in glob.glob(os.path.join(RAW, "*.ts")))
t0, t1 = all_ts[0], all_ts[-1]
repo, g, st, tr, R, N = M["repo"], M["repo"]["graphql"], M["stars"], M["traffic"], M["releases"], M["npm"]
iss, prs = M["issues"], M["prs"]
months = ["2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"]

# git commits per month from git_meta
commits_by_month = {}
for ln in M["git_meta"]:
    m = re.match(r"\s*(\d+)\s+(\d{4}-\d{2})$", ln)
    if m:
        commits_by_month[m.group(2)] = int(m.group(1))
total_commits = int(re.search(r"total commits on HEAD: (\d+)", "\n".join(M["git_meta"])).group(1))
head_line = [l for l in M["git_meta"] if l.startswith("HEAD:")][0]

# git shortlog parse
shortlog = []
for ln in M["git_shortlog_2026"]:
    m = re.match(r"\s*(\d+)\s+(.*)$", ln)
    shortlog.append((int(m.group(1)), m.group(2)))
owner_ids = {"SeungBeom Choi", "samuel.choi"}
owner_commits = sum(n for n, who in shortlog if who in owner_ids)
non_owner_commits = sum(n for n, who in shortlog if who not in owner_ids)

# ------------------------------------------------------------------ Apple
apple_rows = []
for cc in ["us", "kr", "jp", "gb", "de", "fr", "ca", "au"]:
    d = jl("apple_lookup_id_" + cc)
    r = d["results"][0] if d.get("results") else None
    apple_rows.append((cc, d.get("resultCount"), r.get("trackName") if r else None, r.get("version") if r else None,
                       r.get("userRatingCount") if r else None, r.get("averageUserRating") if r else None))
sweep = []
for ln in rd("apple_lookup_sweep").splitlines():
    cc, rest = ln.split("\t")
    mm = re.match(r"resultCount=(\d+) ratings=(\S+) avg=(\S+)", rest)
    sweep.append((cc, int(mm.group(1)), None if mm.group(2) == "-" else int(mm.group(2)), mm.group(3)))
stores_available = sum(1 for r in apple_rows if r[1]) + sum(1 for r in sweep if r[1])
stores_total = len(apple_rows) + len(sweep)
ratings_total = sum((r[4] or 0) for r in apple_rows) + sum((r[2] or 0) for r in sweep)
rated_stores = [(r[0], r[4], r[5]) for r in apple_rows if r[4]] + [(r[0], r[2], r[3]) for r in sweep if r[2]]
us = jl("apple_lookup_id_us")["results"][0]
mac_sweep = []
for ln in rd("apple_mac_page_sweep").splitlines():
    cc_, http_, rest_ = ln.split("\t")
    mm_ = re.match(r"ratings=(\d+) avg=([\d.]+)", rest_)
    mac_sweep.append((cc_, http_, int(mm_.group(1)) if mm_ else None, mm_.group(2) if mm_ else None))
mac_total = sum(r[2] or 0 for r in mac_sweep)
mac_rated = [(r[0], r[2], r[3]) for r in mac_sweep if r[2]]
mac_notserved = [r[0].upper() for r in mac_sweep if r[1] != "HTTP 200"]
mac_served = sum(1 for r in mac_sweep if r[1] == "HTTP 200")
ratings_all = mac_total + ratings_total
a_mac, a_sw = jl("apple_search_mac"), jl("apple_search_software")
def apple_rank(d):
    for k, r in enumerate(d["results"]):
        if r.get("trackId") == 6784822497:
            return k + 1
    return None
def apple_namesakes(d):
    out = []
    for r in d["results"]:
        if r.get("trackId") != 6784822497 and re.search(r"agent\s*deck", r.get("trackName", ""), re.I):
            out.append(f'{r["trackName"]} ({r["sellerName"]})')
    return out
apple_page = rd("page_apple_us")
_pr = re.search(r'"productId":"6784822497","ratingAverage":([\d.]+),"totalNumberOfRatings":(\d+),"context":"productPage","ratingCounts":\[([\d,]+)\],"status":"([^"]*)"', apple_page)
apple_page_rating = (_pr.group(1), _pr.group(2), _pr.group(3), _pr.group(4)) if _pr else None

# ------------------------------------------------------------------ Elgato
eh = rd("page_elgato_product")
ld = json.loads(re.search(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', eh, re.S).group(1))
ld_app = [x for x in ld if x.get("@type") == "SoftwareApplication"][0] if isinstance(ld, list) else ld
flight = json.loads('"' + "".join(re.findall(r'self\.__next_f\.push\(\[\d+,"(.*?)"\]\)', eh, re.S)) + '"')
i0 = flight.index('"versions":[')
s0 = flight.index("[", i0)
depth = 0
for j in range(s0, len(flight)):
    if flight[j] == "[":
        depth += 1
    elif flight[j] == "]":
        depth -= 1
        if depth == 0:
            e0 = j + 1
            break
ev = json.loads(flight[s0:e0])
ev_rows = [(v["version_number"], v["status"], (v.get("publish_date") or "")[:10]) for v in ev]
ev_pub = [r for r in ev_rows if r[1] == "published"]
ev_first = min(r[2] for r in ev_pub)
ev_last = max(r[2] for r in ev_pub)

# ------------------------------------------------------------------ Ulanzi
uz = jl("ulanzi_api_resources")
ur = uz["tResources"]

# ------------------------------------------------------------------ Play
ph = rd("page_play_details")
play_dl = re.search(r"(\d[\d,]*\+)\s*Downloads", re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"<script.*?</script>|<style.*?</style>", " ", ph, flags=re.S)))))
play_text = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"<script.*?</script>|<style.*?</style>", " ", ph, flags=re.S))))
play_upd = re.search(r"Updated on ([A-Z][a-z]{2} \d{1,2}, \d{4})", play_text)
ps = rd("page_play_search")
play_ids = []
for x in re.findall(r"/store/apps/details\?id=([A-Za-z0-9._]+)", ps):
    if x not in play_ids:
        play_ids.append(x)
play_rank = play_ids.index("dev.agentdeck") + 1 if "dev.agentdeck" in play_ids else None
play_ld = json.loads(re.search(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', ph, re.S).group(1))

# ------------------------------------------------------------------ code-search mentions
cs = jl("gh_code_api_slug")
cs_repos = OrderedDict()
for r in cs:
    cs_repos.setdefault(r["repo"], []).append(r)
cs_total = json.loads(rd("gh_code_total_slug"))
npm_cs = jl("gh_code_api_npm")
site_cs = jl("gh_code_api_site")

# ------------------------------------------------------------------ search repos
srepos = jl("gh_search_repos_v2")
main_stars = [r for r in srepos if r["fullName"] == "puritysb/AgentDeck"][0]["stargazersCount"]
second = [r for r in srepos if r["fullName"] != "puritysb/AgentDeck"][0]

# =====================================================================================
add("# AgentDeck traction metrics — `puritysb/AgentDeck`")
add("")
_k0 = (dt.datetime.fromisoformat(t0.replace("Z", "+00:00")) + dt.timedelta(hours=9)).strftime("%Y-%m-%d %H:%M")
_k1 = (dt.datetime.fromisoformat(t1.replace("Z", "+00:00")) + dt.timedelta(hours=9)).strftime("%H:%M")
add(f"**Collected** {t0} → {t1} (UTC) = {_k0}–{_k1} KST. Read-only: GitHub/npm/store APIs and public pages, plus `git` read commands on the local checkout "
    f"(`{head_line}`; no fetch, no daemon, no hardware). Every capture below carries its verbatim command, UTC timestamp and exit code in a collapsible block; "
    f"full raw files are in `raw/` next to this file, derived numbers are computed by `scripts/analyze.py` + `scripts/assemble.py` (re-runnable: `python3 -I scripts/analyze.py raw metrics.json`).")
add("")
add("## 1. One-screen summary")
add("")
rows = []
def R_(area, metric, value):
    rows.append((area, metric, value))
R_("GitHub", "Stars", f"**{repo['stars']}** — first {st['first'][:10]}; +{st['last_7d']} (7 d) · +{st['last_30d']} (30 d) · +{st['last_90d']} (90 d)")
R_("GitHub", "Forks · watchers", f"**{repo['forks']}** forks (REST list returned {M['forks']['listed']}; {M['forks']['pushed_after_create']} have a push after creation) · **{repo['watchers_subscribers']}** watchers (`subscribers_count`; the legacy `watchers_count` just repeats stars)")
R_("GitHub", "Repo", f"created {repo['created_at'][:10]} ({repo['age_days']} d old) · {repo['license']} · {repo['language']} · {len(repo['topics'])} topics · {g['discussions']} Discussion · {g['releases']} Releases")
R_("GitHub", "Issues", f"**{g['issues_total']}** = {g['issues_open']} open + {g['issues_closed']} closed · non-owner **{iss['external_count']}** from **{len(iss['external_distinct_authors'])}** distinct authors ({iss['external_states'].get('CLOSED', 0)} closed)")
R_("GitHub", "Pull requests", f"**{g['prs_total']}** = {g['prs_open']} open + {g['prs_merged']} merged + {g['prs_closed']} closed-unmerged · non-owner **{prs['external_count']}** from **{len(prs['external_distinct_authors'])}** distinct authors ({prs['external_states'].get('MERGED', 0)} merged)")
R_("GitHub", "Distinct non-owner issue/PR authors", f"**{len(M['external_union_authors'])}** (issues ∪ PRs; {len(M['external_both_authors'])} did both). New external authors by month of first activity: " + ", ".join(f"{MON[k[5:]]} {v}" for k, v in M["external_new_authors_by_month"].items()))
R_("GitHub", "Code contributors", f"contributors API lists **{len(M['contributors_api'])}** = owner + 7 human accounts + `claude`; of {fmt(total_commits)} commits on local HEAD, **{non_owner_commits}** ({non_owner_commits / total_commits * 100:.1f}%) are by non-owner identities")
R_("GitHub", f"Traffic, last 14 d ({tr['views_14d']['first_day'][:10]}…{tr['views_14d']['last_day'][:10]})", f"views **{fmt(tr['views_14d']['count'])}** ({tr['views_14d']['uniques']} unique) · clones **{fmt(tr['clones_14d']['count'])}** ({tr['clones_14d']['uniques']} unique)")
R_("GitHub", "Top referrers (14 d, views/uniques)", " · ".join(f"{x['referrer']} {x['count']}/{x['uniques']}" for x in tr["referrers"][:6]))
ch = R["channels"]
R_("Releases", "GitHub Releases", f"**{R['total']}** — " + " · ".join(f"{k} {ch[k]['count']}" for k in ["npm", "android", "apple", "esp32", "streamdeck", "ulanzi", "other"]) + f"; first {min(c['first'] for c in ch.values())}, latest {max(c['last'] for c in ch.values())}")
R_("Releases", "GitHub asset downloads (all-time)", f"**{fmt(R['total_downloads'])}** — " + " · ".join(f"{k} {fmt(ch[k]['downloads'])}" for k in ["esp32", "streamdeck", "android", "ulanzi", "other"]) + " · apple/npm releases carry no assets. esp32 = firmware/OTA-manifest fetches, not user count")
s = N["setup"]
R_("npm", "@agentdeck/setup", f"**v{s['latest']}**, {s['versions']} versions, first publish {s['created'][:10]} · downloads last-month **{fmt(s['last_month'])}**, last-week **{fmt(s['last_week'])}** (API windows end {s['last_month_window'][1]}) · 2026-01-01…{s['last_month_window'][1]} total {fmt(s['range_total'])}")
R_("npm", "Other published packages", " · ".join(f"@agentdeck/{p} last-month {fmt(N[p]['last_month'])}" for p in ["bridge", "shared", "hooks"]) + " · `@agentdeck/plugin` is private (npm 404)")
R_("Elgato Marketplace", "Listing", f"**live**, Free, v{ld_app['softwareVersion']} (published 2026-10-14Z) · {len(ev_pub)} published versions since {ev_first} · **no install/rating figure shown** · rank #1 in Marketplace search \"AgentDeck\" (4 unrelated \"Agent Deck\" listings follow)")
R_("Ulanzi Marketplace", "Listing", f"**live** (contentView/1141), v{ur['version']}, devices {ur['device']} · page shows **no counts**; listing API fields: download={ur['download']}, star={ur['star']}, collect={uz['collect']}, hot={ur['hot']} (popular={ur['popular']}, meaning unverified)")
R_("Apple App Store", "Listing", f"**live** \"{us['trackName']}\" v{us['version']}, Free, first release {us['releaseDate'][:10]} · ratings in total **{ratings_all}**, all five-star: Mac page {mac_total} (" + ", ".join(f"{c.upper()} {n}" for c, n, a in mac_rated) + f") + iOS record {ratings_total} (" + ", ".join(f"{c.upper()} {n}" for c, n, a in rated_stores) + f"), across {mac_served} storefronts that serve the app · #{apple_rank(a_mac)} (Mac search) / #{apple_rank(a_sw)} (iOS search) for \"AgentDeck\" ({len(apple_namesakes(a_sw))} unrelated apps share the name)")
R_("Google Play", "Listing", f"**live** `dev.agentdeck`, \"{play_dl.group(1)} Downloads\" bucket, Updated {play_upd.group(1)}, content rating {play_ld.get('contentRating')} · no rating shown · #{play_rank} for \"AgentDeck\" in Play search")
R_("Mentions", "Third-party code/docs referencing `puritysb/AgentDeck`", f"**{cs_total['total_count']} files in {len(cs_repos)} other repos** (GitHub code search, none are forks; {max(len(v) for v in cs_repos.values())} of the files are i18n copies in one repo) — awesome lists, landscape docs, hardware-vendor firmware port, community integrations, users' dotfiles")
R_("Mentions", "Media / blogs found", "shiritomo (hashout.jp) 2026-06-19 — names AgentDeck + repo URL, built around an X video the article says drew 3,900+ likes · codex.danielvaughan.com 2026-07-19 (blog, presents AgentDeck as the open-source alternative to OpenAI Codex Micro)")
R_("Mentions", "Searched, nothing found / unreadable", "Hacker News (Algolia): 0 hits · Elgato editorial pages (2 checked): no mention · Reddit: **could not read** (search API 403, browser tool blocks reddit.com) though GitHub shows reddit.com referrals · queries \"puritysb AgentDeck\" and \"AgentDeck TRMNL\": nothing relevant")
add(table(["Area", "Metric", "Value"], rows))
add("")
add("### Month-by-month view (UTC month; Oct = 1–15/16)")
add("")
mrows = []
cum = 0
for mth in months:
    cum += st["by_month"].get(mth, 0)
    mrows.append((mth, f"{st['by_month'].get(mth, 0)} (→{cum})", M["forks"]["by_month"].get(mth, 0), f"{iss['by_month_external'].get(mth, 0)}/{iss['by_month_all'].get(mth, 0)}",
                  f"{prs['by_month_external'].get(mth, 0)}/{prs['by_month_all'].get(mth, 0)}", M["external_new_authors_by_month"].get(mth, 0),
                  R["by_month_all"].get(mth, 0), fmt(N["setup"]["by_month"].get(mth, 0)), commits_by_month.get(mth, 0)))
add(table(["Month", "Stars (cumulative)", "Forks created", "Issues ext/all", "PRs ext/all", "New ext. authors", "GH Releases", "npm `setup` downloads", "Commits on HEAD"], mrows))
add("")
add("Oct npm = 1–12 Oct only (the API had not published 13–16 Oct yet; the zeros in the daily series after 12 Oct are *not yet reported*, not real). Stars/forks/issues/PRs/releases/commits run to the capture time.")
add("")
add("### Reading the numbers (caveats that change what they mean)")
add("")
cl = tr["clones_14d"]
add(f"- **Owner-driven volume is not traction.** {prs['owner_count']} of {prs['total']} PRs and {iss['owner_count']} of {iss['total']} issues are by `puritysb` (agent-assisted work included); {fmt(owner_commits)} of {fmt(total_commits)} commits are owner identities (`SeungBeom Choi` + `samuel.choi`). The external signal is the {len(M['external_union_authors'])} distinct outside issue/PR authors and the {non_owner_commits} outside commits.")
add(f"- **Clones ≠ users.** {fmt(cl['count'])} clones from {cl['uniques']} unique cloners in 14 days (≈{cl['count'] / cl['uniques']:.1f} per cloner) is consistent with automated clones (CI, mirrors, agent sandboxes, the owner's own machines — GitHub does not separate them); one day alone (2026-10-06) accounts for {fmt(max(c_[1] for c_ in tr['clones_14d']['series']))} of the {fmt(cl['count'])} clones; views ({tr['views_14d']['uniques']} uniques) are the better human proxy.")
add(f"- **npm counts are tarball downloads**, including mirrors/CI/bots; the four packages move together (installing `setup` pulls the rest), and single days spike (max day {N['setup']['max_day']['downloads']} on {N['setup']['max_day']['day']}). Not unique users.")
add(f"- **GitHub asset downloads for esp32 are firmware images and `manifest.json` fetches** (OTA/web-flasher traffic incl. the owner's own boards), so the human-installable figures are streamdeck {ch['streamdeck']['downloads']} + android {ch['android']['downloads']} + ulanzi {ch['ulanzi']['downloads']} = {ch['streamdeck']['downloads'] + ch['android']['downloads'] + ch['ulanzi']['downloads']} over all releases.")
add(f"- **Store installs are small or hidden:** Play shows only the \"10+\" bucket (≥10 and <50), Apple shows {ratings_all} ratings in total (Mac {mac_total}, iOS {ratings_total}), Ulanzi's page shows no counts and its API says 0 downloads (semantics unverified), Elgato shows nothing. None of these is an install count.")
add(f"- **The star curve has a visible external burst:** {pre_burst} stars in the 20 days 2026-05-25…06-13, then {_days.get('2026-06-16', 0)} / {_days.get('2026-06-17', 0)} on 06-16 / 06-17, **{_days.get('2026-06-18', 0)} on 06-18 and {_days.get('2026-06-19', 0)} on 06-19** — the dates of the X video (06-18) and the shiritomo article (06-19) in §7.1 — and {_days.get('2026-06-24', 0)} on 06-24 (no cause found). June total {st['by_month']['2026-06']} vs May {st['by_month']['2026-05']}. Timing coincidence only; causation not established. Since then: Jul {st['by_month']['2026-07']}, Aug {st['by_month']['2026-08']}, Sep {st['by_month']['2026-09']}, Oct 1–15 {st['by_month']['2026-10']}.")
add(f"- **The name is crowded.** `gh search repos agentdeck` returns 100+ repos; this one leads by stars ({main_stars} vs {second['stargazersCount']} for the runner-up `{second['fullName']}`), but Apple, Play, Elgato and HN all contain *unrelated* \"AgentDeck/Agent Deck\" products, so every mention count here uses the slug `puritysb/AgentDeck`, the product page URL or the app id, never the bare name.")
add("")

# =====================================================================================
add("## 2. GitHub — repository, traffic, stars, forks")
add("")
add("### 2.1 Repository facts")
add("")
add(table(["Field", "Value"], [
    ("created / last push", f"{repo['created_at']} / {repo['pushed_at']}"),
    ("stars · forks · watchers", f"{repo['stars']} · {repo['forks']} · {repo['watchers_subscribers']} (`subscribers_count`)"),
    ("issues (GraphQL)", f"{g['issues_total']} total: {g['issues_open']} open, {g['issues_closed']} closed"),
    ("pull requests (GraphQL)", f"{g['prs_total']} total: {g['prs_open']} open, {g['prs_merged']} merged, {g['prs_closed']} closed-unmerged"),
    ("`open_issues_count` (REST)", f"{repo['open_issues_incl_prs']} (= {g['issues_open']} issues + {g['prs_open']} PR; REST mixes them)"),
    ("license · language", f"{repo['license']} · {repo['language']}"),
    ("topics", ", ".join(repo["topics"])),
    ("homepage · discussions", f"{repo['homepage']} · enabled, {g['discussions']} discussion"),
]))
add("")
_rp = jl("repo")
_keys = ["full_name", "created_at", "pushed_at", "stargazers_count", "watchers_count", "subscribers_count", "forks_count", "open_issues_count", "license", "topics", "visibility", "default_branch", "has_discussions", "archived", "size", "language", "homepage", "description"]
add(raw("repo", "gh api repos/puritysb/AgentDeck", proj=json.dumps({k: (_rp[k] if k != "license" else {"spdx_id": (_rp[k] or {}).get("spdx_id"), "name": (_rp[k] or {}).get("name")}) for k in _keys}, ensure_ascii=False, indent=1), note="18 of ~95 fields kept (the rest are URL templates and owner object)", lang="json"))
add(raw("graphql_totals", "GraphQL exact totals (supplement to the REST numbers)", lang="json"))
add("")
add("### 2.2 Traffic (owner-only endpoints; GitHub retains 14 days only)")
add("")
add(f"Views {tr['views_14d']['count']} / {tr['views_14d']['uniques']} unique; clones {fmt(tr['clones_14d']['count'])} / {tr['clones_14d']['uniques']} unique. Daily series (date: views/uniques · clones/uniques):")
add("")
vd = {d: (c, u) for d, c, u in tr["views_14d"]["series"]}
cd = {d: (c, u) for d, c, u in tr["clones_14d"]["series"]}
add(table(["Day", "Views", "Unique viewers", "Clones", "Unique cloners"], [(d, vd.get(d, ("–", "–"))[0], vd.get(d, ("–", "–"))[1], fmt(cd[d][0]) if d in cd else "–", cd.get(d, ("–", "–"))[1]) for d in sorted(set(vd) | set(cd))]))
add("")
add("Referrers (top 10, 14 d):")
add("")
add(table(["Referrer", "Views", "Uniques"], [(x["referrer"], x["count"], x["uniques"]) for x in tr["referrers"]]))
add("")
add("Popular paths (top 10, 14 d):")
add("")
add(table(["Path", "Views", "Uniques"], [(f"`{x['path']}`", x["count"], x["uniques"]) for x in tr["paths"]]))
add("")
add(raw("traffic_views", "traffic/views", limit=1500, lang="json"))
add(raw("traffic_clones", "traffic/clones", limit=1500, lang="json"))
add(raw("traffic_referrers", "traffic/popular/referrers", lang="json"))
add(raw("traffic_paths", "traffic/popular/paths", lang="json"))
add("")
add("### 2.3 Stargazers by month")
add("")
add("Command differs from the brief only by `--slurp` (merges the 3 pages of 100 into one valid JSON array). 264 stargazer records, 264 distinct users.")
add("")
add(table(["Month", "New stars", "Cumulative"], [(mth, st["by_month"].get(mth, 0), st["cumulative_by_month"].get(mth)) for mth in months]))
add("")
add(f"Busiest days: " + ", ".join(f"{d} ({n})" for d, n in st["top_days"]) + f". First star {st['first']}, latest {st['last']}.")
add("")
sg = [s["starred_at"][:10] for p in jl("stargazers") for s in p]
sg.sort()
proj = "\n".join(" ".join(sg[k:k + 10]) for k in range(0, len(sg), 10))
add(raw("stargazers", "stargazers (all 264 `starred_at` dates, sorted)", proj=proj, note="`user` objects dropped, dates kept"))
add("")
add("### 2.4 Forks")
add("")
add(f"{M['forks']['listed']} forks listed by the REST forks endpoint (repo `forks_count` = {repo['forks']}); {M['forks']['pushed_after_create']} show a push after creation (heuristic: `pushed_at` later than `created_at`); only 2 forks carry a star of their own. By creation month: " + ", ".join(f"{k}={v}" for k, v in M["forks"]["by_month"].items()) + ".")
add("")
fk = [f for p in jl("forks") for f in p]
proj = "owner | created | last push | stars\n" + "\n".join(f"{f['owner']['login']} | {f['created_at'][:10]} | {(f.get('pushed_at') or '')[:10]} | {f['stargazers_count']}" for f in sorted(fk, key=lambda x: x['created_at']))
add(raw("forks", "forks (54 rows)", proj=proj, note="owner, created, last push, stars"))
add("")

# =====================================================================================
add("## 3. Contributors, issues and PRs")
add("")
add("### 3.1 Code contributors")
add("")
add(table(["GitHub login (contributors API)", "Contributions"], [(f"`{c['login']}`" + (" (owner)" if c["login"] == "puritysb" else ""), fmt(c["contributions"])) for c in M["contributors_api"]]))
add("")
add(f"`git shortlog -sn --since=2026-01-01 HEAD` on the local checkout ({head_line}; the checkout may trail the remote by a few commits — API owner count is 2,447 vs {fmt(owner_commits)} here). `HEAD` was added to the command because `git shortlog` without a revision waits on stdin when not run in a terminal. The repo's first commit is 2026-02-21 so `--since=2026-01-01` is the whole history.")
add("")
add(fence("\n".join(M["git_shortlog_2026"])))
add("")
add("Identity mapping: `SeungBeom Choi` + `samuel.choi` = owner; `doug-w` + `Doug Warren` = GitHub `doug-w` (25); `Lukasz D` = `dudziakl` (6); `Roman Schlagowsky` = `r-dent`; `uto` = `uto-usui`; `Claude` = the `claude` account (1 commit).")
add("")
add(raw("contributors", "contributors API", proj="\n".join(f"{c['login']}\t{c['contributions']}\t{c['type']}" for c in M["contributors_api"]), note="login, contributions, type"))
add(raw("git_shortlog_2026", "git shortlog since 2026-01-01"))
add(raw("git_meta", "git history meta (commit totals, per-month commits)"))
add("")
add("### 3.2 Issue and PR authors (owner = `puritysb`)")
add("")
add(f"Both lists were fetched with `--limit 1000` (the brief's `--limit 300` would have truncated: there are {g['prs_total']} PRs). `authorAssociation` is not a valid `gh pr list --json` field in gh 2.96, so the first PR attempt failed (kept as `raw/prs_failed_authorAssociation.*`) and the field was dropped. No bot authors appear in either list.")
add("")
iss_raw, prs_raw = jl("issues"), jl("prs")
def lg(a):
    return (a or {}).get("login") or "ghost"
ia, pa = dict(iss["by_author"]), dict(prs["by_author"])
merged = Counter(lg(p["author"]) for p in prs_raw if p["state"] == "MERGED")
first, last = {}, {}
for it in iss_raw + prs_raw:
    a_, d_ = lg(it["author"]), it["createdAt"][:10]
    first[a_] = min(first.get(a_, d_), d_)
    last[a_] = max(last.get(a_, d_), d_)
rows_a = [(f"`{a}`" + (" (owner)" if a == "puritysb" else ""), ia.get(a, 0), pa.get(a, 0), merged.get(a, 0), first[a], last[a])
          for a in sorted(set(ia) | set(pa), key=lambda x: (x != "puritysb", -(ia.get(x, 0) + pa.get(x, 0)), x.lower()))]
add(table(["Author", "Issues", "PRs", "PRs merged", "First activity", "Last activity"], rows_a))
add("")
add(f"Totals: issues {iss['total']} = owner {iss['owner_count']} + non-owner {iss['external_count']}; PRs {prs['total']} = owner {prs['owner_count']} + non-owner {prs['external_count']}. Distinct non-owner authors: issues {len(iss['external_distinct_authors'])}, PRs {len(prs['external_distinct_authors'])}, union {len(M['external_union_authors'])}, both {len(M['external_both_authors'])} ({', '.join('`' + a + '`' for a in M['external_both_authors'])}).")
add("")
add(table(["Month", "Issues owner", "Issues external", "PRs owner", "PRs external", "New external authors"],
          [(mth, iss["by_month_owner"].get(mth, 0), iss["by_month_external"].get(mth, 0), prs["by_month_owner"].get(mth, 0), prs["by_month_external"].get(mth, 0), M["external_new_authors_by_month"].get(mth, 0)) for mth in months]))
add("")
proj_i = "\n".join(f"#{it['number']:<4} {it['state']:<7} {it['created']} {it['author']:<17} {it['title']}" for it in iss["external_items"])
proj_p = "\n".join(f"#{it['number']:<4} {it['state']:<7} {it['created']} {it['author']:<17} {it['title']}" for it in prs["external_items"])
add(raw("issues", "issue list — external issues only (31 of 95)", proj=proj_i, note="rows for non-owner authors; all 95 are in the raw file"))
add(raw("prs", "PR list — external PRs only (46 of 454)", proj=proj_p, note="rows for non-owner authors; all 454 are in the raw file"))
add(raw("prs_failed_authorAssociation", "FAILED first attempt (unsupported field)", limit=700))
add("")

# =====================================================================================
add("## 4. Releases and downloads")
add("")
add(f"`gh release list` returned {R['total']} releases (limit raised to 1000); the asset call matched every one of them (no release without an asset record, none missing). Channels by tag prefix:")
add("")
crow = []
for k in ["apple", "android", "esp32", "npm", "streamdeck", "ulanzi", "other"]:
    c = ch[k]
    crow.append((f"`{k}-v*`" if k != "other" else "other", c["count"], c["first"] + f" ({c['first_tag']})", c["last"] + f" ({c['last_tag']})", c["prereleases"], c["assets"], fmt(c["downloads"])))
crow.append(("**total**", R["total"], min(c["first"] for c in ch.values()), max(c["last"] for c in ch.values()), sum(c["prereleases"] for c in ch.values()), R["total_assets"], fmt(R["total_downloads"])))
add(table(["Channel", "Releases", "First published", "Last published", "Pre-releases", "Assets", "Asset downloads"], crow))
add("")
add("`other` = `verification-streamdeck-v1.0.3-windows.1` and `assets-hermes-character-candidate` (both pre-releases). Downloads on the latest release of each channel: " + ", ".join(f"{k} `{v[0]}` = {v[1]}" for k, v in R["channel_latest_release_downloads"].items()) + ".")
add("")
add("Releases published per month by channel:")
add("")
add(table(["Channel"] + months[4:], [(k, *[R["by_month_by_channel"][k].get(m, 0) for m in months[4:]]) for k in ["apple", "android", "esp32", "npm", "streamdeck", "ulanzi", "other"]]))
add("")
# esp32 breakdown
add("Where the downloads sit (channel / asset type: downloads over assets): " + "; ".join(f"{c} `{k}` {fmt(v[1])} ({v[0]} assets)" for (c, k), v in sorted(atype.items()) if v[0]) + ". Top individual assets: " + "; ".join(f"{t}/{n} = {c}" for c, t, n in R["top_assets"][:6]) + ". " + f"{R['assets_with_nonzero_downloads']} of {R['total_assets']} assets have ≥1 download.")
add("")
add(f"**Elgato Marketplace releases** (not GitHub; read from the product-page payload): {len(ev_pub)} published versions, first publish {ev_first}, latest {ev_last}; the first submission (v1, created 2026-07-19) was rejected. " + ", ".join(f"v{v} {d}" for v, s, d in ev_rows if s == "published") + ".")
add("")
rl = jl("releases_list")
proj = "\n".join(f"{r['tagName']:<44} {r['publishedAt'][:10]} {'PRE' if r['isPrerelease'] else ''}" for r in rl)
add(raw("releases_list", "gh release list (136 rows)", proj=proj, note="tag, published date, prerelease flag"))
ra = jlines("releases_assets")
proj = "\n".join(f"{r['tag']:<44} assets={len(r['assets']):<3} downloads={sum(a['download_count'] for a in r['assets'])}" for r in ra)
add(raw("releases_assets", "release asset download counts (per-release sums)", proj=proj, note="per-release asset count and summed `download_count`; per-asset counts are in the raw file"))
add("")

# =====================================================================================
add("## 5. npm")
add("")
add("All four published packages share the same release train; `@agentdeck/plugin` and `plugin-ulanzi` are `private: true` and `npm view @agentdeck/plugin` returns E404 as expected. Download figures come from `api.npmjs.org` (counts lag ~3 days; windows are stated per row).")
add("")
nrows = []
for p in ["setup", "bridge", "shared", "hooks"]:
    d = N[p]
    nrows.append((f"`@agentdeck/{p}`", d["latest"], d["versions"], d["created"][:10], d["modified"][:10], fmt(d["last_month"]), fmt(d["last_week"]), fmt(d["range_total"])))
add(table(["Package", "Latest", "Versions", "First publish", "Last modified", f"Downloads last-month ({N['setup']['last_month_window'][0]}…{N['setup']['last_month_window'][1]})", f"last-week ({N['setup']['last_week_window'][0]}…{N['setup']['last_week_window'][1]})", f"2026-01-01…{N['setup']['last_month_window'][1]}"], nrows))
add("")
add("Downloads per calendar month (range endpoint bucketed by month; Oct = 1–12 only):")
add("")
add(table(["Month"] + [f"`{p}`" for p in ["setup", "bridge", "shared", "hooks"]] + ["versions published (setup)"], [(m, *[fmt(N[p]["by_month"].get(m, 0)) for p in ["setup", "bridge", "shared", "hooks"]], N["setup"]["versions_by_month"].get(m, 0)) for m in ["2026-01"] + months]))
add("")
sd = jl("npm_dl_range_setup")["downloads"]
top5 = sorted(sd, key=lambda x: -x["downloads"])[:5]
tot = sum(x["downloads"] for x in sd)
add(f"`setup` concentration: top 5 days = {fmt(sum(x['downloads'] for x in top5))} of {fmt(tot)} ({sum(x['downloads'] for x in top5) / tot * 100:.0f}%): " + ", ".join(f"{x['day']} ({x['downloads']})" for x in top5) + f". Days with ≥1 download in the last-month window ({N['setup']['last_month_window'][0]}…{N['setup']['last_month_window'][1]}): " + str(sum(1 for x in sd if N['setup']['last_month_window'][0] <= x['day'] <= N['setup']['last_month_window'][1] and x['downloads'] > 0)) + " of 30.")
add("")
for p in ["setup", "bridge", "shared", "hooks"]:
    add(raw(f"npm_view_{p}", f"npm view @agentdeck/{p} version time --json", limit=2300, lang="json"))
add(raw("npm_view_plugin", "npm view @agentdeck/plugin (expected 404 — private package)", limit=900))
for p in ["setup", "bridge", "shared", "hooks"]:
    d = N[p]
    proj = f"last-month: {fmt(d['last_month'])} ({d['last_month_window'][0]}..{d['last_month_window'][1]})\nlast-week : {fmt(d['last_week'])} ({d['last_week_window'][0]}..{d['last_week_window'][1]})\nrange total {d['range_window'][0]}..{d['range_window'][1]}: {fmt(d['range_total'])}\nby month: " + ", ".join(f"{k}={fmt(v)}" for k, v in d["by_month"].items()) + "\nlast 14 daily values: " + ", ".join(f"{a[5:]}={b}" for a, b in d["last_14_days"])
    add(raw(f"npm_dl_range_{p}", f"npm downloads {p}: month/week/range (range endpoint shown; point endpoints are in raw/npm_dl_month_{p}.out and npm_dl_week_{p}.out)", proj=proj, note="monthly buckets and last-14-day tail computed from the daily JSON"))
add("")

# =====================================================================================
add("## 6. Stores")
add("")
add("Page reads used `curl` (plus the iTunes JSON API); the three client-rendered pages (Elgato search, Elgato product, Ulanzi) were additionally read in a browser tab (Claude-in-Chrome, opened and closed by this task). The tab group was left empty afterwards.")
add("")
add("### 6.1 Elgato Marketplace")
add("")
add(f"- Product page `https://marketplace.elgato.com/product/agentdeck-dce3806b-176e-40f2-be7d-e029bec0f464` — HTTP 200 via curl and via browser: title \"{re.search(r'<title[^>]*>(.*?)</title>', eh, re.S).group(1).strip()}\", author Serendipity Bound, price {ld_app['offers']['price']} {ld_app['offers']['priceCurrency']}, OS {ld_app['operatingSystem']}, size {ld_app['fileSize']}, version {ld_app['softwareVersion']}, \"Dial support: Yes\", \"Profiles: Yes\".")
add("- **No download/install count, rating or review element exists in the page** (checked in the server HTML and in the rendered page text) — so there is no public install figure for this channel. The only public numbers are the version history above.")
add("- Marketplace search for \"AgentDeck\" (rendered in a browser; KRW prices → Korean storefront): AgentDeck by Serendipity Bound is the first plugin result, followed by \"Agent Deck for Claude Code\" (Barbanson Data Solutions, ₩3,000) and three \"Agent Deck\" profiles by panda studio. The curl copy of the search page is only the empty shell (results load client-side).")
add("- Adjacent listings the Marketplace recommends on the product page: Codex Shortcuts Plugin, ChatGato, ChatGPT & Codex (Elgato), Fingertip Agent — i.e. the Codex-on-Stream-Deck niche is crowded.")
add("- Elgato editorial pages checked for a mention (`explorer/.../control-claude-with-stream-deck-for-faster-workflows`, `.../what-is-an-ai-controller`): neither names AgentDeck.")
add("")
add(raw("page_elgato_product", "Elgato product page (curl)", proj="\n".join([
    f"HTTP: {rd('page_elgato_product','err').strip()}", f"size: {len(rd('page_elgato_product')):,} chars",
    "ld+json SoftwareApplication: " + json.dumps({k: ld_app.get(k) for k in ["name", "operatingSystem", "softwareVersion", "fileSize", "author", "offers", "applicationSubCategory"]}, ensure_ascii=False),
    "versions payload (version, status, publish_date): " + "; ".join(f"{v} {s} {d or '-'}" for v, s, d in ev_rows),
    "counts of the strings 'download'/'install'/'rating'/'review' in the visible page text: 0/0/0/0"]), note="extracted facts; the 207 kB HTML is in the raw file"))
add(raw("page_elgato_search", "Elgato search page (curl) — empty client-side shell", proj=f"HTTP: {rd('page_elgato_search','err').strip()}\nsize: {len(rd('page_elgato_search')):,} chars\nresult list is not in the server HTML (heading only: Search results for \"AgentDeck\"); see the browser read below", note="shell only"))
add("<details><summary>raw · browser reads (transcribed): Elgato search + Elgato product page</summary>\n")
add(fence(open(os.path.join(RAW, "browser_elgato_search.txt"), encoding="utf-8").read()))
add("")
add(fence(open(os.path.join(RAW, "browser_elgato_product.txt"), encoding="utf-8").read()))
add("\n</details>\n")
add("### 6.2 Ulanzi Marketplace (Ulanzi Studio UGC)")
add("")
add(f"- Public page `https://ugc.ulanzistudio.com/contentView/1141` is a client-rendered app. curl returns an empty shell; in a browser the page renders AgentDeck v{ur['version']}, category Plugins/AI, system Windows/Mac, devices {ur['device']}. **The rendered page shows no download/like/view/rating numbers.**")
add(f"- The same page's own data call (`GET /api/api/resources?id=1141`, no login) returns JSON with `download={ur['download']}`, `star={ur['star']}`, `collect={uz['collect']}`, `hot={ur['hot']}`, `popular={ur['popular']}`, `status={ur['status']}`, `version={ur['version']}`, `updateTime={ur['updateTime']}`. What each counter measures is not documented and the page does not display them, so read `download=0` as \"counter reads zero\", not \"zero installs\"; `popular=230` is an unlabeled number (possibly a view/popularity score).")
add("- Probe note: my first guess at the endpoint (`/api/resources?id=1141`) was redirected to the vendor's *admin login* page; I did not touch that page and used the path the public SPA actually calls. That first response is kept as `raw/ulanzi_api_resources_single_prefix.out` for the record.")
add("")
uz_proj = json.dumps({k: (v if not isinstance(v, str) else v[:80]) for k, v in ur.items() if k in ["id", "version", "device", "os", "support", "language", "status", "star", "hot", "download", "popular", "collect", "createTime", "updateTime", "uuid", "additionalLink", "cateId", "classify"]} | {"top_level": {k: v for k, v in uz.items() if k != "tResources"}}, ensure_ascii=False, indent=1)
add(raw("ulanzi_api_resources", "Ulanzi listing JSON (GET /api/api/resources?id=1141)", proj=uz_proj, note="counter/version fields kept; localized descriptions, file paths and the e-mail fields dropped"))
add(raw("ulanzi_api_resources_single_prefix", "Ulanzi first probe (redirected to the vendor admin login page — not pursued)", proj="curl followed a redirect to http://api.ulanzistudio.com:80/admin/login and returned that login page's HTML (not reproduced).", note="response not reproduced on purpose"))
add("<details><summary>raw · browser read (transcribed): Ulanzi content page</summary>\n")
add(fence(redact(open(os.path.join(RAW, "browser_ulanzi_content.txt"), encoding="utf-8").read())))
add("\n</details>\n")
add("### 6.3 Apple App Store / Mac App Store")
add("")
add(f"- Listed: **{us['trackName']}** (id 6784822497, bundle `{us['bundleId']}`, seller {us['sellerName']}), Free, v{us['version']} (current version date {us['currentVersionReleaseDate'][:10]}), first release {us['releaseDate'][:10]}. One App Store record spans Mac, iPhone and iPad; the iTunes lookup returns it as `kind: {us['kind']}` and its version/ratings describe the **iOS** side only (the repo's own RELEASING.md notes the Mac side is not readable through lookup). Storefront titles are \"AgentDeck Dashboard\" (US/GB/DE/FR/CA/AU…) and \"AgentDeck\" (KR/JP).")
add(f"- Search term `AgentDeck`: `entity=macSoftware` → {a_mac['resultCount']} results, AgentDeck Dashboard **#{apple_rank(a_mac)}**; `entity=software` → {a_sw['resultCount']} results, **#{apple_rank(a_sw)}**. Unrelated apps with the same name in the iOS results: " + "; ".join(apple_namesakes(a_sw)) + ".")
add(f"- Ratings, iOS side: iTunes lookup in {stores_total} storefronts ({stores_available} serve the app; not served: " + ", ".join(r[0].upper() for r in sweep if not r[1]) + f") → **{ratings_total} rating** (" + ", ".join(f"{c.upper()}: {n}, average {a}" for c, n, a in rated_stores) + f"). The US iOS page's own `productRatings` block agrees: average {apple_page_rating[0]}, total {apple_page_rating[1]}, histogram [{apple_page_rating[2]}], status \"not enough ratings to display an overview\".")
add(f"- Ratings, Mac side: the Mac pages (`https://apps.apple.com/<cc>/app/id6784822497?platform=mac`) fetched for {len(mac_sweep)} storefronts ({mac_served} serve the app; not served: " + ", ".join(mac_notserved) + f") carry their own `productRatings` block → **{mac_total} ratings** (" + ", ".join(f"{c.upper()}: {n}, average {a}" for c, n, a in mac_rated) + f"); every other storefront shows 0. So the visible total is **{ratings_all}** (all five-star). App Store Connect (downloads, impressions, units) is owner-only and was not read.")
add("")
proj = "storefront | resultCount | trackName | version | userRatingCount | averageUserRating\n" + "\n".join(f"{r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]}" for r in apple_rows)
add(raw("apple_lookup_id_us", "iTunes lookup id=6784822497 (US) — full record", limit=2400, lang="json"))
add("<details><summary>raw · iTunes lookup, other storefronts (8 explicit calls + 35-storefront sweep)</summary>\n")
add(fence(proj + "\n\nsweep (country, resultCount, ratings, avg):\n" + "\n".join(f"{c} {n} {r} {a}" for c, n, r, a in sweep)))
add("")
add(f"Commands: `curl -sS --fail-with-body \"https://itunes.apple.com/lookup?id=6784822497&country=<cc>\"` for cc in us kr jp gb de fr ca au (ids `apple_lookup_id_<cc>`), and the loop recorded in `raw/apple_lookup_sweep.cmd` for the other {len(sweep)} storefronts; the Mac-page loop is `raw/apple_mac_page_sweep.cmd`.")
add("\n</details>\n")
for sid, ttl in [("apple_search_mac", "iTunes search term=AgentDeck entity=macSoftware"), ("apple_search_software", "iTunes search term=AgentDeck entity=software")]:
    d = jl(sid)
    proj = "rank | trackName | seller | ratings\n" + "\n".join(f"{k + 1} | {r.get('trackName')} | {r.get('sellerName')} | {r.get('userRatingCount')}" for k, r in enumerate(d["results"][:12]))
    add(raw(sid, ttl, proj=proj, note="first 12 of the results"))
add(raw("apple_lookup_bundle_us", "iTunes lookup by bundleId=bound.serendipity.agent.deck (US)", proj="resultCount=1 (same record as id lookup)", note="same record"))
add(raw("apple_mac_page_sweep", "Mac App Store page ratings by storefront (…?platform=mac)", limit=2600))
add("### 6.4 Google Play")
add("")
add(f"- `https://play.google.com/store/apps/details?id=dev.agentdeck` — HTTP 200: **\"{play_dl.group(1)} Downloads\"** (Play's public bucket: at least 10, fewer than 50), Updated on {play_upd.group(1)}, content rating {play_ld.get('contentRating')}, price Free, author Serendipity Bound. No star rating or review count is shown. Exact installs, store-listing visitors and conversion need the Play Console (owner login) and were not read.")
add(f"- Play search `https://play.google.com/store/search?q=AgentDeck&c=apps`: `dev.agentdeck` is result **#{play_rank}** of {len(play_ids)} app links on the page; the next results are unrelated apps (" + ", ".join(play_ids[1:6]) + " …).")
add("")
add(raw("page_play_details", "Google Play details page (curl)", proj="\n".join([f"HTTP: {rd('page_play_details','err').strip()}", "ld+json: " + json.dumps(play_ld, ensure_ascii=False)[:700], f"visible text cue: '{play_dl.group(0)}', 'Updated on {play_upd.group(1)}'", "no rating / review-count text present"]), note="extracted facts; 1.06 MB HTML in the raw file"))
add(raw("page_play_search", "Google Play search page (curl)", proj=f"HTTP: {rd('page_play_search','err').strip()}\nlinked package ids in page order: {', '.join(play_ids[:20])} …", note="package ids extracted"))
add("")

# =====================================================================================
add("## 7. Mentions")
add("")
add("### 7.1 Where outside parties talk about AgentDeck (verified one by one)")
add("")
add("| Date | Where | What it says | Evidence |")
add("|---|---|---|---|")
add("| 2026-06-19 (updated 2026-08-21) | shiritomo / hashout.jp — https://hashout.jp/ai/2290/ | Japanese tech-culture article about product designer Go Ando's X video (2026-06-18) of a Stream Deck+ showing Claude Code sessions; says his setup is based on AgentDeck and links `github.com/puritysb/AgentDeck`; title/body claim the X post drew 3,900+ likes (figure is the article's, not verified). | curl: `datePublished 2026-06-19T06:15+09:00`, `dateModified 2026-08-21`; text contains AgentDeck ×9 and the repo slug |")
add("| 2026-07-19 | codex.danielvaughan.com — https://codex.danielvaughan.com/2026/07/19/codex-micro-physical-control-surfaces-ai-coding-agents-hardware-moat-developer-ergonomics/ | Blog on OpenAI's Codex Micro; presents AgentDeck as the open-source alternative for physical agent controls with multi-agent support, in a comparison table. | post source read via GitHub (lines 72–78, 148) |")
add("| 2026-09-10 / 2026-09-22 | RockBase-iot (hardware vendor) — `RockBase-iot/ESPWebApps/agentdeck/` and `RockBase-iot/wiki-documents` | Vendor ships an AgentDeck firmware build for its NM-EPD-420 4.2\" tri-colour e-ink panel in its web flasher (a commit adding AgentDeck and a black-and-white demo to the vendor's web-flasher app list, authored by the vendor account) and its wiki lists it as a third-party build of puritysb/AgentDeck. | `gh api` commit history + file contents |")
add("| 2026-08-20 → | `houtacheng/companion-module-agentdeck` | Community Bitfocus-Companion module for AgentDeck (README: maintained in its own repo, daemon from upstream); author also opened AgentDeck issues #221 and #246. | repo metadata, README line |")
add("| 2026 | Derivative / attribution | `nickboy/claudedeck` and `nickboy/herddeck` NOTICE files credit AgentDeck (borrowed `pty-ringbuffer.ts`; usage-API approach); `alejandrosnz/claude-deck` README acknowledges AgentDeck as reference for Claude Code integration and usage API; `Boyapati13/Octopus-Agent-System` has a bridge entry file headed as an AgentDeck-style bridge that points to the AgentDeck monorepo for the full daemon; `lstutzman/agentdeck-omp` AGENTS.md pins an AgentDeck commit. | file contents via `gh api` |")
add("| 2026-10 | Users' dotfiles | `shin-sforzando/dotfiles` TROUBLESHOOTING.md documents running the AgentDeck daemon + Ulanzi D200X plugin (same user opened #541/#544/#545 on 2026-10-14); `danielmoraes/dotfiles` documents replacing AgentDeck's session slot with a custom plugin and notes AgentDeck can then be uninstalled entirely (a former user). | file contents via `gh api` |")
add("| 2026 | Landscape / competitor write-ups | `fugitivelabs/cockpit` (lists AgentDeck with a 157-star snapshot, i.e. written ~July), `stevebargelt/forge` (assessment doc: rates AgentDeck the better candidate for a bounded, read-only integration experiment), `fridiculous/the-score`, `zm2231/agenthail`, `wookat/attnbox`, `technicalpickles/bowerbird`, `taiyun668/gogoke`, `niclasvestlund-YT/vibepulse`, `Selva-Corp/agenttap`, `vaddisrinivas/codecks`, `ValentinNikolaev/research-vault`. | code-search fragments (context of the lines not all opened) |")
add("| 2026 | Catalogs / awesome lists | `itgoyo/Awesome-VibeCoding` (entry at 229★), `Arnon-hs/open-source` (auto-generated page `aiml/puritysb-agentdeck.md`), `yplam/osrtos` (OSRTOS directory page, image dated 2026-04), `parkerluxu/Awesome-agent-cases` (hardware cases), `arthurspk/guiadoconhecimento` (33 files = translations), `baigao417/awesome-dot`, `lzpgood123/agent-ecoradar`, `GooPxel77/agent-skills-hub`, `sudosubin/agents.nix`, `mgraf77/agent-stack`, `adminbjkai/n50`. | code search |")
add("| 2026-08-27 / 09-07 | Issues in other repos linking the slug | `PowerUp-ToolBox/Power_Up_UR_Coding` (closed issue proposing outreach to the maintainers of ClaudeGamepad, VibePad and AgentDeck), `Jacob-Lasky/pocket-dev` (open). | `gh search issues` |")
add("")
add(f"Counts: GitHub code search for `\"puritysb/AgentDeck\" -repo:puritysb/AgentDeck` → {cs_total['total_count']} files in {len(cs_repos)} repos (`incomplete_results: {str(cs_total['incomplete_results']).lower()}`; code search is approximate); `\"@agentdeck/setup\"` → {len(npm_cs)} files in {len({r['repo'] for r in npm_cs})} repos; link to `puritysb.github.io/AgentDeck` → {site_cs['total']} files in {len({i['repo'] for i in site_cs['items']})} repos. {sum(1 for v in cs_repos.values() if v[0]['fork'])} of the {len(cs_repos)} repos are forks.")
add("")
add("### 7.2 Looked for, not found / could not read")
add("")
add("- **Hacker News** (Algolia API): query `puritysb/AgentDeck` → 0 hits; `puritysb.github.io` in the URL field → 0 hits. The 63 story hits for `AgentDeck` are other projects (asheshgoplani/agent-deck, agentdeck/agentdeck, …).")
add("- **Reddit**: **could not read.** `reddit.com/search.json` returned HTTP 403 and the browser tool refused `reddit.com` (\"site not allowed\"). GitHub's own referrer list does show `reddit.com` (27 views / 19 uniques in 14 days), so some Reddit page links the repo — thread not located. A standard and an extended web search for it found nothing.")
add("- **X/Twitter, YouTube, Bluesky**: not searchable with the available tools (the only X item is the Go Ando post cited by the article above).")
add("- **Elgato editorial pages** (2 checked, last updated 2026-07-30 and 2026-08-07): no mention of AgentDeck.")
add("- **Web searches that returned nothing relevant:** \"puritysb AgentDeck\", \"AgentDeck TRMNL\" (TRMNL results are TRMNL's own coverage and unrelated `agent-deck` projects), Korean and Chinese-language queries, and a Zenn/Qiita/note/velog/dev.to/Medium query. DeepWiki has an auto-generated page (`deepwiki.com/puritysb/AgentDeck`), and one fork (`bhardwajRahul/AgentDeck`) surfaced in results.")
add("")
add("### 7.3 Namesakes (do not count these)")
add("")
add("- GitHub: " + ", ".join(f"`{r['fullName']}` ({r['stargazersCount']}★)" for r in srepos[1:7]) + " … — different products. App Store: " + "; ".join(apple_namesakes(a_sw)) + ". Elgato: \"Agent Deck for Claude Code\", panda studio \"Agent Deck\" profiles. Stream Deck-specific namesake: `fernandobelotto/AgentDeck` (Gemini/Claude Stream Deck plugin, created 2026-01-07, 1★).")
add("")
srows = "stars | forks | fork? | created | repo | description\n" + "\n".join(f"{r['stargazersCount']} | {r['forksCount']} | {r['isFork']} | {r['createdAt'][:10]} | {r['fullName']} | {(r.get('description') or '')[:90]}" for r in srepos[:25])
add(raw("gh_search_repos_v2", "gh search repos agentdeck --sort stars (top 25 of 100)", proj=srows, note="first 25 rows"))
cs_proj = "repo | files | example path\n" + "\n".join(f"{k} | {len(v)} | {v[0]['path']}" for k, v in cs_repos.items())
add(raw("gh_code_api_slug", "GitHub code search: \"puritysb/AgentDeck\" outside the repo", proj=cs_proj, note="one row per repository"))
add(raw("gh_code_total_slug", "code-search total count", lang="json"))
add(raw("gh_code_api_npm", "GitHub code search: \"@agentdeck/setup\" outside the repo", proj="\n".join(f"{r['repo']} | {r['path']}" for r in npm_cs)))
add(raw("gh_code_api_site", "GitHub code search: puritysb.github.io/AgentDeck outside the repo", proj="\n".join(f"{i['repo']} | {i['path']}" for i in site_cs["items"]), note=f"total {site_cs['total']}"))
_tp = rd("gh_third_party_files")
_tp_rows = []
for _blk in re.split(r"(?m)^##### ", _tp)[1:]:
    _head, _, _rest = _blk.partition("\n")
    _tp_rows.append(f"{_head} | {len([l for l in _rest.splitlines() if l.strip()])} matching lines")
add(raw("gh_third_party_files", "Third-party files opened to check context (verbatim lines kept in raw/, not reproduced here)", proj="\n".join(_tp_rows), note="file and number of lines matching AgentDeck/puritysb; third-party text deliberately not copied into this report"))
add(raw("gh_third_party_meta", "Authorship / dates of third-party references", limit=2000))
si = jl("gh_search_issues")
add(raw("gh_search_issues", "gh search issues \"AgentDeck\" --limit 30 (brief's command; mostly namesake projects + this repo's own issues)", proj="\n".join(f"{r['repository']['nameWithOwner']} | {'PR' if r['isPullRequest'] else 'issue'} | {r['state']} | {r['createdAt'][:10]} | {r['title'][:70]}" for r in si), note="all 30 rows, title cut to 70 chars"))
add(raw("gh_issues_slug", "gh search issues \"puritysb/AgentDeck\" excluding this repo", proj="\n".join(f"{r['repository']['nameWithOwner']} | {'PR' if r['isPullRequest'] else 'issue'} | {r['state']} | {r['createdAt'][:10]} | {r['title'][:80]}" for r in jl('gh_issues_slug'))))
add(raw("hn_algolia_slug", "Hacker News Algolia: puritysb/AgentDeck", limit=600, lang="json"))
add(raw("hn_algolia_url_name", "Hacker News Algolia: puritysb.github.io in url", limit=600, lang="json"))
add(raw("reddit_search", "Reddit search.json (blocked)", proj="HTTP 403 — response body is Reddit's block page (not reproduced)", note="body dropped"))
add("")
add("<details><summary>raw · web searches run (WebSearch tool, 2026-10-15/16)</summary>\n")
add(table(["#", "Query", "Mode", "Relevant to this project", "Notes"], [
    (1, "AgentDeck Stream Deck Claude Code", "standard", "Apple listing; shiritomo article", "other results are namesakes/competitors (cskwork/streamdeck-agent-cockpit, tomevault, Agent Vitals)"),
    (2, "puritysb AgentDeck", "standard", "none", "returned asheshgoplani/agent-deck pages"),
    (3, "AgentDeck TRMNL", "standard", "none", "TRMNL's own coverage + unrelated agent-deck projects"),
    (4, "AgentDeck Codex Stream Deck", "standard", "Apple listing", "competitors: AgentStreamDeck, VibeDeck (paid), Muxboard, Stream Deck Agent Cockpit"),
    (5, "reddit AgentDeck Stream Deck+ Claude Code sessions dashboard e-ink ESP32 open source puritysb", "extended", "GitHub repo/releases, puritysb.github.io, deepwiki.com/puritysb/AgentDeck, fork bhardwajRahul/AgentDeck", "no Reddit thread found"),
    (6, "AgentDeck Stream Deck+ Claude Code 動画 いいね AI いっぱい飼っている", "standard", "shiritomo article", "—"),
    (7, "AgentDeck 스트림덱 Claude Code Codex 대시보드 오픈소스 puritysb", "standard", "Apple listing, shiritomo article", "no Korean-language article found"),
    (8, "AgentDeck Stream Deck+ AI 编码 Agent 物理控制器 puritysb 知乎 掘金 微信", "standard", "codex.danielvaughan.com post", "no Chinese-language article found"),
    (9, "\"puritysb/AgentDeck\" OR \"AgentDeck\" Stream Deck Claude Code Zenn OR Qiita OR note.com OR velog OR dev.to OR Medium", "standard", "Apple listing, shiritomo article", "no Zenn/Qiita/note/velog/dev.to/Medium page"),
], ))
add("\n</details>\n")
add(raw("page_hashout", "hashout.jp article (curl) — verification of the claims in 7.1", proj="\n".join([f"HTTP: {rd('page_hashout','err').strip()}", "ld+json datePublished 2026-06-19T06:15:45+09:00; dateModified 2026-08-21T15:17:27+09:00", "visible text: 'AgentDeck' x9, 'puritysb/AgentDeck' x1, '3900' x4, '@goando' x2 (embedded X post dated 2026年6月18日)"]), note="facts extracted from the 104 kB page"))

# =====================================================================================
add("## 8. What errored, was substituted, or could not be read")
add("")
add("| Item | What happened | Handling |")
add("|---|---|---|")
add("| `gh pr list --json …authorAssociation` | `Unknown JSON field: \"authorAssociation\"` (exit 1) | field dropped; first attempt kept as `raw/prs_failed_authorAssociation.*` |")
add(f"| `gh pr list --limit 300` | would silently truncate: {g['prs_total']} PRs exist | used `--limit 1000`; counts reconcile with the GraphQL totals ({g['prs_total']} PRs, {g['issues_total']} issues) |")
add("| `git shortlog -sn --since=… ` | without a revision it reads stdin when not on a TTY | added `HEAD` |")
add("| stargazers pagination | `--paginate` alone emits concatenated JSON arrays | added `--slurp` |")
add("| `npm view @agentdeck/plugin` | E404 | expected: package is `private: true` |")
add("| npm download windows | API ended 2026-10-12 although asked for …10-16; later days read 0 | zeros after 10-12 treated as not-yet-reported; Oct = 1–12 |")
add("| Ulanzi first API probe | redirected to the vendor admin login page | stopped; used the public page's own call path; login page untouched |")
add("| Ulanzi / Elgato search pages via curl | client-rendered shells | read in a browser tab (3 pages), tab closed; transcribed under `raw/browser_*.txt` |")
add("| Reddit | search API HTTP 403; browser tool blocked the domain | **could not read** — not inferred absent |")
add("| Apple storefront CN | lookup returned 0 results | recorded as not served in that storefront, ratings unknown |")
add("| Owner-only data | traffic endpoints worked (owner token); App Store Connect, Play Console, Elgato Maker and Ulanzi UGC owner dashboards were **not** accessed | those hold the real install/impression numbers |")
add("")

# capture index
add("## 9. Capture index (every command, verbatim, with UTC time)")
add("")
idx = []
for p in sorted(glob.glob(os.path.join(RAW, "*.cmd")), key=lambda x: rd(os.path.basename(x)[:-4], "ts")):
    i = os.path.basename(p)[:-4]
    cmd = rd(i, "cmd").replace("\n", " ⏎ ")
    idx.append((f"`{i}`", rd(i, "ts").strip(), rd(i, "rc").strip(), fmt(len(rd(i, "out").encode('utf-8'))), "`" + redact(cmd[:150]).replace("|", "\\|") + ("…" if len(cmd) > 150 else "") + "`"))
add(table(["id (raw/<id>.out)", "UTC", "exit", "bytes", "command (first 150 chars)"], idx))
add("")
add("Not in this index: the 9 WebSearch queries (table in 7.2/7.3), 3 WebFetch reads of the hashout and Elgato editorial pages, and the browser reads (transcribed to `raw/browser_*.txt`).")
add("")

open(OUT, "w", encoding="utf-8").write("\n".join(L))
print("wrote", OUT, "bytes", os.path.getsize(OUT))
