# "AgentDeck 포지션 워크숍" 외부 검토 — 2026-10-16

## 판정 (5줄)
1. **수정 후 배포(ship after fixes)** — 단 '더 필요한 것' 표는 다시 채점해야 한다.
2. 논지(AgentDeck은 벤더 교차·오프스크린·로컬·평가 자리에 있고, 단일 에이전트 루프는 하네스가 흡수했다)는 메모와 맞고 버릴 이유가 없다.
3. 그러나 코드로 바로 반증되는 사실 오류가 있다. OpenCode·OpenClaw도 덱에서 승인되고, Codex는 덱 승인이 없다. 이 오류가 요약·공백·후보·시나리오 여섯 곳에 퍼져 있다.
4. 후보 등급은 PM 기준(관측·평가 능력)이 아니라 시장 미충족·생존 척도로 매겨졌다. 그래서 가장 싸고 기준에 맞는 일(APME 판정과 사람 판단의 정합 측정)이 빠졌고, 오히려 그 루프를 담은 OPRO를 닫자고 한다.
5. ToS·벤더 하드웨어·유통 상태 서술은 출처보다 세게 쓰였다. 미완 PENDING 블록과 성장 지표(별·트래픽·D7)가 머리말에 남아 있어, 08-07 입장을 말로만 존중한다.

인용은 보고서 본문 그대로다(「」). 줄 번호는 XML을 걷어 낸 본문 기준이다.

---

## 발견 (피해가 큰 순서)

### 1. [사실 오류·전파] "완전 통합 둘", "Allow/Deny는 Claude뿐"
- **(a) 인용:** 「그중 관측·승인·사용량·평가가 모두 붙은 "완전한" 통합은 Claude Code와 Codex 둘뿐이다.」 / 「승인 비대칭: 덱에서 Allow/Deny가 되는 것은 Claude(PreToolUse HTTP hold 60초, `hooks/src/install.ts:84`)뿐이고 Codex는 알림만 받는다(`codex-install.ts:222`)」
- **(b) 문제:** 두 방향으로 틀렸다.
  - 보고서 자신의 정의(승인 포함)로는 Codex가 '완전'이 아니다. 같은 문서의 에이전트 표 Codex 행이 「알림만 — PermissionRequest→알림, Interrupt 3초; 기기 결정 없음」이다.
  - 덱 Allow/Deny는 Claude만 되는 게 아니다. OpenCode와 OpenClaw도 덱에서 답할 수 있다.
  - 이 오류는 여섯 곳에 퍼져 있다: 한눈에 보기 위협 (3), 부족한 것 1행 「에이전트 커버리지가 둘에서 멈춤」, 후보 ②의 「승인 비대칭(Claude만 Allow/Deny) 해소」, 후보 ③의 「완전 통합 2 → 4–5」, 대체재 비교 「완전 통합 2개 대 VibeDeck 6개」, 시나리오 C 「두 하네스 완전 통합」.
  - 이 코드를 쓴 사람이 독자이므로 첫 페이지에서 신뢰를 잃는다. 시험 (3)의 답은 "공정하지 않다"이다.
- **(c) 증거:**
  - `bridge/src/daemon-server.ts`의 `permission_decision` 핸들러: `requestId.startsWith('ocperm:')`이면 observer plugin이 `POST /session/{id}/permissions/{permissionID}`로 해소한다(`bridge/src/opencode-client.ts:189`).
  - `bridge/src/adapters/openclaw.ts:817-819`의 `resolveApproval`이 `rpcCall('exec.approval.resolve', …)`를 부르고, `bridge/src/openclaw-session.ts:103`이 `liveAnswerable = true`를 둔다.
  - 인벤토리 §2b OpenCode 행: 「`permission.asked`(answerable requestId, 양 tier)」.
- **(d) 수정:**
  - 「네 축(관측·기기 승인·사용량·평가)을 모두 갖춘 통합은 Claude Code 하나다. Codex는 기기 승인이, OpenCode·OpenClaw(실험)는 사용량이 빠진 세 축이고, Kiro·Antigravity·Hermes는 관측 위주다.」
  - 승인 문장은 「덱에서 Allow/Deny가 안 되는 주력 하네스는 Codex 하나다(`codex-install.ts:222`, 알림 전용).」로 바꾼다.
  - 후보 ③의 "2 → 4–5"는 지운다. Cursor는 관측만 늘린다(10번 참조).

### 2. [논리] 선언한 가치 기준과 실제 등급 척도가 다르다
- **(a) 인용:** 「열 개의 후보를 가치 기준(관측·평가 능력이 늘겠는가)과 비용(버스 팩터 1인 소유자의 시간)으로 재서 아래 2×2에 놓았다. 영향 '고'는 미충족 가치 하나를 직접 키우거나 생존 리스크를 없애는 것, '중'은 보완재, '저'는 위생이다.」
- **(b) 문제:**
  - 바로 다음 문장이 정의한 척도는 "시장에서 아직 아무도 채우지 않은 가치"와 "생존"이다. PM 기준이 아니다.
  - PM 기준으로 관측·평가를 실제로 늘리는 후보는 ③(관측 폭)·⑤(교차 대기 큐)·⑥(APME 커버리지) 셋뿐이다. 나머지는 이렇다: ① 보존, ② 제어, ④ 벤더 푸시 편의, ⑦ 표면 확장, ⑧ 쇼케이스, ⑩ 발견성.
  - 그 결과 PM 기준에서 가장 싸고 영향이 큰 항목(3번 발견)이 표에 없다. 「왼쪽 위 칸이 비어 있다는 것이 이 그림의 요점이다 — 싼 개선은 이미 다 했고」는 척도가 만든 결론이지 증거가 아니다.
