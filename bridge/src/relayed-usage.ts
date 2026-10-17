import type { CodexRateLimits, UsageEvent } from './types.js';
import { mergeRelayedSessionUsage, mergeZaiSubscription } from './usage-event.js';
import { pickBestCodexRateLimits } from './codex-rate-limits-live.js';
import type { ApiUsageData } from './usage-api.js';

/** Sync an already-adjusted focused quota without manufacturing an observation
 * timestamp. Replacement omissions must survive the daemon's next own tick. */
export function syncRelayedClaudeUsage(cache: ApiUsageData, relayed: Partial<UsageEvent>): boolean {
  if (relayed.fiveHourPercent == null && relayed.sevenDayPercent == null) return false;
  const snapshot = relayed.claudeUsageSnapshot === true;
  if (snapshot || relayed.fiveHourPercent != null) {
    cache.fiveHourPercent = relayed.fiveHourPercent ?? null;
    cache.fiveHourResetsAt = relayed.fiveHourResetsAt ?? null;
  }
  if (snapshot || relayed.sevenDayPercent != null) {
    cache.sevenDayPercent = relayed.sevenDayPercent ?? null;
    cache.sevenDayResetsAt = relayed.sevenDayResetsAt ?? null;
  }
  cache.scopedLimits = Array.isArray(relayed.scopedLimits) ? relayed.scopedLimits : [];
  if (snapshot) {
    cache.extraUsageEnabled = relayed.extraUsageEnabled ?? false;
    cache.extraUsageMonthlyLimit = relayed.extraUsageMonthlyLimit ?? null;
    cache.extraUsageUsedCredits = relayed.extraUsageUsedCredits ?? null;
    cache.extraUsageUtilization = relayed.extraUsageUtilization ?? null;
  }
  return true;
}

/**
 * Decide what the daemon broadcasts when a session bridge relays a
 * `usage_update`, and keep that decision out of the callback it used to be
 * inlined in.
 *
 * A session bridge broadcasts usage on EVERY state change. In daemon-first mode
 * its snapshot usually has no model context, so the Claude quota model gate
 * (`isClaudeSubscriptionModel`) yields no percents and the event carries
 * `usageStale=true`. Forwarding that bare event verbatim clobbered the daemon's
 * own authoritative aggregate on the dashboard: the Claude gauge blanked to
 * "No usage data" on every state tick (the Codex gauge, which ignores global
 * staleness, stayed put — hence the Claude-only flicker).
 *
 * Suppressing the relay instead is NOT an option: `usage_update` is the ONLY
 * carrier of per-session tokens / cost / duration (`state_update` has none of
 * those fields), and the daemon's own `buildUsage()` reads a UsageTracker that
 * no PTY ever feeds, so its session half is zeros. Dropping the event would
 * blank the session numbers for every focus that legitimately carries no Claude
 * quota — Codex, OpenCode, API billing.
 *
 * When the relay has no Claude quota, or the caller prefers the daemon's
 * current account reading, split the event by half: ACCOUNT fields (quota,
 * scoped caps, extra usage, subscriptions, Codex/Ollama, `usageStale`) come
 * from the daemon, and SESSION counters come from the relay. An unstamped
 * focused-session event must not overwrite a newer status-line/account reading
 * or revive a window its replacement snapshot retired.
 *
 * ## Why the Claude-bearing branch is not just the same merge
 *
 * Without `preferOwnClaudeUsage`, a relay carrying Claude percentages retains
 * the existing behavior: its account half goes out as-is — except for
 * `codexRateLimits`, which is the one account-half field a session bridge
 * cannot compute as well as the daemon. A bridge keeps host processes off by
 * design, so it has only the passive rollout read; the daemon additionally
 * holds a throttled `codex app-server` reading. They agree whenever a
 * plan-matching rollout exists. When none does, the daemon holds a live
 * snapshot with real windows while the bridge holds a mismatched one that
 * `normalizeCodexRateLimits` voids to a windowless block — and successive
 * events then alternated between a real Codex window and a voided one, which
 * reads as a flickering/blanking Codex gauge on every surface (issue #253).
 *
 * The two blocks are RECONCILED rather than one overwriting the other, by the
 * same `pickBestCodexRateLimits` rule the daemon already applies to its own two
 * readings. Both inputs arrive already normalized against the same `auth.json`
 * by their own producer, so no account tier is read here: voiding has already
 * stripped `capturedAt` from a mismatched block, which is exactly what makes it
 * lose to a stamped one under plan-agnostic newest-wins. That matters in both
 * directions — the daemon's block is normally the better one, but a bridge that
 * just read a newer rollout than the daemon's last build still wins on recency.
 *
 * Recency rules WITHIN a limit family, not across one, and this call site is
 * where that distinction bites hardest. A bridge has only the passive read, so
 * once the account's weekly quota is exhausted its block is the per-model pool
 * wearing the account's `limit_id` — and always seconds old, because the rollout
 * is appended every couple of seconds while Codex works. So a cross-family
 * disagreement is resolved toward the daemon's block rather than by age.
 *
 * But only when the daemon actually HAS that answer. `lastBuiltCodexRateLimits`
 * is the daemon's last published value, which is the app-server reading only
 * when it won its own pick — a daemon whose PATH carries no `codex` binary holds
 * nothing but a rollout read, exactly like the bridge. Deciding a cross-family
 * disagreement between two rollout reads by which process is holding one is not
 * a rule, and with the roles reversed (the daemon on the mislabelled pool line,
 * the bridge on the account line) it would invert the fix it exists to deliver.
 * So `ownLiveFamilyAuthorityExpiresAtMs` gates the guard — an instant, judged
 * against this event's clock, because the flag is produced by a usage build and
 * consumed here later; without it the tie falls back to recency as before. A second bound applies whenever the guard does fire: a
 * block with no weekly window — the synthetic credit gauge, a voided snapshot —
 * can never reject anything, so a windowless block cannot displace a windowed
 * one. Inside one family nothing changes: the fresher rollout still wins.
 *
 * ## Why `buildOwnUsage` is a thunk
 *
 * `BridgeCore.buildUsage()` is the call that arms the throttled `codex
 * app-server` spawn gate and re-derives the whole account half. It runs only
 * when merging session counters into the daemon's account reading: no relayed
 * Claude quota, or explicit `preferOwnClaudeUsage`. The default Claude-bearing
 * path continues using the remembered blocks below without rebuilding. Passing
 * it as a thunk lets tests assert which path incurred that work.
 *
 * `ownCodexRateLimits` is the block from the daemon's own last built usage
 * event — a remembered value, never a fresh build, so reading it costs nothing
 * and cannot arm the spawn. Null before the daemon has built one, in which case
 * the relayed block stands, which is the pre-#253 behaviour.
 */
