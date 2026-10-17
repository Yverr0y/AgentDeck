# AgentDeck × 외부 리서치 클레임 크로스체크 — 2026-10-16

기준: master @ c773e23b, read-only grep 기반. 각 항목 = implemented / partial / absent + 증거(file:line).

---

## 1. Claude usage 소스 — **implemented (OAuth endpoint), status-line JSON은 부분(managed 전용 텍스트 파싱), `rate_limit_event`는 absent**

- **쿼터의 유일한 1차 소스는 미공개 OAuth endpoint**: `bridge/src/usage-api.ts:9` — `const USAGE_API_URL = 'https://api.anthropic.com/api/oauth/usage'`.
- **토큰 획득**: macOS = Keychain service `Claude Code-credentials`를 `security` CLI로 읽음(`usage-api.ts:10`, `:227` "Read the macOS Keychain OAuth blob via the `security` CLI"); Windows/Linux = Claude Code가 쓴 `<configDir>/.credentials.json`(`usage-api.ts:224`).
- **Swift(앱스토어)는 relay 전용**: 같은 URL 상수가 있으나(`apple/AgentDeck/Daemon/Core/UsageAPIClient.swift:113`) `static let directOAuthUsageSupported = false`(`:118`)가 하드코딩돼 직접 fetch가 막혀 있음(`:229` guard). 외부 Node daemon이 relay한 값/공유 캐시만 소비.
- **hook payload는 쿼터를 나르지 않음**: 설치된 hook 이벤트는 lifecycle 위주(아래 4번 목록) — usage 필드 없음.
- **`rate_limit_event`(headless 경고) 소비: absent** — 전 repo grep 0건.
- **status-line `rate_limits` JSON(five_hour/seven_day used_percentage) 파싱: absent**. 대신 legacy managed-PTY 관측자가 **`/usage` 명령 텍스트 출력**을 정규식으로 파싱: `bridge/src/output-parser.ts:57-64` — `USAGE_PERCENT = /(\d+)%\s*used/`, `USAGE_COST`, `USAGE_RESET_TIME/DATE`, `USAGE_SESSION_PERCENT`(5/3 hour limit). JSON이 아니라 사람용 텍스트이고 managed 호환 경로에서만 동작.

## 2. Codex usage 소스 — **implemented (양쪽 다)**

- **passive rollout JSONL**: `bridge/src/codex-rate-limits.ts:9-19` — 매 `token_count` 라인의 `rate_limits` 스냅샷을 `~/.codex/sessions/**/rollout-*.jsonl`에서 역방향 스캔. "no Codex/OpenAI API is contacted".
- **live app-server RPC**: `bridge/src/codex-rate-limits-live.ts:10` "Active Codex rate-limit read via the local `codex app-server` JSON-RPC", `:393` — `{ jsonrpc: '2.0', id: …, method: 'account/rateLimits/read', params: {} }` 를 stdio로 spawn해 물음(30s throttle, mid-turn skip, 백오프). Node daemon 전용(Swift는 spawn 불가).
- **Swift native HTTPS**: `apple/AgentDeck/Daemon/Core/UsageAPIClient.swift:1290` — `https://chatgpt.com/backend-api/wham/usage` 를 30초마다 GET(사용자 승인 `~/.codex` 폴더 자격증명, redirect 거부, 로그 금지 — `.claude/rules/usage-quota.md` "The endpoint follows Codex's upstream implementation and is not a public, versioned OpenAI API contract").

## 3. Presence — **partial (idle/lock 감지는 implemented, 그러나 용도가 디스플레이 슬립; 프레즌스 파일·푸시 억제는 absent)**

- `CLAUDE_CLIENT_PRESENCE_FILE`: **absent** — grep 0건.
- **Mac 잠금/유휴 감지: implemented** — `bridge/src/display-monitor.ts:202-241`: ioreg의 `CGSSessionScreenIsLocked`를 `parseIoregPresence`로 읽고(unlock 시 키가 사라지는 macOS 동작까지 처리), `screenLocked`/`screensaverActive`/`sessionInactive`/`displayAsleepByCG|ByPower` 컴포넌트로 구성. 용도는 **display-sleep 계약**(모든 기기 표면의 페인트 초크포인트)이지 푸시 억제가 아님.
- **덱 터치로 폰 푸시 억제: absent** — 애초에 클라우드/푸시 채널이 없음(전 기기 LAN WS; 알림도 명시적 행위 때만 on-device 요청 — appstore-feature-matrix guided-first-use 행).

## 4. Hook을 승인 endpoint로 쓰는가 — **Claude: implemented (PreToolUse HTTP hold), Codex: notify-only**

