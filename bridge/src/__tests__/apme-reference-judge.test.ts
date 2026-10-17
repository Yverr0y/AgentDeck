import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { chmodSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { ApmeStore, type ApmeLocalVerdictRow, type ApmeReferenceEvalRow } from '../apme/store.js';
import { ApmeCollector } from '../apme/collector.js';
import { ApmeRunner, buildTaskJudgeInput } from '../apme/runner.js';
import type { ApmeConfig } from '../apme/settings.js';
import {
  CODEX_FIXED_INPUT_TOKENS,
  REFERENCE_DISABLED_FEATURES,
  buildReferenceReports,
  codexDefaultModel,
  codexJudgeArgs,
  computeAgreement,
  estimateCodexInputTokens,
  isolationBreach,
  parseCodexExecEvents,
  pickReferenceCandidates,
  redactForEgress,
  referenceSampleLabel,
  runCodexJudge,
  stderrReason,
  verdictSchemaFromRubric,
} from '../apme/reference-judge.js';

/**
 * The reference judge (`agentdeck apme reference-judge`) scores tasks the
 * local judge already scored, through `codex exec`, so the local judge can be
 * measured. These tests pin what makes that number mean anything: both judges
 * see one prompt, the reference verdict never reaches the product's own evals,
 * and the codex call is isolated from the daemon that observes Codex.
 */

async function makeStore(): Promise<ApmeStore> {
  const dir = mkdtempSync(join(tmpdir(), 'apme-refjudge-'));
  const store = new ApmeStore(join(dir, 'apme.sqlite'));
  if (!(await store.init())) {
    rmSync(dir, { recursive: true, force: true });
    throw new Error('APME store failed to initialize — is better-sqlite3 installed?');
  }
  (store as unknown as { _tmpDir: string })._tmpDir = dir;
  return store;
}
function cleanup(store: ApmeStore): void {
  store.close();
  const dir = (store as unknown as { _tmpDir?: string })._tmpDir;
  if (dir) rmSync(dir, { recursive: true, force: true });
}

const STUB_CONFIG: ApmeConfig = {
  enabled: true,
  deterministic: { enabled: false, timeoutSec: 30, commands: {} },
  judge: { backend: 'mlx', endpoint: 'http://stub', model: 'stub', sampleRate: 1, onlyWhenDisagreement: false },
  availableModels: [],
};

// Verbatim `codex exec --json` output, codex-cli 0.160.1, 2026-10-18, for a
// synthetic pagination task (no user data).
const CAPTURED_EVENTS = [
  '{"type":"thread.started","thread_id":"01a14c03-24b0-7333-89ea-3a7c625fbadb"}',
  '{"type":"turn.started"}',
  '{"type":"item.completed","item":{"id":"item_0","type":"agent_message","text":"{\\"summary\\":\\"The pagination fix is direct and passes tests, but the claimed regression test is not supported by the trajectory.\\",\\"completion\\":0.9,\\"coherence\\":0.85,\\"efficiency\\":1,\\"overall\\":0.9,\\"reasoning\\":\\"Changing slice(start - 1, end) to slice(start, end) directly addresses the repeated boundary item, and all three pagination tests passed. The final response claims a regression test was added, but no test edit appears in the recorded actions.\\",\\"done\\":[\\"Corrected the slice start index.\\",\\"Ran pagination tests with three passing.\\"],\\"missed\\":[\\"No recorded addition of the claimed page-boundary regression test.\\"]}"}}',
  '{"type":"turn.completed","usage":{"input_tokens":17141,"cached_input_tokens":0,"cache_write_input_tokens":0,"output_tokens":144,"reasoning_output_tokens":0}}',
].join('\n');

// Verbatim lines from the same Codex, 2026-10-18, synthetic prompts that asked
// the model to check a claim itself. With the shell on under `-s read-only`:
const CAPTURED_SHELL_CALL = [
  '{"type":"item.started","item":{"id":"item_0","type":"command_execution","command":"/bin/zsh -lc \\"test -f /etc/hosts && rg -n \'(\\"\'^|[[:space:]])localhost([[:space:]]|$)\'\\"\' /etc/hosts\\"","aggregated_output":"","exit_code":null,"status":"in_progress"}}',
  '{"type":"item.completed","item":{"id":"item_0","type":"command_execution","command":"/bin/zsh -lc \\"test -f /etc/hosts && rg -n \'(\\"\'^|[[:space:]])localhost([[:space:]]|$)\'\\"\' /etc/hosts\\"","aggregated_output":"4:# localhost is used to configure the loopback interface\\n7:127.0.0.1\\tlocalhost\\n9:::1             localhost\\n","exit_code":0,"status":"completed"}}',
  '{"type":"item.completed","item":{"id":"item_1","type":"agent_message","text":"{\\"overall\\":1,\\"reasoning\\":\\"Verified that /etc/hosts exists and contains localhost entries for 127.0.0.1 and ::1. The claim is correct.\\",\\"checked_with_tool\\":true}"}}',
].join('\n');
// Web search, on by default even under --ignore-user-config (the item carries
// its id twice; the second wins):
const CAPTURED_WEB_SEARCH_START =
  '{"type":"item.started","item":{"id":"item_0","type":"web_search","id":"exec-5ed03a70-5ae5-4f3e-b6f4-8152e247b2e6","query":"","action":{"type":"other"}}}';
// An unknown `-c` key, which Codex reports and then ignores:
const CAPTURED_IGNORED_SETTING =
  '{"type":"item.completed","item":{"id":"item_0","type":"error","message":"Codex is ignoring 1 unrecognized configuration setting. Check for typos or deprecated settings.\\n  session-flags: `no_such_key_xyz` is ignored."}}';
// The notice every run with `--disable code_mode_host` starts with:
const CAPTURED_CODE_MODE_OFF =
  '{"type":"item.completed","item":{"id":"item_0","type":"error","message":"Code Mode is unavailable because code-mode host is disabled. Code mode will fail closed; enable `features.code_mode_host` and install `codex-code-mode-host`."}}';

describe('one prompt for both judges', () => {
  let store!: ApmeStore;
  beforeEach(async () => { store = await makeStore(); });
  afterEach(() => { cleanup(store); });

  it('buildTaskJudgeInput produces exactly the prompt the live task judge sends', async () => {
    const collector = new ApmeCollector(store);
    const runner = new ApmeRunner(store);
    runner._setConfig(STUB_CONFIG);
    const sent: string[] = [];
    runner._setJudgeFn(async (p) => { sent.push(p); return JSON.stringify({ overall: 0.8, reasoning: 'r', summary: 'Fixed it', done: [], missed: [] }); });

    const runId = collector.openRun({ sessionId: 's1', agentType: 'claude-code', projectName: 'demo' })!;
    collector.ingestHook('s1', 'UserPromptSubmit', { prompt: 'fix the flaky retry test' });
    collector.ingestHook('s1', 'PreToolUse', { tool_name: 'Bash', tool_input: { command: 'pnpm test retry' } });
    collector.setTurnResponse('s1', 'Fixed the race in the retry helper and re-ran the suite.');
    const taskId = collector.getActiveTaskId('s1')!;
    collector.noteTurnStop('s1');
    collector.closeRun('s1');
    store.updateRun(runId, { taskCategory: 'debugging' });

    runner.enqueueTask({ runId, taskId, boundarySignal: 'session_end' });
    await runner.drain();

    const input = buildTaskJudgeInput(store, { runId, taskId, boundarySignal: 'session_end' });
    expect(input.kind).toBe('ready');
    expect(sent).toHaveLength(1);
    expect(input.kind === 'ready' && input.prompt).toBe(sent[0]);
  });

  it('declines a task the live judge would decline, and writes nothing', async () => {
    const collector = new ApmeCollector(store);
    const runId = collector.openRun({ sessionId: 's2', agentType: 'codex-cli', projectName: 'demo' })!;
    collector.ingestHook('s2', 'UserPromptSubmit', { prompt: 'fix the flaky test please' });
    const taskId = collector.getActiveTaskId('s2')!;
    collector.noteTurnStop('s2');
    collector.closeRun('s2');
    const before = store.getTask(taskId)!.notesJson;

    expect(buildTaskJudgeInput(store, { runId, taskId })).toEqual({ kind: 'declined', reason: 'no_reply' });
    expect(store.getTask(taskId)!.notesJson).toBe(before);
    expect(buildTaskJudgeInput(store, { runId, taskId: 'no-such-task' })).toEqual({ kind: 'missing' });
  });
});

describe('verdict schema from the rubric template', () => {
  let store!: ApmeStore;
  beforeEach(async () => { store = await makeStore(); });
  afterEach(() => { cleanup(store); });

  it('turns the seeded task_rollup template into a strict schema', () => {
    const schema = verdictSchemaFromRubric(store.getCurrentRubric('task_rollup')!.prompt);
    expect(schema).toEqual({
      type: 'object',
      properties: {
        summary: { type: 'string' },
        completion: { type: 'number' },
        coherence: { type: 'number' },
        efficiency: { type: 'number' },
        overall: { type: 'number' },
        reasoning: { type: 'string' },
        done: { type: 'array', items: { type: 'string' } },
        missed: { type: 'array', items: { type: 'string' } },
      },
      required: ['summary', 'completion', 'coherence', 'efficiency', 'overall', 'reasoning', 'done', 'missed'],
      additionalProperties: false,
    });
  });

  it('reads every seeded category rubric, so a template edit that breaks it fails here', () => {
    for (const purpose of ['conversation', 'planning', 'research', 'debugging', 'refactoring', 'review', 'ops']) {
      const rubric = store.getCurrentRubric(purpose);
      expect(rubric, purpose).not.toBeNull();
      const schema = verdictSchemaFromRubric(rubric!.prompt) as { required: string[] } | null;
      expect(schema?.required, purpose).toContain('overall');
    }
  });

  it('returns null rather than guessing when there is no template', () => {
    expect(verdictSchemaFromRubric('Score this. Respond with JSON.')).toBeNull();
    expect(verdictSchemaFromRubric('Return strict JSON: {"overall":N, "nested":{"a":1}}')).toBeNull();
    expect(verdictSchemaFromRubric('Return strict JSON: {"completion":N}')).toBeNull();
  });
});

describe('codex exec', () => {
  it('reads the verdict and token usage from captured JSONL', () => {
    const outcome = parseCodexExecEvents(CAPTURED_EVENTS);
    expect(outcome.error).toBeNull();
    expect(outcome.usage).toEqual({ inputTokens: 17141, cachedInputTokens: 0, outputTokens: 144, reasoningTokens: 0 });
    expect(JSON.parse(outcome.text!).overall).toBe(0.9);
  });

  it('reports a failed turn and skips lines that are not JSON', () => {
    const outcome = parseCodexExecEvents([
      'Reading prompt from stdin...',
      '{"type":"turn.started"}',
      '{"type":"turn.failed","error":{"message":"usage limit reached"}}',
    ].join('\n'));
    expect(outcome).toEqual({ text: null, usage: null, error: 'usage limit reached', toolItems: [], warnings: [] });
    expect(parseCodexExecEvents('{"type":"error","message":"stream disconnected"}').error).toBe('stream disconnected');
  });

  it('a verdict reached through a tool is not a reference verdict', () => {
    const shell = parseCodexExecEvents(CAPTURED_SHELL_CALL);
    expect(shell.toolItems).toEqual(['command_execution']);
    expect(shell.text).not.toBeNull();
    expect(isolationBreach(shell)).toBe('the reference called a tool (command_execution)');

    // A call that never completed still counts.
    const web = parseCodexExecEvents([CAPTURED_WEB_SEARCH_START, CAPTURED_EVENTS].join('\n'));
    expect(web.toolItems).toEqual(['web_search']);
    expect(isolationBreach(web)).toMatch(/web_search/);
    expect(isolationBreach(parseCodexExecEvents(CAPTURED_EVENTS))).toBeNull();
  });

  it('a setting Codex ignored fails the run; the code-mode notice does not', () => {
    const ignored = parseCodexExecEvents([CAPTURED_IGNORED_SETTING, CAPTURED_EVENTS].join('\n'));
    expect(ignored.warnings).toHaveLength(1);
    expect(isolationBreach(ignored)).toMatch(/^codex ignored a setting: .*no_such_key_xyz/);

    const codeModeOff = parseCodexExecEvents([CAPTURED_CODE_MODE_OFF, CAPTURED_EVENTS].join('\n'));
    expect(codeModeOff.warnings).toHaveLength(1);
    expect(codeModeOff.toolItems).toEqual([]);
    expect(isolationBreach(codeModeOff)).toBeNull();
  });

  it('keeps every isolation flag: no rollout, no user config (hooks), no tools, no web, prompt on stdin', () => {
    const args = codexJudgeArgs({ model: 'm', effort: 'high', cwd: '/scratch/cwd', schemaPath: '/scratch/s.json' });
    expect(args[0]).toBe('exec');
    expect(args).toContain('--ephemeral');
    expect(args).toContain('--ignore-user-config');
    expect(args.join(' ')).toContain('-s read-only');
    // Named here, not read back from the list, so dropping one fails.
    for (const feature of ['shell_tool', 'unified_exec', 'code_mode_host', 'view_image', 'apps', 'plugins', 'multi_agent', 'hooks']) {
      expect(args.join(' ')).toContain(`--disable ${feature}`);
    }
    for (const feature of REFERENCE_DISABLED_FEATURES) expect(args.join(' ')).toContain(`--disable ${feature}`);
    expect(args.join(' ')).toContain('-c web_search=disabled');
    expect(args.join(' ')).toContain('-C /scratch/cwd');
    expect(args.join(' ')).toContain('-m m');
    expect(args.join(' ')).toContain('-c model_reasoning_effort=high');
    expect(args.join(' ')).toContain('--output-schema /scratch/s.json');
    expect(args).toContain('--json');
    expect(args[args.length - 1]).toBe('-');
    expect(codexJudgeArgs({ model: 'm', effort: 'low', cwd: '/c', schemaPath: null })).not.toContain('--output-schema');
  });

  it('reads the default model from the top level of config.toml only', () => {
    expect(codexDefaultModel('model = "gpt-6-astra"\nmodel_reasoning_effort = "ultra"\n')).toBe('gpt-6-astra');
    expect(codexDefaultModel('# comment\n[profiles.fast]\nmodel = "gpt-5.6-luna"\n')).toBeNull();
    expect(codexDefaultModel('approval_policy = "never"\n')).toBeNull();
  });
});

describe.skipIf(process.platform === 'win32')('runCodexJudge against a stand-in codex binary', () => {
  let dir!: string;
  beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'apme-fake-codex-')); });
  afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

  // Each stand-in is a cold node start. Under swap pressure one took over the
  // 10 s default (2026-10-18), so these tests allow 30 s: runCodexJudge's own
  // 20 s bound is the one that should fire, and it says what went wrong.
  function fakeCodex(body: string): string {
    const path = join(dir, 'codex');
    writeFileSync(path, `#!/usr/bin/env node\n${body}\n`);
    chmodSync(path, 0o755);
    return path;
  }

  it('sends the prompt on stdin, closes it, and parses the reply', async () => {
    const record = join(dir, 'record.json');
    const binary = fakeCodex(`
      const fs = require('fs');
      let input = '';
      process.stdin.on('data', (c) => { input += c; });
      process.stdin.on('end', () => {
        const args = process.argv.slice(2);
        const cwd = args[args.indexOf('-C') + 1];
        const schema = args[args.indexOf('--output-schema') + 1];
        fs.writeFileSync(${JSON.stringify(record)}, JSON.stringify({ input, args, cwdEntries: fs.readdirSync(cwd), schema: JSON.parse(fs.readFileSync(schema, 'utf-8')) }));
        console.log(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: JSON.stringify({ overall: 0.4, reasoning: 'r', done: [], missed: ['tests'] }) } }));
        console.log(JSON.stringify({ type: 'turn.completed', usage: { input_tokens: 20000, cached_input_tokens: 0, output_tokens: 300, reasoning_output_tokens: 120 } }));
      });
    `);
    const schema = { type: 'object', properties: { overall: { type: 'number' } }, required: ['overall'], additionalProperties: false };
    const result = await runCodexJudge('PROMPT ✓ 한글', { model: 'gpt-x', effort: 'high', schema, binary, timeoutMs: 20_000 });

    expect(result.error).toBeNull();
    expect(JSON.parse(result.text!).overall).toBe(0.4);
    expect(result.usage).toEqual({ inputTokens: 20000, cachedInputTokens: 0, outputTokens: 300, reasoningTokens: 120 });
    const seen = JSON.parse(readFileSync(record, 'utf-8')) as { input: string; args: string[]; cwdEntries: string[]; schema: unknown };
    expect(seen.input).toBe('PROMPT ✓ 한글');
    expect(seen.cwdEntries).toEqual([]);
    expect(seen.schema).toEqual(schema);
    expect(seen.args).toContain('--ignore-user-config');
    // The scratch directory is removed after the call.
    expect(readdirSync(tmpdir()).some((e) => e.startsWith('agentdeck-refjudge-') && seen.args.join(' ').includes(e))).toBe(false);
  }, 30_000);

  it('kills a call that outlives its timeout and says so', async () => {
    const binary = fakeCodex(`process.stdin.resume(); setInterval(() => {}, 1000);`);
    const result = await runCodexJudge('p', { model: 'm', effort: 'low', schema: null, binary, timeoutMs: 400 });
    expect(result.text).toBeNull();
    expect(result.error).toMatch(/timed out/);
  });

  it('a non-zero exit with no verdict says why, from the error line on stderr', async () => {
    const binary = fakeCodex(`process.stdin.resume(); process.stdin.on('end', () => { console.error("error: unexpected argument '--disable' found"); console.error(''); console.error("For more information, try '--help'."); process.exit(2); });`);
    const result = await runCodexJudge('p', { model: 'nope', effort: 'low', schema: null, binary, timeoutMs: 20_000 });
    expect(result.text).toBeNull();
    expect(result.error).toBe("codex exited 2: error: unexpected argument '--disable' found");
  }, 30_000);

  it('withholds a verdict the model reached through a tool', async () => {
    const binary = fakeCodex(`
      process.stdin.resume();
      process.stdin.on('end', () => { process.stdout.write(${JSON.stringify(`${CAPTURED_SHELL_CALL}\n`)}); });
    `);
    const result = await runCodexJudge('p', { model: 'm', effort: 'low', schema: null, binary, timeoutMs: 20_000 });
    expect(result.text).toBeNull();
    expect(result.error).toBe('the reference called a tool (command_execution)');
  }, 30_000);
});