- **(c) 증거:** PM 메모리 `user-role-and-why-agentdeck-exists.md`: 「"사용자가 늘겠는가"보다 "관측·평가 능력이 늘겠는가"가 이 저장소의 가치 기준이다 … 성장/전환 최적화 제안은 번지수가 틀렸다.」
- **(d) 수정:** 표에 'PM 기준'과 '생존'을 따로 채점하는 열을 둔다. 문장: 「영향은 두 축으로 잰다 — PM 기준(관측·평가 능력이 늘어나는가)과 생존(지금 되는 관측이 끊길 위험을 없애는가). 시장에서 비어 있다는 사실은 근거로 쓰지 않는다.」

### 3. [가장 큰 누락] 알맹이(APME)의 타당성을 한 번도 재지 않았고, 그 측정 루프를 닫자고 한다
- **(a) 인용:** 「9 | 실험 닫기 — Dot·D200X 인코더·e-ink 음성·OPRO를 '닫힘/보류'로 명시, 미완 목록 정리」 / 「orphan run 37%」 / 「로컬 judge로 세션 품질을 재는 도구는 아직 아무도 없다」
- **(b) 문제:**
  - 보고서는 "알맹이는 APME"라고 하면서, APME 점수가 PM 본인의 판단과 맞는지는 재지 않았다. 경쟁 메모가 넘긴 숙제(「its maturity needs checking with the repo analyst」)도 하지 않았다.
  - 인용된 judge fidelity(FM 0.580 vs MLX 0.86–1.00)는 `judging` 분류 6시나리오×3회, 18회짜리 벤치마크다. PM 세션에서 잰 정합이 아니다.
  - 사람 라벨 저장소(`vibe_feedback`, `POST /apme/vibe`)는 이미 있다. 빠진 것은 judge 점수와 vibe 판정의 상관을 계산하는 단계 하나다. 그 단계가 바로 OPRO 설계의 2단계(Baseline correlation)다. 후보 ⑨는 이 유일한 judge–사람 정합 루프를 '닫힘'으로 보낸다. PM 기준과 정반대다.
  - 「orphan run 37%」는 09-03 측정치다. 그 뒤 `rehydrateOpenRuns()`와 reaper 수정이 코드에 들어갔고, 재측정은 없었다. "계기를 먼저 검증한다"를 핵심 가치로 든 보고서가 수정 전 수치를 현재 결함으로 인용한다.
- **(c) 증거:**
  - `docs/apme.md` 34–46행: 「2026-08-22 실측(`OpenClaw/model-eval`, `judging` 분류 6 시나리오 × 3 반복…)」
  - 같은 문서 836–856행: 「튜너가 읽고 쓸 저장 구조는 준비돼 있고, 튜너 루프만 없다」, 2단계 「Baseline correlation: `evals.overall` ↔ `vibe_feedback.verdict` 간 Pearson 상관 계산」
  - competitive-landscape.md 235행
  - 메모리 `apme-idle-gap-remeasure-orphans-remain.md`(09-03, 37%)
  - `bridge/src/apme/collector.ts`의 `rehydrateOpenRuns`, `bridge/src/__tests__/apme-rehydrate.test.ts`
- **(d) 수정:**
  - 후보 11을 추가한다: 「judge–사람 정합 계측 — `vibe_feedback`와 `evals.overall`의 상관을 읽기 전용 지표로 노출(튜너·자동 채택 없이). 무엇을 늘리나: 평가의 타당성 자체. 영향 고 / 비용 저.」
  - ⑨는 「OPRO의 자동 튜닝만 보류, 상관 측정은 11번으로 분리」로 바꾼다.
  - 관측 정확도 행은 「orphan 37%(09-03 측정, 이후 rehydrate·reaper 수정 — 재측정 없음)」로 바꾼다.

### 4. [입장 존중이 말뿐] 성장·수익화 렌즈가 그대로 남아 있다
- **(a) 인용:** 「트래픽은 하드웨어 피어의 1/10, 소프트웨어 피어의 1/100이고 이것은 08-07 입장(제품이 아니라 계기판)이 예상한 그대로다.」 / 「가장 큰 별수는 마찰 없는 설치에서 나왔다: … App Store 빌드가 그 역할인데 D7 유지율 1% 미만」 / 「`FUNDING.yml`이 여전히 없다는 것은 09-19 권고가 아직 미실행이라는 뜻이고, 한 줄짜리 무후회 항목으로만 남긴다.」 / 「클라우드 릴레이 없는 LAN 전용 승인면이 맞는 유일한 집단이다.」
- **(b) 문제:** 수익화를 후보에서 뺐다고 선언하면서, 성장 렌즈는 그대로 남겼다.
  - **머리말:** 두 번째 문장이 별수 비교다. 08-07 입장은 가치에 대한 선택이지 트래픽 예측이 아니다. 「예상한 그대로」는 사후 합리화다.
  - **공백 표:** '설치 마찰' 행은 별수와 D7이라는 전환 지표로 공백을 정의한다.
  - **대체재 비교:** 「대체재 대비 열세」는 별 속도로 순위를 매긴다.
  - **후보와 질문:** ⑧「빈 분면 쇼케이스」, ⑩「발견성」, PM 질문 5(검색 점유)는 모두 성장 목표다.
  - **기회 (3):** JetBrains 39%/16%와 Pragmatic "70%"로 시장을 잰다.
    - 시장 메모의 반대 신호는 빠졌다. Stack Overflow Pulse에서 단일 에이전트 사용이 69%, 선호가 68%다.
    - JetBrains 수치는 403 페이지의 스니펫이다. 시장 메모는 이를 UNVERIFIED로 표시했다.
  - **기회 (5):** '엔터프라이즈 집단'이라는 세그먼트 언어로 썼다.
    - PM 기준으로 쓰면 더 강하다. PM이 대량 작업에 쓰는 claude-glm은 `ANTHROPIC_BASE_URL` 게이트웨이를 거친다. 그래서 Remote Control을 쓸 수 없다.
    - 결국 PM 자신의 세션에서 원격 승인 경로는 AgentDeck뿐이다.
  - **수익화 문단:** FUNDING.yml '무후회 항목'과 Stripe·Sponsors·Polar 문단은 PM 메모리의 「상업화·수익화를 제안하지 마라」에 정면으로 어긋난다.
    - Polar의 개인 지급 가능 여부는 메모에서 UNVERIFIED인데, 보고서에서는 그 표시가 사라졌다.
    - 「소프트웨어에는 돈을 안 내고」는 Product Hunt 1표 하나에서 일반화했다. 보고서 스스로 유료 Vibe Island(약 $20)를 대체재로 든다.
