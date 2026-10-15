import XCTest
@testable import AgentDeck
#if os(macOS)
import SwiftUI
import RealityKit

final class CommunicationGraphTests: XCTestCase {
    private func snapshot(_ events: String) throws -> CommunicationSnapshot {
        try JSONDecoder().decode(CommunicationSnapshot.self, from: Data("""
        {"schema":"agentdeck-communications/v1","capturedAt":100000,"since":1,"truncated":false,"events":\(events)}
        """.utf8))
    }
    private func roster() throws -> [SessionInfo] {
        try JSONDecoder().decode([SessionInfo].self, from: Data("""
        [{"id":"observed:claude:a","port":0,"alive":true,"projectName":"Same project","state":"idle"},
         {"id":"b","port":0,"alive":true,"projectName":"Same project","state":"processing"},
         {"id":"unrelated","port":0,"alive":true,"projectName":"Same project","state":"idle"}]
        """.utf8))
    }

    func testAllRosterSessionsAppearWithoutInventingProjectEdges() throws {
        let network = CommunicationNetwork.project(snapshot: nil, roster: try roster())
        XCTAssertEqual(network.nodes.map(\.id), ["a", "b", "unrelated"])
        XCTAssertTrue(network.links.isEmpty)
    }

    func testReplyBadgesAvoidTheNodesThatHidThemInTheLiveNineNodeGraph() {
        let width: CGFloat = 760, height: CGFloat = 390, nodeWidth: CGFloat = 130
        let points = (0..<9).map { index in
            let angle = Double(index)/9 * .pi*2 - .pi/2
            return CGPoint(x: width/2+cos(angle)*(width/2-nodeWidth/2-8), y: height/2+sin(angle)*(height/2-38))
        }
        var occupied = points.map { CGRect(x: $0.x-nodeWidth/2, y: $0.y-32, width: nodeWidth, height: 64) }
        let bounds = CGRect(x: 4, y: 4, width: width-8, height: height-8)
        for (from, to) in [(6, 2), (6, 8), (4, 2), (5, 2)] {
            let center = CGPoint(x: (points[from].x+points[to].x)/2, y: (points[from].y+points[to].y)/2)
            let rect = CommunicationLabelLayout.place(preferred: center, size: CGSize(width: 72, height: 24), bounds: bounds, avoiding: occupied)
            XCTAssertTrue(bounds.contains(rect))
            XCTAssertFalse(occupied.contains { $0.intersects(rect) }, "A reply timer must remain visible above the graph geometry")
            occupied.append(rect)
        }
    }

    private func link(_ messages: [(String, Int, String?, String?)]) throws -> CommunicationLink {
        let rows = messages.enumerated().map { index, message -> [String: Any] in
            var event: [String: Any] = ["id": String(index), "sessionId": message.0, "ts": message.1,
                "relation": "messaged", "direction": "out", "peerSessionId": message.0 == "a" ? "b" : "a"]
            event["messageIntent"] = message.2
            event["messageFingerprint"] = message.3
            return event
        }
        let json = String(data: try JSONSerialization.data(withJSONObject: rows), encoding: .utf8)!
        return try XCTUnwrap(CommunicationNetwork.project(snapshot: try snapshot(json), roster: try roster()).links.first)
    }

    func testNotificationsResponsesAndLegacyUnknownNeverStartTimers() throws {
        for intent in [nil, "notification", "response", "unknown", "future"] as [String?] {
            let value = try link([("a", 10000, intent, nil)])
            XCTAssertNil(value.noReplySince)
            XCTAssertTrue(value.waits.isEmpty)
        }
    }

    func testNotificationsAndRemindersRetainTheRequestTimeAndWaitingDirection() throws {
        let value = try link([("a", 10000, "request", "aaa"), ("a", 15000, "request", "aaa"),
                              ("a", 20000, "notification", "bbb"), ("b", 30000, "notification", "ccc")])
        XCTAssertEqual(value.latestSender, "b")
        XCTAssertEqual(value.noReplySince, 10000)
        XCTAssertEqual(value.waits.first?.sender, "a")
        XCTAssertEqual(value.waits.first?.recipient, "b")
        XCTAssertEqual(value.waits.first?.requestCount, 1)
        XCTAssertEqual(value.status, "Notification · earlier reply request pending")
    }

