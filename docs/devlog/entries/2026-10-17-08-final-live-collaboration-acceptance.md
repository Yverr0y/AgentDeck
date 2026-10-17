# 2026-10-17 — 실제 통신 화면 및 지속 연결 최종 확인

Node PID 59443, port 9120, build `e135110d1c6e`가 main의 dist digest와 일치했다.
서명 검증한 설치 앱의 dylib SHA-256은
`826f0f6a22743cababa5b2103b5696c4dc99417f700cc9d3e677ce822005a9bb`이고,
실제 검증 빌드 파일과 일치했다. executable 변경의 마지막 commit은 `1b15c7d6`이다.

실제 Claude CLI 두 개에서 알림 → 응답 요청 → 역방향 별도 FYI → 명시적 응답을 보냈다.
양방향 hook 관찰의 intent 네 종류가 모두 맞았고, Collaboration과 실제 underwater 3D의
물살/기포·크리처 caption까지 확인했다. 알림은 timer 없음, 요청에만 timer 시작, FYI는
기존 요청 timer 유지, 명시적 응답은 timer 해제였다. 특히 `no reply is requested`와
`Please do not send a response`가 포함된 실제 알림도 notification으로 남았다.

진단 프록시를 제거한 직접 연결에서 native PID 75882는 단일 WebSocket task를
664,817ms 유지한 뒤 정상 Cmd-Q로 종료했다. 연결 관찰 288회(609,060ms), 미확인 probe·
연결 누락·receive error는 0이었다. 이후 정상 앱 실행으로 복귀한다.
실제 데몬 660,062ms 측정은 health 329회, Workboard 43회, communications 65회 모두
오류 0, observer WS 예기치 않은 종료 0, roster 269회 모두 10개·제거/테스트 세션 누락 0.
health 최대 1,335ms, history 최대 4,570ms였다. history worker failure/timeout은 0이며,
Codex rollout probe 실패 counter 11 동안에도 census를 유지했다.

의도적인 35초 연결 차단에서는 앱 버튼 조작 없이 53,475ms에 같은 URL로 복구됐다.
최종 실행 기록과 AX/스크린샷은 gitignored diagnostics의 dashboard-stability 하위에 보존했다.
고부하 때 모든 OS 지연이 사라진다는 주장은 하지 않는다. 앞선 부하 구간의 실패도 보존했다.

`verify:quick` 5,957 pass/8 skip, clean npm package acceptance, 서명된 native
build-for-testing 및 최신 native changed-area의 macOS Release/iOS/Dot iOS 빌드는 통과했다.
macOS Debug/Dot XCTest는 테스트 시작 전 AutomationMode → LocalAuthentication 대기여서
미완료다. 실패한 원래 full receipt와 두 scope를 제외한 재실행 receipt를 함께 보존했다.
