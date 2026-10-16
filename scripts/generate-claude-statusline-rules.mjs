#!/usr/bin/env node
// Generate the Swift mirror of the Claude Code status-line relay rules:
//   shared/src/claude-statusline.ts
//     → apple/AgentDeck/Daemon/Core/ClaudeStatuslineRules.generated.swift
//
//   pnpm generate-claude-statusline-rules            regenerate the mirror
//   pnpm generate-claude-statusline-rules --check    exit 1 if it drifted
//
// Requires shared to be built first (`pnpm build`), since the CLI reads the
// constants from shared/dist. The vitest sync test
// (shared/src/__tests__/claude-statusline-sync.test.ts) imports the emitter
// against the TS source, so drift is caught in CI even when this CLI is never
// run. Behaviour is pinned by shared/claude-statusline-vectors.json, which
// both suites replay.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function rulesFrom(mod) {
  return {
    route: mod.CLAUDE_STATUSLINE_ROUTE,
    freshMs: mod.CLAUDE_STATUSLINE_FRESH_MS,
    carryOverMs: mod.CLAUDE_OAUTH_CARRY_OVER_MS,
    scopedRefreshMs: mod.CLAUDE_OAUTH_SCOPED_REFRESH_MS,
    changeEpsilon: mod.CLAUDE_STATUSLINE_CHANGE_EPSILON,
    msThreshold: mod.CLAUDE_STATUSLINE_MS_THRESHOLD,
  };
}

function num(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`not a finite number: ${value}`);
  return Number.isInteger(value) ? `${value}` : `${value}`;
}

