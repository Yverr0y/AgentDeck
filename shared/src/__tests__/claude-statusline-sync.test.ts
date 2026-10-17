// Drift gate for the generated Claude status-line rule mirror
// (shared/src/claude-statusline.ts → Swift). A hand edit to the generated
// file, or a skipped `pnpm generate-claude-statusline-rules`, fails here.
// Behaviour stays pinned by shared/claude-statusline-vectors.json, which both
// suites replay.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as rulesMod from '../claude-statusline.js';
import { OUTPUTS, rulesFrom } from '../../../scripts/generate-claude-statusline-rules.mjs';

const repoRoot = fileURLToPath(new URL('../../..', import.meta.url));
const rules = rulesFrom(rulesMod);

describe('generated Claude status-line rule mirror in sync', () => {
  for (const [rel, emit] of OUTPUTS) {
    it(`${rel} matches the SSOT`, () => {
      expect(readFileSync(`${repoRoot}${rel}`, 'utf8')).toBe(emit(rules));
    });
  }

  it('emitter embeds the SSOT constants', () => {
    const swift = OUTPUTS[0][1](rules);
    expect(swift).toContain(`static let route = ${JSON.stringify(rulesMod.CLAUDE_STATUSLINE_ROUTE)}`);
    expect(swift).toContain(`static let freshMs: Double = ${rulesMod.CLAUDE_STATUSLINE_FRESH_MS}`);
    expect(swift).toContain(`static let oauthCarryOverMs: Double = ${rulesMod.CLAUDE_OAUTH_CARRY_OVER_MS}`);
    expect(swift).toContain(`static let oauthScopedRefreshMs: Double = ${rulesMod.CLAUDE_OAUTH_SCOPED_REFRESH_MS}`);
    expect(swift).toContain(`static let changeEpsilon: Double = ${rulesMod.CLAUDE_STATUSLINE_CHANGE_EPSILON}`);
    expect(swift).toContain(`static let msThreshold: Double = ${rulesMod.CLAUDE_STATUSLINE_MS_THRESHOLD}`);
    expect(swift).toContain(`static let sessionLimit: Int = ${rulesMod.CLAUDE_STATUSLINE_SESSION_LIMIT}`);
    expect(swift).toContain(`static let relayedSessionUsageFields: [String] = ${JSON.stringify(rulesMod.RELAYED_SESSION_USAGE_FIELDS)}`);
  });

  it('the Swift suite replays the shared vector file (grep the test wiring)', () => {
    const swiftTest = readFileSync(`${repoRoot}apple/AgentDeckTests/ClaudeStatuslineRulesTests.swift`, 'utf8');
    expect(swiftTest).toContain('shared/claude-statusline-vectors.json');
    expect(swiftTest).toContain('cases("accept")');
  });
});
