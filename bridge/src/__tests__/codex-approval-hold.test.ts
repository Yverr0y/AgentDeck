import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import type { ServerResponse } from 'http';
import { describe, expect, it, vi } from 'vitest';
import { codexApprovalDecisionBody, codexHoldReleasedBy } from '@agentdeck/shared';
import { CodexApprovalHolds } from '../codex-approval-hold.js';
import { isPendingRequest, passPending, registerPending, resolvePending } from '../permission-resolver.js';
import { CODEX_TERMINAL_EVENTS, buildCodexPermissionQuestion } from '../hook-codex-sessions.js';

const VECTORS = JSON.parse(readFileSync(
  fileURLToPath(new URL('../../../shared/codex-approval-hold-vectors.json', import.meta.url)), 'utf8')) as {
  decisions: Array<{ decision: string; body: unknown }>;
  capturedPermissionRequest: Record<string, unknown>;
  capturedQuestion: string;
};

describe('Codex approval hold in the Node daemon', () => {
  it('reads the captured request as the question devices show', () => {
    expect(buildCodexPermissionQuestion(VECTORS.capturedPermissionRequest)).toBe(VECTORS.capturedQuestion);
  });

  it('releases a hold on every event that ends a Codex turn here', () => {
    for (const event of CODEX_TERMINAL_EVENTS) expect(codexHoldReleasedBy(event)).toBe(true);
  });
});

describe('CodexApprovalHolds', () => {
  it('keeps one hold per session and reports a turn that ended under it', () => {
    const holds = new CodexApprovalHolds();
    const first = holds.begin('s1');
    expect(holds.requestIdFor('s1')).toBe(first);
    expect(holds.finish('s1', first, 'allow')).toBe('allow');
    expect(holds.requestIdFor('s1')).toBeUndefined();

    const second = holds.begin('s1');
    expect(holds.end('s1')).toBe(second);
    // The release itself arrives as a pass; the record says why.
    expect(holds.finish('s1', second, 'pass')).toBe('ended');
    expect(holds.end('s1')).toBeUndefined();
  });

  it('ignores a release for a hold it no longer owns', () => {
    const holds = new CodexApprovalHolds();
    const current = holds.begin('s1');
    expect(holds.finish('s1', 'stale-request', 'pass')).toBe('pass');
    expect(holds.requestIdFor('s1')).toBe(current);
  });
});

/** A held hook response, as the resolver sees one. */
function fakeResponse(): ServerResponse & { body?: string } {
  const res = {
    body: undefined as string | undefined,
    writeHead: vi.fn(),
    end: vi.fn((chunk?: string) => { res.body = chunk ?? ''; }),
  };
  return res as unknown as ServerResponse & { body?: string };
}

describe('permission resolver with the Codex decision format', () => {
  it('answers a device decision in the format the Codex hook prints', () => {
    const res = fakeResponse();
    const onResolved = vi.fn();
    registerPending('codex-req-allow', res, {
      sessionId: 's1', timeoutMs: 60_000, buildBody: codexApprovalDecisionBody, onResolved,
    });
    expect(resolvePending('codex-req-allow', 'deny')).toBe('s1');
    expect(JSON.parse(res.body ?? '')).toEqual(VECTORS.decisions.find((d) => d.decision === 'deny')?.body);
    expect(onResolved).toHaveBeenCalledWith('deny');
  });

  it('releases a hold early as an empty pass and tells its owner', () => {
    const res = fakeResponse();
    const onResolved = vi.fn();
    registerPending('codex-req-pass', res, {
      sessionId: 's1', timeoutMs: 60_000, buildBody: codexApprovalDecisionBody, onResolved,
    });
    expect(passPending('codex-req-pass')).toBe(true);
    expect(res.body).toBe('');
    expect(onResolved).toHaveBeenCalledWith('pass');
    expect(isPendingRequest('codex-req-pass')).toBe(false);
    expect(passPending('codex-req-pass')).toBe(false);
  });

  it('still times out to a pass', () => {
    vi.useFakeTimers();
    try {
      const res = fakeResponse();
      registerPending('codex-req-timeout', res, {
        sessionId: 's1', timeoutMs: 25_000, buildBody: codexApprovalDecisionBody,
      });
      vi.advanceTimersByTime(25_000);
      expect(res.body).toBe('');
      expect(isPendingRequest('codex-req-timeout')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
