// codex-exec-children.ts — headless `codex exec` runs as children of the
// session that launched them.
//
// A harness that fans work out through `codex exec` (a Claude Bash running
// `xargs -P 4 codex exec …`, a script, a cron) starts one real `codex` process
// per job. Each holds a rollout, each fires the user-global lifecycle hooks,
// and each therefore used to become a full session on every surface: 49 rows
// named after scratchpad topic directories in one batch (2026-10-01), plus 49
// APME runs that nothing ever closed, since Codex has no SessionEnd hook.
//
// A headless run is not an independent session: nobody steers it, it has one
// prompt, and the work belongs to whoever launched it. So it is folded into
// the launching session's child census — the same axis a Claude `Agent` call
// or a Codex `SubagentStart` moves — and it stays out of `sessions_list` and
// out of the APME run table. Its evidence lands on the parent's active task as
// `sample_events.kind='subagent'`, exactly as a hook-declared child does.
//
// Two producers, one registry:
//   • The passive observer sees the process (pid, open rollout, `originator:
//     codex_exec`) and walks its ancestry to another observed session's pid.
//     That is the authoritative link; it needs no cooperation from the hooks.
//   • The hook path sees the run first (SessionStart lands before the next
//     5 s scan) and asks this registry whether the id is a child. A headless
//     rollout with no resolved parent yet is `pending`: its hooks are held out
//     of the parent pipelines (no session row, no APME run) until the observer
//     or a later hook resolves it, or `PENDING_TTL_MS` passes and it is judged
//     standalone — a user's own `codex exec` in a terminal stays a session.
//
// Ownership rules match the ambient-thread filter: a verdict is per session
// id, a decision to fold is sticky, and a child's terminal hook (or its
// process exiting) is the completion that closes it on the parent.

import { basename } from 'path';
import type { LocatedCodexRolloutSummary, ProcInfo } from './passive-observer.js';

/** `session_meta.originator` written by `codex exec`. */
export const CODEX_EXEC_ORIGINATOR = 'codex_exec';

/** A headless rollout: `codex exec` stamps its originator; the desktop app and
 *  the TUI stamp theirs. Case-insensitive because Codex has changed the case
 *  of these labels before. */
export function isHeadlessCodexOriginator(originator: string | undefined): boolean {
  return typeof originator === 'string' && originator.trim().toLowerCase() === CODEX_EXEC_ORIGINATOR;
}

/** The argv shape of a headless run: the `codex` binary followed by the `exec`
 *  subcommand (global flags may sit between). `codex-code-mode-host` and the
 *  Electron helpers never match — their basename is not `codex`. */
export function isCodexExecCommand(command: string): boolean {
  const argv = command.trim().split(/\s+/);
  if (argv.length < 2) return false;
  const bin = basename(argv[0]).replace(/\.exe$/i, '');
  if (bin === 'node' || bin === 'timeout') {
    // `node /opt/homebrew/bin/codex exec …` / `timeout 1500 codex exec …`
    const idx = argv.findIndex((a, i) => i > 0 && basename(a).replace(/\.exe$/i, '') === 'codex');
    return idx > 0 && argv.slice(idx + 1).some((a) => a === 'exec');
  }
  if (bin !== 'codex') return false;
  return argv.slice(1).some((a) => a === 'exec');
}

/** `-C <dir>` / `--cd <dir>` / `--cd=<dir>` from a `codex exec` argv, or null. */
export function codexExecCwdFromCommand(command: string): string | null {
  const argv = command.trim().split(/\s+/);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if ((a === '-C' || a === '--cd') && argv[i + 1]) return argv[i + 1];
    if (a.startsWith('--cd=')) return a.slice('--cd='.length);
  }
  return null;
}

/** An observed session that may own a headless child: its bare id and pid. */
export interface ExecChildPeer {
  sessionId: string;
  pid: number;
  agentType: string;
  projectName?: string;
}

/**
 * The nearest ancestor of `pid` whose pid is a peer session — the launching
 * session. `pid` itself never matches (a Codex is not its own parent), and
 * the walk is cycle-safe against a stale table.
 */
export function nearestAncestorPeer(
  pid: number,
  processes: readonly ProcInfo[],
  peers: readonly ExecChildPeer[],
): ExecChildPeer | null {
  if (peers.length === 0) return null;
  const byPid = new Map(processes.map((p) => [p.pid, p]));
  const peerByPid = new Map(peers.map((p) => [p.pid, p]));
  let current = byPid.get(pid);
  const visited = new Set<number>([pid]);
  while (current && current.ppid > 1 && !visited.has(current.ppid)) {
    const peer = peerByPid.get(current.ppid);
    if (peer) return peer;
    visited.add(current.ppid);
    current = byPid.get(current.ppid);
  }
  return null;
}

