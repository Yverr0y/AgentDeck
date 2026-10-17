/**
 * Reference judge: a stronger hosted model scores the exact prompt the local
 * judge scored, so the local judge's verdicts can be measured instead of
 * trusted (2026-10-16 position workshop, item ⑪). The model is reached through
 * the user's own Codex CLI login (`codex exec`), so there is no API key to hold.
 *
 * CLI only, and only on request. The App Store app cannot spawn a subprocess,
 * and the daemon never calls this: every call sends task text to a hosted
 * model, so a call happens only when the user runs
 * `agentdeck apme reference-judge --run`.
 */

import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { homedir, tmpdir } from 'os';
import { join } from 'path';
import { redactSecrets } from '../utils/redact-secrets.js';
import { codexBinary, codexSpawnPlan } from '../codex-rate-limits-live.js';
import { deriveTaskOutcome, parseJudgeJson } from './runner.js';
import type { ApmeLocalVerdictRow, ApmeReferenceEvalRow } from './store.js';

/** Effort used when `--effort` is not given. High rather than the user's own
 *  Codex default: `ultra` delegates to subagents, which a one-prompt verdict
 *  has no use for. */
export const DEFAULT_REFERENCE_EFFORT = 'high';
export const DEFAULT_REFERENCE_TIMEOUT_MS = 300_000;

/** Stored `judge` tag, e.g. `codex:gpt-6-astra@high`. Agreement is reported
 *  per tag: a verdict at another model or effort is another instrument. */
export function referenceJudgeTag(model: string, effort: string): string {
  return `codex:${model}@${effort}`;
}

/** The top-level `model` of a Codex `config.toml`, or null. The judge runs
 *  with `--ignore-user-config`, so the user's default has to be read here and
 *  passed with `-m`. */
export function codexDefaultModel(configToml: string): string | null {
  for (const raw of configToml.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('[')) break; // first table: past the top level
    const m = /^model\s*=\s*["']([^"']+)["']/.exec(line);
    if (m) return m[1];
  }
  return null;
}

export function readCodexDefaultModel(): string | null {
  const home = process.env.CODEX_HOME || join(homedir(), '.codex');
  try {
    const path = join(home, 'config.toml');
    return existsSync(path) ? codexDefaultModel(readFileSync(path, 'utf-8')) : null;
  } catch {
    return null;
  }
}

/** A strict JSON schema for `--output-schema`, built from the rubric's own
 *  `Return strict JSON` template, so the reference judge answers in exactly
 *  the axes the local judge was asked for. Null when the template cannot be
 *  read; the call then runs without a schema and `parseJudgeJson` decides. */
export function verdictSchemaFromRubric(rubricPrompt: string): Record<string, unknown> | null {
  const anchor = rubricPrompt.search(/Return strict JSON/i);
  if (anchor < 0) return null;
  const start = rubricPrompt.indexOf('{', anchor);
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let end = -1;
  for (let i = start; i < rubricPrompt.length; i++) {
    const c = rubricPrompt[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) { end = i + 1; break; }
  }
  if (end < 0) return null;
  // The template writes every score as a bare N.
  let template: unknown;
  try { template = JSON.parse(rubricPrompt.slice(start, end).replace(/:\s*N(?=\s*[,}])/g, ':0')); }
  catch { return null; }
  if (!template || typeof template !== 'object' || Array.isArray(template)) return null;
  const properties: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(template as Record<string, unknown>)) {
    if (typeof value === 'number') properties[key] = { type: 'number' };
    else if (typeof value === 'string') properties[key] = { type: 'string' };
    else if (Array.isArray(value)) properties[key] = { type: 'array', items: { type: 'string' } };
    else return null;
  }
  if (!('overall' in properties)) return null;
  return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false };
}

/** Credential shapes `redactSecrets` does not know, for text that leaves the
 *  machine. Each has a prefix or structure distinctive enough that a match is
 *  a credential, not prose; commit hashes and UUIDs are left alone because a
 *  judge reads them as evidence. */
