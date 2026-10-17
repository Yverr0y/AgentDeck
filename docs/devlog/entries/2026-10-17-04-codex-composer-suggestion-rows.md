# 2026-10-17 — Codex 자동 다음 메시지 제안의 임시 세션 제외

연결 안정성 관찰의 roster 10↔11 증감을 별도로 조사했다. 네 제거 항목 모두 PID 0인
hook fallback Codex 행이었고, 실제 APME run의 prompt가 두 문장으로 시작했다:
`This is an app-generated request for a suggested next user message.`
`The user did not write this message.`
이것은 사용자의 작업이 아닌 Desktop의 자동 composer suggestion이었다.

기존 ambient 필터는 예전 hyperpersonalized suggestions와 safety review만 알아봤다.
Node의 canonical prompt pattern에 명시적인 두 문장의 anchored signature를 추가하고
Swift mirror와 shared vector를 함께 갱신했다. 중간 인용·block quote·첫 문장만 있는
실제 사용자 작업은 제외하지 않는다. 첫 prompt에서 기존 SessionStart 효과를 철회하고
이후 hook·OTel을 무시하는 기존 수명주기를 사용한다. 과거 SQLite 기록은 삭제하지 않았다.

실제 Claude 두 세션의 알림/요청/역방향 FYI/명시적 응답은 수정 전 설치 앱과 새 Node
worker 배포 상태에서 Collaboration 및 3D 화면까지 확인했다. native의 마지막 측정은
단일 WebSocket 631,083ms로 정상 종료했고, 초기 다른 실행의 1회 교체 원인은 미확정이다.
composer 필터의 최종 배포와 재확인은 이 구현 후 별도로 기록한다.

`verify:quick`은 5,949개 통과/8개 skip이고, 실제 임시 설치 패키지에서도 시작 행 철회와
APME history 0건을 확인했다. Swift의 실제 `CodexAmbientHookRules`를 추출한
Foundation 실행은 shared prompt vector 15개를 통과했다. macOS Debug/Dot XCTest는
테스트 시작 전 OS 인증 대기여서 완료로 처리하지 않았다. test host는 IDE session 준비,
사용자 `testmanagerd`는 AutomationMode → LocalAuthentication에서 대기한 sample을
확보했다. 해당 검증 소유의 host/build만 종료했고 전역 testmanagerd나 보안 설정은
변경하지 않았다. macOS/iOS Release 빌드와 macOS Dot preview boundary는 통과했다.
