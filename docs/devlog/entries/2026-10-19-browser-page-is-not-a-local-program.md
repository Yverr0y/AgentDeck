# 2026-10-19 — Daemons: a browser page on this machine was trusted as a local program

**What was seen.** Both daemons admit a same-machine connection without the
pairing token (`isLocalConnection`, an IP test). A web page the user has open
connects from `127.0.0.1` as well, so it held everything a local program holds,
by three routes that need nothing unusual from the page:

- A WebSocket has no CORS. A page could open the daemon's socket, receive the
  session roster and timeline, and send device commands.
- A cross-origin POST with a `text/plain` body needs no preflight, and both
  daemons parse any body as JSON. A page could post hooks or `/shutdown`.
- With a host name that re-resolves to `127.0.0.1` (DNS rebinding), the page
  becomes same-origin with the daemon and can read `/health`, pairing token
  included.

The macOS app needed no rebinding at all. `HTTPServer.formatHTTPHeaders` wrote
`Access-Control-Allow-Origin: *` on every response, `/health` included, so any
page could read the token with one ordinary `fetch`. The Node APME API sent the
same header on every answer (prompts, task titles, verdicts), and so did a
session bridge's `/sse` stream.

**Why the docs did not catch it.** `docs/daemon.md` said `/setup-status` was
"the only route that answers with `Access-Control-Allow-Origin: *`", and the
Ulanzi Property Inspector's own comment said "the macOS app has always sent
ACAO". The intent was written down and the exception was known, but no test
pinned either. Now `HTTPCrossOriginTests` (Swift: no header unless a route opts
in) and the APME and `/sse` cases in `apme-http.test.ts`,
`apme-history-reader.test.ts` and `local-trust-servers.test.ts` pin them.

**The rule.** `shared/src/local-trust.ts`, generated into
`LocalTrustRules.generated.swift`. It reads two headers a page cannot set:

- `Host` must name this machine: an IP literal, `localhost`, or the machine's
  own host name. This defeats rebinding, because a rebinding page's `Host` is
  its own domain.
- On a WebSocket upgrade or a state-changing method, `Origin` must be one of
  three things. It may be absent, since local programs send none. It may be the
  daemon's own origin, port included, for the APME dashboard it serves. Or it
  may be `file://`, which the ESP32 WebSocket library (links2004) sends; a
  browser serialises an opaque origin as `null`, never as that.

A request that fails either check needs the token. Operator approval never
admits it, and it is never recorded as a pairing knock, because an approval for
a loopback address would hand trust to every page. A GET keeps trust whatever
its `Origin`, so the line between a page and an answer is
`Access-Control-Allow-Origin`. That header now goes only on routes with no
secret: `/setup-status`, Node `/display-state` and the Pixoo frame and stream.
No GET takes a privileged action. The GET side effects left are device
bookkeeping, such as feed-pull telemetry and a staged voice reply marked
fetched.

**Rejected.**

| Alternative | Why not |
|---|---|
| Require the token from every local client | Breaks the CLI, the hooks, both deck plugins and the one-token handover between daemons, and gains nothing against a local process, which can read `/health` anyway |
| Fix CORS only | A WebSocket upgrade and a simple POST never consult CORS |
| Check `Origin` only | A rebinding page's same-origin GET carries no `Origin` |
| `Sec-Fetch-Site` | Older WebViews omit it, so its absence proves nothing, and as an extra signal it would cut off the Ulanzi Property Inspector's cross-origin `/setup-status` read |
| Bind loopback only | LAN devices are the product; `--loopback` already exists for sites that want it |

**Compatibility, checked by code.** No first-party local client sends `Origin`:
the Stream Deck and Ulanzi plugins use Node's `ws`, which sends none by default,
and the Swift app uses `URLSession`. The Ulanzi Property Inspector reads with
GETs. The APME dashboard is same-origin, including its POSTs. ESP32 boards send
`Origin: file://`.

**Known limits.**

- A `.local` name that differs from `gethostname()` (a Bonjour name the user
  renamed) is not recognised, so a browser using it needs the token.
- Docker's `host.docker.internal` likewise needs the token.
- Browsers serialise an IPv4-mapped origin in hex (`[::ffff:7f00:1]`), which
  is not matched as a local address.

**Not done here.** A token a page already read stays valid until it is rotated.
`agentdeck token rotate` does that for the CLI daemon, but the macOS app has no
rotation action of its own.
