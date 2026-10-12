package dev.agentdeck.terrarium
import org.junit.Assert.*
import org.junit.Test
import kotlin.math.PI

class BackgroundWorkTest {
    private fun BackgroundBrood.feed(n: Int?, working: Boolean=true, animate: Boolean=true, dt: Float=0f) = update(n,working,100f,100f,30f,dt,animate)
    @Test fun unknownAttentionAndReconnectNeverInventCompletion() {
        val m=BackgroundBrood();m.feed(5);m.feed(null);m.feed(-1)
        assertEquals(5,m.count);assertTrue(m.finishes.isEmpty())
        m.feed(null,working=false);assertEquals(0,m.count);assertTrue(m.finishes.isEmpty())
        m.feed(null);assertEquals(5,m.count)
        val reconnect=BackgroundBrood();reconnect.feed(null);assertEquals(0,reconnect.count);assertNull(reconnect.known)
    }
    @Test fun pearlsFinishBeforeJarsAndZeroFinishesEvenWhenIdle() {
        val m=BackgroundBrood();m.feed(5);m.feed(4)
        assertEquals(1,m.finishes.size);assertTrue(m.finishes.single().pearl)
        m.feed(0,working=false)
        assertEquals(3,m.finishes.count { !it.pearl });assertEquals(0,m.count)
        repeat(30){m.feed(0,working=false,dt=.05f)}
        assertTrue(m.finishes.isEmpty())
    }
    @Test fun reducedMotionStopsTimeAndSuppressesCompletions() {
        val m=BackgroundBrood();m.feed(3,animate=false);val pose=m.pose(0)
        repeat(30){m.feed(3,animate=false,dt=.05f)}
        assertEquals(pose,m.pose(0));assertTrue(pose.depth>=0)
        m.feed(0,animate=false);assertTrue(m.finishes.isEmpty())
    }
    @Test fun countChangeKeepsSurvivingJarContinuousAndBoundsPools() {
        val m=BackgroundBrood();m.feed(3);val before=m.pose(1)
        m.feed(2,dt=.001f);val after=m.pose(1)
        assertEquals(before.x,after.x,.02f);assertEquals(before.y,after.y,.02f)
        m.feed(4096);assertEquals(9,m.pearls)
        m.feed(4095);assertEquals(1,m.finishes.size) // only the earlier 3→2 transition
        repeat(10){m.feed(12);m.feed(0)}
        assertTrue(m.finishes.size<=BackgroundBuddyStyle.maxFinishes)
    }
    @Test fun canonicalOrbitHasDepthAndTwelveSecondPeriod() {
        val front=buddyPose(0,-PI.toFloat()/2,0f);val back=buddyPose(0,PI.toFloat()/2,0f)
        assertEquals(1f,front.depth,.0001f);assertEquals(-1f,back.depth,.0001f)
        assertTrue(front.radius>back.radius);assertTrue(front.opacity>back.opacity)
        val m=BackgroundBrood();m.feed(3);val first=m.pose(0)
        repeat(240){m.feed(3,dt=.05f)}
        assertEquals(first.x,m.pose(0).x,.001f);assertEquals(first.y,m.pose(0).y,.001f)
        assertEquals("BG 4096",BackgroundWorkPolicy.compact(4096));assertNull(BackgroundWorkPolicy.count(4097))
    }
}
