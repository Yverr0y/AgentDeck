#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root,'shared/src/background-work-presentation.ts'),'utf8');
const p = JSON.parse(source.match(/BACKGROUND_PRESENTATION = (\{[\s\S]*?\}) as const/)[1]);
const header = '// GENERATED from shared/src/background-work-presentation.ts. DO NOT EDIT.\n';
export const outputs = {
 'android/app/src/main/kotlin/dev/agentdeck/terrarium/BackgroundWorkPolicy.generated.kt': `${header}package dev.agentdeck.terrarium

object BackgroundWorkPolicy {
    const val MAX_COUNT = ${p.maxCount}
    const val MAX_DOTS = ${p.maxDots}
    const val ORBIT_MS = ${p.orbitMs}L
    const val FINISH_MS = ${p.finishMs}L
    fun count(value: Int?): Int? = value?.takeIf { it in 0..MAX_COUNT }
    fun label(value: Int?): String? = count(value)?.let { if (it == 0) "${p.complete}" else "$it ${p.running}" }
    fun compact(value: Int?): String? = count(value)?.let { if (it == 0) "${p.done}" else "${p.compact} $it" }
}
`,
 'esp32/src/util/background_work.generated.h': `${header}#pragma once
#include <stdio.h>
namespace BackgroundWork {
static constexpr int MaxCount = ${p.maxCount};
static constexpr int MaxDots = ${p.maxDots};
static constexpr int OrbitMs = ${p.orbitMs};
static constexpr int FinishMs = ${p.finishMs};
inline int count(int value) { return value >= 0 && value <= MaxCount ? value : -1; }
inline void label(int value, char* out, size_t size) {
    if (count(value) < 0) { if(size) out[0] = 0; }
    else if(value == 0) snprintf(out, size, "${p.done}");
    else snprintf(out, size, "${p.compact} %d", value);
}
}
`,
 'apple/AgentDeck/Model/BackgroundDevicePolicy.generated.swift': `${header}import Foundation
enum BackgroundDevicePolicy {
    static let maxCount = ${p.maxCount}
    static let maxDots = ${p.maxDots}
    static let pixelRadiusFraction = ${p.pixelRadiusFraction}
    static let pixelOrbitAspect = ${p.pixelOrbitAspect}
    static let pixelMinRadius: Double = ${p.pixelMinRadius}
    static let orbitMs = ${p.orbitMs}
    static let finishMs = ${p.finishMs}
    static func count(_ value: Int?) -> Int? {
        guard let value, value >= 0, value <= maxCount else { return nil }
        return value
    }
    static func decode(_ raw: Any?) -> Int? {
        guard let n = raw as? NSNumber, CFGetTypeID(n) != CFBooleanGetTypeID(),
              n.doubleValue.isFinite, n.doubleValue.rounded(.down) == n.doubleValue,
              n.doubleValue >= 0, n.doubleValue <= Double(maxCount) else { return nil }
        return n.intValue
    }
    static func compact(_ value: Int?) -> String? {
        guard let value = count(value) else { return nil }
        return value == 0 ? "${p.done}" : "${p.compact} \\(value)"
    }
}
`
};
for(const [target,body] of Object.entries(outputs)) {
 const file = path.join(root,target);
 if(process.argv.includes('--check')) { if(!fs.existsSync(file) || fs.readFileSync(file,'utf8')!==body) throw Error(`drift: ${target}`); }
 else fs.writeFileSync(file,body);
}
