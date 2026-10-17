# 2026-10-17 — 기록 조회와 실시간 데몬 연결 격리

계측 없는 10분 관찰에서 Work board 두 번과 health 한 번이 5초 timeout에 도달했다.
PID와 build는 유지됐고, 관찰용 WebSocket과 실제 Claude 두 세션도 유지됐다.
SQL만 시간을 재는 후속 관찰에서 page 조회 2.8–3.2초, 이후 최대 11.8초를 확인했다.
같은 구간 독립 Node 프로세스의 20ms 타이머 최대 지연은 50ms 미만이었다.
Mac 전체 load average 400 이상도 관찰됐으나, 이를 개별 조회의 유일한 원인으로 단정하지 않는다.

Node `/apme/tasks`, `/apme/communications`를 한 읽기 전용 worker로 옮겼다.
기존 HTTP projection을 추출해 기존 store SQL·필터·표시 규칙을 그대로 사용한다.
worker는 기존 파일을 read-only/query-only로 열고 DDL·seed·migration을 실행하지 않는다.
페이지와 집계는 WAL read snapshot 안에서 읽고 JSON encoding도 worker에서 수행한다.

동일한 요청은 합치며 서로 다른 대기 요청은 8개로 제한한다. 각 요청에 10초 deadline을
적용하고, 만료·crash·종료 시 해당 generation 전체를 거절한다. 종료가 지연되는 worker가
퇴장하기 전에는 새 worker를 만들지 않는다. 실패는 503이며 메인 스레드 동기 조회로
우회하지 않는다. 인증 경로와 SQLite writer ownership은 바꾸지 않았다.

회귀 검사는 실제 빌드 worker의 DTO/WAL 가시성, read-only·무DDL·없는 파일 비생성,
막힌 worker 중 HTTP health 응답, timeout·queue 상한·합치기·퇴장 지연·crash를 검증한다.
깨끗한 npm 설치의 실제 daemon에서도 두 endpoint와 worker 활성 상태를 확인한다.
Swift UI/daemon의 이 변경 단계 소스는 수정하지 않았다. 실제 앱 연결 및 3D 화면 결과는
별도 런타임 기록으로 구분하며, 화면 접근 잠금 해제 전에는 시각 검증 완료를 주장하지 않는다.
