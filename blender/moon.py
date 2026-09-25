"""Renders the moon for a special's drop: the hexagram stands in front like a tower, and
behind it a low-poly moon builds itself, its wireframe drawn first in the lines' green,
then its facets filled in at random, flaring once it is whole, while it rises. With
--labels, each line lights up with its label as the moon climbs, bottom to top.

Timed for a 16-beat lesson: labels from beat 1.5, the moon whole at beat 9, and the last
5 beats left clear for the sentence the template types over it.

Run through scripts/moon.mjs, or directly:
  Blender -b --factory-startup --python-exit-code 1 -P blender/moon.py -- \
    --lines 000011 --bpm 95 --beats 16 --rain public/assets/3d/rain.mp4 \
    --pixel public/fonts/PixelOperator-Bold.ttf [--labels "A|B|C|D|E|F"] --out out/moon.mp4
"""

import argparse
import math
import os
import random
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hexagram import PULSE, REST, add_slab, bloom, key, linear, obsidian, rain_plane, render_settings  # noqa: E402
from layout import FPS, frame_count, line_z, slabs  # noqa: E402

MOON = "#f4efe4"
RADIUS = 6.0
DROP = -3.4  # the hexagram sits this far below the centre of the frame


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--lines", required=True)
    p.add_argument("--bpm", type=float, required=True)
    p.add_argument("--beats", type=float, required=True)
    p.add_argument("--rain", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--edge", default="#6cff7a")
    p.add_argument("--pixel", help="font for the labels")
    p.add_argument("--labels", help="six labels, bottom line first, separated by |")
    p.add_argument("--still", type=int, help="render only this clip frame, as a PNG")
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def facets(seed=20):
    """An icosphere with every vertex pushed in or out a little, so its flat faces catch the
    light unevenly, like a cut stone."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=RADIUS)
    o = bpy.context.object
    rng = random.Random(seed)
    for v in o.data.vertices:
        v.co *= 1 + rng.uniform(-0.045, 0.045)
    for p in o.data.polygons:
        p.use_smooth = False
    # Each facet its own shade of moon-grey, some a touch blue, like maria and highlands.
    shade = o.data.color_attributes.new("shade", "FLOAT_COLOR", "CORNER")
    for p in o.data.polygons:
        g = rng.uniform(0.6, 1.0)
        c = (g * rng.uniform(0.9, 1.0), g * rng.uniform(0.93, 1.0), g, 1.0)
        for li in p.loop_indices:
            shade.data[li].color = c
    return o


def moon_material():
    m = bpy.data.materials.new("moon")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = linear(MOON)
    b.inputs["Roughness"].default_value = 0.55
    b.inputs["Emission Color"].default_value = linear(MOON)
    b.inputs["Emission Strength"].default_value = 0.35
    attr = m.node_tree.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "shade"
    tint = m.node_tree.nodes.new("ShaderNodeMix")
    tint.data_type, tint.blend_type = "RGBA", "MULTIPLY"
    tint.inputs["Factor"].default_value = 1.0
    tint.inputs["A"].default_value = linear(MOON)
    m.node_tree.links.new(attr.outputs["Color"], tint.inputs["B"])
    m.node_tree.links.new(tint.outputs["Result"], b.inputs["Base Color"])
    m.node_tree.links.new(tint.outputs["Result"], b.inputs["Emission Color"])
    return m, b.inputs["Emission Strength"]


def wire_material(colour):
    m = bpy.data.materials.new("moon-wire")
    m.use_nodes = True
    nodes, links = m.node_tree.nodes, m.node_tree.links
    nodes.clear()
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = colour
    emit.inputs["Strength"].default_value = REST
    out = nodes.new("ShaderNodeOutputMaterial")
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return m, emit.inputs["Strength"]


def build(o, start, length, seed):
    """Faces appear one by one in a random order from `start` over `length` frames."""
    mod = o.modifiers.new("build", "BUILD")
    mod.frame_start = start + 1
    mod.frame_duration = max(1, length)
    mod.use_random_order = True
    mod.seed = seed
    return mod


def moon(beat, frames, colour):
    """The wire, then the facets, then a flare; the moon rises and turns throughout."""
    solid = facets()
    m, glow = moon_material()
    solid.data.materials.append(m)
    wire = facets()
    wm, wglow = wire_material(colour)
    wire.data.materials.append(wm)
    build(wire, 0, round(1.5 * beat), seed=3)
    w = wire.modifiers.new("wire", "WIREFRAME")
    w.thickness = 0.035
    # The facets sit just inside the wire, so the green edges stay on top.
    solid.scale = (0.985, 0.985, 0.985)
    fill_at = round(1.0 * beat)
    build(solid, fill_at, round(8 * beat), seed=7)
    whole = fill_at + round(8 * beat)
    for f, v in ((whole - 1, 0.35), (whole + 2, 6.0), (whole + round(beat), 1.6), (frames - 1, 1.8)):
        glow.default_value = v
        glow.keyframe_insert("default_value", frame=f + 1)
    # Once whole, the wire dims to a faint seam and the moon is mostly light.
    for f, v in ((whole - 1, REST), (whole + 2, PULSE * 0.5), (whole + round(beat), 1.2)):
        wglow.default_value = v
        wglow.keyframe_insert("default_value", frame=f + 1)
    for o in (solid, wire):
        for f, z, spin in ((0, -1.0, 0), (frames - 1, 7.4, 40)):
            o.location = (0, 12, z)
            key(o, "location", f)
            o.rotation_euler = (math.radians(12), 0, math.radians(spin))
            key(o, "rotation_euler", f)
    # Moonlight: from the moon, toward the camera, through the haze.
    light = bpy.data.lights.new("moonlight", "POINT")
    light.energy, light.color, light.shadow_soft_size = 3000, linear(MOON)[:3], 3.0
    lo = bpy.data.objects.new("moonlight", light)
    bpy.context.scene.collection.objects.link(lo)
    lo.parent = solid
    # Light from the front-left, so the facets show.
    sun = bpy.data.lights.new("sun", "SUN")
    sun.energy, sun.angle = 3.5, math.radians(4)
    so = bpy.data.objects.new("sun", sun)
    so.rotation_euler = (math.radians(60), 0, math.radians(-50))
    bpy.context.scene.collection.objects.link(so)
    return whole


def tower(lines, black, colour):
    """The hexagram, standing low in the frame. Returns each line's edge strengths."""
    edges = {}
    for i, x, z, w in slabs(lines):
        _, strength = add_slab(i, x, z + DROP, w, black, colour)
        edges.setdefault(i, []).append(strength)
    return edges


def label_times(beat):
    """Clip frame each line's label lights, bottom first."""
    return [round((1.5 + 1.35 * i) * beat) for i in range(6)]


def labels(texts, font, edges, beat):
    """Each label lit on its line's face as the moon passes, with a flare of the line's edge."""
    m = bpy.data.materials.new("label")
    m.use_nodes = True
    nodes, links = m.node_tree.nodes, m.node_tree.links
    nodes.clear()
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = linear(MOON)
    emit.inputs["Strength"].default_value = 2.2
    out = nodes.new("ShaderNodeOutputMaterial")
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    face = -0.45 / 2 - 0.01  # just in front of the slab (hexagram.DEPTH)
    for i, (body, at) in enumerate(zip(texts, label_times(beat))):
        curve = bpy.data.curves.new(f"label{i}", "FONT")
        curve.body = body
        curve.font = bpy.data.fonts.load(os.path.abspath(font))
        curve.size = 0.4
        curve.align_x, curve.align_y = "CENTER", "CENTER"
        o = bpy.data.objects.new(f"label{i}", curve)
        bpy.context.scene.collection.objects.link(o)
        o.rotation_euler = (math.radians(90), 0, 0)
        o.location = (0, face, line_z(i) + DROP)
        bpy.context.view_layer.update()
        if o.dimensions.x > 5.6:
            curve.size *= 5.6 / o.dimensions.x
        o.data.materials.append(m)
        # Flickers on, like a sign.
        for f, hidden in ((0, True), (at, False), (at + 2, True), (at + 3, False)):
            o.hide_render = hidden
            key(o, "hide_render", f)
        for strength in edges[i]:
            for f, v in ((at - 1, REST), (at, PULSE), (at + 10, REST)):
                strength.default_value = v
                strength.keyframe_insert("default_value", frame=f + 1)


def haze(scene):
    world = bpy.data.worlds.new("haze")
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    nodes["Background"].inputs["Strength"].default_value = 0
    fog = nodes.new("ShaderNodeVolumePrincipled")
    fog.inputs["Density"].default_value = 0.012
    fog.inputs["Anisotropy"].default_value = 0.6
    links.new(fog.outputs["Volume"], nodes["World Output"].inputs["Volume"])
    scene.world = world
    scene.eevee.volumetric_start, scene.eevee.volumetric_end = 1, 40
    scene.eevee.volumetric_samples = 64
    scene.eevee.use_volumetric_shadows = True


def camera(scene, frames):
    """Low, looking up at the tower, pushing in slowly."""
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    data = bpy.data.cameras.new("camera")
    data.lens = 35
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
    for f, dist, cz, tz in ((0, 17.5, -4.6, 0.2), (frames - 1, 16.5, -4.4, 1.2)):
        cam.location = (0, -dist, cz)
        key(cam, "location", f)
        target.location = (0, 0, tz)
        key(target, "location", f)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = frame_count(args.beats, args.bpm)
    beat = 60 * FPS / args.bpm
    colour = linear(args.edge)
    edges = tower(args.lines, obsidian(), colour)
    moon(beat, frames, colour)
    if args.labels:
        texts = args.labels.split("|")
        if len(texts) != 6 or not args.pixel:
            raise SystemExit("--labels needs six labels separated by |, and --pixel")
        labels(texts, args.pixel, edges, beat)
    rain_plane(args.rain)
    bpy.data.materials["rain"].node_tree.nodes["Emission"].inputs["Strength"].default_value = 0.15
    # The rain sits behind the moon.
    bpy.data.objects["Plane"].location.y = 22
    bpy.data.objects["Plane"].scale = (40, 60, 1)
    camera(scene, frames)
    haze(scene)
    bloom(scene)
    render_settings(scene, frames, args.out, args.preview)
    if args.still is not None:
        scene.frame_set(args.still + 1)
        scene.render.image_settings.media_type = "IMAGE"
        scene.render.image_settings.file_format = "PNG"
        scene.render.filepath = os.path.abspath(args.out)
        bpy.ops.render.render(write_still=True)
    else:
        bpy.ops.render.render(animation=True)


main()
