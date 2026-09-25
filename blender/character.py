"""Draws a hexagram's character in 3D, stroke by stroke, as a lesson picture: some strokes
as glowing low-poly tubes lying on the ground, others rising as obsidian walls with a neon
crest. The lying strokes first stand up as a thing (for 困, a tree), the walls rise
around it, then it is pressed down flat inside them. The camera starts low, where the
strokes read as things, and cranes up to look straight down, where they read as the
character.

Stroke paths are the character's medians from Make Me a Hanzi (hanzi-writer-data, Arphic
Public License), fetched to public/local/hanzi/ by scripts/character.mjs.

  Blender -b --factory-startup --python-exit-code 1 -P blender/character.py -- \
    --data public/local/hanzi/困.json --order 3,2,4,5,0,1,6 --walls 0,1,6 \
    --bpm 95 --beats 10 --out out/characters/kun.mp4 [--still N] [--preview]
"""

import argparse
import json
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hexagram import PULSE, REST, bloom, edge, key, linear, obsidian, render_settings  # noqa: E402
from layout import FPS, frame_count  # noqa: E402

SCALE = 1 / 100  # hanzi units (a 1024 box, y up) to metres
CENTRE = (512, 388)
TUBE = 0.16  # a lying stroke's square section
WALL_W, WALL_H = 0.2, 1.5


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--data", required=True)
    p.add_argument("--order", help="stroke indices in drawing order, comma separated")
    p.add_argument("--walls", default="", help="stroke indices that rise as walls")
    p.add_argument("--stand", action="store_true", help="the lying strokes stand up first, and are pressed flat once the walls close")
    p.add_argument("--bpm", type=float, required=True)
    p.add_argument("--beats", type=float, required=True)
    p.add_argument("--edge", default="#6cff7a")
    p.add_argument("--out", required=True)
    p.add_argument("--still", type=int)
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def profile(name, w, h):
    """A closed rectangle, w wide and h tall, swept along a stroke as its section."""
    c = bpy.data.curves.new(name, "CURVE")
    s = c.splines.new("POLY")
    s.points.add(3)
    for p, (x, y) in zip(s.points, ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2))):
        p.co = (x, y, 0, 1)
    s.use_cyclic_u = True
    o = bpy.data.objects.new(name, c)
    bpy.context.scene.collection.objects.link(o)
    o.hide_render = o.hide_viewport = True
    return o


def stroke(i, points, section, z, material, parent=None):
    """A stroke as a curve swept with `section`, `z` above the ground; returns the curve."""
    c = bpy.data.curves.new(f"stroke{i}", "CURVE")
    c.dimensions = "3D"
    s = c.splines.new("POLY")
    s.points.add(len(points) - 1)
    for p, (x, y) in zip(s.points, points):
        p.co = ((x - CENTRE[0]) * SCALE, (y - CENTRE[1]) * SCALE, 0, 1)
    c.bevel_mode = "OBJECT"
    c.bevel_object = section
    c.use_fill_caps = True
    c.twist_mode = "Z_UP"
    o = bpy.data.objects.new(f"stroke{i}", c)
    bpy.context.scene.collection.objects.link(o)
    o.location.z = z
    o.data.materials.append(material)
    if parent:
        o.parent = parent
        o.location = (o.location.x - parent.location.x, o.location.y - parent.location.y, z)
    return c


def draw(c, start, length):
    """Grows the stroke along its path from `start` over `length` frames."""
    for f, v in ((start, 0.0), (start + length, 1.0)):
        c.bevel_factor_end = v
        c.keyframe_insert("bevel_factor_end", frame=f + 1)


def camera(scene, frames, beat):
    """Low beside the strokes, then craning up to look straight down on the character."""
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    data = bpy.data.cameras.new("camera")
    data.lens = 35
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
    rise = frames - round(3 * beat)
    for f, loc, t in ((0, (0, -11, 2.4), (0, 0, 2.4)), (rise, (0, -9.5, 4.5), (0, 0.2, 0.8)), (frames - 1, (0, -0.6, 15.5), (0, 0.4, 0))):
        cam.location = loc
        key(cam, "location", f)
        target.location = t
        key(target, "location", f)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    data = json.load(open(args.data))
    medians = data["medians"]
    order = [int(i) for i in args.order.split(",")] if args.order else list(range(len(medians)))
    walls = {int(i) for i in args.walls.split(",") if i}
    frames = frame_count(args.beats, args.bpm)
    beat = 60 * FPS / args.bpm
    colour = linear(args.edge)

    tube = profile("tube", TUBE, TUBE)
    wall = profile("wall", WALL_W, WALL_H)
    crest = profile("crest", WALL_W * 1.1, 0.06)
    black = obsidian()

    # The lying strokes a beat apart from beat 0.5, then the walls a beat apart.
    t = round(0.5 * beat)
    lying = [i for i in order if i not in walls]
    rising = [i for i in order if i in walls]
    # Standing, the lying strokes turn up about the lowest point of the first one (a trunk's foot).
    pivot = None
    if args.stand:
        foot = min(medians[lying[0]], key=lambda p: p[1])
        pivot = bpy.data.objects.new("pivot", None)
        scene.collection.objects.link(pivot)
        pivot.location = (0, (foot[1] - CENTRE[1]) * SCALE, 0)
    glows = []
    for i in lying:
        glow, strength = edge(colour, f"glow{i}")
        draw(stroke(i, medians[i], tube, TUBE / 2, glow, pivot), t, round(0.8 * beat))
        for f, v in ((t - 1, REST), (t + round(0.8 * beat), PULSE * 0.4), (t + round(1.4 * beat), REST)):
            strength.default_value = v
            strength.keyframe_insert("default_value", frame=f + 1)
        glows.append(strength)
        t += round(0.9 * beat)
    t += round(0.4 * beat)
    for i in rising:
        draw(stroke(i, medians[i], wall, WALL_H / 2, black), t, round(0.9 * beat))
        top, _ = edge(colour, f"crest{i}")
        draw(stroke(f"{i}c", medians[i], crest, WALL_H, top), t, round(0.9 * beat))
        t += round(1.0 * beat)
    # Once the walls close, a standing thing is pressed flat inside them.
    if pivot:
        for f, a in ((0, 90), (t, 90), (t + round(0.5 * beat), -4), (t + round(0.7 * beat), 0)):
            pivot.rotation_euler.x = math.radians(a)
            key(pivot, "rotation_euler", f, index=0)
        t += round(0.5 * beat)
    # When the last wall closes, the lying strokes flare once, pressing against it.
    for strength in glows:
        for f, v in ((t - 1, REST), (t + 2, PULSE), (t + round(beat), REST * 1.5)):
            strength.default_value = v
            strength.keyframe_insert("default_value", frame=f + 1)

    world = bpy.data.worlds.new("black")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0
    scene.world = world
    # A sun, low from behind, so the floor shows no light's reflection toward the camera.
    light = bpy.data.lights.new("key", "SUN")
    light.energy, light.angle, light.color = 2.0, math.radians(8), (0.85, 1.0, 0.9)
    lo = bpy.data.objects.new("key", light)
    lo.rotation_euler = (math.radians(-55), 0, math.radians(25))
    scene.collection.objects.link(lo)
    # A dark glossy floor, so the strokes' glow reflects under them.
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
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


main()
