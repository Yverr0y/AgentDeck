// GENERATED from shared/src/collaboration-presentation.ts. DO NOT EDIT.
enum CollaborationPresentation {
    static let heading = "Collaboration"
    static let scope = "Live session census"
    static let networkHistoryWindowMs = 86400000
    static let networkEventLimit = 2000
    static let networkRefreshSeconds = 5
    static let networkDetailCharacters = 140
    static let networkSimultaneousWindowMs = 2000
    static let aquariumLinkLimit = 8
    static let aquariumRecentMessageMs = 30000
    static let aquariumBubbleTravelSeconds = 6
    static let aquariumBubbleCount = 3
    static let labels = ["Subagents active","Done this wave","Spawned running","Jobs waited on"]
    static let symbols = ["circle.dotted","checkmark.circle","arrow.up.right.circle","hourglass"]
    static func phase(_ attention: Bool, _ working: Bool, _ children: Int, _ spawned: Int, _ jobs: Int) -> Int {
        return attention ? 0 : working ? 1 : children > 0 || spawned > 0 || jobs > 0 ? 2 : 3
    }
}