- **(c) 증거:**
  - PM 메모리: 「다운로드 0인 e-ink 패널을 만들 자유가 이 결과물의 조건이지 결함이 아니다」, 「상업화·수익화를 제안하지 마라」.
  - market-demand-monetization.md 15·51·129–131행(SO Pulse, JetBrains UNVERIFIED), 195행(Polar 개인 UNVERIFIED).
  - harness-evolution.md 72행: 「Not available with API keys, Bedrock, Vertex, Foundry, or `ANTHROPIC_BASE_URL` gateways」.
  - 메모리 인덱스: 「대량=claude-glm」.
- **(d) 수정:**
  - **머리말:** 둘째 문장을 다음으로 바꾼다. 「이 보고서는 별·다운로드·유지율을 판단 근거로 쓰지 않는다(08-07 기준). 트랙션 수치는 부록에 둔다.」
  - **'설치 마찰' 행:** 삭제하거나 'PM 본인의 재설치·복구 비용'으로 재정의한다.
  - **기회 (5):** 「게이트웨이 경유 세션(PM의 claude-glm 포함)은 벤더 원격 승인에서 빠진다 — 그 세션의 원격 승인 경로는 AgentDeck LAN뿐이다.」
  - **수익화 문단:** 한 줄로 줄인다. 「수익화는 08-07 결정에 따라 다루지 않는다(09-19 검토의 미결 항목은 그 문서에 남긴다).」

### 5. [과장·처방 오류] 사용량 위협(ToS)과 대체 경로 서술이 둘 다 출처보다 세다
- **(a) 인용:**
  - 「AgentDeck의 Node 데몬이 비공개 `/api/oauth/usage`를 읽는 것은 같은 선 위에 있다.」
  - 「Anthropic은 토큰 중개를 금지하고 "사전 통지 없이" 집행(OpenCode 03-19, OpenClaw 04-04)」
  - 「전환하지 않으면 가장 잘 쓰이는 계기가 하루아침에 죽을 수 있다」
  - 후보 ① 「Claude status-line `rate_limits`(또는 hook 페이로드) 소비, OAuth endpoint 폐기」
  - 「위에만 교차 게이지를 세우면 ToS 리스크가 사라진다.」
- **(b) 문제 (시험 4):**
  - **약관이 실제로 금지하는 것:** 원문이 금지하는 것은 셋이다.
    - Claude.ai 로그인을 자기 앱에서 제공하는 것.
    - 구독 자격증명으로 「route requests … on behalf of their users」 하는 것.
    - 자격증명·세션 토큰을 「collect, store, or intermediate」 하는 것.
  - **읽기 전용 조회는 문언에 없다:** 로컬 도구가 사용자 키체인의 토큰으로 사용량을 읽기만 하는 행위는 문언에 명시되지 않았다.
    - 시장 메모는 이를 '회색지대'(S42)로 적었는데, 보고서는 이 단서를 지웠다.
    - 알려진 집행 두 건은 모두 추론을 중계한 하네스였다. 「같은 선」은 성격이 다른 둘을 합친다.
  - **'사전 통지 없이'의 오용:** 이 문구는 권리 유보 조항이다. 실제 사례를 보면 OpenCode는 법적 요구를 받은 뒤 제거했다. 즉 통지가 있었다.
  - **수치 불일치:** 집행 횟수가 위협 (1)에서는 「두 번」, 타임라인 해설에서는 「세 번」이다.
  - **위험의 범위:** 집행은 계기만이 아니라 사용자(PM 포함)의 구독 계정에 닿을 수 있다. 분석 SDK가 0이므로 「가장 잘 쓰이는」에는 근거가 없다.
  - **한쪽만 본 서술:** App Store Swift 데몬도 비공개 `chatgpt.com/backend-api/wham/usage`를 읽는데, 언급이 없다.
  - **처방의 오류:**
    - hook 페이로드에는 쿼터가 없다.
    - status-line은 `statusLine` 명령 하나만 받으므로 Claude HUD·ccstatusline 사용자와 충돌한다.
    - 값은 살아 있는 세션에서 첫 API 응답이 온 뒤에야 생긴다. Max 사용자에게는 가끔 비어 있다.
    - 모델별 주간 한도가 없어 limit-key가 죽는다.
    - Codex `account/rateLimits/read`는 이미 구현돼 있다.
    - 따라서 비용 '중'은 낮게 잡혔고, 「사라진다」는 과장이다.
- **(c) 증거:**
  - market-demand-monetization.md 219행: S40 원문, 「read-only monitors are called a "gray area" [S42]」, status-line 「after the first API response」.
  - harness-evolution.md 92행: 「sometimes missing for Max users, and the per-model weekly limits are not passed through」.
  - harness-evolution.md 127행: 「after legal demands」.
  - crosscheck §1: 「hook payload는 쿼터를 나르지 않음」.
  - crosscheck §2: `codex-rate-limits-live.ts:393`, `UsageAPIClient.swift:1290`.
