import XCTest
@testable import AgentDeck
#if os(macOS)
import SwiftUI

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

    func testBothHookDirectionsProduceOneConversationAndRemindersKeepOriginalAge() throws {
        let value = try snapshot("""
        [{"id":"1","sessionId":"a","ts":10000,"relation":"messaged","direction":"out","peerSessionId":"b","peerName":"Reviewer"},
         {"id":"2","sessionId":"b","ts":10010,"relation":"messaged","direction":"in","peerSessionId":"a","peerName":"Builder"},
         {"id":"3","sessionId":"a","ts":20000,"relation":"messaged","direction":"out","peerSessionId":"b"}]
        """)
        let network = CommunicationNetwork.project(snapshot: value, roster: try roster())
        XCTAssertEqual(network.links.count, 1)
        XCTAssertEqual(network.links[0].latestSender, "a")
        XCTAssertEqual(network.links[0].latestRecipient, "b")
        XCTAssertEqual(network.links[0].noReplySince, 10000)
        XCTAssertEqual(network.nodes.first { $0.id == "a" }?.name, "Builder")
    }

    func testReverseMessageEndsEarlierBurstAndStartsASeparateObservation() throws {
        let value = try snapshot("""
        [{"id":"1","sessionId":"a","ts":10000,"relation":"messaged","direction":"out","peerSessionId":"b"},
         {"id":"2","sessionId":"b","ts":20000,"relation":"messaged","direction":"out","peerSessionId":"a"}]
        """)
        let link = try XCTUnwrap(CommunicationNetwork.project(snapshot: value, roster: try roster()).links.first)
        XCTAssertEqual(link.latestSender, "b")
        XCTAssertEqual(link.noReplySince, 20000, "A reverse message is not proof a request was resolved")
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
        {"id":"1","sessionId":"a","ts":\(now-180000),"relation":"messaged","direction":"out","peerSessionId":"b","peerName":"reviewer","detail":"Please check the session identity changes"},
        {"id":"2","sessionId":"b","ts":\(now-179990),"relation":"messaged","direction":"in","peerSessionId":"a","peerName":"builder"},
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
                    peerSessionId: "peer", peerName: "Peer", evidence: "test", detail: String(repeating: "x", count: 300), ts: ts, key: key))
            }
        }
        let rows = try store.listCommunicationEvents(since: 100, limit: 10)
        XCTAssertEqual(rows.count, 2)
        XCTAssertEqual(Set(rows.compactMap { $0["sessionId"] as? String }), ["a", "b"])
        XCTAssertTrue(rows.allSatisfy { ($0["detail"] as? String)?.count == 140 && $0["input"] == nil && $0["text"] == nil })
        XCTAssertEqual(try store.listCommunicationEvents(since: 100, limit: 1).count, 1)
        store.close()
        XCTAssertThrowsError(try store.listCommunicationEvents(since: 100, limit: 1))
    }
}
#endif