export function emitSwift(rules) {
  return `// GENERATED FILE — DO NOT EDIT.
// Source of truth: shared/src/claude-statusline.ts
// Regenerate: pnpm generate-claude-statusline-rules (drift gated by shared/src/__tests__/claude-statusline-sync.test.ts)
#if os(macOS)
import Foundation

/// Claude Code status-line relay — the sanctioned subscription-quota source.
/// The installed status line POSTs Claude Code's status document to the local
/// daemon; these rules read the \`five_hour\` / \`seven_day\` windows out of it,
/// age the reading, decide when the OAuth poll may stay quiet (Node) and when a
/// repaint is worth broadcasting. Behaviour is pinned by
/// \`shared/claude-statusline-vectors.json\` (\`ClaudeStatuslineRulesTests\`).
enum ClaudeStatuslineRules {
    static let route = ${JSON.stringify(rules.route)}
    /// A reading younger than this is the live source.
    static let freshMs: Double = ${num(rules.freshMs)}
    /// The last OAuth reading's scoped caps ride along this long.
    static let oauthCarryOverMs: Double = ${num(rules.carryOverMs)}
    /// With scoped caps on the account, OAuth still refreshes this often.
    static let oauthScopedRefreshMs: Double = ${num(rules.scopedRefreshMs)}
    /// Percent moves below this do not broadcast on their own.
    static let changeEpsilon: Double = ${num(rules.changeEpsilon)}
    /// A \`resets_at\` above this is already epoch milliseconds.
    static let msThreshold: Double = ${num(rules.msThreshold)}

    struct Window: Equatable {
        let usedPercent: Double
        /// ISO-8601 UTC with milliseconds, or nil when the window carries no reset.
        let resetsAt: String?
    }

    struct Reading: Equatable {
        let fiveHour: Window?
        let sevenDay: Window?
        let sessionId: String?
        let model: String?
        let version: String?
        /// Daemon receipt time, epoch ms.
        let receivedAtMs: Double
    }

    enum Age: Equatable { case fresh, aged, unknown }

    /// A formatter per call: \`ISO8601DateFormatter\` is not Sendable, so a shared
    /// static would not pass Swift 6 isolation checking, and a status line
    /// arrives at most every 300 ms.
    private static func isoString(_ date: Date) -> String {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        f.timeZone = TimeZone(secondsFromGMT: 0)
        return f.string(from: date)
    }

    /// JSON booleans arrive as NSNumber too; the TS rule rejects them.
    private static func finiteNumber(_ raw: Any?) -> Double? {
        guard let n = raw as? NSNumber, CFGetTypeID(n) != CFBooleanGetTypeID() else { return nil }
        let v = n.doubleValue
        return v.isFinite ? v : nil
    }

    private static func nonEmptyString(_ raw: Any?) -> String? {
        guard let s = raw as? String, !s.isEmpty else { return nil }
        return s
    }

    static func parseWindow(_ raw: Any?) -> Window? {
        guard let o = raw as? [String: Any], let pct = finiteNumber(o["used_percentage"]), pct >= 0 else { return nil }
        var resetsAt: String?
        if let r = finiteNumber(o["resets_at"]), r > 0 {
            let ms = r > msThreshold ? r : r * 1000
            resetsAt = isoString(Date(timeIntervalSince1970: ms.rounded() / 1000))
        }
        return Window(usedPercent: min(100, pct), resetsAt: resetsAt)
    }

    /// Nil when the document carries neither subscription window — the caller
    /// changes nothing.
    static func parse(_ payload: Any?, receivedAtMs: Double) -> Reading? {
        guard let p = payload as? [String: Any], let rl = p["rate_limits"] as? [String: Any] else { return nil }
        let fiveHour = parseWindow(rl["five_hour"])
        let sevenDay = parseWindow(rl["seven_day"])
        guard fiveHour != nil || sevenDay != nil else { return nil }
        let model = (p["model"] as? [String: Any])?["id"]
        return Reading(
            fiveHour: fiveHour, sevenDay: sevenDay,
            sessionId: nonEmptyString(p["session_id"]),
            model: nonEmptyString(model),
            version: nonEmptyString(p["version"]),
            receivedAtMs: receivedAtMs
        )
    }

    /// Three answers: a missing or zero stamp is unknown, never fresh and never aged.
    static func age(receivedAtMs: Double?, nowMs: Double) -> Age {
        guard let receivedAtMs, receivedAtMs.isFinite, receivedAtMs > 0 else { return .unknown }
        return nowMs - receivedAtMs <= freshMs ? .fresh : .aged
    }

    /// Should the OAuth poll run on this tick? (The Swift daemon has no OAuth
    /// poll; the rule is mirrored so both daemons answer alike for a relay.)
    static func shouldPollOAuth(
        statuslineReceivedAtMs: Double?, lastOAuthFetchAtMs: Double?, oauthHasScopedLimits: Bool, nowMs: Double
    ) -> Bool {
        if age(receivedAtMs: statuslineReceivedAtMs, nowMs: nowMs) != .fresh { return true }
        guard let last = lastOAuthFetchAtMs, last.isFinite, last > 0 else { return true }
        if !oauthHasScopedLimits { return false }
        return nowMs - last >= oauthScopedRefreshMs
    }

    /// May the last OAuth-family reading's scoped caps still ride along?
    static func oauthCarryOverFresh(lastOAuthFetchAtMs: Double?, nowMs: Double) -> Bool {
        guard let last = lastOAuthFetchAtMs, last.isFinite, last > 0 else { return false }
        return nowMs - last <= oauthCarryOverMs
    }

    private static func windowChanged(_ a: Window?, _ b: Window?) -> Bool {
        guard let a, let b else { return (a == nil) != (b == nil) }
        if a.resetsAt != b.resetsAt { return true }
        return abs(a.usedPercent - b.usedPercent) >= changeEpsilon
    }

    /// Does \`next\` say anything a surface would repaint for?
    static func changed(prev: Reading?, next: Reading) -> Bool {
        guard let prev else { return true }
        return windowChanged(prev.fiveHour, next.fiveHour) || windowChanged(prev.sevenDay, next.sevenDay)
    }
}
#endif
`;
}

export const OUTPUTS = [
  ['apple/AgentDeck/Daemon/Core/ClaudeStatuslineRules.generated.swift', emitSwift],
];

async function main() {
  let mod;
  try {
    mod = await import(path.join(projectDir, 'shared/dist/claude-statusline.js'));
  } catch (err) {
    console.error(`shared/dist is missing — run \`pnpm build\` first (${err.message})`);
    process.exit(1);
  }
  const rules = rulesFrom(mod);
  const check = process.argv.includes('--check');
  let drifted = false;
  for (const [rel, emit] of OUTPUTS) {
    const abs = path.join(projectDir, rel);
    const next = emit(rules);
    const prev = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
    if (check) {
      if (prev !== next) {
        console.error(`DRIFT: ${rel}`);
        drifted = true;
      }
    } else if (prev !== next) {
      fs.writeFileSync(abs, next);
      console.log(`wrote ${rel}`);
    } else {
      console.log(`up-to-date ${rel}`);
    }
  }
  if (drifted) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
