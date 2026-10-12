---
description: Build Android Release APK
---
이 워크플로우는 AgentDeck 안드로이드 앱의 릴리즈 빌드를 수행합니다. JDK 17+ 환경이 필요하며, 스크립트가 Homebrew JDK를 자동 감지합니다.

빌드 자체는 버전 증가 사유가 아니다. 버전을 바꾸거나 배포할 때는
[버전 결정 규칙](../../RELEASING.md#choosing-a-version)에 따라 공개 버전·이미 사용한
빌드 번호·변경 성격을 먼저 기록한다. 기존 기능의 누락·성능·온보딩 보정은 패치로
분류하고, 같은 미출시 버전의 재빌드는 필요한 `versionCode`만 증가시킨다.
GitHub APK와 Play는 동일 Android 제품 버전을 사용한다.

1. 의존성 패키지를 설치합니다.
// turbo
pnpm install

2. 안드로이드 릴리즈 빌드 스크립트를 실행합니다. 빌드된 APK는 `dist/` 폴더에 생성됩니다.
// turbo
bash scripts/build-android-release.sh
