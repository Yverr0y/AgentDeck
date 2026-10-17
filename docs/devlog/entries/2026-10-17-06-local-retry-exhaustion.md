# 2026-10-17 — 로컬 연결 재시도 소진 후 복구

최종 composer 필터 설치 상태에서 시스템 load average 96의 고부하가 겹쳤다. 실제
Node health timeout과 native WebSocket 종료를 포착했다. CPU profile의 시간 가중치는
ESP32 port 탐색, display fallback, ADB subprocess 생성 등 OS 호출에서 수초의 지연을
보였다. 다른 세션의 작업은 종료하지 않았으며 고부하 원인이 모두 해결됐다고 주장하지 않는다.

health가 다시 응답해도 native는 `Could not connect to the selected host`에 머물렀다.
socket 재시도 소진 후 원격은 Bonjour 이벤트로 복구하지만, preferred local endpoint는
그 경로를 제외한다. 게다가 선택된 loopback URL과 Bonjour의 LAN 주소는 동일 endpoint로
간주할 수 없다. 재시도 소진 후 동일하게 선택된 preferred local URL만 30초의 조용한
간격 뒤 다시 시도한다. 명시적 stop, 인증 거절, 새 endpoint 선택, 앱 종료는 예약을 취소하고
실행 직전에도 상태를 확인한다. 다른 호스트 선택이나 인증 확장은 없다.

실제 loopback 서버 기반 회귀 검사를 추가했다. 성공한 local 연결을 끊은 뒤 소진 상태를
만들고, Bonjour 없이 예약된 같은 URL에 재연결하는지, explicit stop 후 재예약이 금지되는지
검사한다. OS AutomationMode 인증 대기로 XCTest 실행은 별도로 미완료 상태를 유지한다.
