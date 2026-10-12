"""Mirror Apple's makeBuddy/makePearl meshes for Filament; run with Blender -b -P.
The source digest is verified with the background presentation generator.
Transforms below use Apple's y-up coordinates, converted once for Blender export.
"""
from pathlib import Path
import hashlib, re, json
import bpy
ROOT=Path(__file__).resolve().parents[2]
source=(ROOT/'apple/AgentDeck/Terrarium/AquariumResidents.swift').read_text()
mesh_source=source[source.index('    private func makeBuddy('):source.index('    private func makeBackgroundWork(')]
css=(ROOT/'design/tokens.css').read_text()
def rgb(token):
    value=re.search(r'--'+token+r':\s*([^;]+)',css)[1]
    if value.startswith('var('):return rgb(value[6:-1])
    h=value.strip().removeprefix('#')
    srgb=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return [c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in srgb]
def mat(name, token):
    m=bpy.data.materials.new(name);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*rgb(token),1);p.inputs['Roughness'].default_value=.75
    return m
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
clay=mat('clay','tide-200');shade=mat('shade','tide-300');lidmat=mat('lid','tide-100');knobmat=mat('knob','coral-700');ink=mat('eye','ink-900');cyan=mat('work','session-working');white=mat('glint','tide-50')
def empty(name,parent=None,pos=(0,0,0)):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;o.location=(pos[0],-pos[2],pos[1]);return o
def mesh(name,parent,material,kind='sphere',radius=1,height=1,pos=(0,0,0),scale=(1,1,1)):
    if kind=='sphere':bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=radius)
    else:bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=radius,depth=height)
    o=bpy.context.object;o.name=name;o.parent=parent;o.location=(pos[0],-pos[2],pos[1]);o.scale=(scale[0],scale[2],scale[1]);o.data.materials.append(material)
    for f in o.data.polygons:f.use_smooth=True
    return o
def export(root,name):
    bpy.ops.object.select_all(action='DESELECT');root.select_set(True)
    for c in root.children_recursive:c.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(ROOT/'android/app/src/main/assets/residents'/name),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False,export_yup=True)
root=empty('background-buddy')
mesh('belly',root,clay,scale=(1,.9,1));mesh('belt',root,shade,'cylinder',.93,.26,(0,-.42,0))
mesh('neck',root,clay,'cylinder',.46,.42,(0,.95,0));mesh('rim',root,shade,'cylinder',.62,.14,(0,1.2,0));mesh('working-band',root,cyan,'cylinder',.64,.05,(0,1.2,0))
for x in [-.32,.32]:mesh('eye',root,ink,radius=.1,pos=(x,.02,.9),scale=(1,1.2,.5))
for side in [-1,1]:
    joint=empty('fin-left' if side<0 else 'fin-right',root,(side,-.15,0));mesh('fin',joint,shade,scale=(.32,.18,.08))
tail=empty('tail',root);mesh('tail-mesh',tail,shade,scale=(.36,.24,.07))
lid=empty('lid',root,(0,1.34,0));mesh('cap',lid,lidmat,'cylinder',.58,.14);mesh('knob',lid,knobmat,radius=.15,pos=(0,.14,0))
export(root,'background-buddy.glb')
pearl=empty('background-pearl');pm=mat('pearl-clay','tide-300')
a=rgb('tide-300');b=rgb('coral-500');pm.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*[x+(y-x)*.45 for x,y in zip(a,b)],1)
mesh('pearl',pearl,pm);mesh('glint',pearl,white,radius=.3,pos=(-.42,.42,.72));export(pearl,'background-pearl.glb')
bubble=empty('background-bubble');mesh('bubble',bubble,white);export(bubble,'background-bubble.glb')
motion_source=source[source.index('enum BackgroundWorkPresentation'):source.index('/// A presentation projection')]
receipt={'appleMeshSha256':hashlib.sha256(mesh_source.encode()).hexdigest(),'appleMotionSha256':hashlib.sha256(motion_source.encode()).hexdigest(),'assets':{}}
for name in ['background-buddy.glb','background-pearl.glb','background-bubble.glb']:
    receipt['assets'][name]=hashlib.sha256((ROOT/'android/app/src/main/assets/residents'/name).read_bytes()).hexdigest()
(ROOT/'assets/terrarium/background-buddies.json').write_text(json.dumps(receipt,indent=2)+'\n')
