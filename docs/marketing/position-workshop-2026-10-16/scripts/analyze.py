#!/usr/bin/env python3
"""Compute AgentDeck traction metrics from the raw/ captures. Usage: python3 -I analyze.py <rawdir> <metrics.json>"""
import json, sys, os, re, datetime as dt
from collections import Counter, defaultdict

RAW, OUT = sys.argv[1], sys.argv[2]
OWNER = "puritysb"


def rd(name, ext="out"):
    with open(os.path.join(RAW, f"{name}.{ext}"), encoding="utf-8") as f:
        return f.read()


def load(name):
    return json.loads(rd(name))


def jsonl(name):
    return [json.loads(l) for l in rd(name).splitlines() if l.strip()]


def ts(s):
    return dt.datetime.fromisoformat(s.replace("Z", "+00:00"))


collected = ts(rd("repo", "ts").strip())
M = {"collected_at_utc": rd("repo", "ts").strip()}

# ---------------------------------------------------------------- repo
repo = load("repo")
gq = load("graphql_totals")["data"]["repository"]
M["repo"] = {
    "full_name": repo["full_name"], "created_at": repo["created_at"], "pushed_at": repo["pushed_at"],
    "stars": repo["stargazers_count"], "forks": repo["forks_count"], "watchers_subscribers": repo["subscribers_count"],
    "watchers_count_legacy_equals_stars": repo["watchers_count"], "open_issues_incl_prs": repo["open_issues_count"],
    "license": (repo.get("license") or {}).get("spdx_id"), "topics": repo.get("topics"), "language": repo.get("language"),
    "homepage": repo.get("homepage"), "has_discussions": repo.get("has_discussions"), "size_kb": repo.get("size"),
    "graphql": {
        "issues_total": gq["issuesAll"]["totalCount"], "issues_open": gq["issuesOpen"]["totalCount"], "issues_closed": gq["issuesClosed"]["totalCount"],
        "prs_total": gq["prsAll"]["totalCount"], "prs_open": gq["prsOpen"]["totalCount"], "prs_merged": gq["prsMerged"]["totalCount"], "prs_closed": gq["prsClosed"]["totalCount"],
        "discussions": gq["discussions"]["totalCount"], "releases": gq["releases"]["totalCount"], "watchers": gq["watchers"]["totalCount"],
    },
}
age_days = (collected - ts(repo["created_at"])).days
M["repo"]["age_days"] = age_days

# ---------------------------------------------------------------- traffic
v, c = load("traffic_views"), load("traffic_clones")
M["traffic"] = {
    "views_14d": {"count": v["count"], "uniques": v["uniques"], "first_day": v["views"][0]["timestamp"], "last_day": v["views"][-1]["timestamp"], "days": len(v["views"]),
                  "series": [(x["timestamp"][:10], x["count"], x["uniques"]) for x in v["views"]]},
    "clones_14d": {"count": c["count"], "uniques": c["uniques"], "first_day": c["clones"][0]["timestamp"], "last_day": c["clones"][-1]["timestamp"], "days": len(c["clones"]),
                   "series": [(x["timestamp"][:10], x["count"], x["uniques"]) for x in c["clones"]]},
    "referrers": load("traffic_referrers"), "paths": load("traffic_paths"),
}

# ---------------------------------------------------------------- stars
stars = [s for page in load("stargazers") for s in page]
sd = sorted(s["starred_at"] for s in stars)
by_month = dict(sorted(Counter(d[:7] for d in sd).items()))
cum, run = {}, 0
for k, n in by_month.items():
    run += n
    cum[k] = run
byday = Counter(d[:10] for d in sd)
def within(days):
    cut = collected - dt.timedelta(days=days)
    return sum(1 for d in sd if ts(d) >= cut)
M["stars"] = {
    "total": len(sd), "distinct_users": len({s["user"]["login"] for s in stars}), "first": sd[0], "last": sd[-1],
    "by_month": by_month, "cumulative_by_month": cum,
    "last_7d": within(7), "last_14d": within(14), "last_30d": within(30), "last_90d": within(90),
    "top_days": byday.most_common(6),
}

# ---------------------------------------------------------------- forks
fk = [f for page in load("forks") for f in page]
forks = []
for f in fk:
    pa = f.get("pushed_at")
    forks.append({"owner": f["owner"]["login"], "created_at": f["created_at"], "pushed_at": pa, "stars": f["stargazers_count"],
                  "pushed_after_create": bool(pa and ts(pa) > ts(f["created_at"]) + dt.timedelta(minutes=1)), "size": f["size"]})
