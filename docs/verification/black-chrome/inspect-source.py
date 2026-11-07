import bpy,json
from pathlib import Path
from mathutils import Vector
path=str(Path(__file__).resolve().parents[3]/"design/brand/abg-logo.blend")
bpy.ops.wm.open_mainfile(filepath=path)
objects=[o for o in bpy.context.scene.objects if o.type in {"MESH","CURVE"} and not o.hide_render and any(c.name.startswith(("01 |","02 | Shallow","05 |")) for c in o.users_collection)]
report={"file":path,"objects":[{"name":o.name,"type":o.type,"location":list(o.location),"scale":list(o.scale),"materials":[m.name for m in o.data.materials],"modifiers":[m.type for m in o.modifiers]} for o in objects]}
print(json.dumps(report))