/** What the observer saw for one headless rollout on its last scan. */
export interface CodexExecChildObservation {
  sessionId: string;
  pid: number;
  cwd?: string;
  /** null: headless, but its ancestry reaches no observed session — a
   *  standalone run the observer keeps as a top-level row. */
  parent: ExecChildPeer | null;
  startedAt?: number;
  goal?: string;
}

export interface CodexExecChild {
  sessionId: string;
  /** Set once a process is known — from the observer (exact) or an argv cwd
   *  match on the hook path (best effort, corrected by the next scan). */
  pid?: number;
  cwd?: string;
  parentSessionId: string;
  parentAgentType: string;
  parentProjectName?: string;
  startedAt: number;
  lastSeenAt: number;
  stoppedAt?: number;
  goal?: string;
}

export interface ExecChildLifecycle {
  /** The child is attached: retract anything its early hooks created and open
   *  it on the parent's census. */
  onStart(child: CodexExecChild): void;
  /** The child finished (terminal hook or process exit). */
  onStop(child: CodexExecChild, summary: string | undefined): void;
}

type Verdict =
  | { kind: 'child' }
  | { kind: 'standalone'; at: number }
  | { kind: 'not-headless'; at: number }
  | { kind: 'pending'; since: number; cwd?: string }
  | { kind: 'no-rollout'; at: number };

/** Hook events that end a headless run. `codex exec` is one turn, so its
 *  Stop is its completion; an interrupt or a session end is too. */
const TERMINAL_EVENTS = new Set(['codex_stop', 'codex_session_end', 'codex_turn_complete', 'codex_interrupt']);

/** A headless rollout whose parent is still unresolved after this long is a
 *  standalone run: its hooks flow normally from then on. Long enough for two
 *  observer scans (5 s cadence, up to 60 s when a scan is slow) plus lsof's
 *  2 s timeout; short enough that a user's own `codex exec` shows up as a
 *  session while it is still running. */
export const PENDING_TTL_MS = 60_000;
/** A rollout not on disk at SessionStart is re-checked on the next hook, but
 *  not on every hook — one readdir walk per interval, not per tool call. */
const NO_ROLLOUT_RETRY_MS = 2_000;
/** A finished child stays known this long so a trailing tool_end cannot
 *  resurrect it as a session; mirrors HookCodexSessions' tombstone. */
const STOPPED_TTL_MS = 30 * 60_000;
/** Cached negative verdicts expire so an id-space reuse cannot be misread
 *  forever (Codex ids are uuidv7, so this is belt and braces). */
const VERDICT_TTL_MS = 6 * 60 * 60_000;

export interface HookVerdict {
  /** The hook belongs to a child (attached or pending) and must not enter the
   *  parent session's row, state, timeline, or APME pipelines. */
  childOnly: boolean;
  child?: CodexExecChild;
}

export interface CodexExecChildrenOptions {
  /** Rollout lookup by hook session id (`codexRolloutSummaryForSession`).
   *  Injected rather than imported so this module stays a leaf below the
   *  observer, which imports the ancestry helpers above. */
  locateRollout?: (sessionId: string) => LocatedCodexRolloutSummary | null;
  /** The finished run's reply (`lastAgentMessageFromCodexRollout`). */
  lastMessage?: (sessionId: string) => string;
  now?: () => number;
}

export class CodexExecChildren {
  lifecycle: ExecChildLifecycle | undefined;

  private readonly children = new Map<string, CodexExecChild>();
  private readonly verdicts = new Map<string, Verdict>();
  private readonly locateRollout: (sessionId: string) => LocatedCodexRolloutSummary | null;
  private readonly lastMessage: (sessionId: string) => string;
  private readonly now: () => number;

  constructor(opts: CodexExecChildrenOptions = {}) {
    this.locateRollout = opts.locateRollout ?? (() => null);
    this.lastMessage = opts.lastMessage ?? (() => '');
    this.now = opts.now ?? Date.now;
  }

  /** Attached or pending: the id is not an independent session. */
  knows(sessionId: string): boolean {
    if (this.children.has(sessionId)) return true;
    return this.verdicts.get(sessionId)?.kind === 'pending';
  }

