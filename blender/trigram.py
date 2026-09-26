"""Acts out a hexagram's Image, the picture its two trigrams make, as a lesson picture.
The hexagram stands on a dark glass floor; its trigrams part and light up with their names;
then the picture plays out between them. There is no shake: the camera drifts and cranes.

--scene lake (60, water over the lake): the lower trigram sinks into the floor and a round
lake rises in its place; the upper trigram turns to water and rains into it; the lake fills
to its rim and stops there, the rim flares, and a last drop only ripples the surface.

Timed for a lesson of --beats beats, with the last 5 beats left clear for the sentence the
template types under it.

Run through scripts/lesson3d.mjs, or directly:
  Blender -b --factory-startup --python-exit-code 1 -P blender/trigram.py -- \
    --scene lake --lines 110010 --names "LAKE|WATER" --pixel public/fonts/PixelOperator-Bold.ttf \
    --bpm 100 --beats 12 --out out/trigram.mp4 [--still N] [--preview]
"""

import argparse
import math
import os
import random
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hexagram import DEPTH, PULSE, REST, add_slab, bloom, edge, key, linear, obsidian, render_settings  # noqa: E402
from layout import FPS, frame_count, line_z, slabs  # noqa: E402

WATER = "#5ee7ff"
LABEL = "#e8f5e4"
BASE = 3.2  # the hexagram's centre height above the floor
RIM_R = 2.7  # the lake's radius
RIM_H = 1.3  # the lake's wall height
FULL = RIM_H - 0.04  # the water's level when the lake is full


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--scene", choices=("lake",), required=True)
    p.add_argument("--lines", required=True, help="six lines, bottom first, 1 = yang")
    p.add_argument("--names", required=True, help="the lower and upper trigrams' names, separated by |")
    p.add_argument("--pixel", required=True)
    p.add_argument("--edge", default="#6cff7a")
    p.add_argument("--bpm", type=float, required=True)
    p.add_argument("--beats", type=float, required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--still", type=int)
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def emission(name, colour, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nodes, links = m.node_tree.nodes, m.node_tree.links
    nodes.clear()
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = linear(colour)
    emit.inputs["Strength"].default_value = strength
    links.new(emit.outputs["Emission"], nodes.new("ShaderNodeOutputMaterial").inputs["Surface"])
    return m, emit.inputs["Strength"]


def pulse(strength, f, peak=PULSE, rest=REST):
    for g, v in ((f - 1, rest), (f + 2, peak), (f + 10, rest)):
        strength.default_value = v
        strength.keyframe_insert("default_value", frame=g + 1)


def trigrams(lines, black, colour):
    """The hexagram standing on the floor, each trigram on its own empty so they can part.
    Returns (lower, upper) as (empty, [(slab, edge strength)])."""
    halves = []
    for h in range(2):
        e = bpy.data.objects.new(f"trigram{h}", None)
        bpy.context.scene.collection.objects.link(e)
        halves.append((e, []))
    for i, x, z, w in slabs(lines):
        o, strength = add_slab(i, x, z + BASE, w, black, colour)
        e, parts = halves[i // 3]
        o.parent = e
        parts.append((o, strength))
    return halves


def label(name, text, z, font, t):
    """A trigram's name on the face of its middle line, flickering on at frame `t`."""
    m, _ = emission(f"label-{name}", LABEL, 2.4)
    curve = bpy.data.curves.new(name, "FONT")
    curve.body = text
    curve.font = bpy.data.fonts.load(os.path.abspath(font))
    curve.size = 0.42
    curve.align_x, curve.align_y = "CENTER", "CENTER"
    o = bpy.data.objects.new(name, curve)
    bpy.context.scene.collection.objects.link(o)
    o.rotation_euler = (math.radians(90), 0, 0)
    o.location = (0, -DEPTH / 2 - 0.01, z)
    o.data.materials.append(m)
    for f, hidden in ((0, True), (t, False), (t + 2, True), (t + 3, False)):
        o.hide_render = hidden
        key(o, "hide_render", f)
    return o


def lake(t, fill_end, beat, black):
    """The lake rises out of the floor at frame `t`: a dark wall, a neon rim and water that
    fills to FULL by `fill_end`. Returns the rim's strength and the water's surface object."""
    # An open ring of clear glass, so the water line shows rising up its side.
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=RIM_R, depth=RIM_H, end_fill_type="NOTHING", location=(0, 0, -RIM_H / 2))
    wall = bpy.context.object
    wall.modifiers.new("thick", "SOLIDIFY").thickness = 0.06
    clear = bpy.data.materials.new("lake glass")
    clear.use_nodes = True
    g = clear.node_tree.nodes["Principled BSDF"]
    g.inputs["Base Color"].default_value = (0.8, 1.0, 0.95, 1)
    g.inputs["Transmission Weight"].default_value = 1.0
    g.inputs["Roughness"].default_value = 0.04
    wall.data.materials.append(clear)
    bpy.ops.mesh.primitive_torus_add(major_radius=RIM_R, minor_radius=0.045, major_segments=64, minor_segments=8, location=(0, 0, -0.1))
    rim = bpy.context.object
    rim_m, rim_glow = edge(linear(WATER), "rim")
    rim.data.materials.append(rim_m)
    up = t + round(0.6 * beat)
    for o, z0, z1 in ((wall, -RIM_H / 2, RIM_H / 2), (rim, -0.1, RIM_H)):
        for f, z in ((0, z0), (t, z0), (up, z1)):
            o.location.z = z
            key(o, "location", f, index=2)
    # The water: a glowing disc just inside the wall, rising from the floor to FULL.
    bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=RIM_R - 0.06, depth=1, location=(0, 0, 0))
    water = bpy.context.object
    m = bpy.data.materials.new("water")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = linear("#0a3a44")
    b.inputs["Roughness"].default_value = 0.05
    b.inputs["Coat Weight"].default_value = 1.0
    b.inputs["Emission Color"].default_value = linear(WATER)
    b.inputs["Emission Strength"].default_value = 1.6
    water.data.materials.append(m)
    show = t + round(0.8 * beat)
    for f, hidden in ((0, True), (show, False)):
        water.hide_render = hidden
        key(water, "hide_render", f)
    for f, h in ((0, 0.001), (show, 0.001), (fill_end, FULL)):
        water.scale.z = h
        water.location.z = h / 2
        key(water, "scale", f, index=2)
        key(water, "location", f, index=2)
    return rim_glow, water


def rain(top, start, stop, beat, water_level):
    """Streaks of water falling from height `top` into the lake from `start` until `stop`."""
    m, _ = emission("rain", WATER, 6.0)
    rng = random.Random(60)
    fall = round(0.5 * beat)
    for n in range(46):
        bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.025, depth=0.45)
        o = bpy.context.object
        o.data.materials.append(m)
        o.location = (rng.uniform(-2.4, 2.4) * 0.9, rng.uniform(-1.6, 1.6), top)
        f = start + rng.randrange(0, fall)
        o.hide_render = True
        key(o, "hide_render", 0)
        while f + fall < stop:
            o.hide_render = False
            key(o, "hide_render", f)
            o.location.z = top
            key(o, "location", f, index=2)
            o.location.z = water_level(f + fall) + 0.2
            key(o, "location", f + fall, index=2)
            o.hide_render = True
            key(o, "hide_render", f + fall + 1)
            f += fall + rng.randrange(1, 4)
        # Falling at a steady speed, not easing in and out.
        for fc in o.animation_data.action.fcurves if hasattr(o.animation_data.action, "fcurves") else []:
            for kp in fc.keyframe_points:
                kp.interpolation = "LINEAR"


