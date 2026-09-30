import { describe, expect, it } from 'vitest';
import {
  CodexExecChildren,
  PENDING_TTL_MS,
  codexExecCwdFromCommand,
  isCodexExecCommand,
  isHeadlessCodexOriginator,
  nearestAncestorPeer,
  type CodexExecChild,
  type ExecChildPeer,
} from '../codex-exec-children.js';
import type { LocatedCodexRolloutSummary, ProcInfo } from '../passive-observer.js';

const CLAUDE_SID = '4f55869a-38a5-494c-8577-7afad72aae35';
const CHILD_SID = '01a0f35b-74a5-7bc0-827d-ef80f440478e';
const CWD = '/tmp/scratch/gen/work/2020s_ai_ai';

function proc(pid: number, ppid: number, command: string): ProcInfo {
  return { pid, ppid, rssKb: 100, command };
}

/** The 2026-10-01 shape: claude → zsh → run.sh → xargs → bash → timeout → node → codex. */
function batchTable(): ProcInfo[] {
  return [
    proc(71456, 1872, 'claude'),
    proc(16524, 71456, '/bin/zsh -c source snapshot.sh && bash run.sh'),
    proc(17382, 16524, '/bin/bash /tmp/scratch/gen/run.sh 4 1970s_mainframe_ai'),
    proc(17384, 17382, 'xargs -P 4 -I{} bash -c gen_one {}'),
    proc(49448, 17384, 'bash -c gen_one 2020s_ai_ai'),
    proc(49451, 49448, `timeout 1500 codex exec --skip-git-repo-check -s workspace-write -C ${CWD} -`),
    proc(49452, 49451, `node /opt/homebrew/bin/codex exec --skip-git-repo-check -s workspace-write -C ${CWD} -`),
    proc(49460, 49452, `/opt/homebrew/lib/node_modules/@openai/codex/vendor/aarch64-apple-darwin/bin/codex exec --skip-git-repo-check -s workspace-write -C ${CWD} -`),
    proc(49470, 49460, '/opt/homebrew/lib/node_modules/@openai/codex/vendor/aarch64-apple-darwin/bin/codex-code-mode-host'),
  ];
}

const claudePeer: ExecChildPeer = { sessionId: CLAUDE_SID, pid: 71456, agentType: 'claude-code', projectName: 'epoch-of-tech' };

function rollout(originator: string, extra: Partial<LocatedCodexRolloutSummary['summary']> = {}): LocatedCodexRolloutSummary {
  return {
    path: `/rollouts/rollout-${CHILD_SID}.jsonl`,
    mtimeMs: 1,
    summary: { state: 'processing', isSubagent: false, originator, cwd: CWD, ...extra },
  };
}

interface Recorded { starts: CodexExecChild[]; stops: Array<{ child: CodexExecChild; summary: string | undefined }> }

function registry(opts: {
  rollout?: LocatedCodexRolloutSummary | null;
  lastMessage?: string;
  now?: () => number;
} = {}): { reg: CodexExecChildren; seen: Recorded } {
  const seen: Recorded = { starts: [], stops: [] };
  const reg = new CodexExecChildren({
    locateRollout: () => (opts.rollout === undefined ? rollout('codex_exec') : opts.rollout),
    lastMessage: () => opts.lastMessage ?? '',
    now: opts.now,
  });
  reg.lifecycle = {
    onStart: (child) => { seen.starts.push({ ...child }); },
    onStop: (child, summary) => { seen.stops.push({ child: { ...child }, summary }); },
  };
  return { reg, seen };
}