  parentOf(sessionId: string): string | undefined {
    return this.children.get(sessionId)?.parentSessionId;
  }

  snapshot(): CodexExecChild[] {
    return [...this.children.values()];
  }

  /**
   * Hook path. Decides, for a `codex_*` hook, whether its session is a
   * headless child — resolving the parent on the spot when the process table
   * already shows the run — and drives the child's completion on its
   * terminal hook.
   */
  noteHook(
    eventName: string,
    payload: Record<string, unknown>,
    processes: readonly ProcInfo[],
    peers: readonly ExecChildPeer[],
  ): HookVerdict {
    if (!eventName.startsWith('codex_')) return { childOnly: false };
    const sessionId = typeof payload.session_id === 'string' ? payload.session_id.trim() : '';
    if (!sessionId) return { childOnly: false };
    const now = this.now();
    this.sweep(now);

    const child = this.children.get(sessionId);
    if (child) {
      child.lastSeenAt = now;
      if (TERMINAL_EVENTS.has(eventName) && child.stoppedAt == null) {
        const inline = typeof payload.last_assistant_message === 'string'
          ? payload.last_assistant_message.trim() : '';
        this.stop(child, inline || undefined, now);
      }
      return { childOnly: true, child };
    }

    const verdict = this.verdicts.get(sessionId);
    if (verdict?.kind === 'standalone' || verdict?.kind === 'not-headless') return { childOnly: false };
    if (verdict?.kind === 'no-rollout' && now - verdict.at < NO_ROLLOUT_RETRY_MS) return { childOnly: false };

    const hookCwd = typeof payload.cwd === 'string' && payload.cwd ? payload.cwd : undefined;
    let cwd = hookCwd;
    let goal: string | undefined;
    let startedAt: number | undefined;
    if (verdict?.kind === 'pending') {
      cwd = cwd ?? verdict.cwd;
    } else {
      const located = this.locateRollout(sessionId);
      if (!located) {
        // SessionStart can land before the rollout's first line is flushed.
        // Not a verdict — look again on the next hook.
        this.verdicts.set(sessionId, { kind: 'no-rollout', at: now });
        return { childOnly: false };
      }
      if (!isHeadlessCodexOriginator(located.summary.originator)) {
        this.verdicts.set(sessionId, { kind: 'not-headless', at: now });
        return { childOnly: false };
      }
      cwd = cwd ?? located.summary.cwd;
      goal = located.summary.goal;
      startedAt = located.summary.startedAt;
    }

    // Headless. Find its process by argv cwd and walk to the launcher.
    const resolved = this.resolveByCwd(sessionId, cwd, processes, peers);
    if (resolved.kind === 'child') {
      const attached = this.attach({
        sessionId, pid: resolved.pid, cwd, parent: resolved.parent, startedAt, goal,
      }, now);
      if (TERMINAL_EVENTS.has(eventName)) this.stop(attached, undefined, now);
      return { childOnly: true, child: attached };
    }
    if (resolved.kind === 'standalone') {
      this.verdicts.set(sessionId, { kind: 'standalone', at: now });
      return { childOnly: false };
    }
    // No process visible yet. Hold the hook out of the parent pipelines and
    // let the observer (or the next hook) resolve it.
    const since = verdict?.kind === 'pending' ? verdict.since : now;
    if (now - since > PENDING_TTL_MS || TERMINAL_EVENTS.has(eventName)) {
      // Never resolved: a run this daemon could not attach is a standalone
      // run. A terminal hook while pending means it is over either way.
      this.verdicts.set(sessionId, { kind: 'standalone', at: now });
      return { childOnly: TERMINAL_EVENTS.has(eventName) };
    }
    this.verdicts.set(sessionId, { kind: 'pending', since, cwd });
    return { childOnly: true };
  }

