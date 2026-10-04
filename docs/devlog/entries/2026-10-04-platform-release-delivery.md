# 2026-10-04 — 1.7 store submissions and platform delivery

## Source and verification

[PR #446](https://github.com/puritysb/AgentDeck/pull/446) merged as
`2ee27840d0f63e65c433da4cad026890f5fa81e5` after all ten CI checks passed.
This is the exact source of the Android, ESP32, Stream Deck and Ulanzi tags.
Apple's already-submitted 7701 build remains from `65847d64`; see the
[Apple receipt](docs/devlog/entries/2026-10-04-platform-release-preparation.md).
No Apple queued binary or tag was replaced.

Local build/typecheck, protocol drift, documentation/catalog/devlog/token checks,
Android's 449 tests and signed APK/AAB builds, and both plugin packaging checks
passed. New Ulanzi discovery/client coverage passed 15 tests. The initial full
Vitest run found one old 1.6.0 fixture expectation; it was corrected and the
relevant 15-test suite passed, followed by clean full CI. The built checkout's
92 design-lint findings were existing/generated-output findings; the clean CI
regression gate passed. These checks do not establish Windows/WSL2 physical
acceptance for #445, nor the processed Stream Deck encoder review loop.

## Channel receipts

| Channel | Measured state | Evidence / next gate |
|---|---|---|
| Apple iOS/macOS | 1.7.0 (7701), Waiting for Review | Separate submissions at 08:53/08:54 KST; linked receipt above |
| Android GitHub | 1.7.0 signed APK published | [Release run 37164393964](https://github.com/puritysb/AgentDeck/actions/runs/37164393964) |
| Google Play | 24 (1.7.0), full rollout submitted; Changes in review / quick checks | [Publishing overview](https://play.google.com/console/u/1/developers/7107476187102902603/app/4975606862124022024/publishing); managed publishing off |
| Stream Deck | Package 1.7.0.0, Pending review · 1.7 | [Release CI artifact](https://github.com/puritysb/AgentDeck/actions/runs/37164391977); automatic publication off until DRM-processed encoder acceptance |
| Ulanzi | 1.7.0, Works under review (1) | [Review work](https://ugc.ulanzistudio.com/my/0); [GitHub release CI](https://github.com/puritysb/AgentDeck/actions/runs/37164964246) passed |
| ESP32 | 1.7.0 tag pushed; sequential board builds running | [Release workflow](https://github.com/puritysb/AgentDeck/actions/runs/37164390316); public delivery unconfirmed |
| npm | 1.7.0 packed, not tagged or published | Three-mode macOS/CLI soak blocked by locked Mac |

The Stream Deck CI artifact must be uploaded to Maker Console, so its artifact
release preceded marketplace submission. Neither that GitHub Release nor the
submission is a claim of marketplace publication. The unrelated old 1.4
Ready to publish version was not released.

## Store content

Apple's existing previews/screenshots remain representative, and the native
Hermes simulator capture was inspected. No new preview video was uploaded.
Play release notes cover English, Korean and Japanese; existing galleries remain.
Ulanzi's seven locale pairs were restored after ZIP upload, saved, then read back
exactly; unsupported Dial and AU05 selections introduced by the uploader were
removed and their saved exclusion verified. The existing banner and equivalent
regenerated cover were retained. Hermes is explicitly read-only in deck listings.
The first Ulanzi submission expired with the login session; a fresh login and
resubmission produced exactly one pending review record.

Canonical submitted copy and receipts: [Play listing](marketplace/play/LISTING.md),
[Elgato listing](marketplace/elgato/LISTING.md),
[Ulanzi listing](marketplace/ulanzi/LISTING.md).

## npm continuation

Four 1.7.0 candidate tarballs were packed from clean `2ee27840`. The submitted
macOS 1.7.0 (7701) package was downloaded from Apple release CI, expanded, and
passed the App Store archive verifier. Privacy preflight passed. Native app
launch was refused because the Mac was locked; no required soak row is claimed.
The installed CLI/runtime was not replaced or stopped.

Measured global versions before any candidate install: bridge 1.6.0, hooks,
shared and setup 1.4.2. Rollback to that exact global package set:

```bash
npm install --global @agentdeck/bridge@1.6.0 @agentdeck/hooks@1.4.2 @agentdeck/shared@1.4.2 @agentdeck/setup@1.4.2
```

After unlock, use the clean `2ee27840` release source and macOS 7701 candidate,
complete all three [pre-tag soak rows](RELEASING.md#pre-tag-three-mode-daemon-soak)
with a real agent turn and visible downstream delivery, record results in the
release issue, then push `npm-v1.7.0` and verify all four npm versions. Do not
substitute the older installed macOS 1.5.0 (4) app or a temporary-prefix smoke.