    func testExplicitResponseSettlesOnlyOneUnambiguousEarlierRequest() throws {
        XCTAssertNil(try link([("a", 10000, "request", "aaa"), ("b", 20000, "response", "bbb")]).noReplySince)
        let ambiguous = try link([("a", 10000, "request", "aaa"), ("a", 15000, "request", "bbb"), ("b", 20000, "response", "ccc")])
        XCTAssertEqual(ambiguous.noReplySince, 10000)
        XCTAssertEqual(ambiguous.waits.first?.requestCount, 2)
        XCTAssertEqual(try link([("a", 10000, "request", "aaa"), ("b", 11000, "response", "bbb")]).noReplySince, 10000)
    }

    func testCrossedRequestsRetainBothWaitingDirections() throws {
        let value = try link([("a", 10000, "request", "aaa"), ("b", 10000, "request", "bbb")])
        XCTAssertEqual(value.waits.count, 2)
        XCTAssertEqual(Set(value.waits.map(\.recipient)), ["a", "b"])
    }

    func testDelayedReceiverEchoCannotReopenAnAnsweredRequest() throws {
        let value = try snapshot("""
        [{"id":"1","sessionId":"a","ts":10000,"relation":"messaged","direction":"out","peerSessionId":"b","messageIntent":"request","messageFingerprint":"abc"},
         {"id":"2","sessionId":"b","ts":20000,"relation":"messaged","direction":"out","peerSessionId":"a","messageIntent":"response","messageFingerprint":"def"},
         {"id":"3","sessionId":"b","ts":30000,"relation":"messaged","direction":"in","peerSessionId":"a","messageIntent":"request","messageFingerprint":"abc"}]
        """)
        XCTAssertNil(CommunicationNetwork.project(snapshot: value, roster: try roster()).links.first?.noReplySince)
    }

    func testCrossedOrEqualTimestampMessagesNeverInventReplyOrderOrCrash() throws {
        for ts in [10000, 11000] {
            let value = try snapshot("""
            [{"id":"1","sessionId":"a","ts":10000,"relation":"messaged","direction":"out","peerSessionId":"b"},
             {"id":"2","sessionId":"b","ts":\(ts),"relation":"messaged","direction":"out","peerSessionId":"a"}]
            """)
            let link = try XCTUnwrap(CommunicationNetwork.project(snapshot: value, roster: try roster()).links.first)
            XCTAssertTrue(link.crossed)
            XCTAssertNil(link.noReplySince)
        }
    }

    func testUnresolvedNamesResolveOnlyWithUniqueExplicitEvidence() throws {
        let value = try snapshot("""
        [{"id":"1","sessionId":"a","ts":10000,"relation":"messaged","direction":"out","peerName":"Reviewer"},
         {"id":"2","sessionId":"a","ts":20000,"relation":"messaged","direction":"in","peerSessionId":"b","peerName":"Reviewer"}]
        """)
        let network = CommunicationNetwork.project(snapshot: value, roster: try roster())
        XCTAssertEqual(network.links.count, 1)
        XCTAssertFalse(network.nodes.contains(where: \.unresolved))
        let ambiguous = try snapshot("""
        [{"id":"1","sessionId":"a","ts":10000,"relation":"messaged","direction":"out","peerName":"Reviewer"},
         {"id":"2","sessionId":"a","ts":20000,"relation":"messaged","direction":"in","peerSessionId":"b","peerName":"Reviewer"},
         {"id":"3","sessionId":"a","ts":30000,"relation":"messaged","direction":"in","peerSessionId":"gone","peerName":"Reviewer"}]
        """)
        let uncertain = CommunicationNetwork.project(snapshot: ambiguous, roster: try roster())
        XCTAssertEqual(uncertain.links.count, 3)
        XCTAssertTrue(uncertain.nodes.contains(where: \.unresolved))
        XCTAssertNil(uncertain.nodes.first { $0.id == "gone" }?.rosterID)
    }

    func testInvalidDirectionsFutureEventsAndNonMessagesDoNotCreateEdges() throws {
        let value = try snapshot("""
        [{"id":"1","sessionId":"a","ts":10000,"relation":"spawned","direction":"out","peerSessionId":"b"},
         {"id":"2","sessionId":"a","ts":10000,"relation":"messaged","direction":"unknown","peerSessionId":"b"},
         {"id":"3","sessionId":"a","ts":100001,"relation":"messaged","direction":"out","peerSessionId":"b"}]
        """)
        XCTAssertTrue(CommunicationNetwork.project(snapshot: value, roster: try roster()).links.isEmpty)
    }

