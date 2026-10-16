import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { createServer, type Server } from 'node:http';
import { spawn } from 'node:child_process';
import {
  STATUSLINE_RELAY_MARKER,
  buildStatuslineRelayCommand,
  isAgentDeckStatuslineCommand,
  unwrapStatuslineCommand,
  applyStatuslineRelay,
  removeStatuslineRelay,
  refreshStatuslineRelay,
  statuslinePolicyFromEnv,
  installHooks,
  uninstallHooks,
  migrateHooksIfNeeded,
  claudeSettingsPaths,
} from '../install.js';

const RELAY_POST = `curl -sf --connect-timeout 0.2 --max-time 0.8 -X POST "http://127.0.0.1:$PORT/claude/statusline" -H 'Content-Type: application/json' -H "X-AgentDeck-Pid: $PPID" -d @- >/dev/null 2>&1 || true`;
const USER_STATUSLINE = "bun x ccusage statusline --visual-burn-rate emoji && echo 'done'";

function tempHome(): string {
  return mkdtempSync(join(tmpdir(), 'agentdeck-statusline-'));
}

/**
 * Run a shell command with a stdin document and collect its stdout — without
 * blocking the event loop, because the daemon the snippet talks to is an HTTP
 * server in this same process (an `execFileSync` here would starve it, the
 * `/health` probe would time out, and the relay would fall back to port 9120 —
 * the real daemon on a developer's machine).
 */
function runShell(command: string, input: string, env: NodeJS.ProcessEnv): Promise<{ stdout: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn('/bin/sh', ['-c', command], { env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    child.stdout.setEncoding('utf-8');
    child.stdout.on('data', (chunk: string) => { stdout += chunk; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ stdout, code }));
    child.stdin.end(input);
  });
}

function readSettings(home: string): any {
  return JSON.parse(readFileSync(claudeSettingsPaths(home).settings, 'utf-8'));
}

describe('Claude status-line relay snippet', () => {
  it('relay alone: bounded fire-and-forget POST, no AGENTDECK_PORT, no wrapped command', () => {
    const cmd = buildStatuslineRelayCommand();
    expect(cmd).toContain(STATUSLINE_RELAY_MARKER);
    expect(cmd).not.toContain('AGENTDECK_PORT');
    expect(cmd).toContain(RELAY_POST);
    expect(cmd).toContain('--connect-timeout 0.2 --max-time 0.3 "http://127.0.0.1:$P/health"');
    expect(cmd.trimEnd().endsWith('|| true')).toBe(true);
    expect(isAgentDeckStatuslineCommand(cmd)).toBe(true);
    expect(unwrapStatuslineCommand(cmd)).toBe('');
  });

  it.each([
    ['~/.claude/statusline.sh'],
    [USER_STATUSLINE],
    ['input=$(cat)\nMODEL=$(echo "$input" | jq -r \'.model.display_name\')\necho "[$MODEL]"'],
    ['  npx -y ccstatusline@latest  \n'],
  ])('wraps the user command verbatim (trimmed) and unwraps it back: %s', (original) => {
    const cmd = buildStatuslineRelayCommand(original);
    expect(cmd).toContain(`${RELAY_POST}\nprintf '%s' "$I" | {\n${original.trim()}\n}`);
    expect(unwrapStatuslineCommand(cmd)).toBe(original.trim());
    expect(buildStatuslineRelayCommand(unwrapStatuslineCommand(cmd))).toBe(cmd);
  });

  it('a foreign command is not ours', () => {
    expect(isAgentDeckStatuslineCommand('~/.claude/statusline.sh')).toBe(false);
    expect(unwrapStatuslineCommand('~/.claude/statusline.sh')).toBeNull();
    expect(unwrapStatuslineCommand(42)).toBeNull();
    expect(unwrapStatuslineCommand(undefined)).toBeNull();
  });

  it('every co-owned writer carries the same relay POST line and header', () => {
    const root = process.cwd();
    for (const path of ['hooks/src/install.ts', 'setup/src/setup.ts', 'apple/AgentDeck/Daemon/Core/HookInstaller.swift']) {
      const source = readFileSync(join(root, path), 'utf-8');
      expect(source, path).toContain(RELAY_POST);
      expect(source, path).toContain('# AgentDeck status-line relay v1');
      expect(source, path).toContain(`printf '%s' "$I" | {`);
    }
  });
});