describe('codex exec shape predicates', () => {
  it('recognises the exec subcommand behind node and timeout wrappers, not the helpers', () => {
    expect(isCodexExecCommand(`timeout 1500 codex exec -C ${CWD} -`)).toBe(true);
    expect(isCodexExecCommand(`node /opt/homebrew/bin/codex exec -C ${CWD} -`)).toBe(true);
    expect(isCodexExecCommand('/x/bin/codex exec --skip-git-repo-check -s workspace-write -C /p -')).toBe(true);
    expect(isCodexExecCommand('/x/bin/codex --profile fast exec -')).toBe(true);
    expect(isCodexExecCommand('/x/bin/codex')).toBe(false);
    expect(isCodexExecCommand('/x/bin/codex resume abc')).toBe(false);
    expect(isCodexExecCommand('/x/bin/codex-code-mode-host')).toBe(false);
    expect(isCodexExecCommand('/Applications/ChatGPT.app/Contents/Resources/codex app-server')).toBe(false);
    expect(isCodexExecCommand('grep codex exec')).toBe(false);
  });

  it('reads the working directory from -C / --cd / --cd=', () => {
    expect(codexExecCwdFromCommand(`codex exec -C ${CWD} -`)).toBe(CWD);
    expect(codexExecCwdFromCommand('codex exec --cd /a/b -')).toBe('/a/b');
    expect(codexExecCwdFromCommand('codex exec --cd=/a/b -')).toBe('/a/b');
    expect(codexExecCwdFromCommand('codex exec -')).toBeNull();
  });

  it('treats only codex_exec as headless, case-insensitively', () => {
    expect(isHeadlessCodexOriginator('codex_exec')).toBe(true);
    expect(isHeadlessCodexOriginator('Codex_Exec')).toBe(true);
    expect(isHeadlessCodexOriginator('codex-tui')).toBe(false);
    expect(isHeadlessCodexOriginator('Codex Desktop')).toBe(false);
    expect(isHeadlessCodexOriginator(undefined)).toBe(false);
  });
});

describe('nearestAncestorPeer', () => {
  it('walks the wrapper chain up to the launching session', () => {
    expect(nearestAncestorPeer(49460, batchTable(), [claudePeer])).toEqual(claudePeer);
  });

  it('never matches the process itself and returns null with no peer ancestor', () => {
    const selfPeer: ExecChildPeer = { sessionId: CHILD_SID, pid: 49460, agentType: 'codex-cli' };
    expect(nearestAncestorPeer(49460, batchTable(), [selfPeer])).toBeNull();
    expect(nearestAncestorPeer(49460, batchTable(), [])).toBeNull();
  });

  it('survives a cyclic or truncated table', () => {
    const table = [proc(10, 11, 'a'), proc(11, 10, 'b')];
    expect(nearestAncestorPeer(10, table, [claudePeer])).toBeNull();
  });
});