    func testHabitatRequiresTwoVisibleIdentitiesAndFiltersInspectedCreature() throws {
        let value = try snapshot("""
        [{"id":"1","sessionId":"a","ts":10000,"relation":"messaged","direction":"out","peerSessionId":"b","messageIntent":"request"},
         {"id":"2","sessionId":"a","ts":20000,"relation":"messaged","direction":"out","peerName":"unknown"}]
        """)
        let ids: Set<String> = ["observed:claude:a", "b", "unrelated"]
        func habitat(_ visible: Set<String>, _ focus: String? = nil) throws -> AquariumCommunications {
            .project(snapshot: value, roster: try roster(), visibleIDs: visible, focusedID: focus, fresh: true)
        }
        XCTAssertEqual(try habitat(ids).currents.map(\.senderID), ["observed:claude:a"])
        XCTAssertTrue(try habitat(["observed:claude:a"]).currents.isEmpty, "Off-stage peers have no invented position")
        XCTAssertTrue(try habitat(ids, "unrelated").currents.isEmpty)
        XCTAssertEqual(try habitat(ids, "b").currents.count, 1)
        let live = try habitat(ids)
        let frozen = AquariumCommunications(currents: live.currents, capturedAt: 100000, fresh: false, truncated: false)
        let later = Date(timeIntervalSince1970: 160)
        XCTAssertEqual(live.currents[0].caption(now: live.clock(later)), "Awaiting b · 2m 30s")
        XCTAssertEqual(frozen.currents[0].caption(now: frozen.clock(later)), "Awaiting b · 1m 30s")
    }

    @MainActor
    func test3DCurrentAnchorsFollowResidentParentAndCameraAndDisappearOnRemoval() async throws {
        let scene = AquariumResidents()
        scene.loadTemplates(try await Entity(contentsOf: XCTUnwrap(Bundle.main.url(forResource: "3d-residents", withExtension: "usdz"))))
        var state = TerrariumState()
        state.creatures = [.init(id: "a", projectName: "A", modelName: nil, state: .working, homeX: 0.5, homeY: 0.5, scale: 1)]
        scene.sync(state, aspect: 1.6)
        let camera = PerspectiveCamera()
        camera.look(at: [0, 2, 0], from: [0, 2, 14], relativeTo: nil)
        scene.camera = camera
        let first = try XCTUnwrap(scene.communicationPosition("a", aspect: 1.6))
        scene.root.position.x += 1
        let moved = try XCTUnwrap(scene.communicationPosition("a", aspect: 1.6))
        XCTAssertGreaterThan(moved.x, first.x)
        camera.position.x += 1
        XCTAssertEqual(try XCTUnwrap(scene.communicationPosition("a", aspect: 1.6)).x, first.x, accuracy: 0.001)
        state.creatures = []
        scene.sync(state, aspect: 1.6)
        XCTAssertNil(scene.communicationPosition("a", aspect: 1.6))
        XCTAssertNil(scene.communicationPosition("missing", aspect: 1.6))
    }
}

