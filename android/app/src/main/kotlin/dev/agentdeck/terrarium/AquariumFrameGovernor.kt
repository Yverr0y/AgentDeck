package dev.agentdeck.terrarium

/** Keep a weak GPU at a stable cadence instead of continually missing a 60 Hz budget. */
internal class AquariumFrameGovernor {
    var constrained = false
        private set
    private var firstPresentation = 0L
    private var windowStart = 0L
    private var submittedFrames = 0

    fun reset() {
        constrained = false
        firstPresentation = 0L
        windowStart = 0L
        submittedFrames = 0
    }

    fun record(now: Long, submitted: Boolean, targetHz: Float) {
        if (constrained) return
        if (targetHz <= 30f) {
            firstPresentation = 0L
            windowStart = 0L
            submittedFrames = 0
            return
        }
        if (firstPresentation == 0L) {
            if (submitted) firstPresentation = now
            return
        }
        // Loading and shader compilation are not evidence of sustained capacity.
        if (now - firstPresentation < 5_000_000_000L) return
        if (windowStart == 0L) {
            windowStart = now
            submittedFrames = 0
            return
        }
        if (submitted) submittedFrames++
        val elapsed = now - windowStart
        if (elapsed < 3_000_000_000L) return
        constrained = submittedFrames < targetHz * (elapsed / 1e9f) * .8f
        windowStart = now
        submittedFrames = 0
    }
}
