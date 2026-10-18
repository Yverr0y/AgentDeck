#if os(macOS)
import XCTest
@testable import AgentDeck

/// Codex device approvals (the opt-in `PermissionRequest` hold). Replays
/// shared/codex-approval-hold-vectors.json, as bridge/src/__tests__/
/// codex-approval-hold.test.ts and hooks/src/__tests__/codex-install.test.ts do.
final class CodexApprovalHoldTests: XCTestCase {

    private func vectors() throws -> [String: Any] {
        let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        let data = try Data(contentsOf: root.appendingPathComponent("shared/codex-approval-hold-vectors.json"))
        return try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
    }

    // MARK: - Installer

    func testInstallerEmitsTheSharedHoldCommand() throws {
        // Codex hashes the command for trust: a one-byte drift between the two
        // installers would put every user back on the review screen.
        XCTAssertEqual(CodexConfigInstaller.buildApprovalHoldCommand(), try vectors()["posixHoldCommand"] as? String)
        XCTAssertEqual(CodexConfigInstaller.approvalHoldHeader.lowercased(), CodexApprovalHoldRules.header)
    }

    func testInstallerWritesTheSharedPermissionRequestGroup() throws {
        let group = try XCTUnwrap(try vectors()["posixPermissionRequestGroup"] as? String)
        XCTAssertTrue(CodexConfigInstaller.managedBlockBody(includeApprovalHold: true).contains(group))
    }

    func testHoldIsASecondHandlerAndLeavesEveryOtherByteAlone() {
        let plain = CodexConfigInstaller.managedBlockBody(includeOtel: false)
        let held = CodexConfigInstaller.managedBlockBody(includeOtel: false, includeApprovalHold: true)
        let hold = [
            "[[hooks.PermissionRequest.hooks]]",
            "type = \"command\"",
            "command = \(MiniToml.quoted(CodexConfigInstaller.buildApprovalHoldCommand()))",
            "timeout = 60",
        ].joined(separator: "\n")
        XCTAssertEqual(held.replacingOccurrences(of: "\n" + hold, with: ""), plain)
        XCTAssertEqual(held.components(separatedBy: "[[hooks.PermissionRequest]]").count - 1, 1)
        XCTAssertFalse(plain.contains(CodexConfigInstaller.approvalHoldHeader))
    }

    func testPolicyIsOffByDefaultOnWhenAskedKeptByARefreshAndRemovedWhenOff() throws {
        let original = "model = \"gpt-5\"\n"
        let plain = try CodexConfigInstaller.preparedConfig(original, daemonHttpPort: 9120)
        XCTAssertFalse(CodexConfigInstaller.hasApprovalHold(plain))

        let held = try CodexConfigInstaller.preparedConfig(plain, daemonHttpPort: 9120, approvals: .on)
        XCTAssertTrue(CodexConfigInstaller.hasApprovalHold(held))
        // The install pass at every daemon start must neither add nor drop it.
        XCTAssertEqual(try CodexConfigInstaller.preparedConfig(held, daemonHttpPort: 9120), held)
        XCTAssertEqual(try CodexConfigInstaller.preparedConfig(plain, daemonHttpPort: 9120), plain)

        let off = try CodexConfigInstaller.preparedConfig(held, daemonHttpPort: 9120, approvals: .off)
        XCTAssertEqual(off, plain)
        XCTAssertEqual(MiniToml.removeManagedBlock(in: held), original)
    }