describe('dry-run cost estimate', () => {
  it('adds the fixed part to the prompt at the fitted per-script rates', () => {
    expect(estimateCodexInputTokens('')).toBe(CODEX_FIXED_INPUT_TOKENS);
    expect(estimateCodexInputTokens('a'.repeat(1000))).toBe(CODEX_FIXED_INPUT_TOKENS + 280);
    expect(estimateCodexInputTokens('가'.repeat(1000))).toBe(CODEX_FIXED_INPUT_TOKENS + 910);
  });
});

describe('stderr reason', () => {
  it('prefers the error line, falls back to the last line', () => {
    expect(stderrReason('Error: Unknown feature flag: no_such_feature_xyz\n')).toBe('Error: Unknown feature flag: no_such_feature_xyz');
    expect(stderrReason('warming up\nsomething went wrong\n')).toBe('something went wrong');
    expect(stderrReason('  \n')).toBeNull();
  });
});

describe('redaction before egress', () => {
  it('removes pairing tokens and credential shapes, keeps hashes and ids a judge reads as evidence', () => {
    const token = 'a'.repeat(32) + 'b'.repeat(32);
    const sha = '3c7c6aac0f1e2d3c4b5a69788796a5b4c3d2e1f0';
    const uuid = '01a14c03-24b0-7333-89ea-3a7c625fbadb';
    const text = [
      `curl -H "Authorization: Bearer ${token}" http://127.0.0.1:9120/health`,
      `ws://host:9120/?token=${token}`,
      'export ANTHROPIC_API_KEY=sk-ant-api03-abcdefghijklmnop',
      'OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwx1234',
      'git push https://ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@github.com/x/y',
      'aws key AKIAABCDEFGHIJKLMNOP',
      '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA\n-----END OPENSSH PRIVATE KEY-----',
      `commit ${sha} in thread ${uuid}`,
    ].join('\n');
    const { text: out, redactions } = redactForEgress(text, [token, 'short']);
    expect(out).not.toContain(token);
    expect(out).not.toContain('sk-ant-api03');
    expect(out).not.toContain('sk-abcdefghijklmnopqrstuvwx1234');
    expect(out).not.toContain('ghp_ABCDEF');
    expect(out).not.toContain('AKIAABCDEFGHIJKLMNOP');
    expect(out).not.toContain('b3BlbnNzaC1rZXktdjEAAAAA');
    expect(out).toContain(sha);
    expect(out).toContain(uuid);
    expect(redactions).toBe(7);
  });

  it('leaves clean text unchanged', () => {
    expect(redactForEgress('Fixed the race; 3 tests pass.', [])).toEqual({ text: 'Fixed the race; 3 tests pass.', redactions: 0 });
  });
});

