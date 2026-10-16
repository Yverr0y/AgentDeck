/**
 * Claude Code status-line relay — the sanctioned subscription-quota source.
 *
 * Claude Code hands every configured status-line command a JSON document whose
 * `rate_limits` block carries the claude.ai Pro/Max `five_hour` / `seven_day`
 * windows (`used_percentage` 0–100, `resets_at` epoch seconds). It is the one
 * documented place a third party may read those percentages: the
 * `/api/oauth/usage` endpoint both daemons also use is undocumented and needs
 * the Keychain OAuth token, which the sandboxed Swift daemon cannot reach at
 * all. AgentDeck's installed status line therefore POSTs the document to the
 * local daemon (`CLAUDE_STATUSLINE_ROUTE`), and this module is the rule for
 * what either daemon does with it.
 *
 * Decided 2026-10-16 ("keep today's experience, give each daemon the safe
 * maximum"): OAuth polling is not removed. It is suppressed while a status-line
 * reading is fresh and resumes when sessions go quiet, and the per-model scoped
 * caps that only OAuth reports keep refreshing on a slower clock. The Swift
 * daemon, which never had an OAuth path, gains its first token-free Claude
 * gauge from the same reading.
 *
 * Facts the thresholds rest on (Claude Code status-line docs, read 2026-10-16):
 * `rate_limits` is present only for Pro/Max subscribers and only after a
 * session's first API response; each window may be independently absent, and
 * Claude Code drops a window once its `resets_at` passes; the script is
 * debounced at 300 ms and a running script is cancelled by the next update.
 * So an absent window is "no information" (the reading keeps the other window,
 * the consumer retains), and a reading is stamped at receipt — the payload
 * carries no capture time, and the script runs right after the API response it
 * describes.
 *
 * `pnpm generate-claude-statusline-rules` emits the Swift mirror
 * (`ClaudeStatuslineRules.generated.swift`); the byte gate is
 * `claude-statusline-sync.test.ts`, and behaviour is pinned by
 * `shared/claude-statusline-vectors.json`, replayed by
 * `claude-statusline.test.ts` and `ClaudeStatuslineRulesTests.swift`.
 */

/** Local HTTP route the installed status line POSTs to, on both daemons. */
export const CLAUDE_STATUSLINE_ROUTE = '/claude/statusline';

/**
 * A reading younger than this is "fresh": it is the live source and the OAuth
 * poll stays quiet. Older readings keep rendering (the usual 10-minute display
 * bound applies to them like any other reading) but no longer hold OAuth back.
 */
export const CLAUDE_STATUSLINE_FRESH_MS = 5 * 60_000;

/**
 * Per-model scoped caps and extra-usage fields exist only in the OAuth
 * response. While the status line is the live source they ride along from the
 * last OAuth reading for this long, then drop — an absent cap is "unknown",
 * never a frozen percent dressed as current.
 */
export const CLAUDE_OAUTH_CARRY_OVER_MS = 30 * 60_000;

/**
 * With scoped caps on the account, OAuth still refreshes this often while the
 * status line is fresh — one tenth of the 60 s poll — so the gauge only OAuth
 * can feed keeps moving. Without caps it does not poll at all until the
 * status line goes quiet.
 */
export const CLAUDE_OAUTH_SCOPED_REFRESH_MS = 10 * 60_000;

/**
 * Percent moves smaller than this do not broadcast on their own: the status
 * line fires on every message boundary, and every broadcast repaints every
 * surface (serial boards included). The 5 s usage tick carries small moves.
 */
export const CLAUDE_STATUSLINE_CHANGE_EPSILON = 0.05;

/** A `resets_at` above this is already epoch milliseconds, not seconds. */
export const CLAUDE_STATUSLINE_MS_THRESHOLD = 1e11;

export interface ClaudeStatuslineWindow {
  /** 0–100; the status line never reports above 100 for these windows, and a
   *  larger value is clamped rather than refused. */
  usedPercent: number;
  /** ISO-8601 UTC with milliseconds, or null when the window carries no reset. */
  resetsAt: string | null;
}

export interface ClaudeStatuslineReading {
  fiveHour: ClaudeStatuslineWindow | null;
  sevenDay: ClaudeStatuslineWindow | null;
  sessionId: string | null;
  /** `model.id` of the session that produced the reading (`claude-opus-5-5`). */
  model: string | null;
  /** Claude Code version string. */
  version: string | null;
  /** Daemon receipt time, epoch ms. */
  receivedAt: number;
}

/** Where the Claude 5h/7d numbers a daemon is showing came from. */
export type ClaudeUsageSource = 'oauth' | 'statusline' | 'relay';

