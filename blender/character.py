"""Draws a hexagram's character in 3D, stroke by stroke, as a lesson picture, like a Hong
Kong neon sign: each stroke's real outline (a brush-style kaishu font) traced by a hollow,
faceted neon tube over a dark glass body. Some strokes lie on the ground; others rise as
obsidian walls in the stroke's own shape, with the neon along their top edge. The lying strokes first stand up as a thing (for 困, a tree), the walls rise
around it, then it is pressed down flat inside them. The camera starts low, where the
strokes read as things, and cranes up to look straight down, where they read as the
character.

Stroke outlines are from Make Me a Hanzi (hanzi-writer-data, Arphic
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
NEON = 0.03  # the neon tube's radius
BODY = 0.06  # a lying stroke's glass body, thickness
WALL_H = 1.5


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


def subpaths(d):
    """An SVG path (M, L, Q, C, Z, absolute) as closed lists of cubic segments
    (p0, c1, c2, p1), in hanzi units."""
    toks = d.replace(",", " ").split()
    out, cur, pos, i = [], [], None, 0
    num = lambda k: (float(toks[k]), float(toks[k + 1]))
    while i < len(toks):
        op = toks[i]
        if op == "M":
            if cur:
                out.append(cur)
            cur, pos, i = [], num(i + 1), i + 3
        elif op == "L":
            p1 = num(i + 1)
            cur.append((pos, lerp(pos, p1, 1 / 3), lerp(pos, p1, 2 / 3), p1))
            pos, i = p1, i + 3
        elif op == "Q":
            q, p1 = num(i + 1), num(i + 3)
            cur.append((pos, lerp(pos, q, 2 / 3), lerp(p1, q, 2 / 3), p1))
            pos, i = p1, i + 5
        elif op == "C":
            c1, c2, p1 = num(i + 1), num(i + 3), num(i + 5)
            cur.append((pos, c1, c2, p1))
            pos, i = p1, i + 7
        elif op == "Z":
            i += 1
        else:
            raise ValueError(f"path command {op}")
    if cur:
        out.append(cur)
    return out


def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def world(p):
    return ((p[0] - CENTRE[0]) * SCALE, (p[1] - CENTRE[1]) * SCALE, 0)


def outline(name, d):
    """A stroke's outline as a closed Bezier curve; returns the curve data."""
    c = bpy.data.curves.new(name, "CURVE")
    for segs in subpaths(d):
        if segs[-1][3] != segs[0][0]:
            p0, p1 = segs[-1][3], segs[0][0]
            segs.append((p0, lerp(p0, p1, 1 / 3), lerp(p0, p1, 2 / 3), p1))
        # Open, ending where it starts: Blender ignores a bevel's end factor on a cyclic
        # curve, and the neon has to trace itself in.
        s = c.splines.new("BEZIER")
        s.bezier_points.add(len(segs))
        for k, bp in enumerate(s.bezier_points):
            prev, seg = segs[k - 1], segs[k % len(segs)]
            bp.co = world(seg[0])
            bp.handle_left = world(prev[2])
            bp.handle_right = world(seg[1])
        # Few segments per curve: the neon reads as bent glass in facets, low-poly.
        s.resolution_u = 4
    return c


def place(o, z, parent):
    bpy.context.scene.collection.objects.link(o)
    o.location.z = z
    if parent:
        o.parent = parent
        o.location = (-parent.location.x, -parent.location.y, z)
    return o


def neon(name, d, z, material, parent=None):
    """The hollow tube tracing a stroke's outline, `z` above the ground; returns its curve."""
    c = outline(name, d)
    c.dimensions = "3D"
    c.bevel_depth = NEON
    c.bevel_resolution = 1
    c.use_fill_caps = True
    place(bpy.data.objects.new(name, c), z, parent).data.materials.append(material)
    return c


def body(name, d, height, z, material, parent=None):
    """The stroke's own shape, filled and extruded `height` (centred on `z`); returns the object."""
    c = outline(name, d)
    for sp in c.splines:
        sp.use_cyclic_u = True  # a fill needs a closed curve
    c.dimensions = "2D"
    c.fill_mode = "BOTH"
    c.extrude = height / 2
    o = place(bpy.data.objects.new(name, c), z, parent)
    o.data.materials.append(material)
    return o


def glass():
    """Dark smoked glass with a faint green glow, the body under the neon."""
    m = bpy.data.materials.new("glass")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.01, 0.03, 0.015, 1)
    b.inputs["Roughness"].default_value = 0.15
    b.inputs["Coat Weight"].default_value = 1.0
    b.inputs["Emission Color"].default_value = linear("#6cff7a")
    b.inputs["Emission Strength"].default_value = 0.08
    return m


def draw(c, start, length):
    """Traces the curve from `start` over `length` frames."""
    for f, v in ((start, 0.0), (start + length, 1.0)):
        c.bevel_factor_end = v
        c.keyframe_insert("bevel_factor_end", frame=f + 1)


def show(o, at):
    """Hidden until clip frame `at`."""
    for f, hidden in ((0, True), (at, False)):
        o.hide_render = hidden
        key(o, "hide_render", f)


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
    medians, paths = data["medians"], data["strokes"]
    order = [int(i) for i in args.order.split(",")] if args.order else list(range(len(medians)))
    walls = {int(i) for i in args.walls.split(",") if i}
    frames = frame_count(args.beats, args.bpm)
    beat = 60 * FPS / args.bpm
    colour = linear(args.edge)

    black, smoke = obsidian(), glass()

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
        length = round(0.8 * beat)
        draw(neon(f"neon{i}", paths[i], BODY + NEON, glow, pivot), t, length)
        show(body(f"body{i}", paths[i], BODY, BODY / 2, smoke, pivot), t + length)
        for f, v in ((t - 1, REST), (t + round(0.8 * beat), PULSE * 0.4), (t + round(1.4 * beat), REST)):
            strength.default_value = v
            strength.keyframe_insert("default_value", frame=f + 1)
        glows.append(strength)
        t += round(0.9 * beat)
    t += round(0.4 * beat)
    for i in rising:
        top, _ = edge(colour, f"crest{i}")
        length = round(0.9 * beat)
        draw(neon(f"crest{i}", paths[i], WALL_H + NEON, top), t, length)
        # The wall rises out of the floor to meet its crest's finished outline.
        wall = body(f"wall{i}", paths[i], WALL_H, WALL_H / 2, black)
        for f, z in ((t + length, -WALL_H / 2), (t + length + round(0.5 * beat), WALL_H / 2)):
            wall.location.z = z
            key(wall, "location", f, index=2)
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
