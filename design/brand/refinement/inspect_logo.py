"""Blender background diagnostic; no source file is saved or mutated on disk."""
import bpy, json, numpy as np, hashlib
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'docs/verification/logo-refinement'
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'design/brand/abg-logo.blend'))
chrome=bpy.data.collections['02 | Shallow sculpted chrome']
curves=bpy.data.collections['01 | Editable Bezier outlines']
report=[]; boundaries=[]
for o in chrome.objects:
    dec=next(m for m in o.modifiers if m.type=='DECIMATE')
    item={'name':o.name,'modifiers':[(m.type, {'factor':m.factor,'iterations':m.iterations} if m.type=='SMOOTH' else {'ratio':m.ratio}) for m in o.modifiers]}
    stem=o.name.split(' | ')[0]+'-'+('entry' if 'entry' in o.name else 'exit' if 'exit' in o.name else 'letter')
    for label,enable in [('decimate',True),('no-decimate',False)]:
        dec.show_viewport=enable;dec.show_render=enable
        bpy.context.view_layer.update()
        ev=o.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh();me.calc_loop_triangles()
        v=np.array([v.co[:] for v in me.vertices]);f=np.array([t.vertices[:] for t in me.loop_triangles]);n=np.array([v.normal[:] for v in me.vertices])
        np.savez_compressed(OUT/f'{stem}-{label}.npz',vertices=v,faces=f,normals=n)
        item[label]={'vertices':len(v),'triangles':len(f),'bounds':[v.min(axis=0).tolist(),v.max(axis=0).tolist()]}
        ev.to_mesh_clear()
    source=curves.objects[o.name.replace(' | chrome surface','')]
    boundaries.append({'name':source.name,'mesh':o.name,'stem':stem,'location':list(o.location),'splines':[[{'p':list(p.co),'l':list(p.handle_left),'r':list(p.handle_right)} for p in spline.bezier_points] for spline in source.data.splines]})
    report.append(item)
    dec.show_viewport=False;dec.show_render=False
objects=[o for o in bpy.context.scene.objects if o.type in {'MESH','CURVE'} and not o.hide_render and any(c.name.startswith(('01 |','02 | Shallow','05 |')) for c in o.users_collection)]
bpy.ops.object.select_all(action='DESELECT')
for o in objects:o.hide_set(False);o.select_set(True)
bpy.context.view_layer.objects.active=objects[0]
bpy.ops.export_scene.gltf(filepath=str(OUT/'no-decimate.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
(OUT/'diagnostic.json').write_text(json.dumps(report,indent=2))
(OUT/'source-curves.json').write_text(json.dumps(boundaries,indent=2))
(OUT/'provenance.json').write_text(json.dumps({'approved_blend_sha256':hashlib.sha256((ROOT/'design/brand/abg-logo.blend').read_bytes()).hexdigest(),'curves_sha256':hashlib.sha256((OUT/'source-curves.json').read_bytes()).hexdigest(),'blender_version':bpy.app.version_string},indent=2))
print('DIAGNOSTICS_WRITTEN',flush=True)
