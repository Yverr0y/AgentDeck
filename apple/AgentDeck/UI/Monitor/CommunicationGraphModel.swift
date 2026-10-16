import Foundation

/// Keep elapsed labels legible around nodes and other labels in both the graph
/// and habitat. The candidate search is bounded, deterministic and screen-local.
enum CommunicationLabelLayout {
    static func place(preferred: CGPoint, size: CGSize, bounds: CGRect, avoiding occupied: [CGRect]) -> CGRect {
        let dx = size.width + 8, dy = size.height + 6
        var offsets: [CGPoint] = [.zero]
        for ring in 1...4 {
            let r = CGFloat(ring)
            offsets += [CGPoint(x: 0, y: -dy*r), CGPoint(x: 0, y: dy*r),
                        CGPoint(x: -dx*r, y: 0), CGPoint(x: dx*r, y: 0),
                        CGPoint(x: -dx*r, y: -dy*r), CGPoint(x: dx*r, y: -dy*r),
                        CGPoint(x: -dx*r, y: dy*r), CGPoint(x: dx*r, y: dy*r)]
        }
        var best = CGRect.zero, leastOverlap = CGFloat.infinity
        for offset in offsets {
            let rect = CGRect(x: min(max(bounds.minX, preferred.x+offset.x-size.width/2), max(bounds.minX, bounds.maxX-size.width)),
                              y: min(max(bounds.minY, preferred.y+offset.y-size.height/2), max(bounds.minY, bounds.maxY-size.height)),
                              width: size.width, height: size.height)
            let overlap = occupied.reduce(CGFloat.zero) { total, other in
                let intersection = rect.intersection(other.insetBy(dx: -3, dy: -3))
                return total + (intersection.isNull ? 0 : intersection.width * intersection.height)
            }
            if overlap == 0 { return rect }
            if overlap < leastOverlap { best = rect; leastOverlap = overlap }
        }
        return best
    }
}

struct CommunicationSnapshot: Decodable, Sendable {
    let schema: String
    let capturedAt: Double
    let since: Double
    let truncated: Bool
    let events: [CommunicationObservation]
}

struct CommunicationObservation: Decodable, Sendable {
    let id: String
    let sessionId: String
    let ts: Double
    let relation: String
    let direction: String
    let peerSessionId: String?
    let peerName: String?
    let detail: String?
    let messageIntent: String?
    let messageFingerprint: String?
}

struct CommunicationNode: Identifiable, Equatable {
    let id: String
    var name: String
    var project: String?
    var rosterID: String?
    var state: String?
    var unresolved = false
}

struct CommunicationWait: Equatable {
    let sender: String
    let recipient: String
    let since: Double
    let fingerprint: String
    var requestCount = 1
}

struct CommunicationLink: Identifiable, Equatable {
    let id: String
    let first: String
    let second: String
    var latestSender: String
    var latestRecipient: String
    var lastObservedAt: Double
    var detail: String?
    var messageIntent: String
    var waits: [CommunicationWait]
    var noReplySince: Double? { waits.first?.since }
    var status: String {
        if !waits.isEmpty {
            switch messageIntent {
            case "notification": return "Notification · earlier reply request pending"
            case "response": return "Reply observed · request match unconfirmed"
            case "request": return "Reply requested · awaiting explicit response"
            default: return "Latest intent unknown · earlier request pending"
            }
        }
        switch messageIntent {
        case "notification": return "Notification · no reply requested"
        case "response": return "Explicit reply observed"
        default: return "Reply requirement unknown"
        }
    }
    var crossed = false
}

struct CommunicationNetwork {
    let nodes: [CommunicationNode]
    let links: [CommunicationLink]