- **(d) 수정:**
  - **본문:** 「약관 원문은 구독 자격증명으로 요청을 중계하거나 토큰을 수집·중개하는 것을 금지한다. 로컬 도구의 읽기 전용 사용량 조회는 문언에 없는 회색지대이고, 알려진 집행(OpenCode·OpenClaw)은 모두 추론 중계였다. 다만 집행은 통지 없이 계정 단위로 올 수 있으므로 Claude 게이지는 기본값에서 빼고 동의형 opt-in으로 둔다.」
  - **후보 ①:** 「status-line 릴레이(기존 statusLine 명령 체이닝 포함)를 기본, OAuth 조회는 명시적 opt-in으로 강등. 비용 중–고.」 "(또는 hook 페이로드)"는 지운다.

### 6. [시험 2] "어느 벤더도 만들 유인이 없다" — 두 벤더가 이미 만들었다
- **(a) 인용:**
  - 「미충족으로 남은 네 가지 — 물리적 존재, 에이전트 불문 단일 시야, 클라우드 릴레이 없는 로컬 승인, 로컬 평가 — 는 어느 벤더도 만들 유인이 없고」
  - 「(2) 플랫폼 사업자 셋(Anthropic Desktop Buddy, Elgato MCP Deck, Logitech MX Keypad)이 같은 분면으로 들어왔다.」
  - 「Claude Desktop Buddy 2.65k(Anthropic 공식 BLE API, …)」 대 「"공식 지원 기능 아님", Claude 데스크톱 앱 세션만」
- **(b) 문제:**
  - **이미 만든 벤더:**
    - OpenAI Codex Micro는 RGB 키로 실시간 상태를 보여 주고, accept/reject 키·effort 다이얼·PTT를 갖췄다. AgentDeck 덱 기능의 거의 전부다.
    - Desktop Buddy도 승인 버튼이 있다.
    - 유인이 없는 것은 '벤더 중립' 물리 표면뿐이다.
  - **위협 목록 구성:**
    - PM의 08-07 메모리는 Codex Micro를 「같은 카테고리 진입」으로 적었다. 그런데 위협 목록에 Codex Micro가 없다.
    - 대신 들어간 Elgato MCP Deck은 보고서 스스로 「반대 방향 — AI가 덱을 누른다」고 썼다. 경쟁 메모의 겹침 평가도 「Low–Med today」다.
  - **Desktop Buddy 서술의 비일관:**
    - 절마다 다르다. 한쪽은 '공식 BLE API'·「공식·양방향」이고, 다른 쪽은 「"공식 지원 기능 아님"」이다.
    - README 원문은 「only available when the desktop apps are in developer mode … isn't an officially supported product feature」이다. 대상은 「Claude Cowork & Claude Code Desktop」이고 CLI 언급은 없다.
    - 따라서 「데스크톱 앱 세션만」은 단정이 지나치다. 감시 목록의 「CLI 세션 포함 여부 UNVERIFIED」가 맞는 표기다.
  - **Codex Micro '매진':** UNVERIFIED다. 출처는 2차 자료와 언론이다.
- **(c) 증거:**
  - market-demand-monetization.md 25·116–122행.
  - PM 메모리: 「OpenAI 가 2026-07-15 에 Codex Micro 로 같은 카테고리 진입」.
  - competitive-landscape.md 118행: 「Information flows from AI to actions, not from agent state to keys」.
  - github.com/anthropics/claude-desktop-buddy README(2026-10-16 열람).
- **(d) 수정:**
  - **판정 문장:** 「벤더는 자기 에이전트 전용 물리 표면까지는 만들었다(Codex Micro 07-15, Desktop Buddy 개발자 모드 BLE 04-09). 라이벌 세션까지 보여 주는 벤더 중립 물리 표면만 유인이 없다.」
  - **위협 (2):** 「OpenAI(Codex Micro)와 Anthropic(Desktop Buddy, 비공식 개발자 기능)이 자사 전용 물리 승인 표면을 냈고 Logitech은 개발자 키패드로 접근한다. Elgato MCP Deck은 방향이 반대(AI→덱)지만 플랫폼을 쥐고 있다.」

### 7. [사실 오류] 유통 상태와 '백색 공간'이 낡았거나 AgentDeck 자신을 지운다
- **(a) 인용:**
  - 「Elgato 1.8 공개, 1.8.1 심사 중」
  - 「1.6.0이 마지막 공개, 1.8.x 미게시」
  - 「Ulanzi 1.6.0이 마지막 공개(1.8.x 미게시), Elgato 1.8.1·Apple 1.9.1 심사 중」
  - 후보 ⑧ 「Ulanzi 마켓 복귀」
  - 「Ulanzi는 에이전트 플러그인이 없다」
  - 「아무도 없는 곳: … Ulanzi 덱; … Windows/Linux의 물리 상태; …」
- **(b) 문제:**
  - **낡은 상태 정보:**
    - 트랙션 메모는 10-15 실시간 조회 결과를 담고 있다. Elgato 1.8.1은 10-14에 공개됐고 Ulanzi는 v1.8.1이 라이브다.
    - 보고서는 같은 날 모은 두 증거 중 낡은 쪽(저장소 문서 기반 인벤토리)을 말없이 골랐다.
    - 그래서 '유통 라운드가 심사에 묶임' 행의 근거 절반과 ⑧의 '복귀'가 성립하지 않는다.
  - **AgentDeck 자신을 지운 백색 공간:**
    - 「Ulanzi는 에이전트 플러그인이 없다」는 틀렸다. AgentDeck 자신의 Ulanzi 플러그인이 마켓에 있다.
    - 경쟁 메모는 저장소를 읽지 않았다고 밝혔다. 보고서는 그 메모의 결론을 거르지 않고 옮겼다.
  - **Windows/Linux (시험 5):**
    - 「Windows/Linux의 물리 상태」는 빈 곳이 아니다. Windows에는 VibeDeck·Agent Vitals·Elgato Claude 플러그인이 있다.
    - AgentDeck도 이미 Windows(Stream Deck 플러그인+Node 데몬)와 Linux(데몬+ESP32·Pixoo·Android)에서 상태를 낸다.
    - 문제는 '빈 곳'이 아니라 '이미 하는데 보고서가 말하지 않은 곳'이다.
