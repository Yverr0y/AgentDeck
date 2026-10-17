# AgentDeck 내부 인벤토리 (repo-grounded) — 2026-10-16

작성 기준: master @ c773e23b, read-only 조사. 원 출처는 각 항목에 파일 경로로 표기.
통계: `git log --since=2026-07-01` = **1,559 commits** (SeungBeom Choi 1,159 + samuel.choi 367 = 동일인 97.9%; 외부 doug-w/Doug Warren 19, Lukasz D 6, jcarberator 4, pjodoin 2, uto 1, jurri 1). devlog entries **957개**.

---

## 1. 가치 제안 인용 (verbatim)

- `README.md:18` — "**Your AI agents, at a glance. Across your desk.**"
- `README.md:20-23` — "AgentDeck brings your AI agents into one local dashboard. See which are working, waiting for you, or finished—across projects and tools. Watch them in a living aquarium, follow the timeline, and keep usage limits in view. Use your Mac or terminal on its own, or add a tablet, Stream Deck, e-ink reader, or small desk display."
- `README.md:31` — "**Start with what you already have. No extra hardware required.**"
- `README.md` "What it does" — "**Follow parallel work.** … **Notice when you are needed.** Permission and input requests stand out. … **Keep usage visible.** Claude, Codex, and z.ai/GLM gauges appear where the connected provider supplies usage data. … **Choose your display.**"
- `README.md:299-300` — "Run agents normally; AgentDeck reads their native events rather than scraping terminal screens."
- `DESIGN.md` 서두 — "> A glanceable command surface for AI coding agents. The aesthetic is **'aquarium tide'**…" / §1.2 — "AgentDeck serves two audiences: **App Store users** (paid, polished, plug‑and‑play) and **developers** (open‑source, npx, hardware‑hackable)."
- `docs/daemon.md:313` — "AgentDeck is designed for one human at a desk with a fleet of LAN gadgets."
- `docs/roadmap.md §2` — "Building a data-driven answer to 'which of my 6+ LLMs should I route this task to?' — replacing gut-feel model selection with measurement on my actual work."
- `docs/appstore-feature-matrix.md` Tier contract — "Tier 1 — App Store: Complete sandboxed dashboard. No PTY, subprocess, bundled interpreter…" / "Tier 2 — CLI: Optional Node daemon that owns integrations requiring external tools…"
- `AGENTS.md:1` (구 버전 프레이밍) — "Stream Deck+ controller for AI coding agents — a bidirectional local control system."

---

## 2. 표면 × 에이전트 × 기능 인벤토리

### 2a. 표면 (surfaces)

