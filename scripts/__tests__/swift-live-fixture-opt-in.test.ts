import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('Swift live replay fixture opt-in', () => {
  it('refuses before contacting a daemon unless visible fixture creation is explicit', () => {
    const result = spawnSync(
      process.execPath,
      ['scripts/verify-swift-codex-live.mjs', '--port', '1', '--pid', '2', '--app', '/missing/AgentDeck.app'],
      { encoding: 'utf8' },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Refusing to create visible test sessions');
    expect(result.stderr).not.toContain('fetch failed');
  });
});