describe('CodexExecChildren.noteHook', () => {
  it('attaches a headless run to its launcher on SessionStart when the process is visible', () => {
    const { reg, seen } = registry();
    const verdict = reg.noteHook('codex_session_start', { session_id: CHILD_SID, cwd: CWD }, batchTable(), [claudePeer]);
    expect(verdict.childOnly).toBe(true);
    expect(verdict.child).toMatchObject({ sessionId: CHILD_SID, parentSessionId: CLAUDE_SID, parentAgentType: 'claude-code', pid: 49460, cwd: CWD });
    expect(seen.starts).toHaveLength(1);
    expect(reg.knows(CHILD_SID)).toBe(true);
    expect(reg.parentOf(CHILD_SID)).toBe(CLAUDE_SID);
  });

  it('completes the child on its Stop with the inline reply, once', () => {
    const { reg, seen } = registry();
    reg.noteHook('codex_session_start', { session_id: CHILD_SID, cwd: CWD }, batchTable(), [claudePeer]);
    reg.noteHook('codex_tool_start', { session_id: CHILD_SID, cwd: CWD, tool_name: 'exec' }, batchTable(), [claudePeer]);
    const stop = reg.noteHook('codex_stop', { session_id: CHILD_SID, cwd: CWD, last_assistant_message: 'DONE' }, batchTable(), [claudePeer]);
    expect(stop.childOnly).toBe(true);
    expect(seen.stops).toHaveLength(1);
    expect(seen.stops[0].summary).toBe('DONE');
    // A trailing tool_end after the stop is still the child's, and no second stop.
    const trailing = reg.noteHook('codex_tool_end', { session_id: CHILD_SID, cwd: CWD }, batchTable(), [claudePeer]);
    expect(trailing.childOnly).toBe(true);
    expect(seen.stops).toHaveLength(1);
  });

  it('falls back to the rollout reply when the Stop payload carries none', () => {
    const { reg, seen } = registry({ lastMessage: 'wrote 12 files' });
    reg.noteHook('codex_session_start', { session_id: CHILD_SID, cwd: CWD }, batchTable(), [claudePeer]);
    reg.noteHook('codex_stop', { session_id: CHILD_SID, cwd: CWD }, batchTable(), [claudePeer]);
    expect(seen.stops[0].summary).toBe('wrote 12 files');
  });

  it('lets an interactive TUI session through untouched', () => {
    const { reg, seen } = registry({ rollout: rollout('codex-tui') });
    const verdict = reg.noteHook('codex_session_start', { session_id: CHILD_SID, cwd: CWD }, batchTable(), [claudePeer]);
    expect(verdict.childOnly).toBe(false);
    expect(seen.starts).toHaveLength(0);
    expect(reg.knows(CHILD_SID)).toBe(false);
  });

  it('judges a headless run with no session ancestor standalone', () => {
    const { reg, seen } = registry();
    const table = [
      proc(500, 1, '/bin/zsh'),
      proc(501, 500, `/x/bin/codex exec -C ${CWD} -`),
    ];
    const verdict = reg.noteHook('codex_session_start', { session_id: CHILD_SID, cwd: CWD }, table, [claudePeer]);
    expect(verdict.childOnly).toBe(false);
    expect(seen.starts).toHaveLength(0);
    expect(reg.knows(CHILD_SID)).toBe(false);
  });

  it('holds hooks while the process is not yet visible, then attaches on the next hook', () => {
    let now = 1_000;
    const { reg, seen } = registry({ now: () => now });
    // SessionStart lands before the 5 s scan refreshed the process table.
    const first = reg.noteHook('codex_session_start', { session_id: CHILD_SID, cwd: CWD }, [], [claudePeer]);
    expect(first.childOnly).toBe(true);
    expect(reg.knows(CHILD_SID)).toBe(true);
    expect(seen.starts).toHaveLength(0);
    now += 3_000;
    const second = reg.noteHook('codex_tool_start', { session_id: CHILD_SID, cwd: CWD }, batchTable(), [claudePeer]);
    expect(second.childOnly).toBe(true);
    expect(seen.starts).toHaveLength(1);
  });

  it('gives up on a pending run after PENDING_TTL_MS and lets its hooks through', () => {
    let now = 1_000;
    const { reg } = registry({ now: () => now });
    expect(reg.noteHook('codex_session_start', { session_id: CHILD_SID, cwd: CWD }, [], [claudePeer]).childOnly).toBe(true);
    now += PENDING_TTL_MS + 1;
    expect(reg.noteHook('codex_tool_start', { session_id: CHILD_SID, cwd: CWD }, [], [claudePeer]).childOnly).toBe(false);
    expect(reg.knows(CHILD_SID)).toBe(false);
    // Sticky: a later hook does not re-open the question.
    expect(reg.noteHook('codex_tool_end', { session_id: CHILD_SID, cwd: CWD }, batchTable(), [claudePeer]).childOnly).toBe(false);
  });

  it('re-checks a rollout that was not on disk at SessionStart', () => {
    let located: LocatedCodexRolloutSummary | null = null;
    let now = 1_000;
    const seen: Recorded = { starts: [], stops: [] };
    const reg = new CodexExecChildren({ locateRollout: () => located, now: () => now });
    reg.lifecycle = { onStart: (c) => seen.starts.push(c), onStop: () => {} };
    expect(reg.noteHook('codex_session_start', { session_id: CHILD_SID, cwd: CWD }, batchTable(), [claudePeer]).childOnly).toBe(false);
    located = rollout('codex_exec');
    now += 2_500;
    expect(reg.noteHook('codex_user_prompt_submit', { session_id: CHILD_SID, cwd: CWD }, batchTable(), [claudePeer]).childOnly).toBe(true);
    expect(seen.starts).toHaveLength(1);
  });

  it('ignores non-codex hooks and hooks without a session id', () => {
    const { reg } = registry();
    expect(reg.noteHook('SessionStart', { session_id: CHILD_SID }, batchTable(), [claudePeer]).childOnly).toBe(false);
    expect(reg.noteHook('codex_session_start', {}, batchTable(), [claudePeer]).childOnly).toBe(false);
  });

  it('does not let two same-cwd siblings claim one process', () => {
    const other = '01a0f35b-b2be-7ca1-955e-8ca991dd357b';
    const table = [
      ...batchTable(),
      proc(49548, 17384, 'bash -c gen_one 2020s_ai_ai'),
      proc(49551, 49548, `/x/bin/codex exec -C ${CWD} -`),
    ];
    const { reg } = registry();
    const a = reg.noteHook('codex_session_start', { session_id: CHILD_SID, cwd: CWD }, table, [claudePeer]);
    const b = reg.noteHook('codex_session_start', { session_id: other, cwd: CWD }, table, [claudePeer]);
    expect(a.child?.pid).toBeDefined();
    expect(b.child?.pid).toBeDefined();
    expect(a.child?.pid).not.toBe(b.child?.pid);
  });
});