- **Claude**: `PermissionRequest` hook 타입은 쓰지 않음. 대신 **PreToolUse를 request-response로 잡아 deploy가 응답을 최대 60초 들고 있는다**: `hooks/src/install.ts:84-92` — "PreToolUse is request-response: the daemon may hold the connection open and…" + `curl … /hooks/PreToolUse … --max-time 60`; Swift 동일(`apple/AgentDeck/Daemon/Core/HookInstaller.swift:306-311`). 기기의 답은 `permission_decision {requestId, decision}`으로 held hook을 해소(`bridge/src/daemon-server.ts:6542` 핸들러, `apple/AgentDeck/Daemon/Session/ObservedSteering.swift:11` "until a device answers `permission_decision` or the hold…"). AskUserQuestion은 같은 hold 메커니즘의 ask-gate(`bridge/src/ask-gate.ts`). 보조 경로: `Notification(permission_prompt)` 표시 전용 + 예측기(`shared/src/claude-permission-rules.ts` 생성 SSOT — "Claude가 실제로 물을 것 같을 때만" hold) + 터미널 키 주입(`agentdeck inject-test`, `docs/cli.md`).
- **설치 이벤트 목록**(이름만): `install.ts:29-38` / `HookInstaller.swift:17-19` — SessionStart, SessionEnd, PreToolUse, PostToolUse, PostToolUseFailure, Stop, Notification, UserPromptSubmit, SubagentStart, SubagentStop, TaskCompleted, TeammateIdle.
- **Codex**: 결정을 반환하지 않는 notify-only — `hooks/src/codex-install.ts:216-226` — `PermissionRequest`→`codex_permission_request`(matcher `'*'`, "fires only when Codex is ABOUT TO ASK"), `Interrupt`→`codex_interrupt`(0.151+ 3초 경성 한계, `:241-242` `timeout = Interrupt ? 3 : 5`). allow/deny 결정 왕복은 없고 턴 종료/표시만.

## 5. Cursor — **absent (언급 0건); 정체성 귀결은 "Claude Code"**

- repo 전체에서 Cursor(에디터) 언급 0건 — `bridge/src/state-machine.ts:78` 등의 `cursorIndex/cursorAuthority`는 터미널 커서 상태(옵션 네비게이션)임.
- 사용자 전역 `~/.claude/settings.json` hook은 어떤 호스트에서 `claude` 프로세스가 돌든 발화하므로, Cursor가 Claude Code 엔진을 물리고 있다면 그 세션은 정상적으로 `claude-code` 행으로 관측됨(`X-AgentDeck-Pid: $PPID` 상위 프로세스 추적 포함).
- `shared/src/hook-harness.ts`의 귀결 규칙: Codex 전용 증거(Codex thread key, notify `agent-turn-complete`, rollout `transcript_path`)만 Codex로 보내고, 나머지 Claude 어휘 payload는 무조건 unprefixed endpoint에서도 Claude로 수렴 — **model/provider 문자열은 결코 정체성 증거가 아님**(`claude-glm`은 Claude). 즉 Cursor 호스트 여부를 구분하는 축은 없고, Cursor 자체 에이전트(비 Claude Code)는 보이지 않음.

## 6. Gemini CLI / Copilot CLI / Antigravity — **Gemini·Copilot: absent / Antigravity: partial (hook 없는 수동 관측)**

- `gemini`, `copilot`: bridge/src·hooks/·setup/ 설치자·파서 0건.
- **Antigravity**: hook/installer 없음. Node daemon `bridge/src/passive-observer.ts`의 프로세스 수동 발견만; App Store 앱은 세션 관측 불가·usage/plan 표시만(`docs/appstore-feature-matrix.md` "Antigravity | Node passive observer | App-only session observation remains unavailable; usage display is a separate capability"; plan 표기 규칙 `.claude/rules/usage-quota.md` — `AGY Pro`/tier만, 크레딧 원수 숨김).

## 7. MCP — **partial (Dot 루프백 MCP 호스트만, dev 전용; 범용 MCP 서버는 absent)**

- 범용 MCP 서버(Elgato "MCP Deck"·어시스턴트용 노출) 없음 — `mcpServers` 서버 구현 0건.
- 존재하는 것: ① **Dot direct loopback MCP 호스트** — `services/dot-relay/` + `shared/src/dot-rules.ts`(계약 생성), `DotOAuth.swift`(루프백 OAuth) — 단 **Store 빌드에서 컴파일 제외**(`.claude/rules/apple-release.md` "Dot is development-only in both Apple targets"). ② z.ai MCP tool-call 사용량 창 라벨(`usage-quota.md` TIME_LIMIT=monthly MCP). ③ Claude permission 규칙의 MCP 툴 허용 문법(`shared/src/claude-permission-rules.ts`).