| 표면 | 보여주는 것 / 제어 | 비고·출처 |
|---|---|---|
| **Stream Deck plugin** (SD+, +XL, XL, Classic, Mini; SDK v2, 6 actions) | 세션 키(8/15/32/36), Detail view(BACK/INFO/MORE/ESC·STOP), E1 Volume, E2 Claude 사용량(5H/7D/scoped 3모드), E3 Codex 사용량, E4 Launcher, opt-in `limit-key`(per-model weekly cap 게이지), agent-native MODEL/THINKING picker(OpenClaw), model·effort·mode 읽기(#463), 같은 프로젝트 세션 short-id 태그(#544), no-daemon 시 센터 키 recovery hero | `docs/streamdeck-layout.md`; UUID 불변, SDKVersion 3 필수 |
| **Ulanzi plugin** (D200H/D200X LCD keys, 공식 UlanziDeckPlugin-SDK) | 동적 keypad 1종, `buildSessionDeck` 공유 레이아웃 엔진, MODEL/THINKING picker | **sole** Ulanzi 드라이버(direct-HID 제거). D200X encoder 미지원·실기기 검증 대기. WASM resvg 패키징(네이티브 바이너리 금지). `.claude/rules/devices-and-wire.md` |
| **macOS app** (SwiftUI + in-process Swift daemon `@DaemonActor`) | 대시보드, native 3D aquarium(Blender 저작 크리처), Collaboration lens(그래프+흐름 전류), menubar 적응형 개요, 음성 입력(PTT), WeatherKit+MET Norway, APME Work판/Graph/Activity/Recommend, Device Preview 카탈로그, Hermes mermaid, CI companion 궤도 | App Store 불변식: subprocess 0, companion-install 프롬프트 0, 외부 CLI 기능은 `isUsingExternalDaemon` progressive enhancement로만. `docs/appstore-feature-matrix.md`, `.claude/rules/apple-release.md` |
| **iOS/iPadOS companion** | 대시보드+페어링(mDNS/QR), 오프라인 Device Preview, 폼팩터 HUD | App Store 2026-08-07 첫 리젝(2.1(a) 무한 spinner) 후 라이브 |
| **Android** (CremaS/Onyx/Kobo/타블릿, Jetpack Compose) | 대시보드, e-ink 정적 투영, LCD 3D 배경 동반자, 3단계 guided onboarding, 설정 무선 APK 업데이트 | 토큰 없이 adb reverse로 붙음(`android-fleet-has-no-token-pairing` memory), Play 1.10.0 production |
| **ESP32 보드 12종** (86Box, IPS 3.5", IPS 10.1(음성), Round AMOLED, TC001, T-Embed CC1101, T-Display-S3-Pro, TTGO T-Display, EPD47, NM-EPD-420, TRMNL 7.5" e-ink 커스텀 펌웨어) | 상태표시 + 일부 양방향: T-Embed=로터리 조향+PTT 음성+대기 호출기(pager), T-Display-S3-Pro=터치 조향·Pocket/Focus 전환, WiFi OTA, serial/WiFi 이중 전송 | 보드맵 SSOT `shared/src/esp32-boards.ts` → release matrix 생성. `docs/devices.md`, `esp32/AGENTS.md` |
| **Pixoo64 / Timebox Mini / iDotMatrix / TC001** | 픽셀 아쿠아리움+사용량 HUD(Tide 씬), 11×11 로봇 얼굴 표정, 32×32 크리처+WORK/JOBS/WAIT 카운트, 8×32 매트릭스 | HTTP REST / BLE(ISSC) / BLE / WS2812B. 브랜드 마스크 SSOT 생성물만 사용 |
| **Node daemon + CLI** (`agentdeck`) | hub port 9120, hook HTTP, mDNS, LAN default-deny+페어링 코드, usage producer(Claude/Codex/z.ai), APME 30s 루프, 음성 helper, ESP32 flash(esptool-js), relay, order pins, `run`/`order`/`relay` daemon-first | `docs/cli.md`, `docs/daemon.md` |
| **TUI 대시보드** (`agentdeck dashboard`, "tide console") | 세션/모델·effort·PERM/CI 대기/서브에이전트, 브라일 아쿠아리움, provider별 사용량, 타임라인 | #474 재구축(2026-10-07) |
| **웹** | GitHub Pages: 기기 카탈로그·라이브 렌더 프리뷰·브라우저 플래셔·design system·Build Health 리포트. **라이브 웹 대시보드 클라이언트는 없음** — 외부 클라이언트용 SSE 전송과 `docs/surface-protocol.md` 프로파일(`dashboard-live/v1`, `companion-control/v1`, `portable-reader/v1`, `display-only/v1`)만 존재 | `docs/pages-site.md` |
| **호환 커뮤니티** | XTeink X3/X4(Pocket Daily Reader 포크, `portable-reader/v1`), Bitfocus Companion 모듈(`companion-control/v1`, houtacheng) | "Community" 통합 — 호환성 미검증 명시 |

### 2b. 에이전트 × 관측 경로 × 기능

| Agent | 관측 소스 | PERM 검출 | 사용량/quota | APME | 음성/릴레이/주입 |
|---|---|---|---|---|---|
| **Claude Code** (주 통합) | lifecycle hooks(사용자 전역 `~/.claude/settings.json`) + transcript JSONL | `Notification(permission_prompt)` + PreToolUse hold 예측기(`ClaudePermissionRules` 생성 SSOT)로 기기 Allow/Deny | Node daemon이 미공개 `/api/oauth/usage` OAuth로 5H/7D+per-model scoped; Tier 1은 relay 전용(Anthropic ToS) | 완전(hooks+transcript, 판정 대상 선별 포함) | ask-gate 홀드·terminal injection·queued-directive 사다리; cmux 전달은 #541로 문서화 답변만 |
| **Codex CLI** | lifecycle hooks(`~/.codex/config.toml`) + rollout JSONL; Desktop 앱은 macOS에서 top-level rollout 탐지(Windows 검증 대기) | `PermissionRequest` + `Interrupt`(≤3s) | rollout `rate_limits` 수동 읽기(producer에서 plan 정합성 void 처리) + live account endpoint 30s 폴 | hooks+rollout; `model`은 hook에서 turn에 기록; `codex exec` 자식 fold | 관측 스티어링(relay 시스템 등), 주입 런그는 플랫폼별 |
| **OpenCode** | observer plugin(`~/.config/opencode/plugins/agentdeck.js`) + SSE 오버레이 | `permission.asked`(answerable requestId, 양 tier) | **unknown — 문서화된 usage 소스 없음**(README: provider가 주는 곳에만 게이지) | timeline events 경로 | OpenCode 내부에서 답변; 기기 응답은 제한적 |
| **Kiro CLI / IDE** | transcript 관측(v2 SQLite / v3 JSONL; v3는 global lifecycle hook도 지원). CLI hook 설치는 실험상 무의미(2.18.1 실측: hook 로드만 되고 발화 0) | **없음** | 없음 | passive timeline(rows는 수집되나 judge 커버는 명시 없음 — unknown) | 없음 |
| **Antigravity** | CLI daemon passive 관측만; App Store 앱은 세션 관측 불가(usage/credit 상태만 별도 기능) | 없음 | App Store가 usage/credit DB 읽기(사용자 승인) | unknown | 없음 |
| **OpenClaw** | 실험적 Gateway WS(18789, 커스텀 프레이밍, Ed25519 v2/v3, `sessions.subscribe`) | `exec.approval.requested`(+ plugin.approval #309) | `hasApiUsage=false` | per-session-key run(유휴 run 종료 규칙 있음) | `chat.send`/abort, MODEL/THINKING picker, steering key SSOT |
| **Hermes Agent** | opt-in preview observer plugin(`agentdeck hermes-observer`), read-only | 없음(읽기 전용) | 없음 | `hermes_*` hooks 수집 | App Store는 relay 경유로만 수신 |
| **Dot** (실험 캐릭터) | Node daemon loopback MCP 호스트 — **Store 빌드에서 제외**(dev 전용) | — | — | — | G0a 실험: "local" 작업=cloud_threads, 로컬 MCP 미상속 |
| **Gemini CLI / Cursor** | **지원 없음 — 저장소 어디에도 등장하지 않음** | — | — | — | — |
| Claude App cloud Code | "Not supported — deferred" (`docs/appstore-feature-matrix.md`) | — | — | — | — |

---

## 3. 2026-07 이후 핵심 제품 결정 (결정 / 기각안 / 근거)

- **#463 deck control 재설계**: 예산 제어가 아니라 각 에이전트 고유 어휘로 — PTY parsing·키 주입 없이, 모든 값은 요청 시점에 agent 자신의 값. 기각: `/model` 타이핑·가공 디폴트. 근거: Claude 2.1.289(`Stop`에 `effort.level`, hook은 model 변경 불가·`/effort`는 전역 설정 오염), Codex 0.156, OpenClaw 2026.9.8 실측. `2026-10-06-deck-agent-native-control.md`
- **#273 managed PTY 유지 결정(2026-10-15)**: 제거 안 함 — 즉시 터미널 조향·Windows 입력·원격 managed 플래그에 대체 없음+사용자 피드백 0. daemon-first(`run`/`order`/`relay`)로 신규 구축, phase 0 죽은 코드 제거. `2026-10-14-273-phase0-dead-legacy-code.md`, `.claude/rules/managed-sessions.md`
- **Daemon relay(#538)**: worker daemon이 hub에 observed 세션 발행. 관리형 remote attach 원 구현자에게 Discussion #278에서 토폴로지 확인 후 착수. 검증: loopback 2데몬 e2e(미검증: 2대 물리 머신·Windows worker). `2026-10-14-daemon-relay.md`
- **Hook harness 정체성 = payload, not endpoint(#490/#504)**: unprefixed 엔드포인트의 Codex payload가 Claude 세션으로 되살아나던 것(실 capture 재생으로 재현)을 생성 SSOT `hook-harness.ts`로 차단. 기각: 엔드포인트 이름 기반 분류, model 문자열 증거 사용(`claude-glm`은 Claude). `2026-10-11-hook-harness-identity.md`
- **Devlog entries-only(#550)**: 생성 집계 커밋 중단(40 PR 중 18개가 같은 파일 재작성, 월 롤오버마다 열린 PR 전멸). 기각: `merge=union`(GitHub 무시), 봇 재생성 커밋. `2026-10-15-devlog-entries-only.md`
- **검증 3티어(`verify:changed|quick|full`) + verification-catalog 게이트**: darwin-gated vitest ~10건이 어느 CI에서도 안 돌던 것, ESLint 181 오류 등을 감사 후 제도화. `2026-10-07-verification-tiers.md`
- **APME judge 체인 `mlx → foundationModels`, FM은 floor**: 실측 judge-fidelity FM 0.580 vs MLX 0.86–1.00, FM 4,096토큰 창에 실제 프롬프트 4.2% 초과. 기각: FM 완전 제거(무료 평가 소멸). `docs/apme.md`
- **MLX judge `repetition_penalty` 1.05, per-request만**: gemma-4-26b `summary` 반복 루프 4/6→1/6. 종전의 "엔드포인트별 영구 기억"은 적대적 리뷰 4연속 HIGH/MEDIUM 결함으로 **삭제**. `.claude/rules/apme-eval.md`
- **판정 대상 선별(task-gradeability)**: 실측 — 채점 182건 중 69건이 에이전트 응답 0인 채 점수 매짐. `no_reply`/`aborted_only`/`trivial` 거부+사유 기록. `docs/apme.md`(2026-09-03)
- **Claude background jobs 정체성**: 버전명 argv[0] 승인+세션 파일 `kind/jobId/spare` 판독(소유자가 입력 중인 대화가 행 0개, idle 2행으로 보이던 실측). `2026-10-10-claude-background-job-sessions.md`
- **세션 상태 palette 단일 SSOT**: 같은 WORKING 세션이 표면별로 초록/파랑/청록이던 것을 `--session-*` 토큰+생성 미러로 통일. `2026-09-27-session-state-palette.md`
- **Windows autostart = launcher(스케줄드 태스크의 action이 데몬이 아님)**: 실측 — daemon-as-action은 WindowsTerminal 창 상주. 기각: `<Hidden>`, `conhost --headless`(미실행), S4U principal(권한 거부). 대가: 모든 자식 spawn `windowsHide` 게이트. `docs/daemon.md`
- **Pixoo 자동탐지 기본 OFF**: 기본값이던 매 시작 시 Divoom cloud POST+/24 스윕을 opt-in으로 전환. `.claude/rules/daemon-lifecycle.md`
- **D200H direct-HID 은퇴 → 공식 Ulanzi Studio plugin이 유일 드라이버**; resvg-wasm 단일 바이너리(실측: 5개 아치 .node가 20MB 중 18.5MB, macOS 검증 경고; wasm은 34타일 바이트 동일). `.claude/rules/devices-and-wire.md`
- **TRMNL 상용 BYOS pull 통합 제거** → 같은 하드웨어에 자체 펌웨어 플래시하는 정식 보드로. `docs/devices.md`
- **Dot은 Apple 양 타깃에서 dev-only**: Store 아티팩트에서 컴파일 제외+아카이브 검증. `.claude/rules/apple-release.md`
- **Hermes 비주얼**: CC0 위상 실험·sphere 조립 모델 기각(일반적 얼굴), Blender 프로덕션 조각+스킨 리그 채택. `2026-09-30-hermes-modeling-methods.md`
- **`AGENTS.md` 단일 루트 지시파일(CLAUDE.md 삭제, 2026-09-29)**: Claude Code fallback 규칙+Codex 32KiB cap 실측에 근거. 기각: CLAUDE.md 병존(조용히 AGENTS.md를 대체해 버림). `docs/agent-harness.md`

---

## 4. 사고·고통 클러스터 (devlog 957 entries + rules의 사고 기록 기반)

| 클러스터 | 대표 사고 | 규모 감각 |
|---|---|---|
| **릴리스/스토어 배포 차질** | "성공한 뒤 실패한 2단계 게시"(1.6.0), ASC 무언 실패(What's New 공백), Ulanzi 마켓 수동 발행 404, Elgato DRM 조용한 체크섬 차단, Play 콘솔 저장≠제출 | release/platform-release/store 접두 entry 20+; 이슈 #449(1.8.0 심사) 여전 open |
| **관측 정체성·응답 유실** | #490 Codex 턴이 Claude 아이콘으로 이중 렌더, codex stop 128턴 중 응답 3건, 관측 응답 캡처 공백, open run 잔존(orphan 37%), `codex exec` 홍수 | codex/claude/hook 접두 48+13+4건; APME 규칙 대부분이 이 클러스터 산출 |
| **다중 데몬 토폴로지·포트·토큰** | timeline.json 양데몬 공유, 토큰 미채택으로 WiFi 플릿 전체 4001 잠김(2026-08-08), #370 폴백 포트 영구화, #545 세션 종료가 hub 전체를 끊음 | daemon 21건 + daemon-lifecycle rule 대부분 |
| **Swift 동시성·렌더** | main actor 포화로 데몬 굶김(24분 로그 정체), HUD 서브트리 스왑 상태 유실, `@convention(c)` 인라인 trap, actor 우선순위 역전 | swift-daemon rule 전체; 2026-07-18 사고가 `@DaemonActor` 탄생 |
| **ESP32 하드웨어 예산** | 전원 붕괴(brownout), WiFi 플랩 증폭(4096B 불변식), DRAM 가드, loopTask 8KB OOM, OTA 무음 no-op, 동일보드 2대 키 충돌, 포트 재열거 | esp32/eink/ips10/tc001/trmnl 접두 30+8+36+5+8건(ips10이 단일 보드로 최다급) |
| **APME 판정 파이프라인** | gemma 반복 루프, 잘린 JSON 판정, 인덱스 추가 하나가 137.8s 페이지(서버主스레드 SQLite), 2.33GB 무retention | apme 11건 + `apme-eval.md` rule |
| **Windows 특화** | Git Bash가 인라인 PowerShell `$variable` 제거(전 hook 실패), UTF-16 BOM schtasks, 콘솔 창, Node 드리프트로 better-sqlite3 ABI | windows 6건 + `docs/windows.md` |
| **BLE/TCC** | 미번들 바이너리 mic grant가 경로 고정→업데이트시 조용히 박탈, SIGABRT 77회 폭풍, Rosetta venv 아키텍처 미검출 | `devices-and-wire.md` BLE workers 절 |
| **와이어 프로토콜** | `usageStale` 양방향 래치, 소수 epoch-ms 한 프레임(242연속 거부), unknown agentType 오렌더링(Kiro=Claude 문어), 역행 insert가 10,603회 재수확 | `devices-and-wire.md` Wire semantics 절 |
| **하네스·검증 자체** | devlog 머지 충돌(#550), design lint 더블 스코프(빌드 체크아웃 658 vs clean 89), 지어낸 fixture 5건, red 게이트가 base 소행, DerivedData PAT 유출(PR #438) | Dev Harness memory 클러스터 + verification-tiers |

---

## 5. 취약 의존성 (외부가 바뀌면 깨지는 지점)

| 의존성 | 코드 위치 | 게이트/테스트 | 깨진 횟수·증거 |
|---|---|---|---|
| **Claude Code hook 형식** (3단 nesting v2.1+) | snippet이 `hooks/src/install.ts`·`setup/src/setup.ts`·`HookInstaller.swift`에 byte-identical 3중 미러 | byte-identical 요구(AGENTS.md CRITICAL); lifecycle baseline claude>=2.1.50 | 구 flat 형식 조용한 실패(사전 경험), #490 Codex의 Claude 어휘 hook 유입 — 실 capture 벡터로 재생 게이트 |
| **Codex config.toml/rollout 형식** | `codex-*.ts`, `hook-harness.ts`(생성 SSOT+0.160.1 실capture 벡터) | `hook-harness-sync.test.ts`, e2e HTTP 재생 | 다수: 응답 3/128 유실, exec 자식, background terminals, OTel 스레드 이중 계산, 0.149.0 `Interrupt` 부재 |
| **Claude 사용량 endpoint(미공개 `/api/oauth/usage`)** | Node daemon 소유; Tier 1 relay 소비만(`scopedLimits` 생성 protocol) | relay 파싱 게이트 | ToS 제약(2026-04-04 시행)으로 직접 로그인 불가 — 경쟁사(LimitWatch)도 비스토어 broker로 회피; 회복=Haiku 무툴 턴 |
| **Codex rate-limit/account API** | `codex-rate-limits*.ts`, producer 정합성 `codexSnapshotMatchesAccountPlan`(생성 mirror) | 방정식 벡터; 5h창 slot flip memory | window slot flip 사고, 소진 후 credits 교체(#2026-10-01), lapsed plan 미래형 창 |
| **z.ai GLM endpoint** | `zai-quota.ts` SSOT→생성 | `zai-quota-vectors.json` 양 suite | 2026-09-19 실측 후 구현; pair-key 표시(#2026-10-02), 자격증 거부 복구(#459) |
| **OpenClaw Gateway 프로토콜** (커스텀 프레이밍, JSON-RPC 아님; 2026.4.14 검증) | `openclaw*.ts`, Swift `Daemon/Gateway/**` | 세 답 health, 구독 필수 규칙 | 반복: adapter 쐐기(9/17·9/26, PR #380), 구독 없는 이벤트 무음, transcript feed 무동력, headless 승인 거부, ghost PERM |
| **Elgato SDK/DRM** | `plugin/`, SDKVersion 3 필수 | 배포 전 review loop로 DRM 처리본 encoder 검증(#349) | DRM 체크섬 조용한 로컬 빌드 차단, Marketplace "Mac Only" 오표시(#88), 심사 지연 상시 |
| **App Store 규칙 (2.5.2/4.2.3, iOS 2.1(a))** | `apple/scripts/verify-appstore-archive.sh`, 기능표 사전 등록 규칙 | 아카이브 Mach-O 검색 게이트 | iOS 1차 리젝(spinner), 번들ID 과거사(1.0.6 build floor), DerivedData 토큰 유출 사고 |
| **Ulanzi SDK/마켓** | `plugin-ulanzi/` | 패키징 verify가 tree 순회 `.node` 탐지; VERIFY.md 절차 | WASM 전환 강제(서명 불가), 마켓 수동 발행 감사 404, 1.8.x 심사 대기 중 |
| **node-pty** (optional, macOS helper 모드) | `pty-manager.ts` — spawn 전 helper 퍼미션 복구 | `diag native` ABI 증명, posix_spawnp 사전 복구 | prebuild 0644 이슈(#919 상류), Node 짝수 라인 강제(engineStrict) |
| **Python BLE workers(bleak)** | `ble-sync-spawn.ts`, `python-ble-runtime.ts` | SIGABRT 서킷브레이커, Mach-O 아키텍처 판독 | TCC 경로 고정 박탈(77 crash), Rosetta venv |
| **better-sqlite3 / Node ABI** | APME store | `diag native`, Windows Node 드리프트 감지 | #281 Windows 전멸 |

---

## 6. 커뮤니티·유통

- **이슈 테마**(전 90+ 건 스캔): 초기 = Windows 크래시/지원 요청·Stream Deck 비Plus 지원(#39/#63/#94)·보안 피드백(#145/#149 → LAN default-deny 재설계로 수렴). 중기 = 관측 신뢰성·usage/APME 정확성·릴리스 게이트. 최근 = 음성(#541 cmux, #542 LaunchAgent mic — #546으로 수정 머지, 발행 대기), 덱 라벨(#544→#548), e-ink 실측 요구(#551). 이슈를 작업 추적으로 겸용(Release delivery #414/#449/#515/#535).
- **외부 기여**: 2026-07-01 이후 커밋의 **2.1%**(33/1,559). PR #534(dudziakl, Windows `where` 수정)이 최근 유일한 비소유자 PR. doug-w/Doug Warren(19) = managed remote attach 원 구현자로 Discussion #278에서 자문. houtacheng의 Companion 모듈은 별도 저장소로 Community 취급. 보안 리서처 2건(#145/#149).
- **릴리스 캐던스**(tag 기준, 09-07→10-13 약 6주): npm 12회(1.2.1→1.9.2), Apple 10회(→1.9.1), Android 10회(→1.10.1), ESP32 9회(→1.9.2, 보드 12종×binary 60개), Stream Deck 6회(→1.8.1), Ulanzi 6회(→1.8.1). **주 단위 조정 라운드**+target별 patch 분리. (사용자 선호 memory: 모아서 라운드 배포.)
- **발행처**: npm(`@agentdeck/*` 4패키지), App Store(macOS 1.9.0 공개 확정·1.9.1 심사 중; iOS 1.9.1 심사 잔류), Google Play(1.10.0 production 100% 178개국, 1.10.1 internal), Elgato Marketplace(1.8 공개·1.8.1 심사 대기), Ulanzi Marketplace(**1.6.0이 마지막 공개 확정**, 1.8.x 미게시), GitHub Releases(signed APK, ESP32 firmware manifest), 브라우저 플래셔. **미발행**: Windows 스토어/패키지 없음(CLI 경유), Linux도 CLI+systemd뿐, Dot·D200X encoder·Hermes observer 마켓 없음, TestFlight는 초기 전용.
- **공개 웹**: puritysb.github.io/AgentDeck(카탈로그·프리뷰·design system·Build Health·플래셔) + YouTube 데스크 투어.

---

## 7. 문서에 있지만 미완/미배선

- **Dot**: `docs/dot-distribution-decision.md`, `docs/dot-creature-surfaces.md`(여러 "Planned" 행), `services/dot-relay/`가 있으나 **Store 빌드에서 컴파일 제외**(dev-only). G0a 실험 결론: 로컬 MCP 미상속으로 서버 없는 배포 계획은 미완.
- **D200X encoder**: "separate, unshipped UX" — keypad가 지원을 암시하지 않도록 규칙 존재. LCD keys 실기기 검증 대기(`docs/appstore-feature-matrix.md` "Partial").
- **TRMNL 7.5"**: 기능표에는 "Experimental — 물리 렌더/리프레시 릴리스 검증 미완"(devices.md는 "shipping via WiFi OTA"로 더 낙관; #551이 리프레시 latency/고스팅 실측 요구).
- **TC001의 Swift `led8x32`**: 하드웨어 검증 공백("Pending").
- **e-ink 음성 인터페이스(#272)**: BOOT PTT 홀드는 예약했으나 ES8311 캡처 미활성화 — "아직 열린 음성 인터페이스" 연구로 마감.
- **APME rubric auto-tuning(OPRO)**: "설계만 있고 아직 구현되지 않았다"(`docs/apme.md` 서두) — `apme tune` CLI는 자리만.
- **APME Layer 1(deterministic)**: CLI 전용(git subprocess 필요).
- **Daemon relay 미완 항목**: 2대 물리머신·Windows worker 미검증, hub-side pin 미지원, timeline/APME/review 릴레이 없음(`docs/daemon.md`).
- **Swift daemon 격차**: ESP32 orientation 커맨드 미전송, Claude model을 SessionStart 값에 고정, `reasoningEffort` 미소비.
- **Kiro/Antigravity**: PERM 없음·App Store 세션 관측 불가 각각 명시.
- **Claude App cloud Code**: "Not supported — deferred".
- **T-Embed**: BLE 폰 릴레이·CC1101 서브GHz 캡처 "future work".
- **미해결 오픈 이슈로 남은 배선**: #541(cmux 음성 전달 — 문서화된 답변만), #542 수정의 설치본 반영 대기, #449(1.8.0 스토어 심사 완결), #551(e-ink 실측).
- `bridge|shared|plugin*` src 내 TODO/FIXME 19개(양호한 수준).

---

## 8. 요약 (20줄)

**가장 강한 것 3가지**
1. **기계로 강제되는 다중 표면 패리티**: 숫자·규칙·와이어 계약이 SSOT→generator→drift gate→실capture 벡터 재생(약 40행 카탈로그)으로 TS/Swift/Kotlin/C++에 동시 강제 — 경쟁자가 흉내 내기 어려운 검증 문화이자, 12개 펌웨어 보드·6개 플러그인/앱이 같은 의미를 유지하는 실제 이유.
2. **실재하는 물리 데스크와 양방향 제어**: 사진·영상으로 입증된 하드웨어 플릇(ESP32 12종, 덱 2종, LED/픽셀 4종)이 hook 홀드·ask-gate·주입 사다리로 agent를 실제로 조종 — "모니터링 앱"이 아니라 조종면. 카메라·케이블 없는 페어링, OTA, PTT 음성까지 갖춤.
3. **완결된 6채널 유통+데이터 루프**: App Store/Play/npm/Elgato/Ulanzi/GitHub가 버전 정책·영수증·5단계 상태 규율로 돌아가고, APME가 "어떤 모델에 어떤 작업을 맡길까"를 로컬 무료 judge 체인으로 데이터화 — 제품의 차별화 축.

**가장 약한 것 3가지**
1. **버스 팩터 1**: 커밋 97.9%가 소유자, 외부 PR은 6주간 1건. 하드웨어 검증·스토어 심사 추적도 소유자 책상에 집중 — 커뮤니티 검증 파이프라인은 Companion 1건이 유일.
2. **외부 인터페이스 노출 상시**: 미공개 usage endpoint, harness hook/rollout 형식, 실험적 Gateway 프로토콜, SDK/DRM·마켓 심사 — 한쪽이 바뀌면 즉시 깨지고(문서화된 사고 다수), Elgato/Ulanzi/ASC 대기가 라운드를 자주 지연시킴.
3. **스코프 인플레이션과 실험의 체류**: 957 devlog entries, 동시 진행 실험(Dot, Hermes, relay, D200X, e-ink 음성)이 "문서엔 있으나 미완" 목록을 계속 키움 — 관리 부담이 이미 검증 3티어·devlog 재구조 같은 자기 수순을 요구할 만큼 커짐. Windows/Linux는 명시적 2등 시민.
