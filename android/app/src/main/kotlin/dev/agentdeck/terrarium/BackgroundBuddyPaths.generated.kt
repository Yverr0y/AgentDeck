// GENERATED from Apple BuddyPaths by generate-background-presentation.mjs.
package dev.agentdeck.terrarium
import android.graphics.Path
internal object BackgroundBuddyPaths {
    val circle = Path().apply { addOval(-1f, -1f, 1f, 1f, Path.Direction.CW) }
    val pearlLit = Path().apply { addOval(-0.94f, -0.94f, 0.7f, 0.7f, Path.Direction.CW) }
    val pearlGlint = Path().apply { addOval(-0.63f, -0.63f, -0.21f, -0.21f, Path.Direction.CW) }
    val body = Path().apply { addOval(-1f, -0.9f, 1f, 0.9f, Path.Direction.CW); addRect(-0.46f, -1.14f, 0.46f, -0.74f, Path.Direction.CW) }
    val belt = Path().apply { addOval(-0.84f, 0.22f, 0.84f, 0.72f, Path.Direction.CW) }
    val rim = Path().apply { addRoundRect(-0.62f, -1.3f, 0.62f, -1.08f, 0.1f, 0.1f, Path.Direction.CW) }
    val gloss = Path().apply { addOval(-0.6f, -0.62f, -0.28f, -0.4f, Path.Direction.CW) }
    val eyes = Path().apply { addOval(-0.3f, -0.18f, -0.1f, 0.06f, Path.Direction.CW); addOval(0.3f, -0.18f, 0.5f, 0.06f, Path.Direction.CW) }
    val cheeks = Path().apply { addOval(-0.56f, 0.06f, -0.32f, 0.19f, Path.Direction.CW); addOval(0.58f, 0.06f, 0.82f, 0.19f, Path.Direction.CW) }
    val fin = Path().apply { moveTo(0f, 0f); quadTo(0.5f, 0.1f, 0.1f, 0.55f); quadTo(-0.1f, 0.3f, 0f, 0f) }
    val tail = Path().apply { moveTo(0f, 0f); lineTo(-0.55f, -0.32f); quadTo(-0.4f, 0f, -0.55f, 0.32f); close() }
    val lid = Path().apply { addOval(-0.58f, -0.2f, 0.58f, 0.14f, Path.Direction.CW) }
    val knob = Path().apply { addOval(-0.14f, -0.4f, 0.14f, -0.14f, Path.Direction.CW) }
    val sparkle = Path().apply { for (k in 0 until 6) { val a = k * kotlin.math.PI.toFloat() / 3; moveTo(kotlin.math.cos(a)*.55f,kotlin.math.sin(a)*.55f); lineTo(kotlin.math.cos(a),kotlin.math.sin(a)) } }
    const val lidSeat = -1.34f
}