- **(c) 증거:**
  - agentdeck-metrics.md §1: 「Elgato Marketplace … live, Free, v1.8.1 (published 2026-10-14Z)」, 「Ulanzi Marketplace … live (contentView/1141), v1.8.1」.
  - competitive-landscape.md 11·237–240행.
  - AGENTS.md Windows·Linux 절.
- **(d) 수정:**
  - 상태 열은 트랙션 메모 기준으로 갱신한다.
  - 「Ulanzi 마켓의 에이전트 플러그인은 AgentDeck이 유일하다」로 고친다.
  - 백색 공간 제목은 「AgentDeck 말고는 아무도 없는 곳」으로 바꾸고 Windows/Linux 항목은 지운다.
  - ⑧에서 'Ulanzi 마켓 복귀'를 지운다.

### 8. [시험 1·숫자] 미완 PENDING 블록, 이름표가 틀린 '트래픽', 출처가 사라진 사용자 수
- **(a) 인용:**
  - PENDING 블록 「트래픽·다운로드 실측: GitHub 스타 월별 추이, npm 다운로드, 스토어 등록 상태 — 집계 중」
  - 「속도 — 월 34★는 단일 목적 하드웨어 레포(Desktop Buddy 430, Clawdmeter 440, Clawd on Desk 930)의 약 1/10이다.」
  - 「같은 기간 뒤의 커밋 1,559건 중 97.9%가 소유자이고, 외부 PR은 1건이다.」
  - 「활성 사용자 수십 명(09-13 실측), ESP32·APK 다운로드 수십」
- **(b) 문제:**
  - **PENDING 블록:** 미완 블록이 그대로 배포된다. 데이터는 이미 `agentdeck-metrics.md`(10-15 수집, 완결)에 있다. PM 기준이라면 이 절은 채우지 말고 지우는 편이 맞다(4번).
  - **'트래픽' 이름표:** 비교 대상은 트래픽이 아니라 별 총수다(메모: 「about 10% of the hardware-repo leaders and about 1% of cmux」).
    - 실제 트래픽은 메모에 있다(14일 views 743, clones 7,779). 그런데 쓰지 않았다.
    - 피어의 트래픽은 공개 API로 볼 수 없다. 트래픽 비교는 애초에 불가능하다.
    - '1/100'은 cmux 하나와의 비교다.
  - **별 속도 비교:**
    - Clawd on Desk는 소프트웨어 펫이다. 시장 표에도 「소프트웨어 펫」으로 적혀 있다. 34/930은 1/10이 아니라 1/27이다.
    - 월 34★는 생성 이후 평균이다. 최근 30일은 27★이고 추세는 하락 중이다(7월 52 → 9월 41).
    - Desktop Buddy는 「most stars came at launch」라 평균 비교가 왜곡된다.
  - **커밋 기간:** 1,559건은 07-01 이후 수치다. 6주 창의 수치와 섞였다.
  - **외부 PR:** 「외부 PR 1건」은 트랙션 메모와 다르다. 메모에는 비소유자 PR이 9월 6건, 10월 1건이고 외부 저자가 25명이다. 봇이 포함됐는지 대조해야 한다.
  - **사용자 수의 출처:**
    - 「활성 사용자 수십 명」과 「D7 1% 미만」의 출처 파일은 master에도, 로컬 ref 어디에도 없다(`git log --all -- docs/marketing/commercialization-review-2026-09-19.md` 0건).
    - 유일한 흔적은 메모리 「활성 수십 명(D7 <1% × 256다운로드)」이다. 이 산식대로라면 3명 미만이다. 측정값이 아니라 추정이다.
  - **ESP32 다운로드:** 「ESP32 다운로드 수십」은 메모의 esp32 asset 1,336회와 다르다. 다만 그 1,336회도 OTA·매니페스트 fetch라 사용자 수가 아니다.
- **(c) 증거:**
  - agentdeck-metrics.md §1과 월별 표: Stars 「+27 (30 d)」, Traffic 743/7,779, 「non-owner 46 from 12」, 월별 PRs ext 9월 6·10월 1, esp32 1,336.
  - competitive-landscape.md 48·150·287행.
  - agentdeck-internal-inventory.md 4행(`--since=2026-07-01`).
  - 메모리 `monetization-free-everywhere-stripe-korea-blocker.md`.
- **(d) 수정:**
  - PENDING 블록을 지운다.
  - 트랙션을 남긴다면 부록에 메모 원값만 둔다: 「별 264(생성 후 평균 월 34, 최근 30일 27)·npm setup 월 2,062·Elgato·Ulanzi 1.8.1 라이브」.
  - 커밋 문장은 「07-01 이후 커밋 1,559건 중 97.9%가 소유자다.」로 고친다.
  - '활성 수십 명'은 지우거나 「추정, 산식 불일치 — 근거로 쓰지 않음」으로 표시한다.
  - 출처 경로는 실제 위치로 바꾼다.

### 9. [저장소 결정과 충돌] "PTY 파싱은 은퇴할 수 있다", "#463에서 … 퇴출 결정"
- **(a) 인용:**
  - 「한 번 쓰고 어디서나 관측할 수 있고 PTY 파싱은 은퇴할 수 있다.」
  - 「#463에서 PTY 파싱·키 주입 퇴출 결정」
  - 「ask-gate 홀드·기기 Allow/Deny·주입 사다리·PTT」
  - 「반대로 어떤 대체재도 갖지 못한 것: … 음성·텍스트 주입」
