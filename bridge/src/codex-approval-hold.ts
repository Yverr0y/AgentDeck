/**
 * Open Codex device-approval holds — the Node daemon's half of the opt-in
 * `PermissionRequest` hold. What a hold request means, when one is held, how
 * long, what the hook prints and which events end it are shared rules in
 * shared/src/codex-approval-hold.ts (Swift: the generated
 * `CodexApprovalHoldRules` plus the `.codexApproval` gate in
 * `ObservedSteering`). This registry only remembers, per Codex session, the
 * hold a device can answer and whether its turn ended under it.
 */
import { randomUUID } from 'crypto';
import type { CodexApprovalOutcome } from '@agentdeck/shared';
import type { PermissionDecision } from './permission-resolver.js';

interface OpenHold {
  requestId: string;
  ended: boolean;
}

/** Open holds by Codex session id. */
export class CodexApprovalHolds {
  private readonly bySession = new Map<string, OpenHold>();

  begin(sessionId: string): string {
    const requestId = randomUUID();
    this.bySession.set(sessionId, { requestId, ended: false });
    return requestId;
  }

  requestIdFor(sessionId: string): string | undefined {
    return this.bySession.get(sessionId)?.requestId;
  }

  /** The session's turn ended under the hold. Returns the hold to release. */
  end(sessionId: string): string | undefined {
    const open = this.bySession.get(sessionId);
    if (!open) return undefined;
    open.ended = true;
    return open.requestId;
  }

  /** Drop the hold once released; reports how it ended. */
  finish(sessionId: string, requestId: string, decision: PermissionDecision): CodexApprovalOutcome {
    const open = this.bySession.get(sessionId);
    if (open?.requestId !== requestId) return decision;
    this.bySession.delete(sessionId);
    return open.ended ? 'ended' : decision;
  }
}
