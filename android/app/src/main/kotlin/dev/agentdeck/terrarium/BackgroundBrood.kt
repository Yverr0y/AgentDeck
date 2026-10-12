package dev.agentdeck.terrarium

import kotlin.math.*

private typealias S = BackgroundBuddyStyle

/** Apple jar-buddy motion, in body-radius units (y up). Renderer-independent. */
internal data class BuddyPose(val x: Float, val y: Float, val radius: Float, val depth: Float,
    val opacity: Float, val facing: Float, val tilt: Float, val lid: Float, val fin: Float, val tail: Float)
internal fun buddyPose(index: Int, theta: Float, phase: Float, reach: Float = S.orbitRadius, pearl: Boolean = false): BuddyPose {
    fun orbit(t: Float): Pair<Float,Float> {
        val x = reach*cos(t); val y = S.orbitHeight*reach/S.orbitRadius*sin(t)
        return Pair(x*cos(S.orbitTilt)-y*sin(S.orbitTilt), S.orbitCenterY+x*sin(S.orbitTilt)+y*cos(S.orbitTilt))
    }
    val (x,y) = orbit(theta); val (ax,ay) = orbit(theta+.02f)
    val depth = -sin(theta); val near = (depth+1)/2
    return BuddyPose(x,y,(if(pearl) S.pearlRadius else S.buddyRadius)*(S.farScale+(S.nearScale-S.farScale)*near),
        depth,S.farOpacity+(1-S.farOpacity)*near,(depth*4).coerceIn(-1f,1f),
        atan2(ay-y,abs(ax-x)+.0001f).coerceIn(-.3f,.3f)*(if(ax>=x)1 else -1),
        max(0f,sin(phase*3.4f+index*2.3f)).pow(6)*.18f,abs(sin(phase*6+index)),sin(phase*7+index*1.7f)*.45f)
}
internal fun jarSpacing(i: Int, count: Int) = i*2*PI.toFloat()/count.coerceIn(1,S.maxBuddies)
internal fun pearlSpacing(i: Int, count: Int): Float {
    val gap = 2*PI.toFloat()/S.maxBuddies; val g = i%S.maxBuddies
    val inGap = count/S.maxBuddies + if(g<count%S.maxBuddies)1 else 0
    return g*gap+gap*(i/S.maxBuddies+1)/(max(1,inGap)+1)
}
internal class BackgroundBrood {
    data class Finish(val pose: BuddyPose, val x: Float, val y: Float, val radius: Float, val pearl: Boolean, var age: Float = 0f)
    var known: Int? = null; private set
    var count = 0; private set
    val pearls get() = (count-S.maxBuddies).coerceIn(0,S.maxPearls)
    val finishes = ArrayList<Finish>(S.maxFinishes)
    var x = 0f; private set
    var y = 0f; private set
    var phase = 0f; private set
    var reach = S.orbitRadius; private set
    var still = false; private set
    private var initialized = false
    private val offsets = FloatArray(S.maxBuddies)
    private val pearlOffsets = FloatArray(S.maxPearls)
    fun angle(i: Int, pearl: Boolean = false): Float {
        if(still) return -PI.toFloat()/2 + if(pearl) ((i+.5f)/max(1,pearls)-.5f)*2.2f else (i-(min(count,S.maxBuddies)-1)/2f)*.85f
        return phase/S.radiansPerSecond*2*PI.toFloat()/S.lapSeconds + if(pearl) offsets[0]+pearlOffsets[i] else offsets[i]
    }
    fun pose(i: Int, pearl: Boolean = false) = buddyPose(i,angle(i,pearl),phase,reach,pearl)
    fun update(explicit: Int?, working: Boolean, px: Float, py: Float, radius: Float, dt: Float, animate: Boolean, nearest: Float = Float.POSITIVE_INFINITY) {
        val next = BackgroundWorkPolicy.count(explicit)
        val previous = known
        val shown = count
        if(next != null) known = next
        count = if(working) known ?: 0 else 0
        still = !animate
        if(!animate) finishes.clear()
        if(animate && next != null && previous != null && next<previous && shown>0 && (working || next==0)) {
            fun finish(i: Int, pearl: Boolean) { finishes.add(Finish(pose(i,pearl),x,y,radius,pearl)) }
            for(i in ((if(working) pearls else 0) until (shown-S.maxBuddies).coerceIn(0,S.maxPearls)).reversed()) finish(i,true)
            for(i in min(count,S.maxBuddies) until min(shown,S.maxBuddies)) finish(i,false)
            while(finishes.size>S.maxFinishes) finishes.removeAt(0)
        }
        // Time comes from the frame clock, bounded after resume; never wall-clock modulo.
        val elapsed = if(animate) dt.coerceIn(0f,.05f) else 0f
        val blend = if(!initialized || elapsed<=0)1f else 1-exp(-elapsed*S.settleRate)
        for(i in offsets.indices) offsets[i] += Math.IEEEremainder((jarSpacing(i,count)-offsets[i]).toDouble(),2*PI).toFloat()*blend
        for(i in pearlOffsets.indices) pearlOffsets[i] += Math.IEEEremainder((pearlSpacing(i,pearls)-pearlOffsets[i]).toDouble(),2*PI).toFloat()*blend
        if(!initialized || elapsed<=0) { x=px;y=py } else { val lag=1-exp(-elapsed*S.followRate);x+=(px-x)*lag;y+=(py-y)*lag }
        reach = max(S.bodyClearance,min(S.orbitRadius,nearest*.5f-.1f))
        phase += elapsed*S.radiansPerSecond
        for(f in finishes) f.age+=elapsed
        finishes.removeAll { it.age>=S.finishSeconds }
        initialized=true
    }
}
