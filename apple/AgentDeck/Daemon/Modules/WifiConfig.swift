#if os(macOS)
// WifiConfig.swift — WiFi credential management for ESP32 auto-provisioning.
//
// Persists user-supplied SSID/password for ESP32 firmware to consume during
// the first-boot handshake. Auto-detection of the current SSID and Keychain
// password lookup both required `networksetup` / `security` subprocesses,
// which are not allowed under Apple Review Guideline 2.5.2 — the
// ESP32ProvisionSheet asks the user to type both fields directly, and the
// daemon saves them through `POST /esp32/wifi` (ESP32WifiSetup.swift).

import Foundation

struct WifiConfig: Codable, Equatable, Sendable {
    let ssid: String
    let password: String
    var autoProvision: Bool = true

    init(ssid: String, password: String, autoProvision: Bool = true) {
        self.ssid = ssid
        self.password = password
        self.autoProvision = autoProvision
    }

    private enum CodingKeys: String, CodingKey { case ssid, password, autoProvision }

    /// Node parity (`loadWifiConfig`): anything but a literal `false` keeps
    /// auto-provisioning on, an absent key included.
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        ssid = try container.decode(String.self, forKey: .ssid)
        password = try container.decode(String.self, forKey: .password)
        autoProvision = (try? container.decodeIfPresent(Bool.self, forKey: .autoProvision)) ?? true
    }
}

private final class WifiConfigDataBox: @unchecked Sendable {
    private let lock = NSLock()
    private var data: Data?

    func set(_ data: Data?) {
        lock.lock()
        self.data = data
        lock.unlock()
    }

    func get() -> Data? {
        lock.lock()
        defer { lock.unlock() }
        return data
    }
}

/// The config as this process last read or wrote it. The daemon consults it on
/// every board's `device_info` and on every `/esp32/wifi` request, so it is
/// read from disk once; `save` keeps it current, which is what lets credentials
/// saved by the Wi-Fi sheet apply without a restart. Nothing else writes the
/// App Store container's file; a hand edit applies at the next daemon start.
private final class WifiConfigCache: @unchecked Sendable {
    private let lock = NSLock()
    private var loaded = false
    private var value: WifiConfig?

    func get() -> (loaded: Bool, value: WifiConfig?) {
        lock.lock()
        defer { lock.unlock() }
        return (loaded, value)
    }

    func set(_ value: WifiConfig?) {
        lock.lock()
        self.value = value
        loaded = true
        lock.unlock()
    }
}

enum WifiConfigManager {
    private static let configFile = AuthManager.agentDeckDir.appendingPathComponent("wifi-config.json")
    // .userInteractive: DaemonServer.startDeviceModules makes the first read
    // from the main actor and sync-waits via DispatchSemaphore. .userInitiated
    // still leaves a one-step inversion (User-interactive → User-initiated) that
    // TPC flags. The work is a single Data(contentsOf:) bounded by a 700 ms cap,
    // so the elevated QoS is justified for the main-actor critical path.
    private static let readQueue = DispatchQueue(label: "dev.agentdeck.wifi-config.read", qos: .userInteractive)
    private static let readTimeout: DispatchTimeInterval = .milliseconds(700)
    private static let cache = WifiConfigCache()

    /// The saved credentials, or nil when none are saved. Reads the file the
    /// first time only; a read that timed out is tried again on the next call.
    static func current() -> WifiConfig? {
        let cached = cache.get()
        if cached.loaded { return cached.value }
        guard let read = readFromDisk() else { return nil }
        cache.set(read)
        return read
    }

    /// The file's config, `.some(nil)` when there is none, or nil when the read
    /// did not finish in time.
    private static func readFromDisk() -> WifiConfig?? {
        let box = WifiConfigDataBox()
        let semaphore = DispatchSemaphore(value: 0)
        readQueue.async {
            box.set(try? Data(contentsOf: configFile))
            semaphore.signal()
        }
        guard semaphore.wait(timeout: .now() + readTimeout) == .success else {
            DaemonLogger.shared.debug("WifiConfig", "Read timed out; treating as unconfigured")
            return nil
        }

        guard let data = box.get(),
              let config = try? JSONDecoder().decode(WifiConfig.self, from: data),
              !config.ssid.isEmpty, !config.password.isEmpty else { return .some(nil) }
        return .some(config)
    }

    static func save(_ config: WifiConfig) throws {
        try FileManager.default.createDirectory(at: AuthManager.agentDeckDir, withIntermediateDirectories: true)
        let data = try JSONEncoder.pretty.encode(config)
        try data.write(to: configFile, options: .atomic)
        try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: configFile.path)
        cache.set(config)
    }

    /// SSID auto-detection is unavailable in the App Store build; the
    /// provisioning sheet prompts the user for the SSID.
    static func detectCurrentSSID() -> String? { nil }

    /// Keychain password lookup is unavailable in the App Store build; the
    /// provisioning sheet prompts the user for the password.
    static func getKeychainPassword(ssid: String) -> String? {
        _ = ssid
        return nil
    }
}
#endif
