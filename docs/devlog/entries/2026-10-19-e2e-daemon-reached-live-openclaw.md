# 2026-10-19 — E2E: the daemon under test was talking to the developer's OpenClaw Gateway

**What was seen.** Local `pnpm verify:quick` runs sometimes failed in the E2E
`afterAll` with `ENOTEMPTY` from `rmSync`. Runs that passed left their temp
`HOME` behind as well. At 02:30 on 2026-10-19, `$TMPDIR` held 15
`agentdeck-e2e-*` homes (about 100 MB) and 30 `agentdeck-relay-*` homes (about
206 MB), all from runs since 2026-10-18. What was left in them was OpenClaw's:
`.openclaw/state`, `.openclaw/npm/projects`, `Library/Caches/bun`, `.npm/_logs`.

**Why.** The E2E daemons inherit the developer's environment apart from the
variables the suites override, and the daemon starts its OpenClaw Gateway
integration unconditionally. On a Mac where the Gateway runs, it listens on
`127.0.0.1:18789`, so the daemon under test:

- found the Gateway, connected an adapter to it, and fed its live sessions into
  the daemon being tested;
- 5 s later ran `openclaw doctor`, which the shell PATH resolves to
  `~/.openclaw/bin/openclaw`, with `HOME` set to the suite's temp directory.

Doctor bootstraps a fresh OpenClaw state directory there, including npm and
bun installs, and it outlives the daemon. Its writes raced the suite's
recursive delete. CI never saw any of this, because no Gateway runs on
`ubuntu-latest`. The first usage build also spawned `codex app-server` once per
daemon. It wrote nothing that outlived the run, but it ran the developer's
binary.

**The fix.**

- `AGENTDECK_DAEMON_NO_GATEWAY=1` skips the Gateway probe and the doctor
  schedule in `bridge/src/daemon-server.ts`. The adapter is connected only from
  that probe.
- Both E2E suites set it, together with the existing
  `AGENTDECK_CODEX_LIVE_USAGE=0`.
- A hub test now checks that the daemon never logged `OpenClaw Gateway
  detected`, that no `.openclaw` appeared in its `HOME`, and that nothing
  connected to a stand-in Gateway. The stand-in holds the port on machines with
  no Gateway, so the check means something on CI too.
- Measured here: with the variable removed from the hub suite, that test fails
  on the log line. With it, the whole E2E suite passes (3 files, 26 tests) and
  leaves no temp home.

**Rejected.**

- **Removing `openclaw` from the daemon's PATH.** `augmentedPath()` adds
  `/opt/homebrew/bin` and home-relative directories back for the model-catalog
  call. The adapter needs no CLI at all, so it would still have reached the live
  Gateway.
- **Always binding a stand-in on 18789.** The real Gateway binds `127.0.0.1` and
  `::1` itself, so a second bind fails. A Gateway bound to a wildcard address
  would let a more specific bind take over the developer's own loopback traffic
  while the suite runs. The stand-in listens only after a connect was refused.
- **Starting the integration only when `~/.openclaw/openclaw.json` exists.** A
  missing or relocated config would then silently cost a real user the Gateway
  integration.

**Not addressed.** The unit tests also leave temp directories behind:
20,563 `agentdeck-vitest-*` directories (1.1 MB in total) since 2026-10-18.
They are small enough for macOS's periodic `$TMPDIR` purge.
