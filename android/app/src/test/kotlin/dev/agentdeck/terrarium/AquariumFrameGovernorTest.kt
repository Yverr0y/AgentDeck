package dev.agentdeck.terrarium

import org.junit.Assert.*
import org.junit.Test

class AquariumFrameGovernorTest {
    private fun feed(governor: AquariumFrameGovernor, start: Long, frames: Int, submitEvery: Int, hz: Float = 60f) {
        repeat(frames) { frame -> governor.record(start + frame * 16_666_667L, frame % submitEvery == 0, hz) }
    }

    @Test fun `unready surface and shader warmup cannot lower quality`() {
        val governor = AquariumFrameGovernor()
        repeat(600) { governor.record(it * 16_666_667L + 1L, false, 60f) }
        feed(governor, 10_000_000_001L, 290, 10)
        assertFalse(governor.constrained)
    }

    @Test fun `sustained missed submissions fall back after warmup and latch until resume`() {
        val governor = AquariumFrameGovernor()
        feed(governor, 1L, 600, 2)
        assertTrue(governor.constrained)
        feed(governor, 10_000_000_001L, 600, 1)
        assertTrue(governor.constrained)
        governor.reset()
        assertFalse(governor.constrained)
        feed(governor, 20_000_000_001L, 600, 1)
        assertFalse(governor.constrained)
    }

    @Test fun `thermal recovery starts a fresh capacity window`() {
        val governor = AquariumFrameGovernor()
        feed(governor, 1L, 420, 1)
        feed(governor, 7_000_000_001L, 600, 2, 30f)
        feed(governor, 17_000_000_001L, 290, 10)
        assertFalse(governor.constrained)
    }

    @Test fun `occasional misses and intended thirty hertz cadence do not trip fallback`() {
        val governor = AquariumFrameGovernor()
        repeat(1200) { frame -> governor.record(1L + frame * 16_666_667L, frame % 10 != 0, 60f) }
        assertFalse(governor.constrained)
        governor.reset()
        feed(governor, 1L, 1200, 2, 30f)
        assertFalse(governor.constrained)
    }
}
