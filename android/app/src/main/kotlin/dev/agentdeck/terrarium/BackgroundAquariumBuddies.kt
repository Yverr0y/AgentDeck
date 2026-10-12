package dev.agentdeck.terrarium

import android.content.Context
import android.opengl.Matrix
import com.google.android.filament.gltfio.AssetLoader
import com.google.android.filament.gltfio.FilamentAsset
import com.google.android.filament.gltfio.ResourceLoader
import com.google.android.filament.utils.ModelViewer
import java.nio.ByteBuffer
import kotlin.math.*

/** Real scene entities: Filament supplies lighting, perspective and depth occlusion. */
internal class BackgroundAquariumBuddies(private val context: Context, private val viewer: ModelViewer,
    private val loader: AssetLoader, private val resources: ResourceLoader) {
    private class Rig(val asset: FilamentAsset, val parts: Map<String,Int>, var visible: Boolean = false)
    private class Group {
        val motion=BackgroundBrood()
        val jars=mutableListOf<Rig>();val pearls=mutableListOf<Rig>();val finishes=mutableListOf<Rig>();val bubbles=mutableListOf<Rig>()
        fun pools()=listOf(jars,pearls,finishes,bubbles)
    }
    private val groups=mutableMapOf<String,Group>()
    private val sources=mutableMapOf<String,ByteArray>()
    private val transform=viewer.engine.transformManager
    private val matrix=FloatArray(16)
    private fun load(kind: String): Rig {
        val bytes=sources.getOrPut(kind){context.assets.open("residents/background-$kind.glb").use { it.readBytes() }}
        val buffer=ByteBuffer.allocateDirect(bytes.size).apply { put(bytes);flip() }
        val asset=requireNotNull(loader.createAsset(buffer));resources.loadResources(asset)
        val parts=asset.entities.toList().mapNotNull { e -> asset.getName(e)?.let { it to e } }.toMap()
        asset.releaseSourceData()
        return Rig(asset,parts)
    }
    private fun visible(rig: Rig, on: Boolean) {
        if(on==rig.visible)return
        if(on)viewer.scene.addEntities(rig.asset.entities) else viewer.scene.removeEntities(rig.asset.entities)
        rig.visible=on
    }
    private fun pooled(pool: MutableList<Rig>, index: Int, kind: String): Rig {
        while(pool.size<=index)pool.add(load(kind))
        return pool[index].also { visible(it,true) }
    }
    private fun place(entity: Int,x: Float,y: Float,z: Float,size: Float,yaw: Float=0f,roll: Float=0f) {
        Matrix.setIdentityM(matrix,0);Matrix.translateM(matrix,0,x,y,z)
        Matrix.rotateM(matrix,0,yaw*180f/PI.toFloat(),0f,1f,0f);Matrix.rotateM(matrix,0,roll*180f/PI.toFloat(),0f,0f,1f)
        Matrix.scaleM(matrix,0,max(.0001f,size),max(.0001f,size),max(.0001f,size))
        transform.setTransform(transform.getInstance(entity),matrix)
    }
    fun update(item: AquariumResident,x: Float,y: Float,z: Float,r: Float,dt: Float,animate: Boolean,nearest: Float) {
        if(item.backgroundTaskCount==null && item.id !in groups)return
        val group=groups.getOrPut(item.id){Group()};val m=group.motion
        val working=item.state==OctopusVisualState.WORKING && !item.backgroundAttention && item.ciWait==null
        m.update(item.backgroundTaskCount,working,x,y,r,dt,animate,nearest)
        if(item.backgroundAttention || item.state==OctopusVisualState.ASKING || item.ciWait!=null) {
            for(pool in group.pools())for(rig in pool)visible(rig,false)
            return
        }
        fun jar(rig: Rig,p: BuddyPose,bx: Float,by: Float,br: Float,age: Float?=null) {
            val progress=(age ?: 0f)/BackgroundBuddyStyle.finishSeconds
            val pop=min(1f,progress*2.5f);val fade=((progress-.35f)/.65f).coerceIn(0f,1f)
            place(rig.asset.root,bx+p.x*br,by+(p.y+.32f)*br,z+p.depth*m.reach*br+.12f,
                p.radius*br*(1-fade*fade),p.facing*.55f,p.tilt)
            rig.parts["lid"]?.let { place(it,0f,1.34f+(if(age==null)p.lid else (1-(1-pop)*(1-pop))*1.6f),0f,
                if(age!=null && progress>.625f).0001f else 1f,roll=if(age!=null)pop*PI.toFloat()*1.5f else 0f) }
            rig.parts["fin-left"]?.let { place(it,-1f,-.15f,0f,1f,roll=-(.2f+p.fin*.5f)) }
            rig.parts["fin-right"]?.let { place(it,1f,-.15f,0f,1f,roll=.2f+p.fin*.5f) }
            rig.parts["tail"]?.let { place(it,-p.facing*1.02f,-.22f,0f,1f,yaw=p.tail) }
        }
        var bubbleIndex=0
        fun bubble(px: Float,py: Float,pz: Float,size: Float) {
            val rig=pooled(group.bubbles,bubbleIndex++,"bubble");place(rig.asset.root,px,py,pz,size)
        }
        val n=min(m.count,BackgroundBuddyStyle.maxBuddies)
        for(i in 0 until n) {
            val p=m.pose(i);jar(pooled(group.jars,i,"buddy"),p,m.x,m.y,r)
            for(k in 0 until BackgroundBuddyStyle.simmerPerBuddy) {
                val raw=m.phase*.45f+i*.37f+k*.5f;val t=raw-floor(raw)
                bubble(m.x+(p.x+sin(t*6+i)*.03f)*r,m.y+(p.y+.32f+p.radius*1.35f+t*.4f)*r,
                    z+p.depth*m.reach*r+.14f,(.022f+.012f*k)*r*(1-t))
            }
        }
        for(i in n until group.jars.size)visible(group.jars[i],false)
        for(i in 0 until m.pearls) {
            val p=m.pose(i,true);val rig=pooled(group.pearls,i,"pearl")
            place(rig.asset.root,m.x+p.x*r,m.y+(p.y+.32f)*r,z+p.depth*m.reach*r+.12f,p.radius*r)
        }
        for(i in m.pearls until group.pearls.size)visible(group.pearls[i],false)
        // A single fixed model kind per finish slot; pearl endings use the same
        // small pale bubble pool, leaving jar slots reusable without reloading.
        var finishIndex=0
        for(f in m.finishes) {
            val p=f.pose;val progress=f.age/BackgroundBuddyStyle.finishSeconds
            if(f.pearl) { bubble(f.x+p.x*f.radius,f.y+(p.y+.32f)*f.radius,z+p.depth*m.reach*f.radius+.12f,p.radius*f.radius*(1-progress));continue }
            jar(pooled(group.finishes,finishIndex++,"buddy"),p,f.x,f.y,f.radius,f.age)
            for(k in 0 until BackgroundBuddyStyle.bubblesPerFinish) bubble(
                f.x+(p.x+sin(f.age*5+k*2)*.05f+(k-1)*.07f)*f.radius,
                f.y+(p.y+.32f+p.radius*1.35f+f.age*(.7f+.25f*k))*f.radius,
                z+p.depth*m.reach*f.radius+.14f,(.035f+.015f*(k%2)+.02f*progress)*f.radius*(1-progress))
        }
        for(i in finishIndex until group.finishes.size)visible(group.finishes[i],false)
        for(i in bubbleIndex until group.bubbles.size)visible(group.bubbles[i],false)
    }
    fun retain(ids: Set<String>) {
        for(id in groups.keys.toList())if(id !in ids) {
            val group=groups.remove(id) ?: continue
            for(pool in group.pools())for(rig in pool){visible(rig,false);loader.destroyAsset(rig.asset)}
        }
    }
    fun dispose(){retain(emptySet());sources.clear()}
}