const EGRESS_SECRET_PATTERNS: readonly RegExp[] = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
  /\bsk-[A-Za-z0-9_-]{20,}/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
  /\bnpm_[A-Za-z0-9]{36}\b/g,
  /\bAIza[0-9A-Za-z_-]{35}/g,
  /\bxox[a-z]-[A-Za-z0-9-]{10,}/g,
];

/** Strip credentials from a prompt before it goes to a hosted model: this
 *  machine's pairing tokens verbatim, then known credential shapes. Returns
 *  how many spans were replaced so the CLI can say so. */
export function redactForEgress(text: string, knownSecrets: readonly string[] = []): { text: string; redactions: number } {
  let out = text;
  let redactions = 0;
  for (const secret of knownSecrets) {
    if (secret.length < 16) continue;
    const parts = out.split(secret);
    redactions += parts.length - 1;
    out = parts.join('[REDACTED]');
  }
  const prefixed = redactSecrets(out);
  redactions += Math.max(0, (prefixed.match(/\[REDACTED\]/g)?.length ?? 0) - (out.match(/\[REDACTED\]/g)?.length ?? 0));
  out = prefixed;
  for (const pattern of EGRESS_SECRET_PATTERNS) {
    out = out.replace(pattern, () => { redactions++; return '[REDACTED]'; });
  }
  return { text: out, redactions };
}

export function promptSha(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex').slice(0, 16);
}

/** Codex's own input per call with every tool off: 9.7k–10.2k tokens over
 *  four calls on 2026-10-18 (15.7k with the tools on). */
export const CODEX_FIXED_INPUT_TOKENS = 10_000;

/** Rough input tokens for one call: the fixed part, plus the prompt at rates
 *  fitted on 20 real judge prompts — 0.28 tokens per non-Hangul character and
 *  0.91 per Hangul syllable, every residual within 1.1k. */
export function estimateCodexInputTokens(prompt: string): number {
  const hangul = (prompt.match(/[가-힣]/g) ?? []).length;
  return Math.round(CODEX_FIXED_INPUT_TOKENS + 0.28 * (prompt.length - hangul) + 0.91 * hangul);
}

export interface CodexUsage {
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
}

export interface CodexExecOutcome {
  /** The final agent message: the verdict text. */
  text: string | null;
  usage: CodexUsage | null;
  error: string | null;
  /** Item types other than messages, reasoning and warnings: tool calls the
   *  event stream reported (`command_execution`, `web_search`, …). */
  toolItems: string[];
  /** Non-fatal `error` items, e.g. a setting Codex ignored. */
  warnings: string[];
}

/** Item types that are not a tool call. */
const NON_TOOL_ITEMS = new Set(['agent_message', 'reasoning', 'error']);

/** Read `codex exec --json` output (JSONL events). The verdict is the last
 *  `agent_message` item; `turn.completed` carries token usage; `turn.failed`
 *  and `error` carry the failure; any other item type is a tool call. Lines
 *  that do not parse are skipped. */
export function parseCodexExecEvents(stdout: string): CodexExecOutcome {
  let text: string | null = null;
  let usage: CodexUsage | null = null;
  let error: string | null = null;
  const tools = new Map<string, string>();
  const warnings: string[] = [];
  const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let event: Record<string, unknown>;
    try { event = JSON.parse(line) as Record<string, unknown>; }
    catch { continue; }
    const item = event.item as Record<string, unknown> | undefined;
    if ((event.type === 'item.started' || event.type === 'item.completed')
      && typeof item?.type === 'string' && !NON_TOOL_ITEMS.has(item.type)) {
      // Keyed by item id: a call reports started and completed, and one that
      // never completes still counts.
      tools.set(typeof item.id === 'string' ? item.id : `#${tools.size}`, item.type);
    }
    if (event.type === 'item.completed' && item?.type === 'error' && typeof item.message === 'string') {
      warnings.push(item.message);
    } else if (event.type === 'item.completed' && item?.type === 'agent_message' && typeof item.text === 'string') {
      text = item.text;
    } else if (event.type === 'turn.completed' && event.usage && typeof event.usage === 'object') {
      const u = event.usage as Record<string, unknown>;
      usage = {
        inputTokens: num(u.input_tokens),
        cachedInputTokens: num(u.cached_input_tokens),
        outputTokens: num(u.output_tokens),
        reasoningTokens: num(u.reasoning_output_tokens),
      };
    } else if (event.type === 'turn.failed') {
      const e = event.error as Record<string, unknown> | undefined;
      error = typeof e?.message === 'string' ? e.message : 'turn failed';
    } else if (event.type === 'error') {
      error = typeof event.message === 'string' ? event.message : 'error';
    }
  }
  return { text, usage, error, toolItems: [...tools.values()], warnings };
}

