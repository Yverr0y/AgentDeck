/**
 * `GET /esp32/wifi` and `POST /esp32/wifi`: the WiFi credentials this daemon
 * hands to serial-attached ESP32 boards, read and set by the operator.
 *
 * Before these routes a daemon learned the credentials only from a file it read
 * at startup (`agentdeck wifi-setup` wrote `~/.agentdeck/wifi-config.json` and
 * said "applies on next restart"), and the macOS app had no way at all: its
 * Wi-Fi sheet wrote a `wifi.config` frame straight to the serial port, which no
 * firmware has ever parsed, and nothing in the app saved credentials for its
 * own daemon. Both daemons serve these routes in one wire shape, because the
 * app calls whichever daemon holds the port (the Swift twin is in
 * DaemonServer.swift).
 *
 * Never served: the password, and a board's credential id, which with the
 * pairing token tests password guesses offline. The credentials never cross
 * the LAN, and arriving from this machine is not enough to read or change
 * them ({@link wifiSetupAuthorized}).
 */
import { wifiCredentialsProblem, type WifiCredentialsProblem } from '@agentdeck/shared';
import type { WifiProvisionMessage } from '@agentdeck/shared/protocol';
import type { WifiProvisionOutcome, WifiSetupBoardRow } from './esp32-serial.js';
import { buildWifiProvision, wifiCredId } from './esp32-wifi-cred.js';
import type { WifiConfig } from './wifi-config.js';

/** What the routes read and drive; the daemon wires the real ones. */
export interface WifiSetupDeps {
  loadConfig(): WifiConfig | null;
  /** Throws when the file cannot be written. */
  saveConfig(config: WifiConfig): void;
  /** Whether this daemon runs the serial channel at all (a `--local` one does not). */
  serialRunning(): boolean;
  boards(expectedCredId: string | null): WifiSetupBoardRow[];
  provision(msg: WifiProvisionMessage, opts: { manual: boolean }): WifiProvisionOutcome[];
  authToken(): string;
  bridgeIp(): string;
  bridgePort: number;
}

export interface WifiSetupResponse {
  status: number;
  body: Record<string, unknown>;
}

export type WifiSetupError = WifiCredentialsProblem | 'invalid-body' | 'save-failed' | 'local-token-required';

/** Loopback socket addresses as both daemons report them. */
export const WIFI_SETUP_LOOPBACK_ADDRESSES: readonly string[] = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

/**
 * The `/integrations/zai` rule, for the same reason: credentials stay on the
 * loopback interface, and the caller presents the pairing token as a bearer.
 * Same-machine trust alone would let anything that reaches the port from this
 * machine replace the network every board joins. The macOS app and
 * `agentdeck wifi-setup` hold the token. (A local process can still read it
 * from `/health`: same-machine trust is not closed by construction.)
 */
export function wifiSetupAuthorized(
  remoteAddress: string | undefined,
  authorization: string | string[] | undefined,
  validateToken: (token: string) => boolean,
): boolean {
  if (!remoteAddress || !WIFI_SETUP_LOOPBACK_ADDRESSES.includes(remoteAddress)) return false;
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) return false;
  const token = authorization.slice('Bearer '.length);
  return token !== '' && validateToken(token);
}

/** The answer to a caller {@link wifiSetupAuthorized} refuses. */
export function wifiSetupRefusal(): WifiSetupResponse {
  return refuse(403, 'local-token-required');
}

/** `GET /esp32/wifi`: what is configured and what each live serial board holds. */
export function wifiSetupStatus(deps: WifiSetupDeps): WifiSetupResponse {
  const config = deps.loadConfig();
  const expectedCredId = config ? wifiCredId(deps.authToken(), config.ssid, config.password) : null;
  const serial = deps.serialRunning();
  return {
    status: 200,
    body: {
      ok: true,
      configured: config !== null,
      ssid: config?.ssid ?? '',
      autoProvision: config?.autoProvision ?? false,
      serial,
      boards: serial ? deps.boards(expectedCredId) : [],
    },
  };
}

/**
 * `POST /esp32/wifi` with `{ssid, password, autoProvision?}`: check the
 * credentials with the shared rule, save them (the daemon reads the file again
 * on the next board's device_info, so they apply without a restart), and send
 * them to every live serial board as an operator request. `autoProvision`
 * (default true) governs only the automatic sends that follow.
 */
export function applyWifiSetup(body: unknown, deps: WifiSetupDeps): WifiSetupResponse {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return refuse(400, 'invalid-body');
  const fields = body as Record<string, unknown>;
  if (fields.autoProvision !== undefined && typeof fields.autoProvision !== 'boolean') {
    return refuse(400, 'invalid-body');
  }
  const ssid = typeof fields.ssid === 'string' ? fields.ssid : '';
  const password = typeof fields.password === 'string' ? fields.password : '';
  const problem = wifiCredentialsProblem(ssid, password);
  if (problem) return refuse(400, problem);
  const autoProvision = fields.autoProvision !== false;
  try {
    deps.saveConfig({ ssid, password, autoProvision });
  } catch {
    return refuse(500, 'save-failed');
  }
  const boards = deps.serialRunning()
    ? deps.provision(buildWifiProvision({
      ssid,
      password,
      bridgeIp: deps.bridgeIp(),
      bridgePort: deps.bridgePort,
      authToken: deps.authToken(),
    }), { manual: true })
    : [];
  return { status: 200, body: { ok: true, saved: true, autoProvision, boards } };
}

function refuse(status: number, error: WifiSetupError): WifiSetupResponse {
  return { status, body: { ok: false, error } };
}
