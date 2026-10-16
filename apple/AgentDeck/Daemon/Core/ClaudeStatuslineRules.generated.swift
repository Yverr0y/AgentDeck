// GENERATED FILE — DO NOT EDIT.
// Source of truth: shared/src/claude-statusline.ts
// Regenerate: pnpm generate-claude-statusline-rules (drift gated by shared/src/__tests__/claude-statusline-sync.test.ts)
#if os(macOS)
import Foundation

/// Claude Code status-line relay — the sanctioned subscription-quota source.
/// The installed status line POSTs Claude Code's status document to the local
/// daemon; these rules read the `five_hour` / `seven_day` windows out of it,
/// age the reading, decide when the OAuth poll may stay quiet (Node) and when a
/// repaint is worth broadcasting. Behaviour is pinned by
/// `shared/claude-statusline-vectors.json` (`ClaudeStatuslineRulesTests`).
enum ClaudeStatuslineRules {
    static let route = "/claude/statusline"
    /// A reading younger than this is the live source.
    static let freshMs: Double = 300000
    /// The last OAuth reading's scoped caps ride along this long.
    static let oauthCarryOverMs: Double = 1800000
    /// With scoped caps on the account, OAuth still refreshes this often.
    static let oauthScopedRefreshMs: Double = 600000
    /// Percent moves below this do not broadcast on their own.
    static let changeEpsilon: Double = 0.05
    /// A `resets_at` above this is already epoch milliseconds.
    static let msThreshold: Double = 100000000000

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

    /// A formatter per call: `ISO8601DateFormatter` is not Sendable, so a shared
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

    /// Does `next` say anything a surface would repaint for?
    static func changed(prev: Reading?, next: Reading) -> Bool {
        guard let prev else { return true }
        return windowChanged(prev.fiveHour, next.fiveHour) || windowChanged(prev.sevenDay, next.sevenDay)
    }
}
#endif