describe('applyStatuslineRelay policy', () => {
  it('auto wraps a status line the user already has, keeping its other keys', () => {
    const settings: any = { statusLine: { type: 'command', command: USER_STATUSLINE, padding: 0 } };
    const result = applyStatuslineRelay(settings, 'auto', 'darwin');
    expect(result).toEqual({ installed: true, wrapped: true });
    expect(settings.statusLine.type).toBe('command');
    expect(settings.statusLine.padding).toBe(0);
    expect(unwrapStatuslineCommand(settings.statusLine.command)).toBe(USER_STATUSLINE);
  });

  it('auto installs nothing when no status line is configured, and says why', () => {
    const settings: any = { hooks: {} };
    const result = applyStatuslineRelay(settings, 'auto', 'darwin');
    expect(result.installed).toBe(false);
    expect(result.reason).toContain('--statusline');
    expect(settings.statusLine).toBeUndefined();
  });

  it('on installs the relay alone when no status line is configured', () => {
    const settings: any = {};
    expect(applyStatuslineRelay(settings, 'on', 'darwin')).toEqual({ installed: true, wrapped: false });
    expect(settings.statusLine).toEqual({ type: 'command', command: buildStatuslineRelayCommand() });
  });

  it('off removes an installed relay, restoring the user command, and leaves a foreign slot alone', () => {
    const foreign: any = { statusLine: { type: 'command', command: USER_STATUSLINE } };
    expect(applyStatuslineRelay(foreign, 'off', 'darwin')).toMatchObject({ installed: false });
    expect(foreign.statusLine.command).toBe(USER_STATUSLINE);

    const ours: any = { statusLine: { type: 'command', command: USER_STATUSLINE, padding: 0 } };
    applyStatuslineRelay(ours, 'auto', 'darwin');
    const result = applyStatuslineRelay(ours, 'off', 'darwin');
    expect(result.installed).toBe(false);
    expect(result.reason).toContain('removed');
    expect(ours.statusLine).toEqual({ type: 'command', command: USER_STATUSLINE, padding: 0 });

    const alone: any = {};
    applyStatuslineRelay(alone, 'on', 'darwin');
    applyStatuslineRelay(alone, 'off', 'darwin');
    expect(alone.statusLine).toBeUndefined();
  });

  it('a relay the user opted into earlier survives a later auto install', () => {
    const settings: any = {};
    applyStatuslineRelay(settings, 'on', 'darwin');
    const once = settings.statusLine.command;
    expect(applyStatuslineRelay(settings, 'auto', 'darwin')).toEqual({ installed: true, wrapped: false });
    expect(settings.statusLine.command).toBe(once);
  });

  it('applying twice is idempotent', () => {
    const settings: any = { statusLine: { type: 'command', command: USER_STATUSLINE } };
    applyStatuslineRelay(settings, 'auto', 'darwin');
    const once = settings.statusLine.command;
    applyStatuslineRelay(settings, 'auto', 'darwin');
    expect(settings.statusLine.command).toBe(once);
  });

  it('leaves a statusLine it does not understand untouched', () => {
    const asString: any = { statusLine: 'weird' };
    expect(applyStatuslineRelay(asString, 'on', 'darwin').installed).toBe(false);
    expect(asString.statusLine).toBe('weird');
    const noCommand: any = { statusLine: { type: 'command' } };
    expect(applyStatuslineRelay(noCommand, 'on', 'darwin').installed).toBe(false);
    expect(noCommand.statusLine).toEqual({ type: 'command' });
  });

  it('is POSIX-only for now', () => {
    const settings: any = { statusLine: { type: 'command', command: USER_STATUSLINE } };
    const result = applyStatuslineRelay(settings, 'on', 'win32');
    expect(result.installed).toBe(false);
    expect(settings.statusLine.command).toBe(USER_STATUSLINE);
  });

  it('removeStatuslineRelay restores the user command verbatim and drops a relay-only slot', () => {
    const wrapped: any = { statusLine: { type: 'command', command: USER_STATUSLINE, padding: 1 } };
    applyStatuslineRelay(wrapped, 'auto', 'darwin');
    expect(removeStatuslineRelay(wrapped)).toBe(true);
    expect(wrapped.statusLine).toEqual({ type: 'command', command: USER_STATUSLINE, padding: 1 });

    const alone: any = {};
    applyStatuslineRelay(alone, 'on', 'darwin');
    expect(removeStatuslineRelay(alone)).toBe(true);
    expect(alone.statusLine).toBeUndefined();

    const foreign: any = { statusLine: { type: 'command', command: USER_STATUSLINE } };
    expect(removeStatuslineRelay(foreign)).toBe(false);
    expect(foreign.statusLine.command).toBe(USER_STATUSLINE);
  });

  it('refreshStatuslineRelay rewrites an outdated relay and nothing else', () => {
    const outdated = buildStatuslineRelayCommand(USER_STATUSLINE)
      .replace('# AgentDeck status-line relay v1', '# AgentDeck status-line relay v0');
    const settings: any = { statusLine: { type: 'command', command: outdated } };
    expect(refreshStatuslineRelay(settings)).toBe(true);
    expect(settings.statusLine.command).toBe(buildStatuslineRelayCommand(USER_STATUSLINE));
    expect(refreshStatuslineRelay(settings)).toBe(false);
    const foreign: any = { statusLine: { type: 'command', command: USER_STATUSLINE } };
    expect(refreshStatuslineRelay(foreign)).toBe(false);
    expect(refreshStatuslineRelay({})).toBe(false);
  });

  it('reads the policy from AGENTDECK_STATUSLINE', () => {
    expect(statuslinePolicyFromEnv({})).toBe('auto');
    expect(statuslinePolicyFromEnv({ AGENTDECK_STATUSLINE: '1' })).toBe('on');
    expect(statuslinePolicyFromEnv({ AGENTDECK_STATUSLINE: 'ON' })).toBe('on');
    expect(statuslinePolicyFromEnv({ AGENTDECK_STATUSLINE: '0' })).toBe('off');
    expect(statuslinePolicyFromEnv({ AGENTDECK_STATUSLINE: 'maybe' })).toBe('auto');
  });
});

