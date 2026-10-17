#if os(macOS)
import XCTest
@testable import AgentDeck

final class BridgeConnectionLifetimeTests: XCTestCase {
    /// Uses the production client and server, including their real ping/pong
    /// path. Frequent frames do not reset URLSession's resource deadline: the
    /// old 120s configuration reliably disconnected this otherwise healthy link.
    func testHealthySocketSurvivesFormerTwoMinuteLifetime() async throws {
        let server = WebSocketServer()
        var selectedPort: UInt16?
        for port in UInt16(19400)..<UInt16(19430) {
            do { try await server.start(port: port, loopbackOnly: true); selectedPort = port; break }
            catch { continue }
        }
        let port = try XCTUnwrap(selectedPort)
        let connection = BridgeConnection()
        let connected = expectation(description: "first frame received")
        let disconnected = expectation(description: "no lifetime-based disconnect")
        disconnected.isInverted = true
        disconnected.assertForOverFulfill = false
        let count = FrameCount()
        connection.onEvent = { _ in if count.increment() == 1 { connected.fulfill() } }
        connection.onDisconnect = { disconnected.fulfill() }
        await server.setConnectHandler { peer in
            peer.send(Data(#"{"type":"connection","status":"connected"}"#.utf8))
        }
        connection.connect(to: "ws://127.0.0.1:\(port)")
        let frames = Task {
            while !Task.isCancelled {
                await server.broadcast(["type": "connection", "status": "connected"])
                do { try await Task.sleep(for: .seconds(1)) } catch { return }
            }
        }
        await fulfillment(of: [connected], timeout: 8)
        await fulfillment(of: [disconnected], timeout: 125)
        XCTAssertGreaterThan(count.value, 110, "must actually receive live frames throughout the old deadline")
        let status = await MainActor.run { connection.status }
        XCTAssertEqual(status, .connected)
        frames.cancel()
        connection.prepareForTermination()
        await server.stop()
    }
}

private final class FrameCount: @unchecked Sendable {
    private let lock = NSLock()
    private var count = 0
    func increment() -> Int { lock.withLock { count += 1; return count } }
    var value: Int { lock.withLock { count } }
}
#endif
