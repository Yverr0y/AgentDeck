import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  WIFI_CRED_ID_DOMAIN,
  WIFI_CRED_ID_HEX_LENGTH,
  wifiCredIdComputable,
  wifiCredIdMessage,
  wifiProvisionDecision,
  type WifiProvisionDecision,
  type WifiProvisionInput,
} from '../esp32-wifi-provision.js';

const VECTORS = JSON.parse(readFileSync(
  fileURLToPath(new URL('../../esp32-wifi-provision-vectors.json', import.meta.url)), 'utf8')) as {
  domain: string;
  hexLength: number;
  credIds: Array<{ name: string; token: string; ssid: string; password: string; credId: string | null }>;
  decisionDefaults: WifiProvisionInput;
  decisions: Array<{ name: string; input: Partial<WifiProvisionInput> } & WifiProvisionDecision>;
};

describe('ESP32 WiFi provision rules (shared vectors)', () => {
  it('names the id the way both HMAC implementations compute it', () => {
    expect(WIFI_CRED_ID_DOMAIN).toBe(VECTORS.domain);
    expect(WIFI_CRED_ID_HEX_LENGTH).toBe(VECTORS.hexLength);
    expect(wifiCredIdMessage('ssid', 'pw')).toBe(`${VECTORS.domain}\u0000ssid\u0000pw`);
  });

  for (const v of VECTORS.credIds) {
    it(`id inputs: ${v.name}`, () => {
      expect(wifiCredIdComputable(v.token, v.ssid, v.password)).toBe(v.credId !== null);
      if (v.credId !== null) expect(v.credId).toMatch(new RegExp(`^[0-9a-f]{${VECTORS.hexLength}}$`));
    });
  }

  it('the separator keeps the SSID/password boundary', () => {
    expect(wifiCredIdMessage('ab', 'c')).not.toBe(wifiCredIdMessage('a', 'bc'));
  });

  for (const v of VECTORS.decisions) {
    it(`decision: ${v.name}`, () => {
      expect(wifiProvisionDecision({ ...VECTORS.decisionDefaults, ...v.input }))
        .toEqual({ send: v.send, reason: v.reason, legacy: v.legacy });
    });
  }

  it('every reason the decision can give is pinned by a vector', () => {
    const reasons = new Set(VECTORS.decisions.map((v) => v.reason));
    for (const reason of [
      'not-connected', 'unidentified', 'already-sent', 'endpoint-refresh', 'wifi-connected',
      'credentials-match', 'credentials-differ', 'legacy-configured', 'legacy-unconfigured',
    ]) expect(reasons).toContain(reason);
  });
});
