/**
 * Claude status-line relay inside BridgeCore: a reading feeds the gauge as a
 * live subscription reading, OAuth-only fields ride along for a bounded time,
 * the OAuth poll stands down while the reading is fresh, and a broadcast goes
 * out only for a repaint-worthy change. Rules: shared/src/claude-statusline.ts.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createServer } from 'http';
import { BridgeCore } from '../bridge-core.js';
import { WsTestClient } from './helpers/ws-test-client.js';
import { createTempDataDir, type TempDataDir } from './helpers/temp-data-dir.js';
import type { UsageEvent } from '../types.js';
import type { ApiUsageData } from '../usage-api.js';
import type { ClaudeStatuslineReading } from '@agentdeck/shared';

const MIN = 60_000;

function oauthUsage(overrides: Partial<ApiUsageData> = {}): ApiUsageData {
  return {
    fiveHourPercent: 35,
    fiveHourResetsAt: new Date(Date.now() + 3 * 3600_000).toISOString(),
    sevenDayPercent: 12,
    sevenDayResetsAt: new Date(Date.now() + 5 * 24 * 3600_000).toISOString(),
    extraUsageEnabled: true,
    extraUsageMonthlyLimit: 100,
    extraUsageUsedCredits: 12.5,
    extraUsageUtilization: 12.5,
    scopedLimits: [{ kind: 'weekly_scoped', label: 'Fable', percent: 61, active: true }] as ApiUsageData['scopedLimits'],
    inferredBillingType: 'subscription',
    ...overrides,
  };
}

function reading(overrides: Partial<ClaudeStatuslineReading> = {}): ClaudeStatuslineReading {
  return {
    fiveHour: { usedPercent: 23.5, resetsAt: new Date(Date.now() + 2 * 3600_000).toISOString() },
    sevenDay: { usedPercent: 41.2, resetsAt: new Date(Date.now() + 4 * 24 * 3600_000).toISOString() },
    sessionId: 'abc123',
    model: 'claude-opus-5-5',
    version: '2.1.300',
    receivedAt: Date.now(),
    ...overrides,
  };
}

describe('BridgeCore × Claude status-line relay', () => {
  let core: BridgeCore;
  let httpServer: ReturnType<typeof createServer>;
  let port: number;
  let tempDir: TempDataDir;

  beforeEach(async () => {
    tempDir = createTempDataDir();
    httpServer = createServer();
    await new Promise<void>((resolve) => { httpServer.listen(0, '127.0.0.1', () => resolve()); });
    const addr = httpServer.address();
    port = typeof addr === 'object' && addr ? addr.port : 0;
    core = new BridgeCore({ port, projectName: 'StatuslineTest', httpServer });
    // A session bridge gates account quota on a Claude model (the daemon hub
    // passes aggregateSubscriptionQuota instead); name one so the numbers show.
    core.stateMachine.handleParserEvent('model_info', { model: 'claude-opus-5-5' });
  });

  afterEach(async () => {
    core.wsServer.close();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
      setTimeout(resolve, 500);
    });
    tempDir.cleanup();
  });

  it('a reading feeds the gauge as a live subscription reading', () => {
    const r = reading();
    expect(core.applyClaudeStatusline(r)).toEqual({ broadcast: true });
    const usage = core.buildUsage() as UsageEvent;
    expect(usage.fiveHourPercent).toBeCloseTo(23.5, 1);
    expect(usage.sevenDayPercent).toBeCloseTo(41.2, 1);
    expect(usage.fiveHourResetsAt).toBe(r.fiveHour?.resetsAt);
    expect(usage.usageStale).toBe(false);
    expect(usage.subscriptions?.some((s) => s.name === 'Claude')).toBe(true);
    expect(core.claudeUsageSource).toBe('statusline');
    expect(core.lastApiFetchTime).toBe(r.receivedAt);
    expect(core.claudeUsageDiagnostics()).toMatchObject({
      source: 'statusline', statuslineAge: 'fresh', statuslineSession: 'abc123',
    });
  });

  it('OAuth-only fields ride along from a recent OAuth reading and drop after 30 minutes', () => {
    core.updateApiUsage(oauthUsage());
    expect(core.claudeUsageSource).toBe('oauth');
    core.applyClaudeStatusline(reading());
    let usage = core.buildUsage() as UsageEvent;
    expect(usage.scopedLimits?.[0]?.label).toBe('Fable');
    expect(usage.extraUsageEnabled).toBe(true);
    expect(usage.fiveHourPercent).toBeCloseTo(23.5, 1);

    core.lastOAuthFetchTime = Date.now() - 31 * MIN;
    core.applyClaudeStatusline(reading({ fiveHour: { usedPercent: 30, resetsAt: null } }));
    usage = core.buildUsage() as UsageEvent;
    expect(usage.scopedLimits).toBeUndefined();
    expect(usage.extraUsageEnabled).toBe(false);
    expect(usage.fiveHourPercent).toBeCloseTo(30, 1);
  });

  it('an OAuth reading arriving while the status line is fresh refreshes the scoped caps and keeps the live numbers', () => {
    core.applyClaudeStatusline(reading());
    core.updateApiUsage(oauthUsage({ fiveHourPercent: 49, sevenDayPercent: 23 }));
    let usage = core.buildUsage() as UsageEvent;
    expect(usage.fiveHourPercent).toBeCloseTo(23.5, 1);
    expect(usage.sevenDayPercent).toBeCloseTo(41.2, 1);
    expect(usage.scopedLimits?.[0]?.label).toBe('Fable');
    expect(usage.usageStale).toBe(false);
    expect(core.claudeUsageSource).toBe('statusline');
    expect(core.lastOAuthFetchTime).toBeGreaterThan(0);

    // A fallback (not fresh) OAuth result changes nothing and does not retire the reading.
    expect(core.applyUsageResult({ data: oauthUsage({ fiveHourPercent: 99 }), fresh: false })).toBe(false);
    usage = core.buildUsage() as UsageEvent;
    expect(usage.fiveHourPercent).toBeCloseTo(23.5, 1);
    expect(usage.usageStale).toBe(false);
    expect(core.applyUsageResult(null)).toBe(false);
    expect((core.buildUsage() as UsageEvent).usageStale).toBe(false);

    // Once the reading has aged, OAuth is the source again and its numbers show.
    core.claudeStatusline = { ...core.claudeStatusline!, receivedAt: Date.now() - 6 * MIN };
    core.updateApiUsage(oauthUsage({ fiveHourPercent: 49, sevenDayPercent: 23 }));
    usage = core.buildUsage() as UsageEvent;
    expect(usage.fiveHourPercent).toBe(49);
    expect(core.claudeUsageSource).toBe('oauth');
  });

  it('broadcasts on the first reading and on a repaint-worthy change only', () => {
    const spy = vi.spyOn(core, 'broadcastUsage');
    const r = reading();
    core.applyClaudeStatusline(r);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(core.applyClaudeStatusline({ ...r, receivedAt: Date.now() })).toEqual({ broadcast: false });
    expect(spy).toHaveBeenCalledTimes(1);
    core.applyClaudeStatusline({ ...r, fiveHour: { ...r.fiveHour!, usedPercent: 24.5 }, receivedAt: Date.now() });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('OAuth poll decision: a fresh reading suppresses, one baseline read is owed, scoped caps keep a slow refresh, an aged reading resumes', () => {
    expect(core.shouldPollClaudeOAuth()).toBe(true);
    core.applyClaudeStatusline(reading());
    expect(core.shouldPollClaudeOAuth()).toBe(true);
    core.updateApiUsage(oauthUsage({ scopedLimits: [] }));
    expect(core.shouldPollClaudeOAuth()).toBe(false);
    core.updateApiUsage(oauthUsage());
    expect(core.shouldPollClaudeOAuth()).toBe(false);
    core.lastOAuthFetchTime = Date.now() - 11 * MIN;
    expect(core.shouldPollClaudeOAuth()).toBe(true);
    core.lastOAuthFetchTime = Date.now();
    core.claudeStatusline = { ...core.claudeStatusline!, receivedAt: Date.now() - 6 * MIN };
    expect(core.shouldPollClaudeOAuth()).toBe(true);
  });

  it('poll ticks skip the fetch while a reading is fresh and count the suppression', async () => {
    const client = new WsTestClient();
    await client.connect(`ws://127.0.0.1:${port}`);
    try {
      const fetchFn = vi.fn(async () => ({ data: oauthUsage({ scopedLimits: [] }), fresh: true }));
      core.applyClaudeStatusline(reading());
      core.updateApiUsage(oauthUsage({ scopedLimits: [] }));
      core.startApiUsagePolling(10, fetchFn);
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(fetchFn).not.toHaveBeenCalled();
      expect(core.oauthPollsSuppressed).toBeGreaterThan(0);
      expect(core.claudeUsageDiagnostics()).toMatchObject({ oauthPollSuppressed: true });

      core.claudeStatusline = { ...core.claudeStatusline!, receivedAt: Date.now() - 6 * MIN };
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(fetchFn).toHaveBeenCalled();
      expect(core.oauthPollsAttempted).toBeGreaterThan(0);
    } finally {
      await client.close();
    }
  });

  it('every ad-hoc refresh goes through the same gate and the same counters', async () => {
    const fetchFn = vi.fn(async () => ({ data: oauthUsage({ scopedLimits: [] }), fresh: true }));
    core.refreshClaudeUsageIfAllowed(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(core.oauthPollsAttempted).toBe(1);
    await new Promise((resolve) => setTimeout(resolve, 10));

    core.applyClaudeStatusline(reading());
    core.refreshClaudeUsageIfAllowed(fetchFn);
    core.refreshClaudeUsageIfAllowed(fetchFn);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(core.oauthPollsSuppressed).toBe(2);
    expect(core.claudeUsageSource).toBe('statusline');
  });

  it('fetchUsageIfStale defers to the status line while it is fresh', async () => {
    const spy = vi.spyOn(core, 'fetchAndUpdateUsage').mockResolvedValue(true);
    core.applyClaudeStatusline(reading());
    core.updateApiUsage(oauthUsage({ scopedLimits: [] }));
    core.lastApiFetchTime = Date.now() - 6 * MIN;
    await core.fetchUsageIfStale();
    expect(spy).not.toHaveBeenCalled();
    core.claudeStatusline = { ...core.claudeStatusline!, receivedAt: Date.now() - 6 * MIN };
    await core.fetchUsageIfStale();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
