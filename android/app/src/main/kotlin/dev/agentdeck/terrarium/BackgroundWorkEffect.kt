package dev.agentdeck.terrarium

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.provider.Settings
import androidx.compose.ui.graphics.toArgb
import dev.agentdeck.ui.theme.DesignTokens
import kotlin.math.*

/** The same jar artwork as Apple Canvas, split around the resident body. */
internal class BackgroundWorkEffect(private val context: Context) {
    private val paint=Paint(Paint.ANTI_ALIAS_FLAG).apply { typeface=ciCompanionTypeface(context) }
    private val broods=mutableMapOf<String,BackgroundBrood>()
    private val frames=mutableMapOf<String,Long>()
    private val paths=BackgroundBuddyPaths
    private val density=context.resources.displayMetrics.density
    fun retain(ids: Set<String>) { broods.keys.retainAll(ids);frames.keys.retainAll(ids) }
    fun draw(canvas: Canvas,id: String,value: Int?,attention: Boolean,x: Float,y: Float,radius: Float,now: Long,
        near: Boolean = true, working: Boolean = true, nearest: Float = Float.POSITIVE_INFINITY) {
        val m=broods.getOrPut(id){BackgroundBrood()};val r=max(12f,radius)
        if(frames[id]!=now) {
            val dt=frames[id]?.let { ((now-it)/1000f).coerceIn(0f,.05f) } ?: 0f
            val animate=Settings.Global.getFloat(context.contentResolver,Settings.Global.ANIMATOR_DURATION_SCALE,1f)!=0f
            m.update(value,working && !attention,x,y,r,dt,animate,nearest);frames[id]=now
        }
        if(attention)return
        val edge=(BackgroundBuddyStyle.orbitRadius+BackgroundBuddyStyle.buddyRadius*BackgroundBuddyStyle.nearScale*1.4f)*r
        val cx=if(canvas.width>edge*2)m.x.coerceIn(edge,canvas.width-edge) else canvas.width/2f
        fun part(path: android.graphics.Path,color: androidx.compose.ui.graphics.Color,alpha: Float=1f,stroke: Float=0f) {
            paint.color=color.toArgb();paint.alpha=(alpha.coerceIn(0f,1f)*255).toInt()
            paint.style=if(stroke>0)Paint.Style.STROKE else Paint.Style.FILL;paint.strokeWidth=stroke
            canvas.drawPath(path,paint)
        }
        fun pearl(p: BuddyPose,px: Float,py: Float,scale: Float=1f,alpha: Float=1f) {
            canvas.save();canvas.translate(px,py);canvas.scale(p.radius*r*scale,p.radius*r*scale)
            part(paths.circle,androidx.compose.ui.graphics.lerp(DesignTokens.Tide.s300,DesignTokens.Coral.s500,.45f),p.opacity*alpha)
            part(paths.pearlLit,androidx.compose.ui.graphics.lerp(DesignTokens.Tide.s100,DesignTokens.Coral.s500,.3f),p.opacity*alpha)
            part(paths.pearlGlint,DesignTokens.Tide.s50,p.opacity*alpha*.9f);canvas.restore()
        }
        fun jar(p: BuddyPose,px: Float,py: Float,age: Float?=null) {
            val progress=(age ?: 0f)/BackgroundBuddyStyle.finishSeconds;val pop=min(1f,progress*2.5f)
            val fade=((progress-.35f)/.65f).coerceIn(0f,1f);val size=p.radius*r*(1-fade*fade)
            if(size<.2f)return
            canvas.save();canvas.translate(px,py)
            if(age!=null && progress<.5f) {
                canvas.save();canvas.translate(0f,-p.radius*r*1.4f);val reach=p.radius*r*(.6f+pop*.9f);canvas.scale(reach,reach)
                part(paths.sparkle,DesignTokens.Tide.s50,1-progress*2,.12f);canvas.restore()
            }
            canvas.rotate(-p.tilt*180/PI.toFloat());canvas.scale(size*(if(p.facing<0)min(-.18f,p.facing) else max(.18f,p.facing)),size)
            val alpha=p.opacity*(1-fade)
            canvas.save();canvas.translate(-.92f,.15f);canvas.rotate(p.tail*180/PI.toFloat());part(paths.tail,DesignTokens.Tide.s300,alpha);canvas.restore()
            part(paths.body,DesignTokens.Tide.s200,alpha);part(paths.belt,DesignTokens.Tide.s300,alpha*.55f)
            part(paths.gloss,DesignTokens.Tide.s50,alpha*.8f);part(paths.eyes,DesignTokens.Ink.s900,alpha);part(paths.cheeks,DesignTokens.Coral.s500,alpha*.35f)
            canvas.save();canvas.translate(.1f,.25f);canvas.scale(1f,.6f+p.fin*.5f);part(paths.fin,DesignTokens.Tide.s300,alpha);canvas.restore()
            part(paths.rim,DesignTokens.Tide.s300,alpha);part(paths.rim,DesignTokens.Session.working,alpha,.08f)
            canvas.save();canvas.translate(0f,paths.lidSeat-(if(age==null)p.lid else (1-(1-pop)*(1-pop))*1.6f));canvas.rotate(if(age==null)0f else pop*270)
            val lidAlpha=alpha*(if(age==null)1f else max(0f,1-progress*1.6f))
            part(paths.lid,DesignTokens.Tide.s100,lidAlpha);part(paths.knob,DesignTokens.Coral.s700,lidAlpha)
            canvas.restore();canvas.restore()
        }
        fun bubble(px: Float,py: Float,br: Float,alpha: Float) {
            paint.color=DesignTokens.Tide.s50.toArgb();paint.alpha=(alpha.coerceIn(0f,1f)*204).toInt();paint.style=Paint.Style.STROKE;paint.strokeWidth=1f
            canvas.drawCircle(px,py,max(1.5f,br),paint)
        }
        if(BackgroundBuddyStyle.pearlRadius*BackgroundBuddyStyle.farScale*r>=BackgroundBuddyStyle.minPearlPoints)for(i in 0 until m.pearls) {
            val p=m.pose(i,true);if((p.depth>=0)==near)pearl(p,cx+p.x*r,m.y-p.y*r)
        }
        if(BackgroundBuddyStyle.buddyRadius*BackgroundBuddyStyle.farScale*r>=BackgroundBuddyStyle.minJarPoints)for(i in 0 until min(m.count,BackgroundBuddyStyle.maxBuddies)) {
            val p=m.pose(i);if((p.depth>=0)!=near)continue
            jar(p,cx+p.x*r,m.y-p.y*r)
            for(k in 0 until BackgroundBuddyStyle.simmerPerBuddy) {
                val raw=m.phase*.45f+i*.37f+k*.5f;val t=raw-floor(raw)
                bubble(cx+(p.x+sin(t*6+i)*.03f)*r,m.y-(p.y+p.radius*1.35f+t*.4f)*r,(.022f+.012f*k)*r,(1-t)*.8f*p.opacity)
            }
        }
        if(!near)return
        for(f in m.finishes) {
            val p=f.pose;val px=f.x+p.x*f.radius;val py=f.y-p.y*f.radius
            if(f.pearl)pearl(p,px,py,1-f.age/BackgroundBuddyStyle.finishSeconds,1-f.age/BackgroundBuddyStyle.finishSeconds) else {
                jar(p,px,py,f.age)
                for(k in 0 until BackgroundBuddyStyle.bubblesPerFinish)bubble(px+(sin(f.age*5+k*2)*.05f+(k-1)*.07f)*r,
                    py-(p.radius*1.35f+f.age*(.7f+.25f*k))*r,(.035f+.015f*(k%2))*r,1-f.age/BackgroundBuddyStyle.finishSeconds)
            }
        }
        if(m.count>0) {
            paint.style=Paint.Style.FILL;paint.color=DesignTokens.Session.working.toArgb();paint.alpha=255
            paint.textSize=(r*.34f).coerceIn(6.5f*density,10f*density);paint.textAlign=Paint.Align.CENTER
            canvas.drawText("${m.count} background task${if(m.count==1) "" else "s"}",x,y+r*1.05f+paint.textSize,paint)
        }
    }
}
