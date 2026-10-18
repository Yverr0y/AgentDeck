// GENERATED FILE — DO NOT EDIT.
// Source of truth: shared/src/esp32-wifi-provision.ts
// Regenerate: pnpm generate-esp32-wifi-provision-rules (drift gated by shared/src/__tests__/esp32-wifi-provision-sync.test.ts)
#if os(macOS)
import CryptoKit
import Foundation

/// Whether a serial-attached ESP32 needs a `wifi_provision`, and the
/// credential id that lets a board with its radio parked say it already holds
/// these credentials (`device_info.wifiCredId`). Behaviour is pinned by
/// `shared/esp32-wifi-provision-vectors.json` (`ESP32WifiProvisionRulesTests`).
enum ESP32WifiProvisionRules {
    static let credIdDomain = "agentdeck-wifi-cred-v1"
    static let credIdHexLength = 16
    /// The board whose radio-up provision the Node daemon re-sends.
    static let endpointRefreshBoard = "ips_10"

    /// The id a provision carrying these credentials and this token sends: the
    /// first `credIdHexLength` lowercase hex characters of HMAC-SHA256, keyed
    /// by the token, over `domain NUL ssid NUL password` (all UTF-8). nil when
    /// any input is empty — such a provision carries no id.
    static func credId(authToken: String, ssid: String, password: String) -> String? {
        guard !authToken.isEmpty, !ssid.isEmpty, !password.isEmpty else { return nil }
        let message = credIdDomain + "\u{0}" + ssid + "\u{0}" + password
        let mac = HMAC<SHA256>.authenticationCode(
            for: Data(message.utf8), using: SymmetricKey(data: Data(authToken.utf8)))
        let hex = mac.map { String(format: "%02x", $0) }.joined()
        return String(hex.prefix(credIdHexLength))
    }

    /// One serial connection's latest `device_info`, and the id of the
    /// provision this daemon would send it.
    struct Input: Equatable {
        var connected: Bool
        var provisionSent: Bool
        var board: String?
        var wifiConfigured: Bool?
        var wifiConnected: Bool?
        var wifiRadioParked: Bool?
        /// "" = firmware that knows the field and stores no id; nil = older firmware.
        var wifiCredId: String?
        var expectedCredId: String?
        var refreshIps10Endpoint: Bool
    }

    struct Decision: Equatable {
        let send: Bool
        let reason: String
        /// Decided by the rule that predates the id: the caller may keep its own there.
        let legacy: Bool
    }

    static func decision(_ input: Input) -> Decision {
        if !input.connected { return Decision(send: false, reason: "not-connected", legacy: false) }
        guard let board = input.board, !board.isEmpty else {
            return Decision(send: false, reason: "unidentified", legacy: false)
        }
        if input.provisionSent { return Decision(send: false, reason: "already-sent", legacy: false) }
        if input.refreshIps10Endpoint, board == endpointRefreshBoard,
           input.wifiConnected == true, input.wifiRadioParked != true {
            return Decision(send: true, reason: "endpoint-refresh", legacy: false)
        }
        if input.wifiConnected == true { return Decision(send: false, reason: "wifi-connected", legacy: false) }
        if let reported = input.wifiCredId, let expected = input.expectedCredId, !expected.isEmpty {
            return reported == expected
                ? Decision(send: false, reason: "credentials-match", legacy: false)
                : Decision(send: true, reason: "credentials-differ", legacy: false)
        }
        return input.wifiConfigured == true
            ? Decision(send: false, reason: "legacy-configured", legacy: true)
            : Decision(send: true, reason: "legacy-unconfigured", legacy: true)
    }
}
#endif
