#if os(macOS)
import XCTest
import Network
@testable import AgentDeck

final class LocalPortProbeTests: XCTestCase {
    func testIPv4ListenerWithoutHTTPResponseIsOccupied() async throws {
        let listener = try SilentListener(ipv6: false)
        defer { listener.close() }
        let status = await LocalPortProbe.status(port: Int(listener.port))
        XCTAssertEqual(status, .listening)
        let bindable = await SessionRegistry.shared.isPortBindable(Int(listener.port))
        XCTAssertFalse(bindable, "an IPv6 wildcard bind must not hide an IPv4 daemon")
    }

    func testIPv6OnlyListenerIsOccupiedToo() async throws {
        let listener = try SilentListener(ipv6: true)
        defer { listener.close() }
        let status = await LocalPortProbe.status(port: Int(listener.port))
        XCTAssertEqual(status, .listening)
    }

    func testClosedListenerPermitsFailover() async throws {
        let listener = try SilentListener(ipv6: false)
        listener.close()
        let status = await LocalPortProbe.status(port: Int(listener.port))
        XCTAssertEqual(status, .notListening)
    }

    func testInconclusiveEvidenceNeverMeansVacant() async {
        let invalid = await LocalPortProbe.status(port: -1)
        XCTAssertEqual(invalid, .unknown)
        XCTAssertEqual(LocalPortProbe.Status.combining(.notListening, .unknown), .unknown)
        XCTAssertEqual(LocalPortProbe.Status.combining(.unknown, .notListening), .unknown)
        XCTAssertEqual(LocalPortProbe.Status.combining(.unknown, .listening), .listening)
    }
}

/// Accepts TCP handshakes but supplies no HTTP response, like a blocked daemon.
private final class SilentListener {
    private var fd: Int32
    let port: UInt16

    init(ipv6: Bool) throws {
        let family = ipv6 ? AF_INET6 : AF_INET
        let descriptor = socket(family, SOCK_STREAM, 0)
        fd = descriptor
        guard fd >= 0 else { throw POSIXError(.EIO) }
        var reuse: Int32 = 1
        setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &reuse, socklen_t(MemoryLayout<Int32>.size))
        let bound: Int32
        if ipv6 {
            var only: Int32 = 1
            setsockopt(fd, IPPROTO_IPV6, IPV6_V6ONLY, &only, socklen_t(MemoryLayout<Int32>.size))
            var address = sockaddr_in6()
            address.sin6_len = UInt8(MemoryLayout<sockaddr_in6>.size)
            address.sin6_family = sa_family_t(AF_INET6)
            address.sin6_addr = in6addr_loopback
            bound = withUnsafePointer(to: &address) {
                $0.withMemoryRebound(to: sockaddr.self, capacity: 1) { bind(descriptor, $0, socklen_t(MemoryLayout<sockaddr_in6>.size)) }
            }
        } else {
            var address = sockaddr_in()
            address.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
            address.sin_family = sa_family_t(AF_INET)
            address.sin_addr.s_addr = inet_addr("127.0.0.1")
            bound = withUnsafePointer(to: &address) {
                $0.withMemoryRebound(to: sockaddr.self, capacity: 1) { bind(descriptor, $0, socklen_t(MemoryLayout<sockaddr_in>.size)) }
            }
        }
        guard bound == 0, listen(fd, 8) == 0 else {
            Darwin.close(fd)
            throw POSIXError(.EADDRINUSE)
        }
        var address = sockaddr_storage()
        var length = socklen_t(MemoryLayout<sockaddr_storage>.size)
        let result = withUnsafeMutablePointer(to: &address) {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) { getsockname(descriptor, $0, &length) }
        }
        guard result == 0 else { Darwin.close(fd); throw POSIXError(.EIO) }
        // Both sockaddr_in and sockaddr_in6 place their network-order port here.
        port = withUnsafePointer(to: &address) {
            $0.withMemoryRebound(to: sockaddr_in.self, capacity: 1) { UInt16(bigEndian: $0.pointee.sin_port) }
        }
    }

    func close() { if fd >= 0 { Darwin.close(fd); fd = -1 } }
    deinit { close() }
}
#endif