def drop(top, f, beat, level):
    """One last drop at frame `f`; it lands on the full lake and a ring spreads to the rim."""
    m, _ = emission("drop", WATER, 8.0)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.09)
    o = bpy.context.object
    o.data.materials.append(m)
    land = f + round(0.5 * beat)
    for g, hidden in ((0, True), (f, False), (land, True)):
        o.hide_render = hidden
        key(o, "hide_render", g)
    for g, z in ((f, top), (land, level)):
        o.location.z = z
        key(o, "location", g, index=2)
    bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=0.02, major_segments=64, minor_segments=6, location=(0, 0, level + 0.01))
    ring = bpy.context.object
    ring_m, ring_glow = emission("ring", WATER, 5.0)
    ring.data.materials.append(ring_m)
    end = land + round(1.2 * beat)
    for g, r, hidden in ((0, 0.05, True), (land, 0.05, False), (end, RIM_R - 0.1, False), (end + 1, RIM_R - 0.1, True)):
        ring.scale = (r, r, 1)
        key(ring, "scale", g)
        ring.hide_render = hidden
        key(ring, "hide_render", g)
    for g, v in ((land, 5.0), (end, 0.0)):
        ring_glow.default_value = v
        ring_glow.keyframe_insert("default_value", frame=g + 1)
    return land


