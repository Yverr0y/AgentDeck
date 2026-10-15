#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const header='// GENERATED from shared/src/collaboration-presentation.ts. DO NOT EDIT.\n';
export function emitCpp(p, phaseSource) {
 const predicate=phaseSource.match(/return ([^;]+);/)[1];
 return `${header}#pragma once
namespace CollaborationPresentation {
static constexpr const char* Heading = "${p.heading}";
static constexpr const char* Scope = "${p.scope}";
static constexpr const char* Labels[] = {${p.metrics.map(m=>JSON.stringify(m.label)).join(',')}};
inline int phase(bool attention, bool working, int children, int spawned, int jobs) { return ${predicate}; }
}
`;
}
export function emitSwift(p, phaseSource) {
 const predicate=phaseSource.match(/return ([^;]+);/)[1];
 return `${header}import Foundation
enum CollaborationPresentation {
    static let heading = "${p.heading}"
    static let scope = "${p.scope}"
${Object.entries(p.network).map(([key,value])=>`    static let network${key[0].toUpperCase()+key.slice(1)} = ${value}`).join('\n')}
${Object.entries(p.aquarium).map(([key,value])=>`    static let aquarium${key[0].toUpperCase()+key.slice(1)} = ${value}`).join('\n')}
    static let labels = [${p.metrics.map(m=>JSON.stringify(m.label)).join(',')}]
    static let symbols = [${p.metrics.map(m=>JSON.stringify(m.symbol)).join(',')}]
    static func messageIntent(_ body: String?) -> String {
        guard let body, body.unicodeScalars.count <= ${p.messageIntent.maxCharacters} else { return "unknown" }
        let text = body.replacingOccurrences(of: #"\`\`\`[\\s\\S]*?\`\`\`"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: #"\`[^\`\\n]*\`"#, with: "", options: .regularExpression)
            .replacingOccurrences(of: #"\"[^\"\\n]*\"|“[^”\\n]*”|‘[^’\\n]*’"#, with: "", options: .regularExpression)
            .components(separatedBy: "\\n").filter { $0.range(of: #"^\\s*>"#, options: .regularExpression) == nil }.joined(separator: "\\n")
${['noReply','request','response','notification'].map(key=>`        if text.range(of: #"${p.messageIntent[key]}"#, options: [.regularExpression, .caseInsensitive]) != nil { return "${key==='noReply'?'notification':key}" }`).join('\n')}
        return "unknown"
    }
    static func messageFingerprint(_ body: String?) -> String? {
        guard let body, body.unicodeScalars.count <= ${p.messageIntent.maxCharacters} else { return nil }
        let flat = body.split(whereSeparator: { $0.isWhitespace }).joined(separator: " ")
        var hash: UInt64 = 14695981039346656037
        for byte in flat.utf8 { hash = (hash ^ UInt64(byte)) &* 1099511628211 }
        return String(hash, radix: 16)
    }
    static func phase(_ attention: Bool, _ working: Bool, _ children: Int, _ spawned: Int, _ jobs: Int) -> Int {
        return ${predicate}
    }
}
`;
}
export const outputs=[['esp32/src/util/collaboration_presentation.generated.h',emitCpp],['apple/AgentDeck/Model/CollaborationPresentation.generated.swift',emitSwift]];
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const {COLLABORATION_PRESENTATION:p,collaborationPhase:f}=await import('../shared/dist/collaboration-presentation.js');
 for(const [target,emit] of outputs) {
  const output=emit(p,f.toString()),file=path.join(root,target);
  if(process.argv.includes('--check')) {if(fs.readFileSync(file,'utf8')!==output)throw Error(`drift: ${target}`);}
  else fs.writeFileSync(file,output);
 }
}
