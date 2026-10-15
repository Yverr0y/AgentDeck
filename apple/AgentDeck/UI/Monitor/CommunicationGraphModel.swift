import Foundation

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
}

struct CommunicationNode: Identifiable, Equatable {
    let id: String
    var name: String
    var project: String?
    var rosterID: String?
    var state: String?
    var unresolved = false
}

struct CommunicationLink: Identifiable, Equatable {
    let id: String
    let first: String
    let second: String
    var latestSender: String
    var latestRecipient: String
    var lastObservedAt: Double
    var detail: String?
    /// Start of the current one-way burst, not the most recent reminder.
    var noReplySince: Double?
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
        var observations: [String: [(sender: String, recipient: String, ts: Double, detail: String?)]] = [:]
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
            observations[key, default: []].append((sender, recipient, event.ts, event.detail))
        }
        let links = observations.map { key, messages -> CommunicationLink in
            let latest = messages.last!
            let opposite = messages.last { $0.sender != latest.sender }
            let crossed = opposite.map {
                latest.ts - $0.ts <= Double(CollaborationPresentation.networkSimultaneousWindowMs)
            } ?? false
            // Two hooks may describe one message. Keeping a burst's first
            // timestamp prevents delivery echoes/reminders from resetting it.
            let start = messages.first { $0.sender == latest.sender && $0.ts > (opposite?.ts ?? -1) }?.ts ?? latest.ts
            let endpoints = [latest.sender, latest.recipient].sorted()
            return CommunicationLink(id: key, first: endpoints[0], second: endpoints[1],
                latestSender: latest.sender, latestRecipient: latest.recipient,
                lastObservedAt: latest.ts, detail: messages.last {
                    $0.sender == latest.sender && $0.ts >= start && $0.detail?.isEmpty == false
                }?.detail,
                noReplySince: crossed ? nil : start, crossed: crossed)
        }.sorted {
            // Oldest unreciprocated conversation first, stable identity as tie-break.
            let a = $0.noReplySince ?? Double.greatestFiniteMagnitude
            let b = $1.noReplySince ?? Double.greatestFiniteMagnitude
            return a == b ? $0.id < $1.id : a < b
        }
        return Self(nodes: nodes.values.sorted { $0.id < $1.id }, links: links)
    }
}