    func testHoldKeepsTrustRecordsAndAUserGroupOutsideTheFence() throws {
        let user = [
            "[[hooks.PermissionRequest]]",
            "[[hooks.PermissionRequest.hooks]]",
            "type = \"command\"",
            "command = \"workmux set-window-status waiting\"",
            "",
            "[hooks.state]",
            "",
            "[hooks.state.\"/Users/me/.codex/config.toml:permission_request:0:0\"]",
            "trusted_hash = \"sha256:abc\"",
        ].joined(separator: "\n")
        let installed = try CodexConfigInstaller.preparedConfig(user, daemonHttpPort: 9120)
        let held = try CodexConfigInstaller.preparedConfig(installed, daemonHttpPort: 9120, approvals: .on)
        XCTAssertEqual(MiniToml.removeManagedBlock(in: held), MiniToml.removeManagedBlock(in: installed))
        XCTAssertTrue(held.contains("trusted_hash = \"sha256:abc\""))
        XCTAssertTrue(held.contains("command = \"workmux set-window-status waiting\""))
    }

    func testOnlyAManagedCommandCountsAsTheHold() {
        let outside = "[[hooks.PermissionRequest]]\n[[hooks.PermissionRequest.hooks]]\ntype = \"command\"\ncommand = \"curl -H 'X-AgentDeck-Hold: 55' x\""
        XCTAssertFalse(CodexConfigInstaller.hasApprovalHold(outside))
        let comment = MiniToml.applyManagedBlock(in: "", body: "# X-AgentDeck-Hold is documented elsewhere")
        XCTAssertFalse(CodexConfigInstaller.hasApprovalHold(comment))
    }

    // MARK: - Daemon rules

    func testHeaderAndDecisionBodies() throws {
        let v = try vectors()
        XCTAssertEqual(CodexApprovalHoldRules.header, v["header"] as? String)
        let rows = try XCTUnwrap(v["decisions"] as? [[String: Any]])
        XCTAssertEqual(rows.count, 4)
        for row in rows {
            let decision = try XCTUnwrap(row["decision"] as? String)
            let body = CodexApprovalHoldRules.decisionBody(decision)
            if row["body"] is NSNull {
                XCTAssertEqual(body, "", decision)
            } else {
                let expected = try XCTUnwrap(row["body"] as? NSDictionary)
                let actual = try XCTUnwrap(JSONSerialization.jsonObject(with: Data(body.utf8)) as? NSDictionary, decision)
                XCTAssertEqual(actual, expected, decision)
                // The hook prints only an answer that names the output key.
                XCTAssertTrue(body.contains("\"hookSpecificOutput\""), decision)
            }
        }
    }

    func testBudgets() throws {
        let rows = try XCTUnwrap(try vectors()["budgets"] as? [[String: Any]])
        XCTAssertFalse(rows.isEmpty)
        for row in rows {
            let name = row["name"] as? String ?? "?"
            let header = try XCTUnwrap(row["header"] as? String, name)
            let defaultMs = try XCTUnwrap(row["defaultMs"] as? Int, name)
            XCTAssertEqual(
                CodexApprovalHoldRules.holdMilliseconds(header: header, defaultMs: defaultMs),
                row["holdMs"] as? Int, name)
        }
        XCTAssertNil(CodexApprovalHoldRules.holdMilliseconds(header: nil, defaultMs: 25_000))
    }

    func testEligibility() throws {
        let v = try vectors()
        let defaults = try XCTUnwrap(v["eligibilityDefaults"] as? [String: Any])
        let rows = try XCTUnwrap(v["eligibility"] as? [[String: Any]])
        XCTAssertFalse(rows.isEmpty)
        for row in rows {
            let name = row["name"] as? String ?? "?"
            let input = defaults.merging(try XCTUnwrap(row["input"] as? [String: Any], name)) { _, new in new }
            let verdict = CodexApprovalHoldRules.decision(.init(
                enabled: try XCTUnwrap(input["enabled"] as? Bool, name),
                clientCount: try XCTUnwrap(input["clientCount"] as? Int, name),
                sessionId: try XCTUnwrap(input["sessionId"] as? String, name),
                background: try XCTUnwrap(input["background"] as? Bool, name),
                execChild: try XCTUnwrap(input["execChild"] as? Bool, name),
                visible: try XCTUnwrap(input["visible"] as? Bool, name),
                alreadyHeld: try XCTUnwrap(input["alreadyHeld"] as? Bool, name)))
            XCTAssertEqual(verdict.hold, row["hold"] as? Bool, name)
            XCTAssertEqual(verdict.reason, row["reason"] as? String, name)
        }
    }

