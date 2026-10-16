#if os(macOS)
import XCTest
@testable import AgentDeck

/// Replays shared/claude-statusline-vectors.json — the same file the Node suite
/// replays — so a Claude Code status-line document reads the same on either
/// daemon: the same windows, the same freshness, the same poll decision.
final class ClaudeStatuslineRulesTests: XCTestCase {
    private static let receivedAtMs: Double = 1792108799000

    private func root() throws -> [String: Any] {
        let url = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("shared/claude-statusline-vectors.json")
        let data = try Data(contentsOf: url)
        return try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
    }

    private func cases(_ section: String) throws -> (now: Double, rows: [[String: Any]]) {
        let root = try root()
        let now = try XCTUnwrap((root["now"] as? NSNumber)?.doubleValue)
        let rows = try XCTUnwrap(root[section] as? [[String: Any]])
        XCTAssertGreaterThan(rows.count, 0, section)
        return (now, rows)
    }

    private func number(_ raw: Any?) -> Double? {
        guard let n = raw as? NSNumber, !(raw is NSNull) else { return nil }
        return n.doubleValue
    }

    private func window(_ raw: Any?) -> ClaudeStatuslineRules.Window? {
        guard let d = raw as? [String: Any], let pct = number(d["usedPercent"]) else { return nil }
        return ClaudeStatuslineRules.Window(usedPercent: pct, resetsAt: d["resetsAt"] as? String)
    }

    private func reading(_ raw: Any?) -> ClaudeStatuslineRules.Reading? {
        guard let d = raw as? [String: Any] else { return nil }
        return ClaudeStatuslineRules.Reading(
            fiveHour: window(d["fiveHour"]), sevenDay: window(d["sevenDay"]),
            sessionId: nil, model: nil, version: nil, receivedAtMs: Self.receivedAtMs)
    }

    func testParseVectors() throws {
        for c in try cases("parse").rows {
            let name = c["name"] as? String ?? ""
            let got = ClaudeStatuslineRules.parse(c["payload"], receivedAtMs: Self.receivedAtMs)
            guard let expected = c["expected"] as? [String: Any] else {
                XCTAssertNil(got, name)
                continue
            }
            let r = try XCTUnwrap(got, name)
            XCTAssertEqual(r.fiveHour, window(expected["fiveHour"]), name)
            XCTAssertEqual(r.sevenDay, window(expected["sevenDay"]), name)
            XCTAssertEqual(r.sessionId, expected["sessionId"] as? String, name)
            XCTAssertEqual(r.model, expected["model"] as? String, name)
            XCTAssertEqual(r.version, expected["version"] as? String, name)
            XCTAssertEqual(r.receivedAtMs, Self.receivedAtMs, name)
        }
    }

    func testAgeVectors() throws {
        let (now, rows) = try cases("age")
        for c in rows {
            let name = c["name"] as? String ?? ""
            let expected: ClaudeStatuslineRules.Age
            switch try XCTUnwrap(c["age"] as? String) {
            case "fresh": expected = .fresh
            case "aged": expected = .aged
            default: expected = .unknown
            }
            XCTAssertEqual(ClaudeStatuslineRules.age(receivedAtMs: number(c["receivedAt"]), nowMs: now), expected, name)
        }
    }

    func testPollVectors() throws {
        let (now, rows) = try cases("poll")
        for c in rows {
            let name = c["name"] as? String ?? ""
            let got = ClaudeStatuslineRules.shouldPollOAuth(
                statuslineReceivedAtMs: number(c["statuslineReceivedAt"]),
                lastOAuthFetchAtMs: number(c["lastOAuthFetchAt"]),
                oauthHasScopedLimits: try XCTUnwrap(c["oauthHasScopedLimits"] as? Bool),
                nowMs: now)
            XCTAssertEqual(got, try XCTUnwrap(c["poll"] as? Bool), name)
        }
    }

    func testCarryVectors() throws {
        let (now, rows) = try cases("carry")
        for c in rows {
            let name = c["name"] as? String ?? ""
            XCTAssertEqual(
                ClaudeStatuslineRules.oauthCarryOverFresh(lastOAuthFetchAtMs: number(c["lastOAuthFetchAt"]), nowMs: now),
                try XCTUnwrap(c["carry"] as? Bool), name)
        }
    }

    func testChangedVectors() throws {
        for c in try cases("changed").rows {
            let name = c["name"] as? String ?? ""
            let next = try XCTUnwrap(reading(c["next"]), name)
            XCTAssertEqual(ClaudeStatuslineRules.changed(prev: reading(c["prev"]), next: next),
                           try XCTUnwrap(c["changed"] as? Bool), name)
        }
    }

    /// The constants the Node side pins (claude-statusline-sync.test.ts checks
    /// the generated file byte for byte; this guards the semantics they carry).
    func testFreshBoundIsInclusive() {
        let now: Double = 1_792_108_800_000
        XCTAssertEqual(ClaudeStatuslineRules.age(receivedAtMs: now - ClaudeStatuslineRules.freshMs, nowMs: now), .fresh)
        XCTAssertEqual(ClaudeStatuslineRules.age(receivedAtMs: now - ClaudeStatuslineRules.freshMs - 1, nowMs: now), .aged)
        XCTAssertEqual(ClaudeStatuslineRules.route, "/claude/statusline")
    }
}
#endif
