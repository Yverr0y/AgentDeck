// GENERATED from shared/src/collaboration-presentation.ts. DO NOT EDIT.
import Foundation
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
    static func normalizedMessageText(_ body: String) -> String {
        body.replacingOccurrences(of: #"[\u0009-\u000d\u0020\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+"#, with: " ", options: .regularExpression)
            .trimmingCharacters(in: CharacterSet(charactersIn: " "))
    }
    static func messageIntent(_ body: String?) -> String {
        guard let body, body.unicodeScalars.count <= 16000 else { return "unknown" }
        let text = normalizedMessageText(body.replacingOccurrences(of: #"```[\s\S]*?```"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: #"`[^`\n]*`"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: #""[^"\n]*"|“[^”\n]*”|‘[^’\n]*’"#, with: "", options: .regularExpression)
            .components(separatedBy: "\n").filter { $0.range(of: #"^\s*>"#, options: .regularExpression) == nil }.joined(separator: "\n"))
        if text.range(of: #"\b(?:no (?:reply|response) (?:is )?(?:needed|required|necessary)|do not reply|don't reply|no need to (?:reply|respond))\b|(?:답장|답변|응답|회신)\s*(?:[은는이가]\s*)?(?:불필요|필요\s*없|하지\s*마|안\s*해도)|세션\s*사이\s*알림"#, options: [.regularExpression, .caseInsensitive]) != nil { return "notification" }
        if text.range(of: #"\b(?:please (?:reply|respond|confirm|report back)|(?:can|could|would) you (?:reply|respond|confirm)|(?:reply|response) (?:is )?(?:required|requested)|let me know|send me (?:the |your )?(?:results|findings|answer))\b|(?:^|[.!?\n;:])\s*report back\b|(?:답장|답변|응답|회신)(?:을|를)?\s*(?:부탁|요청|해\s*줘|해주|해\s*주|바랍|주세요)|(?:알려|보고해|공유해)\s*(?:줘|주세|주시|주면)"#, options: [.regularExpression, .caseInsensitive]) != nil { return "request" }
        if text.range(of: #"\b(?:in reply to|in response to|here (?:are|is) (?:the |your )?requested (?:results|findings|answer))\b|(?:답변|회신)(?:입니다|드립니다)|요청하신[^.!?\n]{0,50}(?:결과|답변|보고)"#, options: [.regularExpression, .caseInsensitive]) != nil { return "response" }
        if text.range(of: #"\b(?:fyi|heads[ -]up|pong|for (?:your )?information|notification|status update)\b|(?:참고용|단순\s*알림|결과\s*보고|완료\s*보고)"#, options: [.regularExpression, .caseInsensitive]) != nil { return "notification" }
        return "unknown"
    }
    static func messageFingerprint(_ body: String?) -> String? {
        guard let body, body.unicodeScalars.count <= 16000 else { return nil }
        let flat = normalizedMessageText(body)
        var hash: UInt64 = 14695981039346656037
        for byte in flat.utf8 { hash = (hash ^ UInt64(byte)) &* 1099511628211 }
        return String(hash, radix: 16)
    }
    static func phase(_ attention: Bool, _ working: Bool, _ children: Int, _ spawned: Int, _ jobs: Int) -> Int {
        return attention ? 0 : working ? 1 : children > 0 || spawned > 0 || jobs > 0 ? 2 : 3
    }
}
