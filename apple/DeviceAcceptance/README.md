# Physical-device timeline acceptance

This standalone XCUITest runner exercises the installed `bound.serendipity.agent.deck`
app without adding test code or fixture sessions to the product. It launches the app,
taps a Codex roster entry, clears the filter, selects OpenClaw, and clears again.
Screenshots and accessibility trees stay in the result bundle. Existing connection
and appearance preferences are retained; inspection finishes with no filter.

Prerequisites: paired/unlocked iPhone or iPad, Developer Mode and UI automation
available, the candidate already installed, and a connected dashboard containing
real Codex and OpenClaw sessions. Missing prerequisites fail rather than skip.
Use the deployment skill for installation. Set `device_id` to the target's UDID.

```bash
xcodegen generate --spec apple/DeviceAcceptance/project.yml
xcodebuild test -project apple/DeviceAcceptance/AgentDeckAcceptance.xcodeproj \
  -scheme Acceptance -destination "platform=iOS,id=$device_id" \
  -derivedDataPath diagnostics/apple-device-acceptance/DerivedData \
  -resultBundlePath diagnostics/apple-device-acceptance/result.xcresult \
  -allowProvisioningUpdates
```

Use a fresh result path per run. This is explicit lab acceptance, not an unattended
CI suite. It does not install the app under test, manufacture sessions, establish
Store signing, or validate 3D creature coordinates. On 2026-10-13 it reproduced
header taps being intercepted by overflowing timeline content on iPhone 14 Pro Max;
the same test passed after bounding the scroll hit area and raising the header.
An iPad runner initialization timeout is a tooling failure, not an app pass.