    static func project(snapshot: CommunicationSnapshot?, roster: [SessionInfo]) -> Self {
        func raw(_ id: String) -> String { ObservedAgentRules.rawSessionId(id) }
        let events = (snapshot?.events ?? []).filter {
            $0.relation == "messaged" && ["in", "out"].contains($0.direction) &&
            !$0.sessionId.isEmpty && $0.ts.isFinite && $0.ts > 0 &&
            $0.ts >= (snapshot?.since ?? 0) && $0.ts <= (snapshot?.capturedAt ?? 0)
        }.sorted { $0.ts == $1.ts ? $0.id < $1.id : $0.ts < $1.ts }
        // Names resolve only through explicit peer identity, and an ambiguous
        // alias never merges two sessions. Project names create no edges.
        var aliases: [String: Set<String>] = [:]
        var labels: [String: String] = [:]
        for event in events {
            if let peer = event.peerSessionId, !peer.isEmpty, let name = event.peerName, !name.isEmpty {
                aliases[name, default: []].insert(raw(peer))
                labels[raw(peer)] = name
            }
        }
        var nodes: [String: CommunicationNode] = [:]
        for session in roster {
            let id = raw(session.id)
            nodes[id] = CommunicationNode(id: id, name: labels[id] ?? String(id.prefix(8)),
                project: session.projectName, rosterID: session.id, state: session.state)
        }
        var observations: [String: [(sender: String, recipient: String, ts: Double, detail: String?, intent: String, fingerprint: String?, direction: String)]] = [:]
        for event in events {
            let owner = raw(event.sessionId)
            let explicit = event.peerSessionId.flatMap { $0.isEmpty ? nil : raw($0) }
            let named = event.peerName.flatMap { aliases[$0] }.flatMap { $0.count == 1 ? $0.first : nil }
            let peer = explicit ?? named ?? "unresolved:\(owner):\(event.peerName ?? event.id)"
            guard owner != peer else { continue }
            if nodes[owner] == nil {
                nodes[owner] = CommunicationNode(id: owner, name: labels[owner] ?? String(owner.prefix(8)))
            }
            if nodes[peer] == nil {
                nodes[peer] = CommunicationNode(id: peer, name: event.peerName ?? String(peer.prefix(8)),
                    unresolved: explicit == nil && named == nil)
            }
            let sender = event.direction == "out" ? owner : peer
            let recipient = event.direction == "out" ? peer : owner
            let key = [sender, recipient].sorted().joined(separator: "|")
            observations[key, default: []].append((sender, recipient, event.ts, event.detail, event.messageIntent ?? "unknown", event.messageFingerprint, event.direction))
        }
        let links = observations.map { key, messages -> CommunicationLink in
            let latest = messages.last!
            let opposite = messages.last { $0.sender != latest.sender }
            let crossed = opposite.map {
                latest.ts - $0.ts <= Double(CollaborationPresentation.networkSimultaneousWindowMs)
            } ?? false
            // Prefer the sender hook when both sides observed identical content.
            // A delayed inbox echo must not reopen a request already answered.
            let outbound = Set(messages.filter { $0.direction == "out" && $0.fingerprint != nil }
                .map { "\($0.sender)|\($0.fingerprint!)" })
            var pending: [CommunicationWait] = []
            for message in messages {
                if message.direction == "in", let fingerprint = message.fingerprint,
                   outbound.contains("\(message.sender)|\(fingerprint)") { continue }
                if message.intent == "request" {
                    let fingerprint = message.fingerprint ?? message.ts.description
                    if !pending.contains(where: { $0.sender == message.sender && $0.fingerprint == fingerprint }) {
                        pending.append(CommunicationWait(sender: message.sender, recipient: message.recipient,
                            since: message.ts, fingerprint: fingerprint))
                    }
                } else if message.intent == "response" {
                    let candidates = pending.filter { $0.recipient == message.sender }
                    // No correlation id is supplied by Claude. Only a single,
                    // strictly earlier request can be settled by explicit reply text.
                    if candidates.count == 1, let request = candidates.first,
                       message.ts - request.since > Double(CollaborationPresentation.networkSimultaneousWindowMs) {
                        pending.removeAll { $0 == request }
                    }
                }
            }
            let endpoints = [latest.sender, latest.recipient].sorted()
            return CommunicationLink(id: key, first: endpoints[0], second: endpoints[1],
                latestSender: latest.sender, latestRecipient: latest.recipient,
                lastObservedAt: latest.ts, detail: latest.detail,
                messageIntent: latest.intent, waits: Dictionary(grouping: pending, by: \.sender).values.map { requests in
                    var wait = requests.min { $0.since < $1.since }!
                    wait.requestCount = requests.count
                    return wait
                }.sorted { $0.since == $1.since ? $0.sender < $1.sender : $0.since < $1.since }, crossed: crossed)
        }.sorted {
            // Oldest explicit request first, stable identity as tie-break.
            let a = $0.noReplySince ?? Double.greatestFiniteMagnitude
            let b = $1.noReplySince ?? Double.greatestFiniteMagnitude
            return a == b ? $0.id < $1.id : a < b
        }
        return Self(nodes: nodes.values.sorted { $0.id < $1.id }, links: links)
    }
}