export type ClaudeStatuslineAge = 'fresh' | 'aged' | 'unknown';

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function parseWindow(raw: unknown): ClaudeStatuslineWindow | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const pct = o.used_percentage;
  if (typeof pct !== 'number' || !Number.isFinite(pct) || pct < 0) return null;
  let resetsAt: string | null = null;
  const r = o.resets_at;
  if (typeof r === 'number' && Number.isFinite(r) && r > 0) {
    const ms = r > CLAUDE_STATUSLINE_MS_THRESHOLD ? r : r * 1000;
    resetsAt = new Date(Math.round(ms)).toISOString();
  }
  return { usedPercent: Math.min(100, pct), resetsAt };
}

/**
 * Read the two subscription windows out of a status-line document. Null when
 * the document carries neither — an API-key session, a gateway spend limit, a
 * session before its first API response — so the caller changes nothing.
 */
export function parseClaudeStatusline(payload: unknown, receivedAt: number): ClaudeStatuslineReading | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const p = payload as Record<string, unknown>;
  const rl = p.rate_limits;
  if (!rl || typeof rl !== 'object' || Array.isArray(rl)) return null;
  const r = rl as Record<string, unknown>;
  const fiveHour = parseWindow(r.five_hour);
  const sevenDay = parseWindow(r.seven_day);
  if (!fiveHour && !sevenDay) return null;
  const model = p.model && typeof p.model === 'object' && !Array.isArray(p.model)
    ? (p.model as Record<string, unknown>).id
    : undefined;
  return {
    fiveHour,
    sevenDay,
    sessionId: nonEmptyString(p.session_id),
    model: nonEmptyString(model),
    version: nonEmptyString(p.version),
    receivedAt,
  };
}

/**
 * How old a status-line reading is, in the three-answer form every probe here
 * uses: a missing or zero stamp is `unknown`, never fresh and never aged. A
 * stamp slightly in the future is a same-machine clock disagreement and reads
 * as fresh, as the usage relay already treats it.
 */
export function classifyClaudeStatuslineAge(
  receivedAt: number | null | undefined,
  now: number,
): ClaudeStatuslineAge {
  if (receivedAt == null || !Number.isFinite(receivedAt) || receivedAt <= 0) return 'unknown';
  return now - receivedAt <= CLAUDE_STATUSLINE_FRESH_MS ? 'fresh' : 'aged';
}

export interface ClaudeOAuthPollInput {
  /** Receipt time of the newest status-line reading, or null when none arrived. */
  statuslineReceivedAt: number | null;
  /** Time of the last LIVE OAuth-family reading (direct or sibling relay). */
  lastOAuthFetchAt: number | null;
  /** Whether that reading carried per-model scoped caps. */
  oauthHasScopedLimits: boolean;
  now: number;
}

/**
 * Should the OAuth poll run on this tick? Always when no fresh status-line
 * reading exists. While one does: once, to learn whether the account has
 * scoped caps at all; then only on the slow clock when it does; never when it
 * does not.
 */
export function shouldPollClaudeOAuth(input: ClaudeOAuthPollInput): boolean {
  if (classifyClaudeStatuslineAge(input.statuslineReceivedAt, input.now) !== 'fresh') return true;
  const last = input.lastOAuthFetchAt;
  if (last == null || !Number.isFinite(last) || last <= 0) return true;
  if (!input.oauthHasScopedLimits) return false;
  return input.now - last >= CLAUDE_OAUTH_SCOPED_REFRESH_MS;
}

/** May the last OAuth reading's scoped caps and extra-usage fields still ride along? */
export function claudeOAuthCarryOverFresh(lastOAuthFetchAt: number | null | undefined, now: number): boolean {
  if (lastOAuthFetchAt == null || !Number.isFinite(lastOAuthFetchAt) || lastOAuthFetchAt <= 0) return false;
  return now - lastOAuthFetchAt <= CLAUDE_OAUTH_CARRY_OVER_MS;
}

function windowChanged(a: ClaudeStatuslineWindow | null, b: ClaudeStatuslineWindow | null): boolean {
  if (!a || !b) return (a == null) !== (b == null);
  if (a.resetsAt !== b.resetsAt) return true;
  return Math.abs(a.usedPercent - b.usedPercent) >= CLAUDE_STATUSLINE_CHANGE_EPSILON;
}

/** Does `next` say anything a surface would repaint for, compared with `prev`? */
export function claudeStatuslineChanged(
  prev: ClaudeStatuslineReading | null | undefined,
  next: ClaudeStatuslineReading,
): boolean {
  if (!prev) return true;
  return windowChanged(prev.fiveHour, next.fiveHour) || windowChanged(prev.sevenDay, next.sevenDay);
}