describe('CodexExecChildren.reconcile', () => {
  it('attaches observer-found children and completes them when their process exits', () => {
    const { reg, seen } = registry({ lastMessage: 'DONE' });
    reg.reconcile([{ sessionId: CHILD_SID, pid: 49460, cwd: CWD, parent: claudePeer, goal: 'write the 2020s AI chapter' }], batchTable());
    expect(seen.starts).toHaveLength(1);
    expect(seen.starts[0]).toMatchObject({ parentSessionId: CLAUDE_SID, goal: 'write the 2020s AI chapter' });
    // Next scan: rollout closed, process gone.
    const without = batchTable().filter((p) => p.pid < 49451);
    reg.reconcile([], without);
    expect(seen.stops).toHaveLength(1);
    expect(seen.stops[0].summary).toBe('DONE');
    expect(reg.knows(CHILD_SID)).toBe(true); // tombstoned, still not a session
  });

  it('treats an empty process table as "could not look", not as every child finishing', () => {
    const { reg, seen } = registry();
    reg.reconcile([{ sessionId: CHILD_SID, pid: 49460, cwd: CWD, parent: claudePeer }], batchTable());
    reg.reconcile([], []);
    expect(seen.stops).toHaveLength(0);
  });

  it('resolves a pending hook-side child once the observer reports the parent', () => {
    const { reg, seen } = registry();
    expect(reg.noteHook('codex_session_start', { session_id: CHILD_SID, cwd: CWD }, [], [claudePeer]).childOnly).toBe(true);
    reg.reconcile([{ sessionId: CHILD_SID, pid: 49460, cwd: CWD, parent: claudePeer }], batchTable());
    expect(seen.starts).toHaveLength(1);
    expect(reg.parentOf(CHILD_SID)).toBe(CLAUDE_SID);
  });

  it('marks a parentless observation standalone so its later hooks flow', () => {
    const { reg } = registry();
    expect(reg.noteHook('codex_session_start', { session_id: CHILD_SID, cwd: CWD }, [], []).childOnly).toBe(true);
    reg.reconcile([{ sessionId: CHILD_SID, pid: 49460, cwd: CWD, parent: null }], batchTable());
    expect(reg.knows(CHILD_SID)).toBe(false);
    expect(reg.noteHook('codex_tool_start', { session_id: CHILD_SID, cwd: CWD }, [], []).childOnly).toBe(false);
  });

  it('corrects a best-effort hook-side pid with the observer\'s exact one', () => {
    const { reg } = registry();
    const table = [
      ...batchTable(),
      proc(49548, 17384, 'bash -c gen_one 2020s_ai_ai'),
      proc(49551, 49548, `/x/bin/codex exec -C ${CWD} -`),
    ];
    reg.noteHook('codex_session_start', { session_id: CHILD_SID, cwd: CWD }, table, [claudePeer]);
    reg.reconcile([{ sessionId: CHILD_SID, pid: 49551, cwd: CWD, parent: claudePeer }], table);
    expect(reg.snapshot().find((c) => c.sessionId === CHILD_SID)?.pid).toBe(49551);
  });
});
