import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { readGitHead } from '../apme/git-head.js';
const roots: string[] = [];
const sha = 'a'.repeat(40);
function fixture(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'apme-head-')); roots.push(root);
  for (const [name, value] of Object.entries(files)) {
    const path = join(root, name); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, value);
  }
  return root;
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
describe('Git HEAD at the hook boundary', () => {
  it('reads loose refs from nested directories and observes subsequent changes', () => {
    const root = fixture({ '.git/HEAD': 'ref: refs/heads/main\n', '.git/refs/heads/main': sha });
    mkdirSync(join(root, 'nested/src'), { recursive: true });
    expect(readGitHead(join(root, 'nested/src'))).toBe(sha);
    writeFileSync(join(root, '.git/refs/heads/main'), 'b'.repeat(40));
    expect(readGitHead(root)).toBe('b'.repeat(40));
  });
  it('resolves worktree gitdir and commondir with packed refs', () => {
    const root = fixture({
      'worktree/.git': 'gitdir: ../repo/.git/worktrees/test\n',
      'repo/.git/worktrees/test/HEAD': 'ref: refs/heads/topic',
      'repo/.git/worktrees/test/commondir': '../..',
      'repo/.git/packed-refs': `# pack-refs with: peeled fully-peeled sorted\n${sha} refs/heads/topic\n`,
    });
    expect(readGitHead(join(root, 'worktree'))).toBe(sha);
  });
  it('accepts detached SHA-256 HEAD and keeps unreadable/unborn/looping refs unknown', () => {
    const root = fixture({ '.git/HEAD': 'c'.repeat(64) });
    expect(readGitHead(root)).toBe('c'.repeat(64));
    for (const head of ['ref: refs/heads/unborn', 'ref: refs/../outside', 'ref: refs/heads/loop']) {
      writeFileSync(join(root, '.git/HEAD'), head);
      mkdirSync(join(root, '.git/refs/heads'), { recursive: true });
      writeFileSync(join(root, '.git/refs/heads/loop'), 'ref: refs/heads/loop');
      expect(readGitHead(root)).toBeNull();
    }
    expect(readGitHead()).toBeNull();
  });
});
