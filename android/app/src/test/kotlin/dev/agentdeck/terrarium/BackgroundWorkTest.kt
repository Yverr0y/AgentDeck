package dev.agentdeck.terrarium

import org.junit.Assert.*
import org.junit.Test

class BackgroundWorkTest {
    @Test fun unknownAndAttentionDoNotInventCompletion() {
        val motion=BackgroundWorkMotion()
        motion.observe(null,0)
        assertNull(motion.count)
        motion.observe(4,1)
        motion.observe(null,2)
        motion.observe(-1,3)
        assertEquals(4,motion.count)
        assertFalse(motion.finishing(3))
        motion.observe(2,4)
        assertTrue(motion.finishing(4))
        motion.observe(0,5)
        assertEquals(0,motion.count)
        assertTrue(motion.finishing(6))
        assertFalse(motion.finishing(5+BackgroundWorkPolicy.FINISH_MS))
    }
    @Test fun baselineZeroDoesNotAnimateAndCountIsExact() {
        val motion=BackgroundWorkMotion()
        motion.observe(0,10)
        assertFalse(motion.finishing(10))
        assertEquals("Background complete",BackgroundWorkPolicy.label(0))
        assertEquals("BG 4096",BackgroundWorkPolicy.compact(4096))
        assertNull(BackgroundWorkPolicy.label(4097))
    }
}
