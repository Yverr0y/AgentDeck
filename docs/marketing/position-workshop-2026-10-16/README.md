# AgentDeck 포지션 워크숍 — 2026-10-16 리서치 원본

보고서 본문은 Claude Doc 「AgentDeck 포지션 워크숍」(https://claude.ai/code/artifact/c53fd680-2212-40b8-990b-0097d448c0f4)이고, 이 디렉터리는 그 보고서가 기댄 리서치 원본을 보존한다. 결론과 PM 결정, 기각한 대안은 [devlog 2026-10-16](../../devlog/entries/2026-10-16-position-workshop-decisions.md)에 있다.

| 파일 | 내용 | 작성 | 언어 |
|---|---|---|---|
| `harness-evolution.md` | 2026년 하네스 진화 타임라인(Claude Code·Codex·Copilot·Cursor·기타), 흡수/미충족 지도, 리스크·기회 | Opus 5.5 (effort high), 웹 리서치 41회 | EN |
| `competitive-landscape.md` | 4분면 경쟁 지형(세션 오케스트레이터·모니터링/평가·덱 통합·데스크 하드웨어), GitHub·npm 수치 2026-10-15 | Opus 5.5 (high) | EN |
| `market-demand-monetization.md` | 수요·페르소나·유통·수익화 메모(43회 검색 + 공개 API 4종) | Opus 5.5 (high) | EN |
| `agentdeck-metrics.md` + `metrics.json` | 저장소 트래픽 실측(스타·포크·이슈/PR 작성자·npm·스토어), 당시 분석에 사용한 `scripts/` 사본 | Sonnet 5.5 (low) | EN |
| `internal-inventory.md` | 저장소 전수 인벤토리(README·docs·rules·devlog·issues·PR) — master @ c773e23b | claude-glm 세션 (GLM 5.3) | KO |
| `crosscheck.md` | 외부 리서치 클레임 12건 × 저장소 실제 구현 교차 확인(file:line) | claude-glm 세션 | KO |
| `red-team-review.md` | 보고서 초안 적대적 검토(판정: 수정 후 배포)와 반영 결과 | Opus 5.5 (effort xhigh) | KO |

보존하지 않은 것: `agentdeck-metrics.md`가 참조하는 `raw/`(API 응답 원본 10 MB)는 커밋하지 않았다. `scripts/analyze.py`·`scripts/assemble.py`는 당시 원본 입력을 읽어 지표와 보고서를 만드는 분석 스크립트 사본이며, API 응답을 재수집하지 않는다. 재실행에는 별도로 보관한 원본 `raw/` 입력이 필요하다. `scripts/lib.sh`도 당시 수집 보조 함수의 사본으로, `RAW`는 그 세션의 scratch 경로에 고정돼 있다. 따라서 이 체크아웃만으로 수집·분석 전체를 재현할 수 없다.

주의: 전부 날짜가 박힌 스냅샷이다. 수치(스타·버전·스토어 상태)는 2026-10-15/16 기준이고, UNVERIFIED 표기는 그대로 둔다. 정책과 로드맵의 정본은 이 메모가 아니라 저장소 규칙과 devlog다.