/** Why a run cannot stand as a reference verdict, or null. A tool call means
 *  the verdict saw more than the prompt the local judge saw. A warning that
 *  Codex ignored a setting means an isolation setting may not have applied:
 *  an unknown `-c` key is only a warning, so a Codex that renames
 *  `web_search` would otherwise run with the web on. */
export function isolationBreach(outcome: Pick<CodexExecOutcome, 'toolItems' | 'warnings'>): string | null {
  if (outcome.toolItems.length > 0) return `the reference called a tool (${[...new Set(outcome.toolItems)].join(', ')})`;
  const ignored = outcome.warnings.find((w) => /unrecognized configuration/i.test(w));
  if (ignored) return `codex ignored a setting: ${ignored.replace(/\s+/g, ' ').trim().slice(0, 200)}`;
  return null;
}

/** The line of a failed run's stderr that says why: the first `error` line
 *  (Codex and its argument parser both print one), else the last line. */
export function stderrReason(stderr: string): string | null {
  const lines = stderr.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const line = lines.find((l) => /^error\b/i.test(l)) ?? lines[lines.length - 1];
  return line ? line.slice(0, 300) : null;
}

export interface CodexJudgeOptions {
  model: string;
  effort: string;
  schema: Record<string, unknown> | null;
  timeoutMs?: number;
  /** Override the Codex executable (tests). Defaults to `AGENTDECK_CODEX_BIN`
   *  or `codex` on PATH. */
  binary?: string;
}

export interface CodexJudgeResult extends CodexExecOutcome {
  latencyMs: number;
}

/** Codex features the judge runs without, so the model has no tools. The
 *  local judge it is measured against has none, and a verdict that read a
 *  file or asked a subagent saw more than the prompt; every such call is
 *  also a way for local data to leave the machine. All are on by default in
 *  codex-cli 0.160.1 (measured 2026-10-18): under `-s read-only` the model
 *  still ran `rg` over a local file, `view_image` reads any image path, and
 *  with only the shell off it called code mode's `exec` instead, a call
 *  `--json` does not report. With `code_mode_host` off, code mode fails
 *  closed. `hooks` off backs up `--ignore-user-config` in keeping AgentDeck's
 *  own Codex hooks from reporting the judge as a session. `codex exec`
 *  refuses a feature name it does not know, so a renamed feature fails the
 *  call rather than staying on. */
export const REFERENCE_DISABLED_FEATURES: readonly string[] = [
  'shell_tool', 'unified_exec', 'shell_snapshot', 'code_mode_host', 'view_image',
  'apps', 'plugins', 'browser_use', 'computer_use', 'image_generation',
  'multi_agent', 'skill_search', 'tool_suggest', 'sleep_tool', 'goals', 'hooks',
];

/** The `codex exec` argument list. Each isolation flag is load-bearing:
 *  - `--ephemeral` writes no rollout, so AgentDeck's Codex rollout readers
 *    never see the judge as a session;
 *  - `--ignore-user-config` skips `~/.codex/config.toml`, which holds
 *    AgentDeck's own Codex hooks: loaded, they would report the judge to the
 *    daemon as a Codex session and open an APME run for it. It also drops the
 *    user's model and effort defaults, so both are passed here;
 *  - `-s read-only` in an empty scratch directory, every tool feature off
 *    (`REFERENCE_DISABLED_FEATURES`) and web search off: the judge reads only
 *    its prompt. Web search is a setting, not a feature, and stays on under
 *    `--ignore-user-config` unless turned off here;
 *  - the prompt arrives on stdin (`-`), which the caller must close, or
 *    `codex exec` waits for more input forever. */