## 8. ACP (Agent Client Protocol) — **partial (Kiro transcript reader가 ACP 레코드 형식만 인식; 자체 채택은 없음)**

- `bridge/src/kiro-diagnostics.ts:16,334-338` — `KiroDiagnosticFormat = 'v2'|'v3'|'acp'|…`, ACP 판별 = `session/prompt` / `session/notification` 레코드 종류; `bridge/src/kiro-session.ts:189`, `passive-observer.ts:1139`("A Kiro IDE parent with a kiro-cli/ACP child").
- 즉 ACP는 **Kiro의 디스크 저장소 관측 소스 형식**으로만 등장. AgentDeck 자신이 ACP 서버/클라이언트가 되는 코드, 다른 에이전트의 ACP 채택은 없음.

## 9. 폰에서의 원격 승인 — **implemented (LAN WS, 클라우드 릴레이 없음, Claude held-gate 한정)**

- Android: `android/.../net/Protocol.kt:691` — `{"type":"permission_decision","requestId":…,"decision":…}` 송신 헬퍼 `BridgeConnection.kt:217 sendPermissionDecision()`; 인증된 daemon WS 경유.
- Apple/daemon: `apple/AgentDeck/Daemon/Session/ObservedSteering.swift:11` — 관측 Claude의 PreToolUse 핸들러를 "until a device answers `permission_decision`"까지 hold; Node 라우팅 `bridge/src/daemon-server.ts:6542`.
- 전제: daemon이 실제 requestId를 들고 있을 때만(`liveAnswerable`) — Claude 관측 세션이며, Codex/Kiro/Antigravity는 display-only. 크로스머신은 hub→worker relay의 `relay_command_down` 허용목록으로 동일 경로 확장(`docs/daemon.md` § Daemon relay). 클라우드 중계 없음 — 페어링 토큰 인증 LAN/LAN-adjacent(ssh -L) 뿐.

## 10. OpenTelemetry — **Codex: implemented (양 daemon) / Claude Code OTel: absent**

- **Codex OTel implemented**: `bridge/src/codex-otel.ts:1-13` — Codex(CLI + ChatGPT.app Desktop)가 OTLP/HTTP JSON span을 daemon `POST /otel/v1/traces`로 보내는 것을 수집("only the Swift daemon implemented that route — the Node daemon answered 404… This is the Node port of `CodexTelemetryModule.swift`"). background threads/turn_context 파생.
- **Claude Code OTel: absent** — `CLAUDE_CODE_ENABLE_TELEMETRY`·Claude 관련 OTel grep 0건.

## 11. 상표 노출 — **partial (nominative 사용 있음, 로고는 공식 업스트림 SVG, 자체 상표는 AgentDeck만)**

- **플러그인 action 이름에 "Claude"/"Codex"**: 빌드된 `plugin/bound.serendipity.agentdeck.sdPlugin/manifest.json` — `"Session Slot"`, **`"Claude Limit"`**, **`"Claude Usage"`**, `"Volume"`, **`"Codex Usage"`**, `"Launcher"`** (Elgato Marketplace에 그대로 게시).
- **공식 업스트림 브랜드 SVG를 저장소에 포함·전 표면 렌더**: `design/brand/` — `claudecode.svg`, `codex.svg`, `openclaw.svg`, `opencode.svg`, `antigravity.svg`, `kiro.svg`, `zai.svg` 등. design 규칙 6 "Brand marks are upstream — do not redraw"(공식 마크만, 재작도 금지; 브랜드색만 `--brand-*` 토큰으로 허용).
- **ASC 메타데이터**: `docs/appstore-metadata-draft.md:50` — "코딩 에이전트(Claude Code, Codex, OpenCode, OpenClaw)…" nominative 사용, `:73-74` "Claude Code Hook 옵션 설치".
- **면책**: README "Independent project. Not affiliated with Anthropic, OpenAI, Google, Elgato, DIVOOM…" + `ATTRIBUTION.md`(공급자/벤더 언급 5건). 앱 이름·번들·제품명 자체는 AgentDeck 단독; 크리처는 자체 캐논(공식 마스코트 아님).

## 12. FUNDING.yml / npm funding — **absent**

- `.github/FUNDING.yml` 없음; 루트/`bridge/package.json`에 `"funding"` 필드 없음 (grep 0건).