@MainActor
final class CommunicationFeedTests: XCTestCase {
    private let data = Data(#"{"schema":"agentdeck-communications/v1","capturedAt":100000,"since":1,"truncated":false,"events":[]}"#.utf8)

    func testFailedRefreshRetainsHistoryButChangingDaemonClearsIt() async {
        let queue = CommunicationResponses([.success(data), .failure(URLError(.timedOut)), .failure(URLError(.timedOut))])
        let feed = CommunicationFeed(load: { _ in try await queue.read() }, pause: { throw CancellationError() })
        await feed.observe(port: 1, connected: true)
        XCTAssertEqual(feed.state, .ready)
        await feed.observe(port: 1, connected: true)
        XCTAssertEqual(feed.state, .failed)
        XCTAssertEqual(feed.snapshot?.capturedAt, 100000)
        await feed.observe(port: 2, connected: true)
        XCTAssertNil(feed.snapshot)
        await feed.observe(port: 2, connected: false)
        XCTAssertEqual(feed.state, .disconnected)
    }

    func testUnknownSchemaCannotPublishHistory() async {
        let feed = CommunicationFeed(load: { _ in
            Data(#"{"schema":"future","capturedAt":1000,"since":0,"truncated":false,"events":[]}"#.utf8)
        }, pause: { throw CancellationError() })
        await feed.observe(port: 1, connected: true)
        XCTAssertEqual(feed.state, .unsupported)
        XCTAssertNil(feed.snapshot)
    }

    func testRenderFullGraphWithWaitingAndUnknownPeer() async throws {
        let roster = try JSONDecoder().decode([SessionInfo].self, from: Data("""
        [{"id":"a","port":0,"alive":true,"projectName":"Implementation","state":"processing"},
         {"id":"b","port":0,"alive":true,"projectName":"Review","state":"idle"},
         {"id":"c","port":0,"alive":true,"projectName":"Tests","state":"awaiting_permission"}]
        """.utf8))
        let now = Int(Date().timeIntervalSince1970 * 1000)
        let payload = Data("""
        {"schema":"agentdeck-communications/v1","capturedAt":\(now),"since":\(now-86400000),"truncated":false,"events":[
        {"id":"1","sessionId":"a","ts":\(now-180000),"relation":"messaged","direction":"out","peerSessionId":"b","peerName":"reviewer","messageIntent":"request","messageFingerprint":"abc","detail":"Please reply with the session identity findings"},
        {"id":"2","sessionId":"b","ts":\(now-179990),"relation":"messaged","direction":"in","peerSessionId":"a","peerName":"builder","messageIntent":"request","messageFingerprint":"abc"},
        {"id":"3","sessionId":"c","ts":\(now-45000),"relation":"messaged","direction":"out","peerName":"external-peer","detail":"Waiting for the test fixture"}]}
        """.utf8)
        let feed = CommunicationFeed(load: { _ in payload }, pause: { throw CancellationError() })
        await feed.observe(port: 1, connected: true)
        var selected: String?
        let view = CommunicationGraphView(feed: feed, roster: roster, selectedID: "a", expanded: true,
                                          inspect: { selected = $0 })
            .padding(20).frame(width: 1000, height: 850).aquariumSurface()
        let hosting = NSHostingView(rootView: view)
        hosting.frame = NSRect(x: 0, y: 0, width: 1000, height: 850)
        hosting.layoutSubtreeIfNeeded()
        let bitmap = try XCTUnwrap(hosting.bitmapImageRepForCachingDisplay(in: hosting.bounds))
        hosting.cacheDisplay(in: hosting.bounds, to: bitmap)
        let png = try XCTUnwrap(bitmap.representation(using: .png, properties: [:]))
        try png.write(to: URL(fileURLWithPath: "/tmp/agentdeck-communication-graph.png"))
        XCTAssertNil(selected, "Rendering a graph must not steer or select an agent")
        XCTAssertEqual(CommunicationNetwork.project(snapshot: feed.snapshot, roster: roster).links.count, 2)
    }
}

private actor CommunicationResponses {
    var responses: [Result<Data, Error>]
    init(_ responses: [Result<Data, Error>]) { self.responses = responses }
    func read() throws -> Data { try responses.removeFirst().get() }
}

@DaemonActor
final class CommunicationPersistenceTests: XCTestCase {
    func testNativeStoreReturnsOnlyBoundedRecentMessagesAcrossSessions() async throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        setenv("AGENTDECK_DATA_DIR", directory.path, 1)
        let store = ApmeStore()
        defer { store.close(); unsetenv("AGENTDECK_DATA_DIR"); try? FileManager.default.removeItem(at: directory) }
        XCTAssertTrue(store.open())
        let collector = ApmeCollector(store: store)
        for session in ["a", "b"] {
            collector.handleHook(event: "session_start", data: ["session_id": session, "agent_type": "claude-code"])
            collector.handleHook(event: "UserPromptSubmit", data: ["session_id": session, "prompt": "private prompt"])
            for (key, relation, ts) in [("old", "messaged", 1), ("recent", "messaged", 10000), ("job", "waiting_on", 20000)] {
                XCTAssertTrue(collector.noteRelation(sessionId: session, relation: relation, direction: "out", phase: "closed",
                    peerSessionId: "peer", peerName: "Peer", evidence: "test", detail: String(repeating: "x", count: 300), ts: ts, key: key, messageIntent: "request", messageFingerprint: "abc"))
            }
        }
        let rows = try store.listCommunicationEvents(since: 100, limit: 10)
        XCTAssertEqual(rows.count, 2)
        XCTAssertTrue(rows.allSatisfy { $0["messageIntent"] as? String == "request" && $0["messageFingerprint"] as? String == "abc" })
        XCTAssertEqual(Set(rows.compactMap { $0["sessionId"] as? String }), ["a", "b"])
        XCTAssertTrue(rows.allSatisfy { ($0["detail"] as? String)?.count == 140 && $0["input"] == nil && $0["text"] == nil })
        XCTAssertEqual(try store.listCommunicationEvents(since: 100, limit: 1).count, 1)
        store.close()
        XCTAssertThrowsError(try store.listCommunicationEvents(since: 100, limit: 1))
    }
}
#endif
