import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isLocallyTrusted, localTrustVerdict, type LocalTrustEnvironment, type LocalTrustRequest } from '../local-trust.js';

const { environment, cases } = JSON.parse(readFileSync(
  fileURLToPath(new URL('../../local-trust-vectors.json', import.meta.url)), 'utf8',
)) as {
  environment: { port: number; localAddresses: string[]; hostNames: string[] };
  cases: Array<{ note: string; request: LocalTrustRequest; verdict: string }>;
};

const env: LocalTrustEnvironment = {
  port: environment.port,
  isLocalAddress: (ip) => environment.localAddresses.includes(ip),
  hostNames: environment.hostNames,
};

describe('local trust (shared vectors)', () => {
  it('has vectors for every verdict', () => {
    expect(new Set(cases.map((c) => c.verdict))).toEqual(new Set(['trusted', 'foreign-host', 'foreign-origin']));
  });
  for (const c of cases) {
    it(c.note, () => {
      expect(localTrustVerdict(c.request, env)).toBe(c.verdict);
      expect(isLocallyTrusted(c.request, env)).toBe(c.verdict === 'trusted');
    });
  }
});

describe('local trust environment', () => {
  it('asks isLocalAddress only about an IP origin, without brackets or zone', () => {
    const asked: string[] = [];
    const probe: LocalTrustEnvironment = { ...env, isLocalAddress: (ip) => { asked.push(ip); return true; } };
    localTrustVerdict({ method: 'POST', host: '127.0.0.1:9120', origin: 'http://[fe80::1%25en0]:9120' }, probe);
    localTrustVerdict({ method: 'POST', host: '127.0.0.1:9120', origin: 'http://localhost:9120' }, probe);
    expect(asked).toEqual(['fe80::1']);
  });

  it('accepts its own host names with or without .local', () => {
    const bare: LocalTrustEnvironment = { ...env, hostNames: ['studio-mac'] };
    expect(localTrustVerdict({ method: 'GET', host: 'Studio-Mac.local:9120' }, bare)).toBe('trusted');
    expect(localTrustVerdict({ method: 'GET', host: 'studio-mac:9120' }, bare)).toBe('trusted');
  });

  it('reads an empty host-name entry as no name', () => {
    const empty: LocalTrustEnvironment = { ...env, hostNames: ['', '.local'] };
    expect(localTrustVerdict({ method: 'GET', host: 'local:9120' }, empty)).toBe('foreign-host');
  });
});
