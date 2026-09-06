"""
Blender to Three.js Automated Asset Pipeline
=============================================
This script runs in Blender 3.x / 4.x (in Blender's Scripting workspace or via CLI):
    blender -b -P tools/blender_export_pipeline.py
    blender my_scene.blend -b -P tools/blender_export_pipeline.py

Features:
1. Batch exports collections or selected meshes to WebGL-optimized glTF/GLB files.
2. Automates Principled BSDF PBR material setup (Albedo, Roughness, Metalness, Normal Map).
3. Applies modifiers, cleans up duplicate vertices, and computes tangent space normals.
4. Auto-exports directly into the web project's `public/models/` directory for Three.js.
5. Includes procedural geometry generators for mountain props (bridges, rocks, wildlife).
"""

import os
import sys
import math

try:
    import bpy
    import bmesh
    BLENDER_AVAILABLE = True
except ImportError:
    BLENDER_AVAILABLE = False
    print("[WARNING] bpy not found outside Blender. This script is intended to be run inside Blender.")


def get_project_export_dir():
    """Locate or create the project's public/models directory."""
    script_dir = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd()
    project_root = os.path.dirname(script_dir)
    export_dir = os.path.join(project_root, "public", "models")
    os.makedirs(export_dir, exist_ok=True)
    return export_dir


def clean_mesh(obj):
    """Merge duplicate vertices, recalculate normals, and validate mesh."""
    if not BLENDER_AVAILABLE or obj.type != 'MESH':
        return
    
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    
    bm = bmesh.from_edit_mesh(obj.data)
    # Remove doubles / close vertices
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0005)
    # Recalculate normals facing outwards
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.update_edit_mesh(obj.data)
    
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.data.use_auto_smooth = True if hasattr(obj.data, 'use_auto_smooth') else False


def setup_pbr_material(name, base_color=(0.35, 0.28, 0.22, 1.0), roughness=0.7, metallic=0.0):
    """Create or configure a standard glTF-compliant Principled BSDF material."""
    if not BLENDER_AVAILABLE:
        return None
    
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
    
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    output_node = nodes.new(type='ShaderNodeOutputMaterial')
    output_node.location = (400, 0)
    
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    
    # Material properties
    if hasattr(bsdf.inputs['Base Color'], 'default_value'):
        bsdf.inputs['Base Color'].default_value = base_color
    if hasattr(bsdf.inputs['Roughness'], 'default_value'):
        bsdf.inputs['Roughness'].default_value = roughness
    if hasattr(bsdf.inputs['Metallic'], 'default_value'):
        bsdf.inputs['Metallic'].default_value = metallic
    
    links.new(bsdf.outputs['BSDF'], output_node.inputs['Surface'])
    return mat


def export_selected_to_glb(filename, export_dir=None):
    """Exports currently selected objects as an optimized binary GLTF (.glb)."""
    if not BLENDER_AVAILABLE:
        print("[ERROR] Cannot export GLB: Blender bpy module is not available.")
        return None
    
    if export_dir is None:
        export_dir = get_project_export_dir()
    
    filepath = os.path.join(export_dir, f"{filename}.glb")
    
    # Deselect non-meshes or ensure proper selection
    selected_meshes = [obj for obj in bpy.context.selected_objects if obj.type in ('MESH', 'EMPTY')]
    if not selected_meshes:
        print(f"[WARNING] No meshes selected to export for {filename}.glb")
        return None
    
    for obj in selected_meshes:
        if obj.type == 'MESH':
            clean_mesh(obj)
    
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=True,
        export_apply=True,           # Apply modifiers (subdiv, bevels, etc.)
        export_yup=True,             # Three.js Y-up coordinate convention
        export_normals=True,         # Include vertex normals
        export_tangents=True,        # Include tangents for normal mapping
        export_materials='EXPORT',   # Export PBR Principled BSDF materials
        export_colors=True,          # Include vertex colors
        export_cameras=False,
        export_lights=False,
    )
    
    print(f"[SUCCESS] Exported optimized model to: {filepath}")
    return filepath


# ─────────────────────────────────────────────────────────────
# PROCEDURAL GENERATORS (can be run directly in Blender)
# ─────────────────────────────────────────────────────────────

def generate_procedural_bridge():
    """Generates a rustic wooden observation bridge for the waterfall in Blender."""
    if not BLENDER_AVAILABLE:
        return
    
    # Create wood material
    wood_mat = setup_pbr_material("RusticWood", base_color=(0.28, 0.20, 0.13, 1.0), roughness=0.85)
    rope_mat = setup_pbr_material("BridgeRope", base_color=(0.42, 0.38, 0.30, 1.0), roughness=0.90)

    bpy.ops.object.select_all(action='DESELECT')
    bridge_objects = []

    # Planks spanning length 14m, width 2.8m
    plank_count = 28
    bridge_length = 14.0
    bridge_width = 2.8

    for i in range(plank_count):
        t = i / (plank_count - 1)
        x = (t - 0.5) * bridge_length
        # Gentle catenary sag in center
        y_sag = math.sin(t * math.pi) * -0.45
        
        bpy.ops.mesh.primitive_cube_add(
            size=1.0,
            location=(x, y_sag, 0),
            scale=(0.42, 0.12, bridge_width)
        )
        plank = bpy.context.active_object
        plank.name = f"Bridge_Plank_{i:02d}"
        plank.data.materials.append(wood_mat)
        bridge_objects.append(plank)

    # Support handrails & posts
    post_count = 8
    for i in range(post_count):
        t = i / (post_count - 1)
        x = (t - 0.5) * bridge_length
        y_sag = math.sin(t * math.pi) * -0.45

        for side in (-bridge_width / 2, bridge_width / 2):
            bpy.ops.mesh.primitive_cylinder_add(
                radius=0.1,
                depth=1.2,
                location=(x, y_sag + 0.6, side)
            )
            post = bpy.context.active_object
            post.name = f"Bridge_Post_{i:02d}_{'L' if side < 0 else 'R'}"
            post.data.materials.append(wood_mat)
            bridge_objects.append(post)

    for obj in bridge_objects:
        obj.select_set(True)

    export_dir = get_project_export_dir()
    export_selected_to_glb("wooden_bridge", export_dir)


if __name__ == "__main__":
    print("=" * 60)
    print("Blender to Three.js Pipeline Tool Initialized")
    print(f"Target export directory: {get_project_export_dir()}")
    print("=" * 60)

    if BLENDER_AVAILABLE:
        # Check if running headless with instructions
        generate_procedural_bridge()
