"""Run with Blender. Writes a SEPARATE refinement copy and a candidate GLB."""
import bpy,bmesh,json,numpy as np,hashlib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'docs/verification/logo-refinement'
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'design/brand/abg-logo.blend'))
items=json.loads((OUT/'source-curves.json').read_text())
build=json.loads((OUT/'refined-build.json').read_text())
assert build['approved_blend_sha256']==hashlib.sha256((ROOT/'design/brand/abg-logo.blend').read_bytes()).hexdigest()
assert build['curves_sha256']==hashlib.sha256((OUT/'source-curves.json').read_bytes()).hexdigest()
archive=bpy.data.collections.new('06 | Original sampled meshes - hidden comparison')
bpy.context.scene.collection.children.link(archive);archive.hide_render=True;archive.hide_viewport=True
report=[]
for item in items:
    o=bpy.data.objects[item['mesh']]
    backup=o.copy();backup.name=o.name+' | original sampled backup';archive.objects.link(backup);backup.hide_render=True
    path=OUT/f"{item['stem']}-refined.npz"
    assert build['meshes'][item['stem']]==hashlib.sha256(path.read_bytes()).hexdigest()
    data=np.load(path)
    me=bpy.data.meshes.new(o.data.name+' | exact cubic boundary')
    me.from_pydata(data['vertices'].tolist(),[],data['faces'].tolist());me.update()
    if me.validate(verbose=False):raise ValueError('Mesh validation changed the refinement')
    for material in o.data.materials:me.materials.append(material)
    for p in me.polygons:p.use_smooth=True
    me.normals_split_custom_set_from_vertices(data['normals'].tolist())
    o.data=me;o.modifiers.clear()
    o['Refinement']='Original cubic boundaries; constrained triangles; smooth elliptic relief; recovered analytic normals. No decimation.'
    bm=bmesh.new();bm.from_mesh(me)
    bad=sum(not e.is_manifold for e in bm.edges);volume=bm.calc_volume(signed=True)
    report.append({'name':o.name,'vertices':len(me.vertices),'faces':len(me.polygons),'nonmanifold_edges':bad,'volume':volume,'custom_normals':me.has_custom_normals})
    bm.free()
    if bad or volume<=0:raise ValueError(report[-1])
objects=[o for o in bpy.context.scene.objects if o.type in {'MESH','CURVE'} and not o.hide_render and any(c.name.startswith(('01 |','02 | Shallow','05 |')) for c in o.users_collection)]
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.hide_set(False);o.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.export_scene.gltf(filepath=str(OUT/'refined.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
# Expected geometry summaries for tests of the shipped GLB, after decoding.
for row in report:
    o=bpy.data.objects[row['name']]
    xyz=np.array([(v.co.x,v.co.z,-v.co.y) for v in o.data.vertices],dtype='<f4')
    xyz[np.abs(xyz)<1e-12]=0
    xyz=xyz[np.lexsort((xyz[:,2],xyz[:,1],xyz[:,0]))]
    row['expected_sorted_gltf_position_sha256']=hashlib.sha256(xyz.tobytes()).hexdigest()
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'design/brand/abg-logo-refined.blend'))
(OUT/'topology.json').write_text(json.dumps(report,indent=2))
print('REFINED_EXPORT_COMPLETE',report,flush=True)