def camera(scene, frames, beat):
    """In front, level with the standing hexagram, then craning up a little over the lake."""
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    data = bpy.data.cameras.new("camera")
    data.lens = 35
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
    # It stays low enough at the end to see the water line on the lake's glass wall.
    keys = ((0, (0, -15, 3.0), (0, 0, 1.6)), (round(2.5 * beat), (0, -14, 5.0), (0, 0, 1.4)), (frames - 1, (0, -12.5, 6.2), (0, 0.6, 0.9)))
    for f, loc, t in keys:
        cam.location = loc
        key(cam, "location", f)
        target.location = t
        key(target, "location", f)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = frame_count(args.beats, args.bpm)
    beat = 60 * FPS / args.bpm
    colour = linear(args.edge)
    black = obsidian()
    names = args.names.split("|")

    (lower, low_parts), (upper, up_parts) = trigrams(args.lines, black, colour)
    # Beat 0.3: the lines light bottom to top. Beat 1.2: the trigrams part and take their names.
    for k, (_, strength) in enumerate(low_parts + up_parts):
        pulse(strength, round((0.3 + 0.12 * k) * beat))
    part = round(1.2 * beat)
    for e, dz in ((lower, -0.5), (upper, 1.6)):
        for f, z in ((0, 0), (part, 0), (part + round(0.4 * beat), dz)):
            e.location.z = z
            key(e, "location", f, index=2)
    for h, e in enumerate((lower, upper)):
        tag = label(f"name{h}", names[h], line_z(1 + 3 * h) + BASE, args.pixel, part + round(0.4 * beat))
        tag.parent = e

    # Beat 2.4: the lower trigram sinks into the floor and the lake rises in its place.
    sink = round(2.4 * beat)
    for f, z in ((sink, -0.5), (sink + round(0.6 * beat), -BASE - 2.5)):
        lower.location.z = z
        key(lower, "location", f, index=2)
    # The upper trigram turns to water and rains into the lake until it is full, at beat 6.5.
    fill_start, fill_end = sink + round(0.6 * beat), round(6.5 * beat)
    for o, _ in up_parts:
        b = o.data.materials[1].node_tree.nodes["Principled BSDF"]
        for f, c, v in ((sink, colour, REST), (fill_start, linear(WATER), REST * 1.5), (fill_end, linear(WATER), REST * 0.4)):
            for name in ("Emission Color", "Base Color"):
                b.inputs[name].default_value = c
                b.inputs[name].keyframe_insert("default_value", frame=f + 1)
            b.inputs["Emission Strength"].default_value = v
            b.inputs["Emission Strength"].keyframe_insert("default_value", frame=f + 1)
    rim_glow, water = lake(sink, fill_end, beat, black)
    top = BASE + 1.6 + line_z(3) - 0.4

    def level(f):
        if f <= fill_start:
            return 0.0
        return FULL * min(1.0, (f - fill_start) / (fill_end - fill_start))

    rain(top, fill_start, fill_end, beat, level)
    # Full: the rim flares; then one last drop only ripples the surface.
    pulse(rim_glow, fill_end, PULSE, REST * 1.5)
    drop(top, fill_end + round(0.4 * beat), beat, FULL)

    world = bpy.data.worlds.new("black")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0
    scene.world = world
    light = bpy.data.lights.new("key", "SUN")
    light.energy, light.angle, light.color = 2.0, math.radians(8), (0.85, 1.0, 0.9)
    light.specular_factor = 0
    lo = bpy.data.objects.new("key", light)
    lo.rotation_euler = (math.radians(-55), 0, math.radians(25))
    scene.collection.objects.link(lo)
    bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, 0))
    bpy.context.object.data.materials.append(black)

    camera(scene, frames, beat)
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


if __name__ == "__main__":
    main()