- **(b) 문제:**
  - #273(10-15)은 managed PTY를 장기 호환 경로로 유지하기로 결정했다. 즉시 터미널 조향, Windows 입력, 원격 managed 플래그를 대신할 경로가 없어서다.
  - #463은 "샌드박스 Swift 데몬 안의 덱 제어"라는 범위 결정이다. 제품 전체에서 퇴출한다는 결정이 아니다.
  - 해당 권고는 저장소를 의도적으로 읽지 않은 하네스 메모에서 그대로 옮겨 왔다.
  - 같은 보고서가 주입을 차별점으로 꼽으므로 스스로 모순이다.
- **(c) 증거:**
  - AGENTS.md: 「… a long-term compatibility path with no removal planned (#273 decision …)」
  - `docs/devlog/entries/2026-10-06-deck-agent-native-control.md` 3행: 「It works inside the sandboxed Swift daemon, with no PTY parsing or keystroke injection.」
  - harness-evolution.md 49행: 「The AgentDeck repository was deliberately not read」
- **(d) 수정:**
  - 「새 관측은 훅·app-server로만 짓는다(#273: 기존 managed PTY 경로는 장기 호환으로 유지).」
  - 핵심 가치 1행 근거: 「#463: 덱 제어는 PTY 파싱·키 주입 없이(샌드박스 데몬)」.

### 10. [UNVERIFIED를 사실로 + 놓친 위험] "Cursor는 Claude 훅을 그대로 로드"
- **(a) 인용:**
  - 「(Cursor는 Claude 훅을 그대로 로드)」
  - 「Cursor는 Claude 훅을 그대로 로드하므로 마찰이 가장 낮다」
  - 후보 ③ 「Cursor는 Claude 훅을 그대로 로드(호스트 식별 축 추가)」
- **(b) 문제:**
  - 근거는 Cursor 문서의 「supports loading hooks from third-party tools like Claude Code」까지다. `CLAUDE_PROJECT_DIR` 별칭과 exit code 2 동등성이 언급된다.
  - AgentDeck의 사용자 전역 훅이 Cursor 안에서 실제로 발화하는지는 메모가 UNVERIFIED 시험 과제로 남겼다. 보고서는 이를 네 번 사실로 쓴다.
  - 반대 방향의 위험이 빠졌다. 훅이 실제로 발화하면 `hook-harness.ts`가 Claude 어휘 payload를 Claude로 귀속한다(크로스체크 §5 「Cursor 호스트 여부를 구분하는 축은 없고」).
    - 그러면 Cursor 턴이 지금 이미 Claude Code 행으로 그려지고, APME에서 Claude로 채점되고 있을 수 있다.
    - 이는 "unknown agentType은 다른 에이전트로 그리지 않는다" 불변식 위반이자 평가 데이터 오염이다.
  - 따라서 이것은 기회 이전에 먼저 확인해야 할 결함 후보다.
- **(c) 증거:**
  - harness-evolution.md 95·191·210행: 「Test whether AgentDeck's Claude hooks already fire inside Cursor (UNVERIFIED)」
  - crosscheck §5.
  - AGENTS.md Key Conventions(unknown `agentType`).
- **(d) 수정:**
  - 「Cursor는 Claude Code 훅 설정을 읽는다고 문서화했다(AgentDeck 훅 발화는 UNVERIFIED). 발화한다면 Cursor 턴이 Claude로 오귀속되고 있을 수 있으므로, 첫 단계는 확장이 아니라 발화·귀속 탐침이다.」
  - 탐침은 30일 칸의 ⑥에 넣는다.

### 11. [시험 5] 열 후보의 등급과 누락
- **(a) 인용:**
  - 「4 | presence 오라클 … | 중 | 저」
  - 「벤더 중립 기기 프로토콜을 사실상 선점; 2.65k★ 커뮤니티 기기 흡수」
  - 「ToS 노출과 발견성」
  - 「Anthropic 정책은 기능명에 Claude 이름을 쓰는 것을 금지하므로」
- **(b) 문제:**
  - **② (방향은 맞다):**
    - 근거가 1번의 "Claude만" 오류에 기대고 있다.
    - 비용에 두 가지가 빠졌다. Codex 훅은 해시로 신뢰하므로 바꾸면 사용자가 다시 신뢰해야 한다. 시간 초과 때는 「decline to decide」로 넘기는 처리도 필요하다.
  - **④:**
    - PM 기준으로 관측·평가를 늘리지 않는다.
    - '기기 근접'은 저장소에 없는 감지다. 있는 것은 잠금·유휴 감지뿐이다.
  - **⑦:**
    - 「사실상 선점」은 반대로 썼다. Anthropic의 비공식 개발자 모드 프로토콜을 구현하는 일은 선점이 아니라 그 프로토콜에 종속되는 일이다.
    - 「흡수」는 성장 언어다.
  - **⑩:**
    - 인용된 원문이 금지하는 것은 「Claude Code or Anthropic names」를 제품·기능명에 쓰는 것이다.
    - "Claude Usage"는 측정 대상을 가리키는 서술적 사용에 가깝다.
    - 상표 문제를 'ToS'라고 부른 것도 틀렸다.
    - "Codex Usage"는 그대로 둔다. 기준이 일관되지 않다.
  - **누락:**
    - 3번(judge–사람 정합)이 없다.
    - 은퇴 대상 목록이 없다. PM 질문 4는 '표면 줄이기'를 묻는데 대상을 하나도 제시하지 않는다. 예: Python BLE 워커(TCC SIGABRT 77회 이력).
    - Kiro는 ⑥ 안의 한 줄뿐이다.
    - Windows/Linux 항목이 없다(7번).
- **(c) 증거:**
  - harness-evolution.md 73행: 「can allow …, deny …, or decline to decide」
  - harness-evolution.md 249행: 「Codex skips new or changed non-managed hooks until the user trusts them」
  - crosscheck §3.
  - market-demand-monetization.md 220행(S40 상표 문구).
  - inventory §5(「TCC 경로 고정 박탈(77 crash)」).
- **(d) 수정:**
  - ④는 PM 기준 '저'로 내린다.
  - ⑦의 '무엇을 늘리나'는 「Desktop Buddy 기기에 Codex·OpenCode 상태 표시(Anthropic 개발자 모드 프로토콜에 의존)」로 바꾼다.
  - ⑩의 근거는 「지침은 'Claude Code·Anthropic' 이름을 제품·기능명에 쓰지 말라는 것 — 서술적 사용은 허용 범위일 가능성이 크나 바꾸는 비용이 작으므로 위생으로만」으로 바꾼다.
  - 후보 12 「은퇴 대상 2–3개 명시 — 유지비 대비 관측 기여가 낮은 표면·워커」를 추가한다.

### 12. [시험 8] 핵심 가치 절: 요약과 본문이 다르고, 부채가 가치로 적혀 있다
- **(a) 인용:**
  - 요약: 「이 중 하네스가 대신할 수 없는 것은 마지막 셋이다.」
  - 본문: 「열 가지 중 하네스가 대신해 줄 수 없는 것은 셋이다. 물리적 존재, 에이전트 불문 단일 시야, 그리고 로컬 평가 루프. 나머지 일곱은 품질 규율이라 흡수되지 않지만 경쟁 우위도 아니다」
  - 로컬 우선 행: 「수익화의 전형 경로(구독·팀 대시보드)와 맞바꾸는 순간 사용자가 신뢰한 전제가 사라진다」
- **(b) 문제:**
  - 요약과 본문이 가리키는 '셋'이 다르다.
    - 요약의 "마지막 셋"은 목록 순서상 조종면, "관측·평가 능력" 기준, 물리적 존재다.
    - 본문의 셋은 물리적 존재, 단일 시야, 로컬 평가 루프다.
    - 본문의 셋 중 둘(단일 시야, 로컬 평가 루프)은 열 개 행 어디에도 없다.
  - 「흡수되지 않지만」은 보고서 자신의 흡수 표와 충돌한다. 그 표에서 '진짜 대기'는 「Claude만 완전」, 원격 승인은 「빅 3 흡수」로 판정돼 있다.
  - 부채가 빠져 있다.
    - 조종면: PreToolUse 60초 hold가 AgentDeck을 모든 게이트 도구 호출의 임계 경로에 둔다. 데몬이 멈추면 Claude가 최대 60초 멈춘다.
    - 물리적 존재: 12개 보드와 6개 채널의 유지비가 보고서가 말하는 버스 팩터 위협의 원천이다. 그런데 질문 4는 바로 이 표면을 줄일지 묻는다. 이 긴장이 적혀 있지 않다.
    - 로컬 우선 행: '버리면 깨지는 것'을 수익화로 정의했다(4번의 밀반입).
  - 「'모름'이 '정상'으로 세탁되어 플릿 전체가 잠긴 2026-08-08 류」는 인벤토리 기록과 다르다. 인벤토리는 이 사고를 "토큰 미채택으로 WiFi 플릿 4001 잠김", 즉 토큰 보관 문제로 기록한다. 세 답 규칙의 사례인지는 확인이 필요하다(확신 낮음).
- **(c) 증거:** 보고서 흡수 표, crosscheck §4(`--max-time 60`), inventory 87행.
- **(d) 수정:**
  - 요약: 「하네스가 대신할 수 없는 것은 물리적 존재·벤더 교차 시야·로컬 평가 셋이다.」
  - 본문: 「열 가지 중 경쟁 우위는 물리적 존재 하나다. 교차 시야와 로컬 평가는 이 원칙들이 지키는 결과다. 나머지는 품질 규율이며, 일부(진짜 대기·원격 승인)는 이미 흡수됐다.」
  - 표에 '이 원칙의 비용' 열을 추가한다.
  - 로컬 우선 행: 「클라우드 백엔드가 생기는 순간 LAN default-deny·토큰 단일 초크포인트라는 보안 경계가 바뀐다」.

### 13. [시험 6] 시나리오 셋은 축이 섞여 결정을 바꾸지 못한다
- **(a) 인용:** 「C. 계기판 | 현상 유지 + 깊이: … | — (기본 경로)」 / 「제안은 C를 기본으로 두고 B의 싼 부분(공개 스펙 문서화)을 얹으며, A의 징후를 분기마다 점검하는 것이다.」
- **(b) 문제:**
  - A·B는 외부 세계의 상태이고, C는 AgentDeck의 선택이다. 축이 달라서 서로 배타적이지 않다.
  - A(Desktop Buddy 정식화)와 B(BLE로 수렴)는 한 사건으로 함께 일어날 수 있다. C는 어느 세계에서도 고를 수 있다.
  - C에는 징후가 없다. 그래서 결론이 표보다 먼저 정해져 있다.
  - 망라적이지도 않다. 보고서가 위협 1위로 꼽은 '관측 기반 붕괴'(OAuth 집행, 훅 회귀)가 없고, PM 하네스 구성의 변화도 없다.
- **(c) 증거:** 시나리오 표, 「가장 큰 위협 셋」 (1).
- **(d) 수정:** 외부 축 두 개로 2×2를 만든다. ① 벤더가 교차 물리 상태를 낸다/안 낸다, ② 관측 기반이 끊긴다/유지된다. 각 칸에 '대응'과 '징후'를 적는다. 또는 표를 「분기 점검 징후 6개」 목록으로 바꾼다.
  - Desktop Buddy 레포 재가동
  - Codex Micro 재입고 또는 CLI 지원
  - Elgato SDK agent-state
  - OAuth 사용량 차단
  - Claude 훅 회귀
  - PM 하네스 구성 변화

### 14. [시험 7] PM 질문 다섯 중 진짜 결정은 둘
- **(a) 인용:**
  - 「2026-08-07 입장(취미·평가 중심, 사업화 없음)을 유지하는가? 유지하면 ⑤⑦⑧의 범위는 '개인 책상'으로 한정하고 팀 보드·B2B eval은 꺼둔다.」
  - 「기준은 본인이 그 하네스를 쓰느냐다.」
  - 「이름: AgentDeck 유지인가? 동명 레포 9개와 1.1k★ TUI가 같은 검색어를 차지한다 — 부제·검색어로 다룰 수 있다.」
- **(b) 문제:**
  - Q1은 수사적이다. 보고서 전체가 유지를 전제하고, 바꿀 새 증거도 없다. 조건절의 '팀 보드·B2B eval'은 어느 후보에도 없다.
  - Q3은 결정이 아니라 조회다. 타임라인과 APME에 PM이 실제로 돌리는 하네스가 이미 기록돼 있다.
  - Q5는 성장 질문이다. 보고서가 저/저로 매긴 위생 항목이다. 숫자도 이중 계산이다. 9개에는 TUI가 이미 포함돼 있고, 앞에서는 「8개 이상」·「8개」라고 썼다.
  - 진짜 결정은 Q2와 Q4다. 다만 Q4에는 대상 목록이 필요하다.
  - 빠진 결정이 있다.
    - (i) OAuth 게이지를 기본값으로 둘지, opt-in으로 내릴지, 제거할지
    - (ii) judge를 PM 라벨로 검증할지(3번)
    - (iii) 은퇴시킬 표면·채널(11번)
- **(c) 증거:** competitive-landscape.md 49행(「At least 8 other」), 311행(「At least 9 … named AgentDeck or agent-deck」).
- **(d) 수정:** Q1·Q3·Q5를 위 (i)–(iii)으로 바꾼다. Q3의 답은 APME를 조회해 본문에 적는다.

### 15. [시험 9] 독자에게 너무 길고, 반복되며, 숫자와 오타가 흔들린다
- **(a) 인용:** 「리서치는 네 갈래로 나눠 모델과 effort를 달리 배정했고」(표는 6행) / 「오프스크린 쪽은 얘다」 / 「흡수된 것은 세 덧이다」 / 「보완재로 바뀜다」 / 「곷 평가 편향」 / 「첨째 VibeDeck」 / 「조용히 늑는다」
- **(b) 문제:** 독자는 이 코드를 쓴 단독 유지보수자다. 본문 약 2만 자, 표 9개는 이 독자에게 너무 길다.
  - 덜어낼 곳:
    - 표면 표 10행은 독자가 이미 안다. 상태 열만 부록으로 옮긴다.
    - 에이전트 표는 1번 수정 후 한 문단이면 된다.
    - 시장 절(4분면 표·대체재·감시 목록·백색 공간)은 '대체재 대비 열세'와 Q5와 겹친다. 하나로 합친다.
    - 흡수 표(9×6)는 판정 열만 남긴다.
    - 「방법과 비용」에는 비용이 없고, '네 갈래'라고 해 놓고 표는 6행이다.
  - 반복: Cursor 훅 4회, OAuth·ToS 5회, 버스 팩터 5회.
  - 숫자 불일치: 집행 '두 번' 대 '세 번', 동명 레포 '8개 이상'·'8개'·'9개'.
- **(c) 증거:** 보고서 본문, 각 메모.
- **(d) 수정:**
  - 본문을 절반(약 1만 자)으로 줄인다.
  - 순서는 '한눈에 보기 → 바닥(1·5번 수정본) → 재채점한 후보 표 → 결정 질문 → 부록(시장·하네스·트랙션·방법)'으로 바꾼다.
  - 오타 7곳을 고친다: 얕다, 가지, 바뀐다(2곳), 곧, 첫째, 늙는다.

---

## 고치지 말아야 할 것 (리뷰어가 '수정'하고 싶어질 부분)
1. **「수요 증거가 없다, 일부러」 행.** 「'무엇을 더 만들기'의 근거가 외부 수요가 아니라 PM 본인의 관측 필요로 제한된다는 점은 인정해야 한다」는 입장을 정직하게 적은 문장이다. "수요 데이터를 보강하라"는 수정은 하지 말 것.
2. **수익화를 열 후보에서 뺀 결정 자체.** 남은 문단만 지우면 된다. "그래도 Sponsors는 넣자"는 식의 되돌리기는 하지 말 것.
3. **「포지션을 바꾸지 말고, 설명을 바꾸고, 바닥을 고치라」와 흡수 판정.** 「벤더 안에서는 끝났다; 벤더 간·오프스크린만 남음」은 벤더 앱과 정면으로 경쟁하는 쪽으로 피벗하려는 유혹을 막는 정확한 결론이다.
4. **저장소로 메모를 바로잡은 크로스체크.** 폰 원격 승인이 클라우드 릴레이 없이 이미 있다는 점(`Protocol.kt:691`, `ObservedSteering.swift:11`)과 Codex가 알림 전용이라는 file:line 근거는 저장소를 읽지 않은 메모를 바로잡은 좋은 사례다. 후보 ②의 방향(Codex에 hold를 붙이는 것)도 옳다.
5. **출처 규율과 '생존 때문에 ①을 먼저'라는 순서 논리.** 절마다 출처와 UNVERIFIED를 표기한 방식은 유지할 것. 지워진 UNVERIFIED 몇 곳(Cursor, JetBrains, Polar, Desktop Buddy CLI)만 복원하면 된다.

**검증 범위.** 메모 5개, 트랙션 메모, 저장소 read-only grep, Desktop Buddy README(1회 열람)를 확인했다. 08-08 4001 사고의 귀속(12번)과 비소유자 PR 중 봇 비중(8번)은 확인하지 못했다.
