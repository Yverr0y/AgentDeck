#if os(macOS)
import Foundation
import Network

/// A connect tests the same endpoint as the health request. On Darwin an IPv6
/// wildcard bind with SO_REUSEADDR can succeed beside a live IPv4 listener;
/// raw bind success therefore cannot license replacing an external daemon.
enum LocalPortProbe {
    enum Status: Sendable, Equatable {
        case listening, notListening, unknown

        static func combining(_ ipv4: Self, _ ipv6: Self) -> Self {
            if ipv4 == .listening || ipv6 == .listening { return .listening }
            if ipv4 == .notListening && ipv6 == .notListening { return .notListening }
            return .unknown
        }
    }

    static func status(port: Int, timeout: TimeInterval = 2) async -> Status {
        guard (1...65535).contains(port), let endpointPort = NWEndpoint.Port(rawValue: UInt16(port)) else {
            return .unknown
        }
        async let ipv4 = connect(host: "127.0.0.1", port: endpointPort, timeout: timeout)
        async let ipv6 = connect(host: "::1", port: endpointPort, timeout: timeout)
        return await .combining(ipv4, ipv6)
    }

    private static func connect(host: NWEndpoint.Host, port: NWEndpoint.Port, timeout: TimeInterval) async -> Status {
        await withCheckedContinuation { continuation in
            Attempt(host: host, port: port, timeout: timeout) {
                continuation.resume(returning: $0)
            }.start()
        }
    }

    /// State and the deadline share one queue. Completion cancels the socket,
    /// removes its callback and resumes exactly once, including on timeout.
    private final class Attempt: @unchecked Sendable {
        private let connection: NWConnection
        private let queue = DispatchQueue(label: "dev.agentdeck.local-port-probe")
        private let timeout: TimeInterval
        private var completion: (@Sendable (Status) -> Void)?
        private var deadline: DispatchWorkItem?

        init(host: NWEndpoint.Host, port: NWEndpoint.Port, timeout: TimeInterval,
             completion: @escaping @Sendable (Status) -> Void) {
            connection = NWConnection(host: host, port: port, using: .tcp)
            self.timeout = timeout
            self.completion = completion
        }

        func start() {
            queue.async { [self] in
                connection.stateUpdateHandler = { [self] state in
                    switch state {
                    case .ready: finish(.listening)
                    case .failed(let error), .waiting(let error):
                        if case .posix(.ECONNREFUSED) = error { finish(.notListening) }
                        else if case .failed = state { finish(.unknown) }
                    case .cancelled: finish(.unknown)
                    default: break
                    }
                }
                let work = DispatchWorkItem { [self] in finish(.unknown) }
                deadline = work
                queue.asyncAfter(deadline: .now() + timeout, execute: work)
                connection.start(queue: queue)
            }
        }

        private func finish(_ status: Status) {
            guard let completion else { return }
            self.completion = nil
            deadline?.cancel()
            deadline = nil
            connection.stateUpdateHandler = nil
            connection.cancel()
            completion(status)
        }
    }
}
#endif
