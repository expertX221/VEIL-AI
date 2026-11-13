import bpy, json, pathlib, math

root = pathlib.Path(__file__).resolve().parents[1]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def metal(name, color, metallic, roughness):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1)
    material.use_nodes = True
    shader = material.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
    return material

titanium = metal('Brushed titanium', (.61,.69,.8), .92, .19)
gold = metal('Coefficient inlay', (.96,.66,.29), .75, .23)

def finish(obj, name, material):
    obj.name = name
    obj.data.materials.append(material)

bpy.ops.mesh.primitive_torus_add(major_segments=64, minor_segments=12, location=(-1.25,0,0), major_radius=.68, minor_radius=.16)
finish(bpy.context.object, 'Key bow', titanium)
for location, dimensions, name in [((.3,0,0),(2.15,.25,.24),'Key shaft'),((1.05,-.25,0),(.22,.65,.24),'First coefficient'),((1.55,-.19,0),(.22,.52,.24),'Second coefficient')]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bevel = obj.modifiers.new('Machined edges','BEVEL')
    bevel.width=.035
    bevel.segments=3
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    finish(obj,name,titanium)

for value, location, size in [('2  3  5  7  11',(-.55,.02,.128),.10),('f(x) = s + ax',(-1.63,-.035,.17),.09)]:
    bpy.ops.object.text_add(location=location)
    obj=bpy.context.object
    obj.data.body=value
    obj.data.size=size
    obj.data.extrude=.002
    finish(obj,'Mathematical inlay',gold)
    bpy.ops.object.convert(target='MESH')

parts=[]
for obj in bpy.context.scene.objects:
    if obj.type!='MESH': continue
    mesh=obj.data
    mesh.calc_loop_triangles()
    positions=[]
    normals=[]
    for tri in mesh.loop_triangles:
        for index in tri.vertices:
            positions.extend(round(v,5) for v in obj.matrix_world @ mesh.vertices[index].co)
            normals.extend(round(v,5) for v in tri.normal)
    parts.append({'name':obj.name,'p':positions,'n':normals,'color':list(obj.data.materials[0].diffuse_color)[:3]})
(root/'src'/'key-asset.mjs').write_text('export default '+json.dumps(parts,separators=(',',':'))+';')
bpy.ops.wm.save_as_mainfile(filepath=str(root/'tools'/'mathematical-key.blend'))
print('Exported key parts',len(parts))