export function codexJudgeArgs(opts: { model: string; effort: string; cwd: string; schemaPath: string | null }): string[] {
  return [
    'exec',
    '--ephemeral',
    '--ignore-user-config',
    '--skip-git-repo-check',
    '-s', 'read-only',
    ...REFERENCE_DISABLED_FEATURES.flatMap((feature) => ['--disable', feature]),
    '-c', 'web_search=disabled',
    '-C', opts.cwd,
    '-m', opts.model,
    '-c', `model_reasoning_effort=${opts.effort}`,
    ...(opts.schemaPath ? ['--output-schema', opts.schemaPath] : []),
    '--json',
    '-',
  ];
}

/** Run one verdict through `codex exec`. Resolves with whatever was learned —
 *  a timeout, a spawn failure, a failed turn and an isolation breach all come
 *  back as `error`, and a breach also withholds the verdict text. */
export async function runCodexJudge(prompt: string, opts: CodexJudgeOptions): Promise<CodexJudgeResult> {
  const started = Date.now();
  const scratch = mkdtempSync(join(tmpdir(), 'agentdeck-refjudge-'));
  // The judge's cwd is an empty child of the scratch directory, so the schema
  // file beside it is not inside what the judge can see.
  const cwd = join(scratch, 'cwd');
  mkdirSync(cwd);
  let schemaPath: string | null = null;
  if (opts.schema) {
    schemaPath = join(scratch, 'verdict-schema.json');
    writeFileSync(schemaPath, JSON.stringify(opts.schema));
  }
  const plan = codexSpawnPlan(opts.binary ?? codexBinary());
  let args = codexJudgeArgs({ model: opts.model, effort: opts.effort, cwd, schemaPath });
  // Under a shell the command line is re-parsed, so an argument with spaces
  // (a temp path under a Windows profile) carries its own quotes.
  if (plan.shell) args = args.map((a) => (/\s/.test(a) ? `"${a}"` : a));

  try {
    return await new Promise<CodexJudgeResult>((resolve) => {
      let stdout = '';
      let stderr = '';
      let settled = false;
      const child = spawn(plan.command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: plan.shell,
        windowsHide: true,
      });
      // `fatal` is a timeout or a spawn failure; `exitCode` is set on close.
      const finish = (fatal: string | null, exitCode: number | null = null): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        const outcome = parseCodexExecEvents(stdout);
        const breach = isolationBreach(outcome);
        const reason = stderrReason(stderr);
        const exited = exitCode != null && exitCode !== 0 ? `codex exited ${exitCode}${reason ? `: ${reason}` : ''}` : null;
        resolve({
          ...outcome,
          text: breach ? null : outcome.text,
          error: breach ?? (outcome.text ? outcome.error : (fatal ?? outcome.error ?? exited ?? reason ?? 'no verdict')),
          latencyMs: Date.now() - started,
        });
      };
      const timer = setTimeout(() => {
        try { child.kill('SIGKILL'); } catch { /* already gone */ }
        if (plan.shell && child.pid) {
          // Under a shell the child is cmd.exe and codex is its grandchild.
          spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }).on('error', () => {});
        }
        finish(`timed out after ${Math.round((opts.timeoutMs ?? DEFAULT_REFERENCE_TIMEOUT_MS) / 1000)} s`);
      }, opts.timeoutMs ?? DEFAULT_REFERENCE_TIMEOUT_MS);
      child.stdout?.on('data', (chunk: Buffer) => { stdout += chunk.toString('utf-8'); });
      child.stderr?.on('data', (chunk: Buffer) => { if (stderr.length < 64_000) stderr += chunk.toString('utf-8'); });
      child.on('error', (err) => finish(`could not start ${plan.command}: ${err.message}`));
      child.on('close', (code) => finish(null, code));
      child.stdin?.on('error', () => { /* a child that died early closes the pipe */ });
      child.stdin?.end(prompt);
    });
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

/** Parse a reference reply exactly as the local judge's reply is parsed. */
export function parseReferenceVerdict(text: string | null): ReturnType<typeof parseJudgeJson> {
  return text ? parseJudgeJson(text) : null;
}