    func testReleasingEvents() throws {
        let v = try vectors()
        XCTAssertEqual(CodexApprovalHoldRules.releasingEvents, Set(try XCTUnwrap(v["releasingEvents"] as? [String])))
        for event in try XCTUnwrap(v["nonReleasingEvents"] as? [String]) {
            XCTAssertFalse(CodexApprovalHoldRules.releasingEvents.contains(event), event)
        }
    }

    func testCapturedRequestReadsAsTheSharedQuestionOnItsSessionRow() throws {
        let v = try vectors()
        let request = try XCTUnwrap(v["capturedPermissionRequest"] as? [String: Any])
        XCTAssertEqual(DaemonServer.codexPermissionQuestion(request), v["capturedQuestion"] as? String)
        let thread = try XCTUnwrap(request["session_id"] as? String)
        XCTAssertEqual(DaemonServer.hookSessionId(event: "codex_permission_request", json: request), "codex:\(thread)")
    }

    // MARK: - Gate

    func testCodexGateKeepsOnePerSessionAndAnswersADeviceDecision() async {
        let steering = ObservedSteering()
        guard ObservedSteering.gateEnabled else { return } // AGENTDECK_OBSERVED_APPROVAL=0
        let sid = "codex:019a0000-0000-7000-8000-000000000001"
        let requestId = await steering.beginCodexGate(sessionId: sid, clientCount: 1, holdSeconds: 5)
        XCTAssertNotNil(requestId)
        let busy = await steering.beginCodexGate(sessionId: sid, clientCount: 1, holdSeconds: 5)
        XCTAssertNil(busy, "a second approval in the same session passes to its terminal prompt")
        let noClients = await steering.beginCodexGate(sessionId: "codex:other", clientCount: 0, holdSeconds: 5)
        XCTAssertNil(noClients)

        let held = Task { await steering.awaitGate(requestId: requestId!) }
        // Give awaitGate a moment to install its continuation.
        try? await Task.sleep(nanoseconds: 50_000_000)
        let affected = await steering.resolveGate(requestId: requestId!, decision: "deny")
        XCTAssertEqual(affected, sid)
        let decision = await held.value
        XCTAssertEqual(decision, "deny")
        let again = await steering.beginCodexGate(sessionId: sid, clientCount: 1, holdSeconds: 5)
        XCTAssertNotNil(again)
    }

    func testCodexGateEndsWithItsTurn() async {
        let steering = ObservedSteering()
        guard ObservedSteering.gateEnabled else { return }
        let sid = "codex:019a0000-0000-7000-8000-000000000002"
        let requestId = await steering.beginCodexGate(sessionId: sid, clientCount: 1, holdSeconds: 5)
        let held = Task { await steering.awaitGate(requestId: requestId!) }
        try? await Task.sleep(nanoseconds: 50_000_000)
        let ended = await steering.endGate(requestId: requestId!)
        XCTAssertEqual(ended, sid)
        let outcome = await held.value
        XCTAssertEqual(outcome, "ended")
        let late = await steering.resolveGate(requestId: requestId!, decision: "allow")
        XCTAssertNil(late, "a press after the turn ended answers nothing")
    }

    func testCodexGateTimesOutOnItsOwnBudget() async {
        let steering = ObservedSteering()
        guard ObservedSteering.gateEnabled else { return }
        let requestId = await steering.beginCodexGate(
            sessionId: "codex:019a0000-0000-7000-8000-000000000003", clientCount: 1, holdSeconds: 0.2)
        let started = Date()
        let outcome = await steering.awaitGate(requestId: requestId!)
        XCTAssertEqual(outcome, "pass")
        // Far below the permission gate's default hold (25 s).
        XCTAssertLessThan(Date().timeIntervalSince(started), 5)
    }
}
#endif
