# 2026-10-17 — 새 연결의 재시도 의도 분리

설치 앱을 실제 Node로 전달하는 로컬 진단 프록시에 연결하고 daemon의 계획된 재시작을
관찰했다. 프록시는 registry 교체 중 ENOENT로 종료했으므로 해당 첫 실행은 통제된
fault injection 성공으로 세지 않는다. native 로그에는 첫 연결 후 단 한 번의 연결 실패만
있고 다섯 번의 retry budget 소진 callback까지 도달하지 않은 것이 확인됐다.

`connectTo`의 disconnect/connect가 이전 socket의 `isReconnecting` publish와 겹치면
새 connectInternal이 자신을 재시도로 판단한다. disconnect가 내린 shouldReconnect를
다시 켜지 않고, 첫 실패 후 영구 정지한다. fresh/retry 여부를 Published UI 값에서 추론하지
않고 호출 인자로 전달한다. fresh 연결은 socket queue에서 재시도 의도를 설정하고 budget을
초기화하며, 예약된 옛 연결·UI publish는 generation이 달라지면 무시한다.

실제 HTTP 503 loopback 서버로 기존 retry 중 disconnect/connect한 뒤 새 연결도 자동
재시도를 이어가는 검사를 추가했다. OS 인증 대기로 XCTest 실행은 여전히 미완료이며,
컴파일과 실제 앱 fault injection의 결과는 최종 기록에 구분해 남긴다.

서명된 build-for-testing이 완료됐고, 실제 설치 앱에 35초의 연결 차단을 주입했다.
fresh 실패 + 자동 retry 5회를 거친 뒤, 마지막 실패로부터 30,072ms 후 같은 URL의
handshake와 연결이 성공했다(차단 시작부터 53,475ms). 재시도 버튼은 누르지 않았고,
실제 AX 화면에 10 sessions와 Notification 그래프가 복구된 것을 확인했다.
진단 프록시는 종료하고 정상 데몬 직접 연결로 돌려 최종 메시지/지속 연결 검증을 이어갔다.

`verify:quick` 5,957개 통과/8개 skip. `verify:full --record --allow-dirty
--skip apple-macos,apple-dot-macos`의 나머지 scope와 clean npm package acceptance는 통과했다.
이 scoped full receipt는 두 macOS XCTest를 포함하지 않는다. 원래 전체 실행의 실패 receipt도
보존했으며, XCTest를 포함한 전체 검증 완료라는 뜻으로 사용하지 않는다.
