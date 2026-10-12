// GENERATED from shared/src/background-work-presentation.ts. DO NOT EDIT.
package dev.agentdeck.terrarium

object BackgroundWorkPolicy {
    const val MAX_COUNT = 4096
    const val MAX_DOTS = 3
    const val ORBIT_MS = 4800L
    const val FINISH_MS = 1500L
    fun count(value: Int?): Int? = value?.takeIf { it in 0..MAX_COUNT }
    fun label(value: Int?): String? = count(value)?.let { if (it == 0) "Background complete" else "$it background" }
    fun compact(value: Int?): String? = count(value)?.let { if (it == 0) "BG DONE" else "BG $it" }
}
