#!/usr/bin/env node
// Generate the mirrors of the ESP32 WiFi provisioning rules:
//   shared/src/esp32-wifi-provision.ts
//     → apple/AgentDeck/Daemon/Modules/ESP32WifiProvisionRules.generated.swift
//       (the decision and the credential id, via CryptoKit)
//     → esp32/src/net/wifi_cred_id.generated.h
//       (the id's length and what a board may store; firmware never computes one)
//
//   pnpm generate-esp32-wifi-provision-rules            regenerate the mirrors
//   pnpm generate-esp32-wifi-provision-rules --check    exit 1 if one drifted
//
// Requires shared to be built first (`pnpm build`), since the CLI reads the
// constants from shared/dist. The vitest sync test
// (shared/src/__tests__/esp32-wifi-provision-sync.test.ts) imports the emitters
// against the TS source, so drift is caught in CI even when this CLI is never
// run. Behaviour is pinned by shared/esp32-wifi-provision-vectors.json, which
// the shared, bridge and Swift suites replay.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const str = (v) => JSON.stringify(v);

export function rulesFrom(mod) {
  return {
    domain: mod.WIFI_CRED_ID_DOMAIN,
    hexLength: mod.WIFI_CRED_ID_HEX_LENGTH,
    refreshBoard: mod.WIFI_PROVISION_ENDPOINT_REFRESH_BOARD,
  };
}

export function emitSwift(rules) {
  return `// GENERATED FILE — DO NOT EDIT.
// Source of truth: shared/src/esp32-wifi-provision.ts
// Regenerate: pnpm generate-esp32-wifi-provision-rules (drift gated by shared/src/__tests__/esp32-wifi-provision-sync.test.ts)
#if os(macOS)
import CryptoKit
import Foundation

/// Whether a serial-attached ESP32 needs a \`wifi_provision\`, and the
/// credential id that lets a board with its radio parked say it already holds
/// these credentials (\`device_info.wifiCredId\`). Behaviour is pinned by
/// \`shared/esp32-wifi-provision-vectors.json\` (\`ESP32WifiProvisionRulesTests\`).
enum ESP32WifiProvisionRules {
    static let credIdDomain = ${str(rules.domain)}
    static let credIdHexLength = ${rules.hexLength}
    /// The board whose radio-up provision the Node daemon re-sends.
    static let endpointRefreshBoard = ${str(rules.refreshBoard)}

    /// The id a provision carrying these credentials and this token sends: the
    /// first \`credIdHexLength\` lowercase hex characters of HMAC-SHA256, keyed
    /// by the token, over \`domain NUL ssid NUL password\` (all UTF-8). nil when
    /// any input is empty — such a provision carries no id.
    static func credId(authToken: String, ssid: String, password: String) -> String? {
        guard !authToken.isEmpty, !ssid.isEmpty, !password.isEmpty else { return nil }
        let message = credIdDomain + "\\u{0}" + ssid + "\\u{0}" + password
        let mac = HMAC<SHA256>.authenticationCode(
            for: Data(message.utf8), using: SymmetricKey(data: Data(authToken.utf8)))
        let hex = mac.map { String(format: "%02x", $0) }.joined()
        return String(hex.prefix(credIdHexLength))
    }

    /// One serial connection's latest \`device_info\`, and the id of the
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
`;
}

export function emitCpp(rules) {
  return `// GENERATED FILE — DO NOT EDIT.
// Source of truth: shared/src/esp32-wifi-provision.ts
// Regenerate: pnpm generate-esp32-wifi-provision-rules (drift gated by shared/src/__tests__/esp32-wifi-provision-sync.test.ts)
#pragma once
#include <stddef.h>

// The credential id a \`wifi_provision\` carries (\`credId\`). Opaque here: the
// board never computes one, it only remembers which provision its stored
// credentials came from and reports it back as \`device_info.wifiCredId\`.
namespace WifiCredId {

// Hex characters in an id the daemon sends; the store is sized for this.
constexpr size_t HEX_LENGTH = ${rules.hexLength};

// A storable id: 1..HEX_LENGTH lowercase hex digits. Anything else is
// refused, and the caller treats it like a provision that carried no id.
inline bool valid(const char* id) {
    if (id == nullptr || id[0] == '\\0') return false;
    for (size_t i = 0; id[i] != '\\0'; i++) {
        if (i >= HEX_LENGTH) return false;
        const char c = id[i];
        if (!((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f'))) return false;
    }
    return true;
}

}  // namespace WifiCredId
`;
}

export const OUTPUTS = [
  ['apple/AgentDeck/Daemon/Modules/ESP32WifiProvisionRules.generated.swift', emitSwift],
  ['esp32/src/net/wifi_cred_id.generated.h', emitCpp],
];

async function main() {
  let mod;
  try {
    mod = await import(path.join(projectDir, 'shared/dist/esp32-wifi-provision.js'));
  } catch (err) {
    console.error(`shared/dist is missing — run \`pnpm build\` first (${err.message})`);
    process.exit(1);
  }
  const rules = rulesFrom(mod);
  const check = process.argv.includes('--check');
  let drifted = false;
  for (const [rel, emit] of OUTPUTS) {
    const abs = path.join(projectDir, rel);
    const next = emit(rules);
    const prev = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
    if (check) {
      if (prev !== next) {
        console.error(`DRIFT: ${rel}`);
        drifted = true;
      }
    } else if (prev !== next) {
      fs.writeFileSync(abs, next);
      console.log(`wrote ${rel}`);
    } else {
      console.log(`up-to-date ${rel}`);
    }
  }
  if (check) {
    console.log(drifted ? 'ESP32 WiFi provision mirrors DRIFTED' : 'ESP32 WiFi provision mirrors in sync');
    process.exit(drifted ? 1 : 0);
  }
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) await main();
