#if os(macOS)
// ESP32WifiSetup.swift — `GET /esp32/wifi` and `POST /esp32/wifi`: the WiFi
// credentials this daemon hands to serial-attached ESP32 boards, read and set
// by the operator.
//
// Node parity: bridge/src/esp32-wifi-setup.ts. Both daemons answer field for
// field, because the macOS app's Wi-Fi sheet and `agentdeck wifi-setup` call
// whichever daemon holds the port; shared/esp32-wifi-setup-vectors.json pins
// the shape and both suites replay it (ESP32WifiSetupTests).
//
// Never served: the password, and a board's credential id, which with the
// pairing token tests password guesses offline. The credentials never cross
// the LAN, and arriving from this machine is not enough to read or change them
// (`authorized`).

import Foundation

enum ESP32WifiSetup {
    /// What the routes read and drive; DaemonServer wires the real ones.
    struct Deps: Sendable {
        var loadConfig: @Sendable () -> WifiConfig?
        /// Throws when the file cannot be written.
        var saveConfig: @Sendable (WifiConfig) throws -> Void
        /// Whether this daemon runs the serial channel at all.
        var serialRunning: @Sendable () async -> Bool
        var boards: @Sendable (_ expectedCredId: String?) async -> [ESP32Serial.WifiSetupBoardRow]
        var provision: @Sendable (_ msg: SendableDict, _ manual: Bool) async -> [ESP32Serial.WifiProvisionOutcome]
        var authToken: @Sendable () -> String
        var bridgeIP: @Sendable () -> String
        var bridgePort: Int
    }

    struct Response {
        let status: Int
        let body: [String: Any]
    }

    /// Loopback socket addresses as both daemons report them.
    static let loopbackAddresses: Set<String> = ["127.0.0.1", "::1", "::ffff:127.0.0.1"]

    /// Node's `readJsonBody` limit for this route.
    static let maxBodyBytes = 4 * 1024

    /// The `/integrations/zai` rule, for the same reason: credentials stay on
    /// the loopback interface, and the caller presents the pairing token as a
    /// bearer. Same-machine trust alone would let anything that reaches the
    /// port from this machine replace the network every board joins. The macOS
    /// app and `agentdeck wifi-setup` hold the token. Compared by Unicode
    /// scalar, as Node compares UTF-16 units: a grapheme comparison would fold
    /// a combining mark into the space before the token.
    static func authorized(
        remoteAddress: String?, authorization: String?, validateToken: (String) -> Bool
    ) -> Bool {
        guard let remoteAddress, loopbackAddresses.contains(remoteAddress) else { return false }
        let scheme = "Bearer ".unicodeScalars
        guard let authorization, authorization.unicodeScalars.starts(with: scheme) else { return false }
        let token = String(String.UnicodeScalarView(authorization.unicodeScalars.dropFirst(scheme.count)))
        return !token.isEmpty && validateToken(token)
    }

    /// The answer to a caller `authorized` refuses.
    static func refusal() -> Response { refuse(403, "local-token-required") }

    /// The request body as Node reads it: none is `{}`, and a body over the
    /// limit or one that is not JSON is nil (`invalid-body`). Any JSON value
    /// parses — `apply` refuses everything but an object. The bytes are decoded
    /// as UTF-8 with replacement first, and a leading BOM is not JSON, as
    /// `Buffer.toString` then `JSON.parse` treat them.
    static func parseBody(_ data: Data?) -> Any? {
        guard let data, !data.isEmpty else { return [String: Any]() }
        guard data.count <= maxBodyBytes else { return nil }
        let text = String(decoding: data, as: UTF8.self)
        guard text.unicodeScalars.first != "\u{FEFF}" else { return nil }
        return try? JSONSerialization.jsonObject(with: Data(text.utf8), options: [.fragmentsAllowed])
    }

    /// `GET /esp32/wifi`: what is configured and what each live serial board holds.
    static func status(_ deps: Deps) async -> Response {
        let config = deps.loadConfig()
        let expectedCredId = config.flatMap {
            ESP32WifiProvisionRules.credId(authToken: deps.authToken(), ssid: $0.ssid, password: $0.password)
        }
        let serial = await deps.serialRunning()
        let boards = serial ? await deps.boards(expectedCredId) : []
        return Response(status: 200, body: [
            "ok": true,
            "configured": config != nil,
            "ssid": config?.ssid ?? "",
            "autoProvision": config?.autoProvision ?? false,
            "serial": serial,
            "boards": boards.map(\.json),
        ])
    }

    /// `POST /esp32/wifi` with `{ssid, password, autoProvision?}`: check the
    /// credentials with the shared rule, save them (each board's device_info
    /// reads the saved config, so they apply without a restart), and send them
    /// to every live serial board as an operator request. `autoProvision`
    /// (default true) governs only the automatic sends that follow.
    static func apply(body: Any?, deps: Deps) async -> Response {
        guard let fields = body as? [String: Any] else { return refuse(400, "invalid-body") }
        let flag = fields["autoProvision"]
        if let flag, !isJSONBool(flag) { return refuse(400, "invalid-body") }
        let ssid = fields["ssid"] as? String ?? ""
        let password = fields["password"] as? String ?? ""
        if let problem = ESP32WifiProvisionRules.credentialsProblem(ssid: ssid, password: password) {
            return refuse(400, problem)
        }
        let autoProvision = (flag as? NSNumber)?.boolValue ?? true
        do {
            try deps.saveConfig(WifiConfig(ssid: ssid, password: password, autoProvision: autoProvision))
        } catch {
            return refuse(500, "save-failed")
        }
        var boards: [ESP32Serial.WifiProvisionOutcome] = []
        if await deps.serialRunning() {
            let msg = ESP32Serial.wifiProvisionMessage(
                ssid: ssid, password: password,
                bridgeIP: deps.bridgeIP(), bridgePort: deps.bridgePort, authToken: deps.authToken())
            boards = await deps.provision(SendableDict(msg), true)
        }
        return Response(status: 200, body: [
            "ok": true, "saved": true, "autoProvision": autoProvision, "boards": boards.map(\.json),
        ])
    }

    /// A decoded JSON `true` or `false`; a cast to `Bool` also accepts numbers.
    private static func isJSONBool(_ value: Any) -> Bool {
        guard let number = value as? NSNumber else { return false }
        return CFGetTypeID(number) == CFBooleanGetTypeID()
    }

    private static func refuse(_ status: Int, _ error: String) -> Response {
        Response(status: status, body: ["ok": false, "error": error])
    }
}
#endif