describe('sampling', () => {
  const row = (taskId: string, category: string | null = 'coding', project: string | null = 'AgentDeck'): ApmeLocalVerdictRow => ({
    taskId, runId: `r-${taskId}`, agentType: 'claude-code', project, category, endedAt: 1, summary: null,
    localOverall: 1, localJudge: 'mlx:x', localRubricVer: 1, localJudgedAt: 1,
  });

  it('a task keeps its place when the pool grows, so a dry run shows what --run sends', () => {
    const pool = Array.from({ length: 40 }, (_, i) => row(`t${i}`));
    const first = pickReferenceCandidates(pool, { limit: 40, skip: new Set(), seed: 's' }).map((r) => r.taskId);
    const grown = pickReferenceCandidates([...pool, row('new-1'), row('new-2')], { limit: 42, skip: new Set(), seed: 's' })
      .map((r) => r.taskId).filter((id) => !id.startsWith('new-'));
    expect(grown).toEqual(first);
    expect(first).not.toEqual(pool.map((r) => r.taskId)); // not just newest-first
  });

  it('skips what this judge already scored, so the next run continues', () => {
    const pool = Array.from({ length: 10 }, (_, i) => row(`t${i}`));
    const firstThree = pickReferenceCandidates(pool, { limit: 3, skip: new Set(), seed: 's' }).map((r) => r.taskId);
    const next = pickReferenceCandidates(pool, { limit: 3, skip: new Set(firstThree), seed: 's' }).map((r) => r.taskId);
    expect(next.some((id) => firstThree.includes(id))).toBe(false);
    expect(next).toEqual(pickReferenceCandidates(pool, { limit: 6, skip: new Set(), seed: 's' }).map((r) => r.taskId).slice(3));
  });

  it('filters by category', () => {
    const pool = [row('a', 'ops'), row('b', 'coding'), row('c', 'ops')];
    expect(pickReferenceCandidates(pool, { limit: 5, skip: new Set(), seed: 's', category: 'ops' }).map((r) => r.taskId).sort())
      .toEqual(['a', 'c']);
  });

  it('sends only allow-listed projects, matched case-insensitively; a task with no project never passes the list', () => {
    const pool = [row('a', 'ops', 'AgentDeck'), row('b', 'ops', 'ClientWork'), row('c', 'ops', 'agentdeck'), row('d', 'ops', null)];
    const pick = (projects?: string[]) =>
      pickReferenceCandidates(pool, { limit: 10, skip: new Set(), seed: 's', projects }).map((r) => r.taskId).sort();
    expect(pick(['agentdeck'])).toEqual(['a', 'c']);
    expect(pick(['AgentDeck', 'ClientWork'])).toEqual(['a', 'b', 'c']);
    expect(pick([])).toEqual(['a', 'b', 'c', 'd']);
    expect(pick()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('filters by the local outcome band, at the task outcome thresholds', () => {
    const pool = [0, 0.49, 0.5, 0.74, 0.75, 1].map((score, i) => ({ ...row(`t${i}`), localOverall: score }));
    const band = (localBand: 'success' | 'partial' | 'fail') =>
      pickReferenceCandidates(pool, { limit: 10, skip: new Set(), seed: 's', localBand }).map((r) => r.localOverall).sort();
    expect(band('fail')).toEqual([0, 0.49]);
    expect(band('partial')).toEqual([0.5, 0.74]);
    expect(band('success')).toEqual([0.75, 1]);
  });
});

describe('agreement', () => {
  it('perfect agreement', () => {
    const s = computeAgreement([{ local: 1, reference: 1 }, { local: 0.6, reference: 0.6 }, { local: 0.1, reference: 0.1 }]);
    expect(s.mae).toBe(0);
    expect(s.bias).toBe(0);
    expect(s.spearman).toBeCloseTo(1, 10);
    expect(s.bucketAgreement).toBe(1);
    expect(s.kappa).toBeCloseTo(1, 10);
  });

  it('a lenient local judge has positive bias, and bands disagree where it passes what the reference fails', () => {
    const s = computeAgreement([
      { local: 1, reference: 0.4 },
      { local: 1, reference: 0.9 },
      { local: 0, reference: 0.2 },
      { local: 1, reference: 0.6 },
    ]);
    expect(s.n).toBe(4);
    expect(s.mae).toBeCloseTo((0.6 + 0.1 + 0.2 + 0.4) / 4, 10);
    expect(s.bias).toBeCloseTo((0.6 + 0.1 - 0.2 + 0.4) / 4, 10);
    expect(s.confusion.success).toEqual({ success: 1, partial: 1, fail: 1 });
    expect(s.confusion.fail).toEqual({ success: 0, partial: 0, fail: 1 });
    expect(s.bucketAgreement).toBe(0.5);
    // po = 0.5; local bands (3 success, 1 fail), reference (1, 1, 2): pe = 3/4·1/4 + 1/4·2/4 = 5/16.
    expect(s.kappa).toBeCloseTo((0.5 - 5 / 16) / (1 - 5 / 16), 10);
    expect(s.localExtremeShare).toBe(1);
    expect(s.referenceExtremeShare).toBe(0);
    expect(s.maeCi).toBeNull(); // below 5 pairs
  });

  it('kappa is undefined when both judges put everything in one band', () => {
    const s = computeAgreement([{ local: 1, reference: 0.9 }, { local: 0.95, reference: 1 }]);
    expect(s.kappa).toBeNull();
    expect(s.bucketAgreement).toBe(1);
  });

  it('spearman uses average ranks for ties and is undefined for a constant side', () => {
    expect(computeAgreement([{ local: 1, reference: 0.2 }, { local: 1, reference: 0.5 }, { local: 1, reference: 0.9 }]).spearman).toBeNull();
    const s = computeAgreement([{ local: 0, reference: 0.1 }, { local: 1, reference: 0.5 }, { local: 1, reference: 0.9 }]);
    expect(s.spearman).toBeCloseTo(0.8660254, 6);
  });

  it('bootstrap intervals are deterministic and bracket the point estimate', () => {
    const pairs = Array.from({ length: 20 }, (_, i) => ({ local: i % 3 === 0 ? 1 : 0.5, reference: (i % 5) / 4 }));
    const a = computeAgreement(pairs);
    const b = computeAgreement(pairs);
    expect(a.maeCi).toEqual(b.maeCi);
    expect(a.maeCi![0]).toBeLessThanOrEqual(a.mae!);
    expect(a.maeCi![1]).toBeGreaterThanOrEqual(a.mae!);
  });

  it('empty input', () => {
    expect(computeAgreement([]).mae).toBeNull();
  });
});

describe('reference verdicts in the store', () => {
  let store!: ApmeStore;
  beforeEach(async () => { store = await makeStore(); });
  afterEach(() => { cleanup(store); });

  const refRow = (o: Partial<ApmeReferenceEvalRow>): ApmeReferenceEvalRow => ({
    taskId: 't1', runId: 'r', judge: 'codex:m@high', sample: 'uniform', category: 'coding', rubricVer: 1, promptSha: 'abc',
    overall: 0.5, scoresJson: '{"overall":0.5}', verdictJson: '{"summary":"Ref says partial","missed":["tests"]}', error: null,
    localJudge: 'mlx:x', localOverall: 1, localRubricVer: 1, localJudgedAt: 1,
    inputTokens: 20_000, cachedInputTokens: 0, outputTokens: 300, reasoningTokens: 100, latencyMs: 30_000,
    createdAt: Date.now(), ...o,
  });

  function seedTask(id: string, endedAt: number, verdicts: Array<{ score: number; createdAt: number; judge?: string }>) {
    store.insertTask({ id, runId: 'r', taskIndex: 0, boundarySignal: 'open', startedAt: endedAt - 1000 });
    store.updateTask(id, { endedAt, boundarySignal: 'idle_gap', taskCategory: 'coding' });
    for (const v of verdicts) {
      store.insertEvalForTask({ id: 0, runId: 'r', taskId: id, layer: 'task_judge', metric: 'overall', score: v.score, raw: null, rubricVer: 7, judgeModel: v.judge ?? 'mlx:old', createdAt: v.createdAt });
      store.insertEvalForTask({ id: 0, runId: 'r', taskId: id, layer: 'task_judge', metric: 'completion', score: 0.1, raw: null, rubricVer: 7, judgeModel: v.judge ?? 'mlx:old', createdAt: v.createdAt });
    }
  }

  it('offers closed tasks with their latest local overall verdict, newest first', () => {
    const now = Date.now();
    store.insertRun({ id: 'r', sessionId: 's', agentType: 'codex-cli', projectName: 'AgentDeck', startedAt: now - 100_000 });
    seedTask('judged-twice', now - 1000, [{ score: 0.2, createdAt: now - 900 }, { score: 1, createdAt: now - 800, judge: 'mlx:new' }]);
    seedTask('older', now - 5000, [{ score: 0, createdAt: now - 4000 }]);
    seedTask('unjudged', now - 2000, []);
    seedTask('ancient', now - 40 * 86_400_000, [{ score: 1, createdAt: now - 40 * 86_400_000 }]);

    const rows = store.listLocallyJudgedTasks({ sinceMs: now - 30 * 86_400_000, limit: 10 });
    expect(rows.map((r) => r.taskId)).toEqual(['judged-twice', 'older']);
    expect(rows[0]).toMatchObject({
      localOverall: 1, localJudge: 'mlx:new', localRubricVer: 7, agentType: 'codex-cli', project: 'AgentDeck', category: 'coding',
    });
  });

  it('stores attempts apart from evals; only successful verdicts count as scored', () => {
    const now = Date.now();
    store.insertRun({ id: 'r', sessionId: 's', agentType: 'claude-code', startedAt: now });
    store.insertTask({ id: 't1', runId: 'r', taskIndex: 0, boundarySignal: 'open', startedAt: now });
    store.insertTask({ id: 't2', runId: 'r', taskIndex: 1, boundarySignal: 'open', startedAt: now });
    store.insertReferenceEval(refRow({ taskId: 't1' }));
    store.insertReferenceEval(refRow({ taskId: 't2', overall: null, scoresJson: null, verdictJson: null, error: 'timed out after 300 s' }));
    store.insertReferenceEval(refRow({ taskId: 't2', sample: 'local_band=fail' }));

    expect([...store.referenceVerdictTaskIds('codex:m@high', 'uniform')]).toEqual(['t1']);
    // A verdict made for another design leaves the task in this design's sample.
    expect([...store.referenceVerdictTaskIds('codex:m@high', 'local_band=fail')]).toEqual(['t2']);
    expect(store.referenceVerdictTaskIds('codex:other@high', 'uniform').size).toBe(0);
    expect(store.listReferenceEvals()).toHaveLength(3);
    expect(store.listReferenceEvals({ judge: 'codex:other@high' })).toHaveLength(0);
    expect(store.listReferenceEvals({ sample: 'local_band=fail' })).toHaveLength(1);
    expect(store.listReferenceEvals({ sample: 'uniform' })[0]).toMatchObject({ taskId: 't1', sample: 'uniform' });
    // The product's own verdict tables never see a reference verdict.
    expect(store.listEvalsForTask('t1')).toEqual([]);
    expect(store.getTask('t1')!.compositeScore).toBeNull();
  });

  it('reports count a re-scored task once, by its latest verdict, and rank disagreements by size', () => {
    const t0 = 1_000_000;
    const rows: ApmeReferenceEvalRow[] = [
      refRow({ id: 1, taskId: 'a', overall: 0.2, localOverall: 1, createdAt: t0 }),
      refRow({ id: 2, taskId: 'a', overall: 0.9, localOverall: 1, createdAt: t0 + 10 }),
      refRow({ id: 3, taskId: 'b', overall: 0.3, localOverall: 0.9, createdAt: t0 + 20, category: 'ops' }),
      refRow({ id: 4, taskId: 'c', overall: null, error: 'timed out after 300 s', createdAt: t0 + 30 }),
      refRow({ id: 5, taskId: 'a', judge: 'codex:other@low', overall: 0.5, localOverall: 1, createdAt: t0 + 40 }),
    ];
    const [main, other] = buildReferenceReports(rows, { top: 5, localSummary: (id) => `local ${id}` });
    expect(main.judge).toBe('codex:m@high');
    expect(main.attempts).toBe(4);
    expect(main.failures).toBe(1);
    expect(main.failureReasons).toEqual([{ reason: 'timed out after 300 s', count: 1 }]);
    expect(main.stats.n).toBe(2);
    expect(main.disagreements.map((d) => [d.taskId, Number(d.delta.toFixed(2))])).toEqual([['b', 0.6], ['a', 0.1]]);
    expect(main.disagreements[0]).toMatchObject({ localSummary: 'local b', referenceSummary: 'Ref says partial', referenceMissed: ['tests'] });
    expect(main.byCategory.map((g) => g.key).sort()).toEqual(['coding', 'ops']);
    expect(other).toMatchObject({ judge: 'codex:other@low', attempts: 1 });
  });

  it('keeps sampling designs apart: a band-targeted sample is not pooled into the uniform estimate', () => {
    const rows = [
      refRow({ id: 1, taskId: 'u1', overall: 0.9, localOverall: 1 }),
      refRow({ id: 2, taskId: 'f1', sample: 'local_band=fail', overall: 0.95, localOverall: 0 }),
      refRow({ id: 3, taskId: 'f2', sample: 'local_band=fail', overall: 0.2, localOverall: 0 }),
    ];
    const reports = buildReferenceReports(rows, { top: 0 });
    expect(reports.map((r) => [r.sample, r.stats.n])).toEqual([['uniform', 1], ['local_band=fail', 2]]);
    expect(reports[1].stats.confusion.fail).toEqual({ success: 1, partial: 0, fail: 1 });
  });

  it('labels the design from the filters it was drawn under', () => {
    expect(referenceSampleLabel({})).toBe('uniform');
    expect(referenceSampleLabel({ localBand: 'fail' })).toBe('local_band=fail');
    expect(referenceSampleLabel({ category: 'ops', localBand: 'fail' })).toBe('category=ops,local_band=fail');
    // One design however the list is spelled or ordered.
    expect(referenceSampleLabel({ projects: ['Remin', 'AgentDeck', 'agentdeck'] })).toBe('project=agentdeck|remin');
    expect(referenceSampleLabel({ projects: [] })).toBe('uniform');
  });
});