  /**
   * Observer path. `observations` is every headless rollout the last scan
   * found (with or without a parent); `processes` is the table it read. A
   * headless run whose ancestry reaches a peer is attached; one that reaches
   * none is judged standalone; an attached child whose process is gone from a
   * non-empty table without a terminal hook is completed here.
   */
  reconcile(
    observations: readonly CodexExecChildObservation[],
    processes: readonly ProcInfo[],
    now = this.now(),
  ): void {
    this.sweep(now);
    const seen = new Set<string>();
    for (const obs of observations) {
      seen.add(obs.sessionId);
      const existing = this.children.get(obs.sessionId);
      if (existing) {
        existing.pid = obs.pid;
        existing.lastSeenAt = now;
        if (!existing.cwd && obs.cwd) existing.cwd = obs.cwd;
        if (!existing.goal && obs.goal) existing.goal = obs.goal;
        continue;
      }
      if (obs.parent) {
        this.attach(obs, now);
      } else if (this.verdicts.get(obs.sessionId)?.kind !== 'standalone') {
        this.verdicts.set(obs.sessionId, { kind: 'standalone', at: now });
      }
    }
    // An empty table is "could not look" (collectProcessInfo reports every
    // failure as []) — never a wave of completions.
    if (processes.length === 0) return;
    const livePids = new Set(processes.map((p) => p.pid));
    for (const child of this.children.values()) {
      if (child.stoppedAt != null || child.pid == null) continue;
      if (seen.has(child.sessionId) || livePids.has(child.pid)) continue;
      this.stop(child, undefined, now);
    }
  }

  private resolveByCwd(
    sessionId: string,
    cwd: string | undefined,
    processes: readonly ProcInfo[],
    peers: readonly ExecChildPeer[],
  ): { kind: 'child'; pid: number; parent: ExecChildPeer } | { kind: 'standalone' } | { kind: 'unknown' } {
    if (!cwd || processes.length === 0) return { kind: 'unknown' };
    const claimed = new Set<number>();
    for (const c of this.children.values()) {
      if (c.sessionId !== sessionId && c.pid != null && c.stoppedAt == null) claimed.add(c.pid);
    }
    const candidates = processes.filter((p) =>
      !claimed.has(p.pid) && isCodexExecCommand(p.command) && samePath(codexExecCwdFromCommand(p.command), cwd));
    if (candidates.length === 0) return { kind: 'unknown' };
    // Prefer the binary itself over its `node`/`timeout` wrappers: ancestry is
    // the same either way, but the pid is what the vanish check watches.
    const ordered = [...candidates].sort((a, b) => wrapperRank(a.command) - wrapperRank(b.command));
    for (const proc of ordered) {
      const parent = nearestAncestorPeer(proc.pid, processes, peers);
      if (parent && parent.sessionId !== sessionId) return { kind: 'child', pid: proc.pid, parent };
    }
    return { kind: 'standalone' };
  }

  private attach(obs: {
    sessionId: string; pid: number; cwd?: string; parent: ExecChildPeer | null;
    startedAt?: number; goal?: string;
  }, now: number): CodexExecChild {
    const parent = obs.parent!;
    const child: CodexExecChild = {
      sessionId: obs.sessionId,
      pid: obs.pid,
      cwd: obs.cwd,
      parentSessionId: parent.sessionId,
      parentAgentType: parent.agentType,
      parentProjectName: parent.projectName,
      startedAt: obs.startedAt ?? now,
      lastSeenAt: now,
      goal: obs.goal,
    };
    this.children.set(obs.sessionId, child);
    this.verdicts.set(obs.sessionId, { kind: 'child' });
    try { this.lifecycle?.onStart(child); } catch { /* a listener must not break attachment */ }
    return child;
  }

  private stop(child: CodexExecChild, inlineSummary: string | undefined, now: number): void {
    child.stoppedAt = now;
    let summary = inlineSummary;
    if (!summary) {
      try { summary = this.lastMessage(child.sessionId).trim() || undefined; } catch { summary = undefined; }
    }
    try { this.lifecycle?.onStop(child, summary); } catch { /* ignore */ }
  }

  private sweep(now: number): void {
    for (const [sid, child] of this.children) {
      if (child.stoppedAt != null && now - child.stoppedAt > STOPPED_TTL_MS) {
        this.children.delete(sid);
        this.verdicts.delete(sid);
      }
    }
    for (const [sid, verdict] of this.verdicts) {
      if (verdict.kind === 'child') continue;
      const at = verdict.kind === 'pending' ? verdict.since : verdict.at;
      if (now - at > VERDICT_TTL_MS) this.verdicts.delete(sid);
    }
  }
}

function wrapperRank(command: string): number {
  const bin = basename(command.trim().split(/\s+/)[0] ?? '').replace(/\.exe$/i, '');
  return bin === 'codex' ? 0 : 1;
}

function samePath(a: string | null, b: string): boolean {
  if (!a) return false;
  const norm = (p: string) => p.replace(/\\/g, '/').replace(/\/+$/, '');
  return norm(a) === norm(b);
}
