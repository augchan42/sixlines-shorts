"""Renders the 3D hexagram build: obsidian slabs with glowing edges landing bottom to top
on half-beats, over a glyph-rain backdrop, while the camera cranes up and pushes in.

Run through scripts/blender.mjs (npm run blender), or directly:
  Blender -b --factory-startup --python-exit-code 1 -P blender/hexagram.py -- \
    --lines 111111 --bpm 110 --beats 4 --rain public/assets/3d/rain.mp4 --out out/hex.mp4
"""

import argparse
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from layout import FPS, LINE_H, frame_count, land_frame, slabs  # noqa: E402

DEPTH = 0.45  # slab thickness front to back
RISE = 6  # frames from below the frame to landed
REST, PULSE = 6.0, 60.0  # edge emission strength at rest and as a line lands


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--lines", required=True)
    p.add_argument("--bpm", type=float, required=True)
    p.add_argument("--beats", type=float, required=True)
    p.add_argument("--rain", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--edge", default="#6cff7a")
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def linear(hex_colour):
    """#rrggbb (sRGB) to linear RGBA, as Blender colour inputs expect."""
    c = [int(hex_colour.lstrip("#")[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c], 1.0)


def key(obj, path, frame, index=-1):
    """Keyframe at a clip frame (from 0); Blender's frames start at 1."""
    obj.keyframe_insert(path, frame=frame + 1, index=index)


def obsidian():
    m = bpy.data.materials.new("obsidian")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.004, 0.005, 0.004, 1)
    b.inputs["Roughness"].default_value = 0.06
    b.inputs["Coat Weight"].default_value = 1.0
    return m


def edge(colour, name):
    """An emissive material for one slab's bevels; returns it and its strength input to animate."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = colour
    b.inputs["Emission Color"].default_value = colour
    b.inputs["Emission Strength"].default_value = REST
    return m, b.inputs["Emission Strength"]


def add_slab(i, x, z, w, black, colour):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 0, z))
    o = bpy.context.object
    o.name = f"line{i}"
    o.scale = (w, DEPTH, LINE_H)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(black)
    glow, strength = edge(colour, f"edge-{o.name}")
    o.data.materials.append(glow)
    # The bevel faces take material slot 1, the glowing edge.
    bevel = o.modifiers.new("bevel", "BEVEL")
    bevel.width = 0.035
    bevel.segments = 2
    bevel.material = 1
    return o, strength


def animate_slab(o, strength, z, land):
    """Hidden until it starts to rise, then rises from below the frame, overshoots and settles."""
    start = land - RISE
    o.hide_render = True
    key(o, "hide_render", start - 1)
    o.hide_render = False
    key(o, "hide_render", start)
    for frame, dz in ((start, -4.5), (land, 0.08), (land + 3, 0.0)):
        o.location.z = z + dz
        key(o, "location", frame, index=2)
    for frame, value in ((land - 1, REST), (land, PULSE), (land + 10, REST)):
        strength.default_value = value
        strength.keyframe_insert("default_value", frame=frame + 1)


def rain_plane(path):
    """The glyph rain on a far plane behind the slabs, looping."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 10, -1), rotation=(math.radians(90), 0, 0))
    plane = bpy.context.object
    plane.scale = (24, 40, 1)
    m = bpy.data.materials.new("rain")
    m.use_nodes = True
    nodes, links = m.node_tree.nodes, m.node_tree.links
    nodes.clear()
    img = bpy.data.images.load(os.path.abspath(path))
    img.source = "MOVIE"
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.image_user.frame_duration = img.frame_duration
    tex.image_user.use_auto_refresh = True
    tex.image_user.use_cyclic = True
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Strength"].default_value = 0.35
    out = nodes.new("ShaderNodeOutputMaterial")
    links.new(tex.outputs["Color"], emit.inputs["Color"])
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    plane.data.materials.append(m)


def camera(scene, frames, bpm):
    """Low and close on line 1, crane up and orbit 25° to square-on by beat 2.75, push in from beat 3."""
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    data = bpy.data.cameras.new("camera")
    data.lens = 35
    data.dof.use_dof = True
    data.dof.focus_object = target
    data.dof.aperture_fstop = 0.1  # low, so the far rain plane goes soft
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target = target
    track.track_axis = "TRACK_NEGATIVE_Z"
    track.up_axis = "UP_Y"
    beat = 60 * FPS / bpm
    # (clip frame, orbit angle, distance, camera height, target height). The final target
    # sits below the hexagram's centre so it frames above the names, as the 2D version does.
    for frame, deg, dist, cz, tz in (
        (0, 25, 7.0, -2.6, -2.3),
        (round(2.75 * beat), 0, 13.0, -1.0, -1.0),
        (round(3 * beat), 0, 13.0, -1.0, -1.0),
        (frames - 1, 0, 9.0, -1.0, -1.0),
    ):
        a = math.radians(deg)
        cam.location = (dist * math.sin(a), -dist * math.cos(a), cz)
        key(cam, "location", frame)
        target.location = (0, 0, tz)
        key(target, "location", frame)


def lights_and_world(scene):
    world = bpy.data.worlds.new("black")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0
    scene.world = world
    light = bpy.data.lights.new("key", "AREA")
    # Straight down from above, so its reflection stays off the faces the camera sees.
    light.energy = 80
    light.size = 8
    light.color = (0.85, 1.0, 0.9)
    obj = bpy.data.objects.new("key", light)
    obj.location = (0, 0, 8)
    scene.collection.objects.link(obj)


def bloom(scene):
    tree = bpy.data.node_groups.new("bloom", "CompositorNodeTree")
    tree.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    layers = tree.nodes.new("CompositorNodeRLayers")
    glare = tree.nodes.new("CompositorNodeGlare")
    glare.inputs["Type"].default_value = "Bloom"
    glare.inputs["Threshold"].default_value = 1.0
    glare.inputs["Strength"].default_value = 0.6
    glare.inputs["Size"].default_value = 0.6
    out = tree.nodes.new("NodeGroupOutput")
    tree.links.new(layers.outputs["Image"], glare.inputs["Image"])
    tree.links.new(glare.outputs["Image"], out.inputs[0])
    scene.compositing_node_group = tree


def render_settings(scene, frames, out, preview):
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.use_raytracing = True
    scene.eevee.taa_render_samples = 16 if preview else 64
    scene.render.resolution_x, scene.render.resolution_y = (540, 960) if preview else (1080, 1920)
    scene.render.resolution_percentage = 100
    scene.render.fps = FPS
    scene.frame_start, scene.frame_end = 1, frames
    scene.view_settings.view_transform = "Standard"
    scene.render.image_settings.media_type = "VIDEO"
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "PERC_LOSSLESS"
    scene.render.ffmpeg.ffmpeg_preset = "GOOD"
    scene.render.filepath = os.path.abspath(out)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = frame_count(args.beats, args.bpm)
    black, colour = obsidian(), linear(args.edge)
    for i, x, z, w in slabs(args.lines):
        o, strength = add_slab(i, x, z, w, black, colour)
        animate_slab(o, strength, z, land_frame(i, args.bpm))
    rain_plane(args.rain)
    camera(scene, frames, args.bpm)
    lights_and_world(scene)
    bloom(scene)
    render_settings(scene, frames, args.out, args.preview)
    bpy.ops.render.render(animation=True)


main()
