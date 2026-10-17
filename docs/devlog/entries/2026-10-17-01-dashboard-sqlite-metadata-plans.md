# 2026-10-17 — Dashboard 재연결을 만든 SQLite 메타데이터 조회

실제 앱의 3D Preview에서 Claude CLI 두 세션으로 알림, 응답 요청, 반대 방향 알림을 주고받았다.
알림에는 타이머가 없고, 요청 대기는 3분 36초까지 증가했으며 반대 방향 알림으로 해제되지 않았다.
명시적 답변은 Collaboration에서 `Explicit reply observed`로 확인됐다.

이 과정에서 데몬의 5초 HTTP timeout과 실제 앱의 `Reconnecting...`도 재현됐다. 프로세스 샘플은
메인 스레드의 `better-sqlite3 → sqlite3_step → pread`를 가리켰다. 로컬 inspector로 인자 없이 SQL과
지연만 수집하니 Work board 페이지 5,168ms, 빈 열린 run 탐색 5,956ms, 미평가 task 큐 2,042ms가
기록됐다. 통신 그래프 조회 자체의 지연으로 단정하지 않는다.

4.17GB 라이브 DB의 일관된 복사본에서 작은 메타데이터 인덱스 7개를 검증했다. Work board의 파일 합계,
응답 유무, 첫 prompt 순서, 최신 점수를 payload 행 전체를 읽지 않고 찾게 하고, 빈 run과 미평가 task는
partial index로 후보부터 좁힌다. 후보 생성은 합계 약 0.74초였고 조회 결과 digest는 전후 같았다.
페이지 조회는 이 복사본에서 29ms → 2ms였다. 전후 캐시 온도가 같지 않으므로 라이브 5초 지연의
정확한 개선 배수로 해석하지 않는다.

동기 자식 프로세스 계측에서는 Keychain `security` 5,112ms, Antigravity `sqlite3` 3,633ms,
기본 route 조회 2,527ms도 확인됐다. 실제 quota fetch의 Keychain 읽기를 비동기로 옮기고,
화면·backoff 경로는 마지막 credential 존재 결과만 사용한다. Antigravity는 auth 행을 한 번만 읽고
동시 probe를 합치며 종료·재시작 이전 완료를 폐기한다. LAN 주소의 동기 getter는 사용 가능한
마지막 route 또는 기존 인터페이스 휴리스틱을 즉시 반환하고, route는 단일 비동기 조회로 갱신한다.
평가 경로에서도 `xcodebuild` 10,017ms, Git 상태 3,380ms, 하드웨어 `sysctl` 1,444ms가 관찰돼
명령·diff·하드웨어 조회를 비동기로 바꿨다. outcome sweep와 하드웨어 샘플은 중복 실행을 합치고,
Git 대기 중 다른 작성자가 결과를 결정했다면 덮어쓰지 않는다. hook 경계의 HEAD는 작은 Git
메타데이터 파일에서 직접 읽어 수집 순서를 유지하며, 알 수 없는 값은 null로 남긴다.
모든 새 자식 조회에는 기존 제한 시간과 SIGKILL 종료가 적용된다. 별도 타이머가 promise도
제한 시간에 끝내며, 종료 callback이 오기 전까지 같은 조회를 재실행하지 않는다. 이 검증 도중
`xcodebuild`가 성공 출력 후 커널의 `?E` 상태에 남아 SIGKILL로도 회수되지 않는 현상을 실제로
관찰했으므로, 자식의 종료 통지를 기다리는 것만으로 timeout을 구현하지 않는다. Keychain의 조회 불가·timeout도
자격 증명 부재와 구분해 이전 credential 상태를 보존하고 quota는 stale로 돌려준다.

SQL은 `shared/apme-read-indexes.json`이 소유하며 생성기로 Node와 Swift migration을 함께 만든다.
기존 Work board와 background queue 테스트는 실제 DAO의 SQL 계획을 검사하고, native 테스트는
Swift 저장소를 연 뒤 플랫폼 SQLite의 계획을 확인한다. 배포 후 라이브 검증 결과는 별도 기록한다.

초기 3D 장면은 배경과 크리처가 보이지 않고 통신 overlay만 보였다. 같은 설치 빌드의 장면과
USDZ를 별도 진단 창에서 실행하면 정상이고, 실제 앱을 재시작하자 복구됐다. 이 복구만으로 장시간
실행 중 렌더러가 빈 화면이 된 원인까지 해결됐다고 주장하지 않는다. 화면과 원본 진단은 gitignored
`diagnostics/dashboard-stability/3d-final-20261017/`에 보관한다.

검증은 최종 `verify:quick` 5,934개 통과, 일반·Dot macOS XCTest와 iOS 빌드, submission
bundle 경계, Android/ESP32 및 깨끗한 npm 설치 검사를 포함한다. `verify:full --record`의 첫 기록은
성공 출력 후 종료되지 않던 macOS Release 검증 shell을 SIGTERM으로 해제해 실패로 남겼다.
그 단계는 다른 native 빌드가 끝난 뒤 `verify:changed --only apple-macos-release`로 단독 재실행해
4분 30초에 통과했다. 첫 실패를 지우거나 전체 full 실행이 성공했다고 바꾸지 않는다.
macOS opt-in daemon E2E, Windows 현장 실행, 수동 lab gate는 이 기록으로 인증하지 않는다.
