# 2026-09-14 — Windows daemon autostart no longer keeps a console window

`agentdeck daemon install` left a terminal window on the desktop, with a
taskbar button, for as long as the daemon ran. Reported from a Windows 11 26200
machine where the window showed the daemon's whole startup log and could not be
closed without killing the daemon.

## What the window actually was

Task Scheduler starts an interactive-token action with a console attached, and
`node.exe` is a console-subsystem binary, so the logon start handed the daemon
to the default terminal application. On the reporting machine that is Windows
Terminal: `EnumWindows` found the daemon's window owned by `WindowsTerminal`
(pid 856280), titled with the action's command line, while the daemon's own
`node.exe` process reported `MainWindowHandle = 0`. The same Terminal process
also owned the user's unrelated PowerShell window, so `ShowWindow`-style hiding
was never an option — there is no window that belongs to the daemon.

## Three fixes that do not work, measured before the one that does

- `<Hidden>true</Hidden>` in the task XML: a probe task carrying it still
  produced a visible `WindowsTerminal` window. The setting hides the task in
  the Task Scheduler UI and nothing else.
- `conhost.exe --headless node …`: emitted terminal escape sequences into the
  calling console and never ran the target script at all.
- An `S4U` principal ("run whether the user is logged on or not", the usual
  no-window answer): `schtasks /Create` refused it with `ERROR: Access is
  denied.` without elevation, which `daemon install` deliberately does not
  have. It would also return the daemon to a non-interactive session, which is
  the reason a real Windows Service was rejected for this job in the first
  place.

## The action is now a launcher

The task action is `daemon autostart`, a hidden CLI command that spawns
`daemon start --foreground` with `detached` + `windowsHide`
(DETACHED_PROCESS | CREATE_NO_WINDOW) and exits. A probe task doing exactly
this showed no visible window at 0.7 s or at 5 s after `schtasks /Run`, and the
detached child kept running after the launcher exited — the launcher is gone
before the terminal handoff paints anything.

## Two things the live install found, both of which the window fix needed

The task's status becomes `Ready` seconds after the run. For a task whose
action IS the daemon that means "not running", and `classifySupervision` turns
that plus an answering daemon into `unsupervised`, whose remedy is stopping the
daemon — so the window fix alone would have made every install and restart stop
a healthy daemon. The first replacement signal had the launcher record the pid
it spawned, and that failed on the first real install: over an
already-running unsupervised daemon, the launcher's daemon hit the incumbent
guard and stayed alive for a second or two while conceding, so "the pid the
task started is alive" was true while the incumbent held 9120. The install
printed `Daemon running under the scheduled task (PID 1575288)` — the
incumbent's pid — and converged nothing.

The signal is therefore written by the daemon, not the launcher: the launcher
passes `AGENTDECK_SUPERVISOR=schtasks`, and the daemon stamps `startedBy` into
`daemon.json` **past its successful bind**, so a daemon that loses the race
exits before it can claim anything. `composeSchtasksRunning` reads that stamp
whenever the status says `Ready`; `Running` and an unreadable status still
answer on their own, which keeps a task from a build before this change —
whose action still is the daemon — classified as it always was. An absent stamp
(hand-started daemon, Swift daemon, pre-stamp build) reads as not supervised,
never as unknown.

The second finding was the upgrade path. The second install still reported
success and changed nothing: `MultipleInstancesPolicy=IgnoreNew` makes
`schtasks /Run` a silent rc-0 no-op while an instance of the *previous* action
is running, and that instance was the old console-window daemon, still serving
from the previous logon. So `daemon install` now ends a running instance before
`/Run` — a no-op under the launcher action, a migration step exactly once.

## Verified on the reporting machine

After the third install: `Ended the previous 'AgentDeckDaemon' instance …`,
then `Daemon running under the scheduled task AgentDeckDaemon (PID 1319544,
port 9120)`. `daemon.json` carried `"startedBy": "schtasks"`, `/health`
answered `mode: daemon` on the new build, task status read `Ready`, and a
window enumeration found no console window for the daemon — only the user's own
PowerShell window. `daemon status` and `daemon restart` both behaved
(restart came back as PID 1599748 through the task).

Two losses stated rather than hidden: `RestartOnFailure` now covers only a
launcher that cannot spawn, and `schtasks /End` no longer stops the daemon.
`daemon stop` was already ending the task *and* POSTing `/shutdown`, and the
second one is what did the work.

## Touched

- `bridge/src/windows-service.ts` — action spelling, evidence in the module
  header
- `bridge/src/cli.ts` — `daemon autostart`, the end-before-run migration step,
  and the restart message that no longer claims the daemon is the task's own
  process
- `bridge/src/daemon-supervisor.ts` — `composeSchtasksRunning`,
  `startedBySupervisor`, `schtasksOwnsRegisteredDaemon`
- `bridge/src/daemon-server.ts`, `bridge/src/session-registry.ts` — the
  `startedBy` stamp, written past the bind
- Tests: `bridge/src/__tests__/windows-service.test.ts`,
  `bridge/src/__tests__/daemon-supervisor.test.ts`
- Docs: `docs/daemon.md`, `docs/windows.md`,
  `.claude/rules/daemon-lifecycle.md`
