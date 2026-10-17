# 2026-10-17 — Codex Desktop의 불확실한 rollout 조회 유지

Dashboard 재연결 측정에서 세 Codex 대화의 bare thread id는 유지되는데 표시 id가
`observed:codex-app:`와 hook fallback의 `observed:codex:` 사이에서 함께 바뀌었다.
Claude 테스트 두 세션은 관찰 기간 내내 남아 있었다. 이 prefix 교체를 세 대화가 종료된
증거 또는 세션 수가 그만큼 줄어든 증거로 해석하지 않는다.

`passive-observer.ts`는 `lsof` timeout·권한 실패를 빈 파일 집합으로 처리했다. 이때 기존
Desktop 관찰을 삭제해 hook fallback의 다른 표시 identity가 노출됐다. 실패 또는 요청한
PID 일부가 빠진 frame은 이제 불확실한 조회로 처리해 같은 harness의 owner가 확인되는
Codex identity와 그 observation stamp를 유지한다. 다른 owner의 확인된 종료는 계속 반영한다. 성공한 전체 frame에서 rollout이 닫힌 경우는 기존대로 제거한다.
`/diag.passiveObserver.codexRolloutReadFailures`에 실패 횟수를 기록한다.

회귀 검사는 실제 임시 rollout으로 첫 Desktop 행을 만든 뒤 조회 실패, 보존, 명시적인
빈 결과의 제거를 순서대로 검증한다. POSIX procfs의 읽을 수 없는 집합도 불확실하게
처리하며, 나열 후 닫힌 FD의 ENOENT는 정상적인 race로 넘긴다.

이전 실행의 전역 JSON/파일 계측은 매 호출의 stack capture 비용까지 포함했다. 그때의
후반 timeout을 계측 없는 앱 지연으로 단정하지 않고, 모든 계측을 복원·종료한 뒤 다시
측정한다. 새 macOS 산출물은 시작 전 정지 및 후속 SwiftCompile 오류로 실제 설치를
유지하지 않았다. 마지막 정상 설치본을 복원했으며, 새 데몬 반영 상태와 GUI 확인 상태는
구분한다. 화면 도구가 명시적으로 잠금을 보고해 최종 화면 검증은 잠금 해제를 기다린다.
