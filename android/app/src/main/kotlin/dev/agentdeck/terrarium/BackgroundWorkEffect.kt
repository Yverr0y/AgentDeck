package dev.agentdeck.terrarium

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.provider.Settings
import androidx.compose.ui.graphics.toArgb
import dev.agentdeck.ui.theme.DesignTokens
import kotlin.math.*

/** Session-keyed transitions: missing telemetry/attention never completes work. */
internal class BackgroundWorkMotion {
    var count: Int? = null; private set
    var finishedAt: Long? = null; private set
    fun observe(value: Int?, now: Long) {
        val next = BackgroundWorkPolicy.count(value) ?: return
        if (count != null && next < count!!) finishedAt = now
        count = next
    }
    fun finishing(now: Long) = finishedAt?.let { now - it in 0 until BackgroundWorkPolicy.FINISH_MS } == true
}

/** Bounded, reusable paint + per-visible-resident state; shared LCD 2D/3D cue. */
internal class BackgroundWorkEffect(context: Context) {
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply { typeface = ciCompanionTypeface(context) }
    private val motions = mutableMapOf<String, BackgroundWorkMotion>()
    private val motionEnabled = Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) != 0f
    fun retain(ids: Set<String>) { motions.keys.retainAll(ids) }
    fun draw(canvas: Canvas, id: String, value: Int?, attention: Boolean, x: Float, y: Float, radius: Float, now: Long) {
        val motion = motions.getOrPut(id) { BackgroundWorkMotion() }
        motion.observe(value, now)
        val count = motion.count ?: return
        if (attention) return
        val r = radius.coerceAtLeast(12f)
        val phase = if (motionEnabled) (now % BackgroundWorkPolicy.ORBIT_MS).toFloat() / BackgroundWorkPolicy.ORBIT_MS * 2f * PI.toFloat() else 0f
        paint.style = Paint.Style.FILL
        paint.color = DesignTokens.Session.working.toArgb()
        val dots = min(count, BackgroundWorkPolicy.MAX_DOTS)
        for (i in 0 until dots) {
            val angle = phase + i * 2f * PI.toFloat() / dots
            val bx = x + cos(angle) * r
            val by = y + sin(angle) * r * .35f
            canvas.drawCircle(bx, by, max(2f, r * .09f), paint)
            // Short trail expresses ongoing work without flashing the status hue.
            canvas.drawCircle(x + cos(angle - .2f) * r, y + sin(angle - .2f) * r * .35f, max(1f, r * .04f), paint)
        }
        if (motionEnabled && motion.finishing(now)) {
            val age = (now - motion.finishedAt!!).toFloat() / BackgroundWorkPolicy.FINISH_MS
            paint.style = Paint.Style.STROKE; paint.strokeWidth = 1.5f
            canvas.drawCircle(x, y, r * (1f + age * .3f), paint)
            paint.style = Paint.Style.FILL
        }
        paint.textSize = (r * .3f).coerceIn(12f, 22f)
        paint.textAlign = Paint.Align.CENTER
        val text = BackgroundWorkPolicy.compact(count) ?: return
        val tx = x.coerceIn(paint.measureText(text)/2+2f, max(paint.measureText(text)/2+2f, canvas.width-paint.measureText(text)/2-2f))
        val ty = (y-r*.6f).coerceAtLeast(paint.textSize)
        paint.color = DesignTokens.Ink.s900.toArgb()
        canvas.drawRoundRect(tx-paint.measureText(text)/2-4f, ty-paint.textSize, tx+paint.measureText(text)/2+4f,ty+3f,4f,4f,paint)
        paint.color = DesignTokens.Tide.s50.toArgb()
        canvas.drawText(text,tx,ty,paint)
    }
}
