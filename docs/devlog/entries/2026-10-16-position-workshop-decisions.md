# 2026-10-16 — Position workshop: keep the position, fix the floor, four owner decisions

A one-day workshop reviewed where AgentDeck stands now that the coding-agent
harnesses absorbed the single-agent "see → get notified → approve" loop
natively during 2026, and what to keep. The report is a Claude Doc
(`AgentDeck 포지션 워크숍`); the research it rests on is preserved under
[docs/marketing/position-workshop-2026-10-16/](docs/marketing/position-workshop-2026-10-16/README.md).
This entry records what a diff cannot: the decisions and the alternatives they
rejected.

**Finding.** The position does not move: off-screen, vendor-neutral, local,
with local evaluation. No vendor has an incentive to build that, and no other
product drives several physical surfaces at once. The threats are in the
floor, not the position: (1) the Claude usage gauge reads the undocumented
`/api/oauth/usage` with the Keychain OAuth token
([bridge/src/usage-api.ts](bridge/src/usage-api.ts)), a gray zone beside the
two inference-relay enforcements of 2026; (2) vendors entered the physical
form factor for their own agent only (Codex Micro, the Claude Desktop Buddy
reference, Logitech MX Keypad); (3) bus factor one, and Codex has no device
approval (notify-only).

**Decisions (owner, 2026-10-16).**

- **Usage source — keep OAuth, add the sanctioned source.** Rejected: removing
  the OAuth call or making it opt-in (loses the per-model scoped caps and the
  idle-time refresh). Adopted: Claude Code's status-line `rate_limits` relayed
  to both daemons; OAuth polling pauses while a status-line reading is fresh
  and keeps a slow refresh for the scoped caps. The principle as stated: do not
  degrade today's experience, and give each of the Swift and Node daemons the
  safe maximum it can have. The App Store daemon, which never had an OAuth
  path, gains its first token-free Claude gauge from this. Implementation
  lands on the `claude/claude-statusline-relay` branch.
- **Judge validity — a reference judge instead of human labels.** Rejected: a
  judge↔human correlation fed by the owner labelling tasks by hand
  (`POST /apme/vibe`), because the metric would depend on labels the owner has
  to keep producing. Adopted: a high-end model driven through `codex exec` as
  a reference judge, an agreement metric against the local judge, and an OPRO
  loop that revises the rubric from disagreements; human labels only calibrate
  the reference. Smoke test the same day (codex-cli 0.160.1, `gpt-6.1-sol`,
  reasoning low): 6 s, 16,982 tokens, schema-conformant JSON; `--ephemeral`
  left no rollout and `--ignore-user-config` loaded no hooks, so the daemon
  saw nothing. Trap: a headless `codex exec` without `< /dev/null` waits on
  stdin forever (`Reading additional input from stdin`).
- **Hardware — keep expanding, refresh the stale.** Rejected: a retirement
  list (Dot, D200X encoders, e-ink voice, IPS10, the BLE workers). Adopted:
  hardware breadth stays — AI coding covers it, and however wide it gets the
  answer is to keep improving — and the stale devices are refreshed in a
  measured order. Live `/devices` on 2026-10-16: 9 of 11 connected boards
  below 1.9.2 (86box, ttgo and trmnl_75 at 1.8.0 `-dirty`; round_amoled and
  ips_35 at 1.8.0; epd47 and t_display_pro at 1.9.0; t_embed and nm_epd at
  1.9.1); `minFreeHeapKb` 0 on ips_35, t_embed and t_display_pro; round_amoled
  last reset `task_watchdog`; Timebox BLE `device not found`;
  `AdbModule.swift` untouched since 06-25 while the Android app took 137
  commits in 90 days.
- **Cursor — extensibility, not personal use.** Adopted: keep the probe (does
  the installed Claude hook fire inside Cursor and get attributed to Claude?);
  if positive, add a generic host axis rather than a Cursor-specific one;
  verification comes from fixtures and outside contributors.

**Not decided here.** Monetization stays off the table (2026-08-07 stance). The
90-day order is: status-line relay, fleet reflash and heap guards, action-name
hygiene, Cursor probe; then the reference judge, the Codex `PermissionRequest`
hold, APME coverage, Timebox BLE and Swift ADB parity; then the host axis, the
cross-vendor wait queue, the public surface spec and the first OPRO round.

**Method and cost.** A GLM (z.ai) session read the repository; Opus 5.5 did
the external research and the adversarial review; Sonnet 5.5 collected the
metrics; the Fable session synthesised. The adversarial review corrected the
approval axis (only Codex lacks device approval — OpenCode and OpenClaw have
it), the grading scale, and the ToS wording (token access is a gray zone, not
the forbidden token relay). The stale line in [docs/apme.md](docs/apme.md)
that lists an `apme-tuner.test.ts` the source tree does not contain was found
on the way and is left for the judge work to fix.