M["forks"] = {
    "listed": len(forks), "by_month": dict(sorted(Counter(f["created_at"][:7] for f in forks).items())),
    "pushed_after_create": sum(1 for f in forks if f["pushed_after_create"]), "with_stars": [f for f in forks if f["stars"] > 0],
    "recent_activity_list": sorted([f for f in forks if f["pushed_after_create"]], key=lambda x: x["pushed_at"], reverse=True)[:15],
}

# ---------------------------------------------------------------- contributors + git
cts = [x for page in load("contributors") for x in page]
M["contributors_api"] = [{"login": x["login"], "contributions": x["contributions"], "type": x["type"]} for x in cts]
M["git_shortlog_2026"] = rd("git_shortlog_2026").strip().splitlines()
M["git_meta"] = rd("git_meta").strip().splitlines()

# ---------------------------------------------------------------- issues / PRs
iss, prs = load("issues"), load("prs")
def login(a):
    return (a or {}).get("login") or "ghost"
def is_bot(a):
    l = login(a)
    return bool((a or {}).get("is_bot")) or l.endswith("[bot]") or l.startswith("app/")
def bucket(items, kind):
    out = {"total": len(items), "states": dict(Counter(i["state"] for i in items))}
    by_author = Counter(login(i["author"]) for i in items)
    out["by_author"] = by_author.most_common()
    owner_n = by_author.get(OWNER, 0)
    bots = {login(i["author"]) for i in items if is_bot(i["author"])}
    ext = [i for i in items if login(i["author"]) != OWNER and not is_bot(i["author"])]
    out["owner_count"] = owner_n
    out["bot_authors"] = sorted(bots)
    out["bot_count"] = sum(1 for i in items if is_bot(i["author"]))
    out["external_count"] = len(ext)
    out["external_distinct_authors"] = sorted({login(i["author"]) for i in ext})
    out["external_states"] = dict(Counter(i["state"] for i in ext))
    out["by_month_all"] = dict(sorted(Counter(i["createdAt"][:7] for i in items).items()))
    out["by_month_external"] = dict(sorted(Counter(i["createdAt"][:7] for i in ext).items()))
    out["by_month_owner"] = dict(sorted(Counter(i["createdAt"][:7] for i in items if login(i["author"]) == OWNER).items()))
    out["external_items"] = [{"number": i["number"], "author": login(i["author"]), "state": i["state"], "created": i["createdAt"][:10], "title": i["title"][:100]} for i in sorted(ext, key=lambda x: x["number"])]
    return out
M["issues"] = bucket(iss, "issue")
M["prs"] = bucket(prs, "pr")
ext_issue_authors = set(M["issues"]["external_distinct_authors"])
ext_pr_authors = set(M["prs"]["external_distinct_authors"])
M["external_union_authors"] = sorted(ext_issue_authors | ext_pr_authors)
M["external_both_authors"] = sorted(ext_issue_authors & ext_pr_authors)
# per-external-author summary
per = defaultdict(lambda: {"issues": 0, "prs": 0, "prs_merged": 0, "first": "9999", "last": "0000"})
for i in iss:
    l = login(i["author"])
    if l != OWNER and not is_bot(i["author"]):
        p = per[l]; p["issues"] += 1; p["first"] = min(p["first"], i["createdAt"][:10]); p["last"] = max(p["last"], i["createdAt"][:10])
for i in prs:
    l = login(i["author"])
    if l != OWNER and not is_bot(i["author"]):
        p = per[l]; p["prs"] += 1; p["prs_merged"] += 1 if i["state"] == "MERGED" else 0
        p["first"] = min(p["first"], i["createdAt"][:10]); p["last"] = max(p["last"], i["createdAt"][:10])
M["external_author_table"] = sorted(([k, v] for k, v in per.items()), key=lambda kv: (-(kv[1]["issues"] + kv[1]["prs"]), kv[0]))
# first external issue/PR date and monthly distinct external authors
first_seen = {}
for i in sorted(iss + prs, key=lambda x: x["createdAt"]):
    l = login(i["author"])
    if l != OWNER and not is_bot(i["author"]) and l not in first_seen:
        first_seen[l] = i["createdAt"][:10]
M["external_first_seen"] = first_seen
M["external_new_authors_by_month"] = dict(sorted(Counter(d[:7] for d in first_seen.values()).items()))