export function resolveRelayedUsageEvent(input: {
  relayed: Record<string, unknown>;
  ownCodexRateLimits: CodexRateLimits | null;
  /** Prefer the daemon's account snapshot, including retired Claude windows,
   *  while still forwarding session counters. The caller decides freshness;
   *  false/absent preserves the existing Claude-bearing relay behavior. */
  preferOwnClaudeUsage?: boolean;
  /** When the daemon's live-backed family authority lapses, or null/absent when
   *  it has none. An instant rather than a flag so it is judged against THIS
   *  event's clock: without a live reading there is no family authority here,
   *  and the tie falls back to recency. */
  ownLiveFamilyAuthorityExpiresAtMs?: number | null;
  /** The daemon's z.ai block with read-time expiry applied: session bridges
   *  never poll the provider account, so a relayed event carrying Claude data
   *  must not silently drop the provider's gauges for as long as the relay is
   *  the louder broadcaster. Undefined = the daemon has nothing either. */
  ownZaiRateLimits?: import('./types.js').ZaiRateLimits | null;
  /** Injectable clock. The family guard's authority decays with a reading's age,
   *  so a test that leaves this to the wall clock changes its answer as the
   *  fixtures age past it. */
  nowMs?: number;
  buildOwnUsage: () => UsageEvent;
}): UsageEvent {
  const {
    relayed,
    ownCodexRateLimits,
    preferOwnClaudeUsage = false,
    ownLiveFamilyAuthorityExpiresAtMs = null,
    ownZaiRateLimits,
    nowMs = Date.now(),
    buildOwnUsage,
  } = input;

  const hasClaudeData = relayed.fiveHourPercent != null || relayed.sevenDayPercent != null;
  if (preferOwnClaudeUsage || !hasClaudeData) {
    return mergeRelayedSessionUsage(buildOwnUsage(), relayed);
  }

  const relayedCodex = (relayed.codexRateLimits ?? null) as CodexRateLimits | null;
  const best = pickBestCodexRateLimits(relayedCodex, ownCodexRateLimits, undefined, nowMs, {
    liveOwnsFamilyAuthority:
      ownLiveFamilyAuthorityExpiresAtMs != null && nowMs < ownLiveFamilyAuthorityExpiresAtMs,
  });
  // Identity, not deep-equality: the picker returns one of its two arguments, so
  // an unchanged pick must leave the relayed event object untouched — including
  // an absent `codexRateLimits` key, which under retain-on-absent merging is
  // "no information" and must not become an explicit `undefined`. The z.ai
  // re-attach also carries its subscription row: the session bridge's
  // replacement list cannot author this daemon-owned provider account.
  if (best === relayedCodex && !ownZaiRateLimits) return relayed as unknown as UsageEvent;
  const merged: Record<string, unknown> = { ...relayed };
  if (best !== relayedCodex) merged.codexRateLimits = best ?? undefined;
  if (ownZaiRateLimits) {
    merged.zaiRateLimits = ownZaiRateLimits;
    // Older producers may omit the list. Preserve that "no information"
    // signal rather than replacing other providers with a z.ai-only list.
    if (Array.isArray(relayed.subscriptions)) {
      merged.subscriptions = mergeZaiSubscription(relayed.subscriptions, ownZaiRateLimits);
    }
  }
  return merged as unknown as UsageEvent;
}
