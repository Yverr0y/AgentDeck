#!/usr/bin/env node
// Generate the Swift evaluator of the same-machine trust rule:
//   shared/src/local-trust.ts
//     → apple/AgentDeck/Daemon/Server/LocalTrustRules.generated.swift
//
//   pnpm generate-local-trust-rules            regenerate the mirror
//   pnpm generate-local-trust-rules --check    exit 1 if it drifted
//
// Requires shared to be built first (`pnpm build`). The vitest sync test
// (shared/src/__tests__/local-trust-sync.test.ts) imports the emitter against
// the TS source, so drift is caught in CI even when this CLI is never run.
// Behaviour is pinned by shared/local-trust-vectors.json, which both suites
// replay. The daemon's inputs (its addresses, host name and port) and the
// refusal log stay in the hand-written LocalTrust.swift beside it, as they do
// in bridge/src/auth.ts.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function swiftString(value) {
  if (!/^[\x20-\x7e]*$/.test(value) || /["\\]/.test(value)) throw new Error(`cannot embed ${value} in a Swift string`);
  return `"${value}"`;
}

export function rulesFrom(mod) {
  return {
    safeMethods: [...mod.LOCAL_TRUST_SAFE_METHODS],
    defaultPorts: Object.entries(mod.LOCAL_TRUST_DEFAULT_PORTS),
    fileOrigin: mod.LOCAL_TRUST_FILE_ORIGIN,
  };
}

export function emitSwift(rules) {
  const methods = rules.safeMethods.map(swiftString).join(', ');
  const ports = rules.defaultPorts.map(([scheme, port]) => `${swiftString(scheme)}: ${Number(port)}`).join(', ');
  return `// GENERATED FILE — DO NOT EDIT.
// Source of truth: shared/src/local-trust.ts
// Regenerate: pnpm generate-local-trust-rules (drift gated by shared/src/__tests__/local-trust-sync.test.ts)
import Foundation

/// Whether a same-machine request may skip the pairing token: a web page in a
/// browser here connects from 127.0.0.1 like a local program, and only its
/// \`Host\` and \`Origin\` tell them apart. \`Host\` must name this machine; on a
/// WebSocket upgrade or a method that changes state, \`Origin\` must be absent,
/// the daemon's own origin, or \`file://\`. The reasoning is in the TS source;
/// behaviour is pinned by \`shared/local-trust-vectors.json\`
/// (\`LocalTrustVectorsTests\`).
enum LocalTrustRules {
    enum Verdict: String, Sendable {
        case trusted
        case foreignHost = "foreign-host"
        case foreignOrigin = "foreign-origin"
    }

    struct Environment: Sendable {
        /// The port this server listens on, which its own pages' origin carries.
        let port: Int
        /// Whether an IP literal (no brackets, no zone) is one of this
        /// machine's addresses, loopback included.
        let isLocalAddress: @Sendable (String) -> Bool
        /// This machine's host names, in any case, with or without \`.local\`.
        let hostNames: [String]
    }

    /// Methods that do not change state; a browser sends no \`Origin\` on a same-origin GET or HEAD.
    static let safeMethods: Set<String> = [${methods}]
    /// The port an origin names when it names none.
    static let defaultPorts: [String: Int] = [${ports}]
    /// The literal \`Origin\` the ESP32 WebSocket library sends; a browser never sends it.
    static let fileOrigin = ${swiftString(rules.fileOrigin)}

    /// Whether a same-machine request may skip the pairing token, and why not.
    static func verdict(
        method: String, upgrade: Bool, origin: String?, host: String?, environment env: Environment
    ) -> Verdict {
        let host = host?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !host.isEmpty && !hostIsThisMachine(host, env) { return .foreignHost }
        let method = method.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        guard upgrade || !safeMethods.contains(method) else { return .trusted }
        let origin = origin?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if origin.isEmpty || origin.lowercased() == fileOrigin { return .trusted }
        return isOwnOrigin(origin, env) ? .trusted : .foreignOrigin
    }

    private struct Authority {
        /// Lower case, without brackets or a trailing dot.
        let host: String
        /// Digits, or "" when the authority names no port.
        let port: String
    }

    /// Split \`host[:port]\` or \`[ipv6][:port]\`; nil when it is neither.
    private static func splitAuthority(_ authority: String) -> Authority? {
        let text = authority.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        var host: String
        var port = ""
        if text.hasPrefix("[") {
            guard let close = text.firstIndex(of: "]") else { return nil }
            host = String(text[text.index(after: text.startIndex)..<close])
            let rest = text[text.index(after: close)...]
            if !rest.isEmpty {
                guard rest.hasPrefix(":") else { return nil }
                port = String(rest.dropFirst())
            }
        } else if let colon = text.firstIndex(of: ":") {
            let afterColon = text[text.index(after: colon)...]
            if afterColon.contains(":") {
                // More than one colon: a bare IPv6 literal, which names no port.
                host = text
            } else {
                host = String(text[..<colon])
                port = String(afterColon)
            }
        } else {
            host = text
        }
        if host.hasSuffix(".") { host.removeLast() }
        guard !host.isEmpty, port.isEmpty || isAsciiDigits(port, maxCount: 5) else { return nil }
        return Authority(host: host, port: port)
    }

    private static func isAsciiDigits<S: StringProtocol>(_ text: S, maxCount: Int) -> Bool {
        !text.isEmpty && text.count <= maxCount && text.allSatisfy { ("0"..."9").contains($0) }
    }

    /// An IPv4 dotted quad, or an IPv6 literal with or without a zone.
    private static func isIpLiteral(_ host: String) -> Bool {
        let octets = host.split(separator: ".", omittingEmptySubsequences: false)
        if octets.count == 4, octets.allSatisfy({ isAsciiDigits($0, maxCount: 3) }) {
            return octets.allSatisfy { (Int($0) ?? 256) <= 255 }
        }
        let address = withoutZone(host)
        return address.contains(":") && address.allSatisfy { "0123456789abcdef:.".contains($0) }
    }

    private static func withoutZone(_ host: String) -> String {
        guard let percent = host.firstIndex(of: "%") else { return host }
        return String(host[..<percent])
    }

    private static func hostIsThisMachine(_ header: String, _ env: Environment) -> Bool {
        guard let authority = splitAuthority(header) else { return false }
        // A browser reaches an IP literal without DNS, so rebinding cannot produce one.
        return isIpLiteral(authority.host) || isThisMachineName(authority.host, env)
    }

    private static func isThisMachineName(_ host: String, _ env: Environment) -> Bool {
        if host == "localhost" || host.hasSuffix(".localhost") { return true }
        for raw in env.hostNames {
            guard let name = splitAuthority(raw)?.host else { continue }
            let bare = name.hasSuffix(".local") ? String(name.dropLast(".local".count)) : name
            if !bare.isEmpty && (host == bare || host == bare + ".local") { return true }
        }
        return false
    }

    private static func isOwnOrigin(_ origin: String, _ env: Environment) -> Bool {
        guard let separator = origin.range(of: "://") else { return false }
        let scheme = origin[..<separator.lowerBound].lowercased()
        guard isScheme(scheme), let defaultPort = defaultPorts[scheme] else { return false }
        // A browser never sends a path; a trailing slash from a non-browser
        // client is tolerated, since host and port still have to be this daemon's.
        var rest = origin[separator.upperBound...]
        if rest.hasSuffix("/") { rest = rest.dropLast() }
        guard !rest.contains(where: { "/?#@".contains($0) }),
              let authority = splitAuthority(String(rest)) else { return false }
        let port = authority.port.isEmpty ? defaultPort : (Int(authority.port) ?? -1)
        guard port == env.port else { return false }
        // An IP literal must be this machine's: any address with the daemon's
        // port would admit a page served from another host's server on that port.
        if isIpLiteral(authority.host) { return env.isLocalAddress(withoutZone(authority.host)) }
        return isThisMachineName(authority.host, env)
    }

    private static func isScheme(_ scheme: String) -> Bool {
        guard let first = scheme.first, ("a"..."z").contains(first) else { return false }
        return scheme.allSatisfy { ("a"..."z").contains($0) || ("0"..."9").contains($0) || "+.-".contains($0) }
    }
}
`;
}

export const OUTPUTS = [
  ['apple/AgentDeck/Daemon/Server/LocalTrustRules.generated.swift', emitSwift],
];

async function main() {
  let mod;
  try {
    mod = await import(path.join(projectDir, 'shared/dist/local-trust.js'));
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
      if (prev !== next) { console.error(`DRIFT: ${rel}`); drifted = true; }
    } else if (prev !== next) {
      fs.writeFileSync(abs, next);
      console.log(`wrote ${rel}`);
    } else {
      console.log(`up-to-date ${rel}`);
    }
  }
  if (check) {
    console.log(drifted ? 'local trust rules mirror DRIFTED' : 'local trust rules mirror in sync');
    process.exit(drifted ? 1 : 0);
  }
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) await main();