# ---------------------------------------------------------------- releases
rl = load("releases_list")
assets = {r["tag"]: r["assets"] for r in jsonl("releases_assets")}
def channel(tag):
    m = re.match(r"^(apple|android|esp32|npm|streamdeck|ulanzi)-v", tag)
    return m.group(1) if m else "other"
ch = defaultdict(lambda: {"count": 0, "drafts": 0, "prereleases": 0, "first": "9999", "last": "0000", "first_tag": None, "last_tag": None, "downloads": 0, "assets": 0, "tags": []})
missing_assets = []
for r in rl:
    tag = r["tagName"]; k = channel(tag); d = ch[k]
    pub = (r.get("publishedAt") or r.get("createdAt") or "")[:10]
    d["count"] += 1
    d["drafts"] += 1 if r["isDraft"] else 0
    d["prereleases"] += 1 if r["isPrerelease"] else 0
    d["tags"].append(tag)
    if pub and pub < d["first"]:
        d["first"], d["first_tag"] = pub, tag
    if pub and pub > d["last"]:
        d["last"], d["last_tag"] = pub, tag
    a = assets.get(tag)
    if a is None:
        missing_assets.append(tag)
    else:
        d["assets"] += len(a); d["downloads"] += sum(x["download_count"] for x in a)
M["releases"] = {"total": len(rl), "channels": {k: {kk: vv for kk, vv in v.items() if kk != "tags"} for k, v in sorted(ch.items())}, "other_tags": ch["other"]["tags"] if "other" in ch else [],
                 "assets_without_release_row": sorted(set(assets) - {r["tagName"] for r in rl}), "release_rows_without_assets": missing_assets,
                 "total_downloads": sum(d["downloads"] for d in ch.values()), "total_assets": sum(d["assets"] for d in ch.values())}
flat = [(a["download_count"], t, a["name"]) for t, al in assets.items() for a in al]
M["releases"]["top_assets"] = sorted(flat, reverse=True)[:12]
M["releases"]["assets_with_nonzero_downloads"] = sum(1 for x in flat if x[0] > 0)
# release cadence by month (all channels) and per-channel
M["releases"]["by_month_all"] = dict(sorted(Counter((r.get("publishedAt") or r["createdAt"])[:7] for r in rl).items()))
M["releases"]["by_month_by_channel"] = {k: dict(sorted(Counter((r.get("publishedAt") or r["createdAt"])[:7] for r in rl if channel(r["tagName"]) == k).items())) for k in sorted(ch)}
# per channel: latest release downloads + top release
M["releases"]["channel_latest_release_downloads"] = {}
for k, d in ch.items():
    if d["last_tag"]:
        M["releases"]["channel_latest_release_downloads"][k] = [d["last_tag"], sum(x["download_count"] for x in assets.get(d["last_tag"], []))]

# ---------------------------------------------------------------- npm
npm = {}
for p in ["setup", "bridge", "shared", "hooks"]:
    view = load("npm_view_" + p)
    times = view["time"]
    versions = {k: t for k, t in times.items() if k not in ("created", "modified")}
    month = load("npm_dl_month_" + p); week = load("npm_dl_week_" + p); rng = load("npm_dl_range_" + p)
    days = rng["downloads"]
    monthly = defaultdict(int)
    for x in days:
        monthly[x["day"][:7]] += x["downloads"]
    nonzero = [x for x in days if x["downloads"] > 0]
    npm[p] = {
        "latest": view.get("version"), "created": times.get("created"), "modified": times.get("modified"), "versions": len(versions),
        "versions_by_month": dict(sorted(Counter(t[:7] for t in versions.values()).items())),
        "last_month": month["downloads"], "last_month_window": [month["start"], month["end"]],
        "last_week": week["downloads"], "last_week_window": [week["start"], week["end"]],
        "range_window": [rng["start"], rng["end"]], "range_total": sum(x["downloads"] for x in days),
        "by_month": dict(sorted(monthly.items())), "first_nonzero_day": nonzero[0]["day"] if nonzero else None,
        "max_day": max(days, key=lambda x: x["downloads"]),
        "last_14_days": [(x["day"], x["downloads"]) for x in days[-14:]],
    }
M["npm"] = npm
M["npm_plugin_private"] = rd("npm_view_plugin", "err").strip().splitlines()[:3]

json.dump(M, open(OUT, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("wrote", OUT)
