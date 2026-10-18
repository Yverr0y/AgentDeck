#if os(macOS)
import Foundation
import XCTest
@testable import AgentDeck

/// Replays shared/esp32-wifi-provision-vectors.json against the generated
/// `ESP32WifiProvisionRules` (CryptoKit), so this daemon sends the same
/// credential id and reaches the same provisioning decision as the Node daemon
/// (shared and bridge suites replay the same file).
final class ESP32WifiProvisionRulesTests: XCTestCase {
    private func vectors() throws -> [String: Any] {
        let root = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
            .deletingLastPathComponent().deletingLastPathComponent()
        let data = try Data(contentsOf: root.appendingPathComponent("shared/esp32-wifi-provision-vectors.json"))
        return try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
    }

    func testConstantsMatchTheVectorFile() throws {
        let file = try vectors()
        XCTAssertEqual(ESP32WifiProvisionRules.credIdDomain, file["domain"] as? String)
        XCTAssertEqual(ESP32WifiProvisionRules.credIdHexLength, file["hexLength"] as? Int)
    }

    func testCredIdVectors() throws {
        let cases = try XCTUnwrap(try vectors()["credIds"] as? [[String: Any]])
        XCTAssertFalse(cases.isEmpty)
        for vector in cases {
            let name = vector["name"] as? String ?? "?"
            let actual = ESP32WifiProvisionRules.credId(
                authToken: try XCTUnwrap(vector["token"] as? String, name),
                ssid: try XCTUnwrap(vector["ssid"] as? String, name),
                password: try XCTUnwrap(vector["password"] as? String, name))
            // A JSON null reads as nil here: no id.
            XCTAssertEqual(actual, vector["credId"] as? String, name)
        }
    }

    func testDecisionVectors() throws {
        let file = try vectors()
        let defaults = try XCTUnwrap(file["decisionDefaults"] as? [String: Any])
        let cases = try XCTUnwrap(file["decisions"] as? [[String: Any]])
        XCTAssertFalse(cases.isEmpty)
        for vector in cases {
            let name = vector["name"] as? String ?? "?"
            let overrides = try XCTUnwrap(vector["input"] as? [String: Any], name)
            let fields = defaults.merging(overrides) { _, override in override }
            let input = ESP32WifiProvisionRules.Input(
                connected: try XCTUnwrap(fields["connected"] as? Bool, name),
                provisionSent: try XCTUnwrap(fields["provisionSent"] as? Bool, name),
                board: fields["board"] as? String,
                wifiConfigured: fields["wifiConfigured"] as? Bool,
                wifiConnected: fields["wifiConnected"] as? Bool,
                wifiRadioParked: fields["wifiRadioParked"] as? Bool,
                wifiCredId: fields["wifiCredId"] as? String,
                expectedCredId: fields["expectedCredId"] as? String,
                refreshIps10Endpoint: fields["refreshIps10Endpoint"] as? Bool ?? false)
            let decision = ESP32WifiProvisionRules.decision(input)
            XCTAssertEqual(decision.send, vector["send"] as? Bool, name)
            XCTAssertEqual(decision.reason, vector["reason"] as? String, name)
            XCTAssertEqual(decision.legacy, vector["legacy"] as? Bool, name)
        }
    }

    func testProvisionCarriesTheIdOfItsOwnToken() throws {
        let cases = try XCTUnwrap(try vectors()["credIds"] as? [[String: Any]])
        let vector = try XCTUnwrap(cases.first)
        let token = try XCTUnwrap(vector["token"] as? String)
        let ssid = try XCTUnwrap(vector["ssid"] as? String)
        let password = try XCTUnwrap(vector["password"] as? String)
        let msg = ESP32Serial.wifiProvisionMessage(
            ssid: ssid, password: password, bridgeIP: "192.168.1.50", bridgePort: 9120, authToken: token)
        XCTAssertEqual(msg["type"] as? String, "wifi_provision")
        XCTAssertEqual(msg["authToken"] as? String, token)
        XCTAssertEqual(msg["credId"] as? String, vector["credId"] as? String)
        // No token, no id: the board clears its own on receipt.
        let tokenless = ESP32Serial.wifiProvisionMessage(
            ssid: ssid, password: password, bridgeIP: "192.168.1.50", bridgePort: 9120, authToken: "")
        XCTAssertNil(tokenless["credId"])
    }

    func testInputIsTheConnectionsOwnReport() {
        let credId = "4fbb066b2801b4ae"
        let parked = ESP32Serial.DeviceInfo(
            board: "t_embed", wifiConfigured: false, wifiConnected: false,
            wifiRadioParked: true, wifiCredId: credId)
        let input = ESP32Serial.wifiProvisionInput(
            connected: true, provisionSent: false, deviceInfo: parked, expectedCredId: credId)
        XCTAssertFalse(input.refreshIps10Endpoint)
        XCTAssertEqual(ESP32WifiProvisionRules.decision(input).reason, "credentials-match")
        // WiFi credentials are not written to a tty no board has identified on.
        let unidentified = ESP32Serial.wifiProvisionInput(
            connected: true, provisionSent: false, deviceInfo: nil, expectedCredId: credId)
        XCTAssertEqual(ESP32WifiProvisionRules.decision(unidentified).reason, "unidentified")
    }

    func testLegacyDecisionsKeepThisDaemonsFingerprintRule() {
        typealias Decision = ESP32WifiProvisionRules.Decision
        // Old firmware or no id to offer: once per port per credential set,
        // whatever the board says about saved credentials.
        let legacyConfigured = Decision(send: false, reason: "legacy-configured", legacy: true)
        XCTAssertTrue(ESP32Serial.shouldSendWifiProvision(legacyConfigured, legacyFingerprintSent: false))
        XCTAssertFalse(ESP32Serial.shouldSendWifiProvision(legacyConfigured, legacyFingerprintSent: true))
        // An id decision stands on its own.
        let match = Decision(send: false, reason: "credentials-match", legacy: false)
        XCTAssertFalse(ESP32Serial.shouldSendWifiProvision(match, legacyFingerprintSent: false))
        let differ = Decision(send: true, reason: "credentials-differ", legacy: false)
        XCTAssertTrue(ESP32Serial.shouldSendWifiProvision(differ, legacyFingerprintSent: true))
    }
}
#endif
