import XCTest

final class Acceptance: XCTestCase {
    func capture(_ app: XCUIApplication, _ name: String) {
        let tree = XCTAttachment(string: app.debugDescription)
        tree.name = name + "-accessibility"
        tree.lifetime = .keepAlways
        add(tree)
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
    func testTimelineSelection() throws {
        continueAfterFailure = false
        let app = XCUIApplication(bundleIdentifier: "bound.serendipity.agent.deck")
        app.terminate()
        app.launch()
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 15))
        let codex = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] %@", "Codex")).firstMatch
        XCTAssertTrue(codex.waitForExistence(timeout: 30), app.debugDescription)
        let clear = app.buttons["Clear timeline filter"]
        if clear.exists {
            clear.tap()
            XCTAssertTrue(clear.waitForNonExistence(timeout: 10))
        }
        codex.tap()
        XCTAssertTrue(clear.waitForExistence(timeout: 10), app.debugDescription)
        capture(app, "codex-selected")
        clear.tap()
        XCTAssertTrue(clear.waitForNonExistence(timeout: 10), app.debugDescription)
        let claw = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "OpenClaw session")).firstMatch
        XCTAssertTrue(claw.exists, app.debugDescription)
        claw.tap()
        XCTAssertTrue(clear.waitForExistence(timeout: 10))
        capture(app, "openclaw-selected")
        clear.tap()
        XCTAssertTrue(clear.waitForNonExistence(timeout: 10), app.debugDescription)
        capture(app, "filter-cleared")
    }
}