describe.skipIf(process.platform === 'win32')('file-system wrappers', () => {
  const homes: string[] = [];
  afterEach(() => { for (const h of homes.splice(0)) rmSync(h, { recursive: true, force: true }); });

  it('installHooks wraps an existing status line; uninstallHooks restores it', () => {
    const home = tempHome(); homes.push(home);
    const { dir, settings } = claudeSettingsPaths(home);
    mkdirSync(dir, { recursive: true });
    writeFileSync(settings, JSON.stringify({ statusLine: { type: 'command', command: USER_STATUSLINE } }));

    installHooks(home);
    const installed = readSettings(home);
    expect(unwrapStatuslineCommand(installed.statusLine.command)).toBe(USER_STATUSLINE);
    expect(installed.hooks.SessionStart).toBeDefined();

    uninstallHooks(home);
    const restored = readSettings(home);
    expect(restored.statusLine).toEqual({ type: 'command', command: USER_STATUSLINE });
    expect(restored.hooks).toBeUndefined();
  });

  it('installHooks adds a relay-only status line on request and keeps it on later auto installs', () => {
    const home = tempHome(); homes.push(home);
    installHooks(home);
    expect(readSettings(home).statusLine).toBeUndefined();

    installHooks(home, { statusline: 'on' });
    const relay = readSettings(home).statusLine;
    expect(relay).toEqual({ type: 'command', command: buildStatuslineRelayCommand() });

    installHooks(home);
    expect(readSettings(home).statusLine).toEqual(relay);

    uninstallHooks(home);
    expect(readSettings(home).statusLine).toBeUndefined();
  });

  it('migrateHooksIfNeeded refreshes an outdated relay but never installs one', () => {
    const home = tempHome(); homes.push(home);
    installHooks(home);
    migrateHooksIfNeeded(home);
    expect(readSettings(home).statusLine).toBeUndefined();

    const path = claudeSettingsPaths(home).settings;
    const current = JSON.parse(readFileSync(path, 'utf-8'));
    current.statusLine = {
      type: 'command',
      command: buildStatuslineRelayCommand(USER_STATUSLINE).replace('relay v1', 'relay v0'),
    };
    writeFileSync(path, JSON.stringify(current, null, 2));
    migrateHooksIfNeeded(home);
    expect(readSettings(home).statusLine.command).toBe(buildStatuslineRelayCommand(USER_STATUSLINE));
  });
});

describe.skipIf(process.platform === 'win32')('the relay snippet, executed', () => {
  let server: Server | null = null;
  const homes: string[] = [];
  afterEach(async () => {
    for (const h of homes.splice(0)) rmSync(h, { recursive: true, force: true });
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = null;
  });

  it('POSTs the stdin document to the daemon named by daemon.json and still runs the wrapped command on the same stdin', async () => {
    const received: Array<{ path: string; body: string; pid: string | undefined }> = [];
    server = createServer((req, res) => {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        received.push({ path: req.url ?? '', body, pid: req.headers['x-agentdeck-pid'] as string | undefined });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(req.method === 'GET' ? '{"status":"ok"}' : '{"received":true}');
      });
    });
    await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as { port: number }).port;

    const home = tempHome(); homes.push(home);
    mkdirSync(join(home, '.agentdeck'), { recursive: true });
    writeFileSync(join(home, '.agentdeck', 'daemon.json'), JSON.stringify({ port }));

    const document = JSON.stringify({
      session_id: 'abc123', version: '2.1.300', model: { id: 'claude-opus-5-5' },
      rate_limits: { five_hour: { used_percentage: 23.5, resets_at: 1738425600 } },
    });
    const wrapped = `printf 'wrapped:%s' "$(cat | wc -c | tr -d ' ')"`;
    const { stdout, code } = await runShell(buildStatuslineRelayCommand(wrapped), document, { ...process.env, HOME: home });

    expect(code).toBe(0);
    expect(stdout).toBe(`wrapped:${Buffer.byteLength(document)}`);
    expect(received.map((r) => r.path)).toEqual(['/health', '/claude/statusline']);
    expect(received[1].body).toBe(document);
    expect(Number(received[1].pid)).toBeGreaterThan(1);
    expect(existsSync(join(home, '.agentdeck', 'daemon.json'))).toBe(true);
  });
});