/** Order candidates by a hash of (seed, task id) and take the first `limit`
 *  that are not in `skip`. A task keeps its place however the pool changes,
 *  so a dry run shows exactly what `--run` will send, and a later run with
 *  the same seed continues with the next tasks rather than a reshuffle. The
 *  sample is uniform over the pool, so its agreement estimates the pool's;
 *  `localBand` narrows the pool to one local outcome band, which measures how
 *  often the reference confirms that band (precision) and nothing wider. */
export function pickReferenceCandidates(
  rows: readonly ApmeLocalVerdictRow[],
  opts: {
    limit: number; skip: ReadonlySet<string>; seed: string; category?: string; localBand?: OutcomeBucket;
    /** Allow-list of project names (case-insensitive): only these projects'
     *  task text may leave the machine. */
    projects?: readonly string[];
  },
): ApmeLocalVerdictRow[] {
  const rank = (id: string) => createHash('sha256').update(`${opts.seed}:${id}`).digest('hex');
  const projects = opts.projects?.length ? new Set(opts.projects.map((p) => p.toLowerCase())) : null;
  return rows
    .filter((r) => !opts.skip.has(r.taskId)
      && (!opts.category || r.category === opts.category)
      && (!opts.localBand || outcomeBucket(r.localOverall) === opts.localBand)
      && (!projects || (r.project != null && projects.has(r.project.toLowerCase()))))
    .map((r) => ({ r, key: rank(r.taskId) }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .slice(0, Math.max(0, opts.limit))
    .map(({ r }) => r);
}

// ─── Agreement ────────────────────────────────────────────────────────────────

export type OutcomeBucket = 'success' | 'partial' | 'fail';
export const OUTCOME_BUCKETS: readonly OutcomeBucket[] = ['success', 'partial', 'fail'];

/** The outcome band a score falls in, by the same thresholds the task row's
 *  `outcome` is derived with. */
export function outcomeBucket(score: number): OutcomeBucket {
  return deriveTaskOutcome(score) as OutcomeBucket;
}

export interface AgreementPair {
  local: number;
  reference: number;
}

export interface AgreementStats {
  n: number;
  /** Mean |local − reference|. */
  mae: number | null;
  /** Mean (local − reference): positive means the local judge scores higher. */
  bias: number | null;
  /** 95% percentile-bootstrap intervals; null below 5 pairs. */
  maeCi: [number, number] | null;
  biasCi: [number, number] | null;
  /** Spearman rank correlation (average ranks for ties); null when either
   *  side is constant. */
  spearman: number | null;
  /** Share of pairs landing in the same outcome band. */
  bucketAgreement: number | null;
  /** Cohen's kappa over the outcome bands; null when chance agreement is 1. */
  kappa: number | null;
  /** confusion[local][reference] = count. */
  confusion: Record<OutcomeBucket, Record<OutcomeBucket, number>>;
  /** Share of each side's scores at exactly 0 or 1. A judge that answers
   *  pass/fail on a [0,1] scale caps every correlation above. */
  localExtremeShare: number | null;
  referenceExtremeShare: number | null;
}

const isExtreme = (score: number): boolean => score <= 0 || score >= 1;

function mean(xs: readonly number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function averageRanks(xs: readonly number[]): number[] {
  const order = xs.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array<number>(xs.length);
  for (let i = 0; i < order.length;) {
    let j = i;
    while (j + 1 < order.length && order[j + 1].v === order[i].v) j++;
    const rank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[order[k].i] = rank;
    i = j + 1;
  }
  return ranks;
}

function pearson(xs: readonly number[], ys: readonly number[]): number | null {
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0; let sxx = 0; let syy = 0;
  for (let i = 0; i < xs.length; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
    syy += (ys[i] - my) ** 2;
  }
  return sxx === 0 || syy === 0 ? null : sxy / Math.sqrt(sxx * syy);
}

/** Deterministic PRNG for the bootstrap, so a report reprints identically. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bootstrapCi(
  values: readonly number[],
  stat: (xs: readonly number[]) => number,
  iters = 2000,
): [number, number] | null {
  if (values.length < 5) return null;
  const rand = mulberry32(0xa9e5);
  const stats: number[] = [];
  const sample = new Array<number>(values.length);
  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < values.length; i++) sample[i] = values[Math.floor(rand() * values.length)];
    stats.push(stat(sample));
  }
  stats.sort((a, b) => a - b);
  return [stats[Math.floor(iters * 0.025)], stats[Math.min(iters - 1, Math.floor(iters * 0.975))]];
}

export function computeAgreement(pairs: readonly AgreementPair[]): AgreementStats {
  const confusion = Object.fromEntries(
    OUTCOME_BUCKETS.map((l) => [l, Object.fromEntries(OUTCOME_BUCKETS.map((r) => [r, 0]))]),
  ) as AgreementStats['confusion'];
  const n = pairs.length;
  if (n === 0) {
    return {
      n, mae: null, bias: null, maeCi: null, biasCi: null, spearman: null, bucketAgreement: null, kappa: null, confusion,
      localExtremeShare: null, referenceExtremeShare: null,
    };
  }
  const diffs = pairs.map((p) => p.local - p.reference);
  const absDiffs = diffs.map(Math.abs);
  for (const p of pairs) confusion[outcomeBucket(p.local)][outcomeBucket(p.reference)]++;
  const agreed = OUTCOME_BUCKETS.reduce((s, b) => s + confusion[b][b], 0);
  const po = agreed / n;
  let pe = 0;
  for (const b of OUTCOME_BUCKETS) {
    const localShare = OUTCOME_BUCKETS.reduce((s, r) => s + confusion[b][r], 0) / n;
    const refShare = OUTCOME_BUCKETS.reduce((s, l) => s + confusion[l][b], 0) / n;
    pe += localShare * refShare;
  }
  return {
    n,
    mae: mean(absDiffs),
    bias: mean(diffs),
    maeCi: bootstrapCi(absDiffs, mean),
    biasCi: bootstrapCi(diffs, mean),
    spearman: n < 3 ? null : pearson(averageRanks(pairs.map((p) => p.local)), averageRanks(pairs.map((p) => p.reference))),
    bucketAgreement: po,
    kappa: pe >= 1 ? null : (po - pe) / (1 - pe),
    confusion,
    localExtremeShare: pairs.filter((p) => isExtreme(p.local)).length / n,
    referenceExtremeShare: pairs.filter((p) => isExtreme(p.reference)).length / n,
  };
}

// ─── Report ───────────────────────────────────────────────────────────────────

export interface ReferenceGroupStats {
  key: string;
  n: number;
  mae: number | null;
  bias: number | null;
}

export interface ReferenceDisagreement {
  taskId: string;
  category: string | null;
  localJudge: string | null;
  local: number;
  reference: number;
  /** local − reference. */
  delta: number;
  localSummary: string | null;
  referenceSummary: string | null;
  referenceMissed: string[];
}

export interface ReferenceReport {
  judge: string;
  /** Sampling design the rows were drawn under (`uniform`, or filters). Only a
   *  `uniform` report estimates agreement over the whole pool; a filtered one
   *  answers the same questions for its slice — under `local_band=fail`, the
   *  outcome-band agreement is the precision of the local judge's fails. */
  sample: string;
  attempts: number;
  failures: number;
  /** Failure reasons, most frequent first. */
  failureReasons: Array<{ reason: string; count: number }>;
  stats: AgreementStats;
  byLocalJudge: ReferenceGroupStats[];
  byCategory: ReferenceGroupStats[];
  medianLatencyMs: number | null;
  medianInputTokens: number | null;
  disagreements: ReferenceDisagreement[];
}

function median(xs: readonly number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function groupStats(pairs: ReadonlyArray<AgreementPair & { key: string }>): ReferenceGroupStats[] {
  const groups = new Map<string, AgreementPair[]>();
  for (const p of pairs) groups.set(p.key, [...(groups.get(p.key) ?? []), p]);
  return [...groups.entries()]
    .map(([key, ps]) => {
      const diffs = ps.map((p) => p.local - p.reference);
      return { key, n: ps.length, mae: mean(diffs.map(Math.abs)), bias: mean(diffs) };
    })
    .sort((a, b) => b.n - a.n || a.key.localeCompare(b.key));
}

/** The sampling-design label stored with each verdict. */
export function referenceSampleLabel(filters: { category?: string; localBand?: string; projects?: readonly string[] }): string {
  const projects = [...new Set((filters.projects ?? []).map((p) => p.toLowerCase()))].sort();
  const parts = [
    ...(filters.category ? [`category=${filters.category}`] : []),
    ...(filters.localBand ? [`local_band=${filters.localBand}`] : []),
    ...(projects.length ? [`project=${projects.join('|')}`] : []),
  ];
  return parts.length ? parts.join(',') : 'uniform';
}

/** One report per (judge tag, sampling design). A task scored more than once
 *  under one of them counts once, by its latest verdict; failed attempts count
 *  toward `failures` only. */
export function buildReferenceReports(
  rows: readonly ApmeReferenceEvalRow[],
  opts: { top: number; localSummary?: (taskId: string) => string | null },
): ReferenceReport[] {
  const groups = new Map<string, ApmeReferenceEvalRow[]>();
  for (const row of rows) {
    const key = JSON.stringify([row.judge, row.sample]);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const reports: ReferenceReport[] = [];
  for (const judgeRows of groups.values()) {
    const { judge, sample } = judgeRows[0];
    const failed = judgeRows.filter((r) => r.overall == null);
    const reasons = new Map<string, number>();
    for (const r of failed) {
      const reason = (r.error ?? 'unknown').slice(0, 120);
      reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
    }
    const latest = new Map<string, ApmeReferenceEvalRow>();
    for (const r of [...judgeRows].sort((a, b) => a.createdAt - b.createdAt || (a.id ?? 0) - (b.id ?? 0))) {
      if (r.overall != null) latest.set(r.taskId, r);
    }
    const compared = [...latest.values()].filter((r) => r.localOverall != null);
    const pairs = compared.map((r) => ({ local: r.localOverall as number, reference: r.overall as number }));
    const verdictOf = (r: ApmeReferenceEvalRow): { summary: string | null; missed: string[] } => {
      try {
        const v = JSON.parse(r.verdictJson ?? '{}') as { summary?: unknown; missed?: unknown };
        return {
          summary: typeof v.summary === 'string' ? v.summary : null,
          missed: Array.isArray(v.missed) ? v.missed.filter((m): m is string => typeof m === 'string') : [],
        };
      } catch {
        return { summary: null, missed: [] };
      }
    };
    reports.push({
      judge,
      sample,
      attempts: judgeRows.length,
      failures: failed.length,
      failureReasons: [...reasons.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
      stats: computeAgreement(pairs),
      byLocalJudge: groupStats(compared.map((r) => ({ key: r.localJudge ?? 'unknown', local: r.localOverall as number, reference: r.overall as number }))),
      byCategory: groupStats(compared.map((r) => ({ key: r.category ?? 'unknown', local: r.localOverall as number, reference: r.overall as number }))),
      medianLatencyMs: median(judgeRows.flatMap((r) => (r.latencyMs != null ? [r.latencyMs] : []))),
      medianInputTokens: median(judgeRows.flatMap((r) => (r.inputTokens != null ? [r.inputTokens] : []))),
      disagreements: compared
        .map((r) => {
          const v = verdictOf(r);
          return {
            taskId: r.taskId,
            category: r.category,
            localJudge: r.localJudge,
            local: r.localOverall as number,
            reference: r.overall as number,
            delta: (r.localOverall as number) - (r.overall as number),
            localSummary: opts.localSummary?.(r.taskId) ?? null,
            referenceSummary: v.summary,
            referenceMissed: v.missed,
          };
        })
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.taskId.localeCompare(b.taskId))
        .slice(0, Math.max(0, opts.top)),
    });
  }
  return reports.sort((a, b) => a.judge.localeCompare(b.judge)
    || (a.sample === 'uniform' ? -1 : b.sample === 'uniform' ? 1 : a.sample.localeCompare(b.sample)));
}
