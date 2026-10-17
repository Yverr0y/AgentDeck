#if os(macOS)
import XCTest
import SQLite3
@testable import AgentDeck

@DaemonActor
final class ApmeHotReadPlanTests: XCTestCase {
    func testNativeOpenInstallsPayloadFreeRollupAndQueueIndexes() async throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        setenv("AGENTDECK_DATA_DIR", directory.path, 1)
        let store = ApmeStore()
        defer { store.close(); unsetenv("AGENTDECK_DATA_DIR"); try? FileManager.default.removeItem(at: directory) }
        XCTAssertTrue(store.open())
        var db: OpaquePointer?
        XCTAssertEqual(sqlite3_open_v2(store.dbPath, &db, SQLITE_OPEN_READONLY, nil), SQLITE_OK)
        defer { sqlite3_close_v2(db) }

        let queries: [(String, String)] = [
            ("SELECT prompt FROM turns WHERE task_id='t' ORDER BY turn_index LIMIT 1", "idx_turns_task_position"),
            ("SELECT SUM(COALESCE(files_modified,0)+COALESCE(files_created,0)) FROM turns WHERE task_id='t'", "COVERING INDEX idx_turns_task_files"),
            ("SELECT COUNT(*) FROM turns WHERE task_id='t' AND response IS NOT NULL", "idx_turns_task_answered"),
            ("SELECT 1 FROM turns WHERE task_id='t' AND response IS NULL LIMIT 1", "idx_turns_task_unanswered"),
            ("SELECT score FROM evals WHERE task_id='t' AND metric='overall' ORDER BY created_at DESC LIMIT 1", "COVERING INDEX idx_evals_task_metric_recent"),
            ("SELECT id FROM runs WHERE ended_at IS NULL AND started_at<1 AND task_prompt IS NULL AND NOT EXISTS (SELECT 1 FROM turns WHERE run_id=runs.id) LIMIT 20", "idx_runs_empty_open"),
            (#"SELECT id,run_id,task_category FROM tasks WHERE ended_at IS NOT NULL AND ended_at>=0 AND NOT (composite_score IS NOT NULL OR summary IS NOT NULL) AND NOT (notes_json IS NOT NULL AND notes_json LIKE '%"notGradeable"%') ORDER BY ended_at DESC LIMIT 20"#, "idx_tasks_unjudged_queue"),
        ]
        for (sql, expected) in queries {
            var statement: OpaquePointer?
            XCTAssertEqual(sqlite3_prepare_v2(db, "EXPLAIN QUERY PLAN " + sql, -1, &statement, nil), SQLITE_OK)
            defer { sqlite3_finalize(statement) }
            var details: [String] = []
            while sqlite3_step(statement) == SQLITE_ROW {
                details.append(String(cString: sqlite3_column_text(statement, 3)))
            }
            let plan = details.joined(separator: "\n")
            XCTAssertTrue(plan.contains(expected), plan)
            XCTAssertFalse(plan.contains("TEMP B-TREE"), plan)
        }
    }
}
#endif
