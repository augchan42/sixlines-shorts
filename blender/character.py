"""Draws a hexagram's character in 3D, stroke by stroke, as a lesson picture, like a Hong
Kong neon sign: each stroke's real outline (a brush-style kaishu font) traced by a hollow,
faceted neon tube over a dark glass body. Some strokes lie on the ground; others rise as walls
in the stroke's own shape, with the neon along their top edge.

- --stand: the lying strokes first stand up as a thing (for 困, a tree), the walls rise round
  it, then it is pressed flat inside them.
- --spill: these strokes (for 益, water; for 蠱, worms) are traced small inside the walls,
  rise past the rim and spill over it to their place in the character.
- --grow: with --stand, the standing thing starts under the floor and pushes up through it
  in three strains (for 屯, a sprout) before it lies down.
- --moon: a moon between the walls goes from new to full and back (for 恆), then sets
  into these strokes; --last draws lying strokes at the end (恆's heart).
- --lift: lying strokes lift free once the walls stand and hover (解's horn, cut loose).
- --drop: strokes traced high above fall to their place (鼎's bowl onto its legs).
- --pool: a pool of water (for 井) that ripples on every beat.

The camera starts beside the strokes, where they read as things, and cranes up to look
straight down, where they read as the character.

Stroke outlines are from Make Me a Hanzi (hanzi-writer-data, Arphic
Public License), fetched to public/local/hanzi/ by scripts/character.mjs.

  Blender -b --factory-startup --python-exit-code 1 -P blender/character.py -- \
    --data public/local/hanzi/困.json --order 3,2,4,5,0,1,6 --walls 0,1,6 --stand \
    --bpm 95 --beats 10 --out out/characters/kun.mp4 [--still N] [--preview]

Each character's options are kept in series/characters.json; `node scripts/character.mjs
--render NUMBER` renders from there.
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
    p.add_argument("--spill", default="", help="stroke indices that fill the walls and spill over them")
    p.add_argument("--stagger", type=float, default=0.0, help="beats between the spilling strokes' starts")
    p.add_argument("--pool", help="x,y (hanzi units): a pool of water that glows there once the walls stand")
    p.add_argument("--wall-height", type=float, default=WALL_H)
    p.add_argument("--glass-walls", action="store_true", help="walls of smoked glass, not obsidian")
    p.add_argument("--moon", default="", help="stroke indices a phasing moon sets into, between the walls")
    p.add_argument("--phases", default="180,0,-180", help="the moon's turns, 1.5 beats apart: 180 is new, 0 full")
    p.add_argument("--drop", default="", help="strokes traced high above, which then fall to their place")
    p.add_argument("--lift", default="", help="lying strokes that lift free and hover once the walls stand")
    p.add_argument("--last", default="", help="lying strokes drawn at the end, not the start")
    p.add_argument("--wall-step", type=float, default=1.0, help="beats between walls")
    p.add_argument("--water", default="#5ee7ff", help="the spilling strokes' neon")
    p.add_argument("--camera", choices=("low", "high", "over"), default="low", help="high looks down into the walls from the start; over, steeper, into a deep bowl")
    p.add_argument("--zoom", type=float, default=1.0, help="the camera's distance, times this")
    p.add_argument("--grow", type=float, default=0.0, help="with --stand: metres the standing thing starts under the floor; it pushes up in three strains")
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


def glass(colour="#6cff7a"):
    """Dark smoked glass with a faint glow, the body under the neon."""
    m = bpy.data.materials.new(f"glass{colour}")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.01, 0.03, 0.015, 1)
    b.inputs["Roughness"].default_value = 0.15
    b.inputs["Coat Weight"].default_value = 1.0
    b.inputs["Emission Color"].default_value = linear(colour)
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


def centre(points):
    """The middle of the points' bounding box, in hanzi units."""
    xs, ys = [p[0] for p in points], [p[1] for p in points]
    return (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, max(xs) - min(xs), max(ys) - min(ys)


# Camera keys (location, target) at the start and where the crane begins, by --camera.
VIEWS = {
    "low": (((0, -11, 2.4), (0, 0, 2.4)), ((0, -9.5, 4.5), (0, 0.2, 0.8))),
    "high": (((0, -9, 7.5), (0, -0.8, 0.4)), ((0, -8, 8.5), (0, 0.4, 0.6))),
    "over": (((0, -6, 10), (0, -1.2, 0)), ((0, -7, 9.5), (0, 0.4, 0.6))),
}


def camera(scene, frames, beat, view, zoom=1.0):
    """Beside the strokes (low, or high enough to see into the walls), then craning up to look
    straight down on the character."""
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
    away = lambda loc, t: tuple(t[k] + (loc[k] - t[k]) * zoom for k in range(3))
    (start, start_t), (mid, mid_t) = VIEWS[view]
    start, mid = away(start, start_t), away(mid, mid_t)
    top = away((0, -0.6, 15.5), (0, 0.4, 0))
    for f, loc, t in ((0, start, start_t), (rise, mid, mid_t), (frames - 1, top, (0, 0.4, 0))):
        cam.location = loc
        key(cam, "location", f)
        target.location = t
        key(target, "location", f)


def circle(x, y, r):
    """A circle as an SVG path of four cubic arcs, in hanzi units."""
    k = 0.5523 * r
    return (f"M {x + r} {y} C {x + r} {y + k} {x + k} {y + r} {x} {y + r} "
            f"C {x - k} {y + r} {x - r} {y + k} {x - r} {y} "
            f"C {x - r} {y - k} {x - k} {y - r} {x} {y - r} "
            f"C {x + k} {y - r} {x + r} {y - k} {x + r} {y} Z")


def pool(at, args, t, beat, frames):
    """For 井: a round pool of water traced at `at` from frame `t`; it glows and ripples on
    every beat to the end."""
    x, y = (float(v) for v in at.split(","))
    d = circle(x, y, 75)
    rim, rim_glow = edge(linear(args.water), "pool rim")
    draw(neon("pool rim", d, BODY + NEON, rim), t, round(0.8 * beat))
    water_, glow = edge(linear(args.water), "pool")
    show(body("pool", d, BODY, BODY / 2, water_, None), t + round(0.8 * beat))
    # On every beat the water brightens and a ring spreads from its centre to the rim.
    f, n = t + round(0.8 * beat), 0
    while f < frames:
        for g, v in ((f, 3.0 if n else 0.5), (f + round(0.5 * beat), 1.2)):
            glow.default_value = v
            glow.keyframe_insert("default_value", frame=g + 1)
        if n:
            ripple(x, y, args, f, beat)
        f, n = f + round(beat), n + 1
    return rim_glow


def ripple(x, y, args, f, beat):
    """A thin ring of light spreading out from (x, y) over a beat from frame `f`."""
    centre_ = bpy.data.objects.new(f"ripple{f}", None)
    bpy.context.scene.collection.objects.link(centre_)
    centre_.location = ((x - CENTRE[0]) * SCALE, (y - CENTRE[1]) * SCALE, 0)
    ring, glow = edge(linear(args.water), f"ripple{f}")
    c = outline(f"ripple{f}", circle(x, y, 70))
    c.dimensions, c.bevel_depth, c.bevel_resolution = "3D", NEON, 1
    o = place(bpy.data.objects.new(f"ripple{f}", c), BODY + NEON, centre_)
    o.data.materials.append(ring)
    show(o, f)
    end = f + round(beat)
    for g, sc, v in ((f, 0.1, PULSE * 0.8), (end, 1.0, 0.0)):
        centre_.scale = (sc, sc, 1)
        key(centre_, "scale", g)
        glow.default_value = v
        glow.keyframe_insert("default_value", frame=g + 1)


def lie(ids, paths, t, beat, colour, smoke, pivot, step=0.9):
    """Draws strokes lying on the floor (or on the pivot) `step` beats apart from frame `t`;
    returns the frame after them and their glow strengths."""
    glows = []
    for i in ids:
        glow, strength = edge(colour, f"glow{i}")
        length = round(0.8 * beat)
        draw(neon(f"neon{i}", paths[i], BODY + NEON, glow, pivot), t, length)
        show(body(f"body{i}", paths[i], BODY, BODY / 2, smoke, pivot), t + length)
        for f, v in ((t - 1, REST), (t + round(0.8 * beat), PULSE * 0.4), (t + round(1.4 * beat), REST)):
            strength.default_value = v
            strength.keyframe_insert("default_value", frame=f + 1)
        glows.append(strength)
        t += round(step * beat)
    return t, glows


def moonlight(colour):
    """A faceted moon lit on one side: the half facing -y (in its own space) glows, the rest is
    dark glass. Turning the moon about z shows its phases."""
    m = bpy.data.materials.new("moon")
    m.use_nodes = True
    nodes, links = m.node_tree.nodes, m.node_tree.links
    b = nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.01, 0.01, 0.015, 1)
    b.inputs["Roughness"].default_value = 0.3
    b.inputs["Emission Color"].default_value = colour
    coords = nodes.new("ShaderNodeTexCoord")
    xyz = nodes.new("ShaderNodeSeparateXYZ")
    lit = nodes.new("ShaderNodeMapRange")
    lit.inputs["From Min"].default_value, lit.inputs["From Max"].default_value = 0.08, -0.08
    strength = nodes.new("ShaderNodeMath")
    strength.operation = "MULTIPLY"
    strength.inputs[1].default_value = 4.0
    links.new(coords.outputs["Normal"], xyz.inputs[0])
    links.new(xyz.outputs["Y"], lit.inputs["Value"])
    links.new(lit.outputs["Result"], strength.inputs[0])
    links.new(strength.outputs[0], b.inputs["Emission Strength"])
    return m


def phases(ids, medians, paths, t, beat, args, smoke):
    """A moon between the walls, over the strokes `ids`, turns through --phases from frame `t`
    (for 恆 new, full and new again; for 明 full, then a thin crescent that stays lit), then
    sets into those strokes as they are drawn. Returns the frame after and their glows."""
    x, y, w, h = centre([p for i in ids for p in medians[i]])
    r = min(0.4 * min(w, h) * SCALE, 1.1)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=10, radius=r)
    ball = bpy.context.object
    ball.data.materials.append(moonlight(linear(args.water)))
    home = ((x - CENTRE[0]) * SCALE, (y - CENTRE[1]) * SCALE, args.wall_height + r + 0.15)
    ball.location = home
    turns = [float(a) for a in args.phases.split(",")]
    keys = [(0, 0.0, turns[0]), (t, 0.0, turns[0])]
    keys += [(t + round((0.4 + 1.5 * k) * beat), 1.0, a) for k, a in enumerate(turns)]
    for f, sc, turn in keys:
        ball.scale = (sc, sc, sc)
        key(ball, "scale", f)
        ball.rotation_euler.z = math.radians(turn)
        key(ball, "rotation_euler", f, index=2)
    t += round(1.5 * (len(turns) - 1) * beat)  # the rest is timed from the last phase
    b = lambda n: t + round(n * beat)
    # It sets: sinks and shrinks into the strokes, which are drawn under it.
    for f, z, sc in ((b(0.4), home[2], 1.0), (b(1.1), 0.0, 0.0)):
        ball.location.z = z
        key(ball, "location", f, index=2)
        ball.scale = (sc, sc, sc)
        key(ball, "scale", f)
    glows = []
    for i in ids:
        glow, strength = edge(linear(args.water), f"moon{i}")
        draw(neon(f"neon{i}", paths[i], BODY + NEON, glow), b(0.5), round(0.8 * beat))
        show(body(f"body{i}", paths[i], BODY, BODY / 2, smoke), b(1.3))
        for f, v in ((b(0.5), REST), (b(1.3), PULSE * 0.5), (b(2.0), REST)):
            strength.default_value = v
            strength.keyframe_insert("default_value", frame=f + 1)
        glows.append(strength)
    return b(1.6), glows


def fall(ids, medians, paths, t, beat, colour, smoke):
    """For 鼎: strokes traced 3.5 m up, one after another from frame `t`, fall together to
    their place, land with a small bounce and flare. Returns the frame after and their glows."""
    x, y, _, _ = centre([p for i in ids for p in medians[i]])
    parent = bpy.data.objects.new("drop", None)
    bpy.context.scene.collection.objects.link(parent)
    parent.location = ((x - CENTRE[0]) * SCALE, (y - CENTRE[1]) * SCALE, 0)
    high = 3.5
    t, glows = lie(ids, paths, t, beat, colour, smoke, parent, step=0.5)
    # Falling: height goes as 1 - (time/fall)^2, sampled so the curve accelerates.
    fall_ = 0.6 * beat
    keys = [(0, high), (t, high)] + [(t + round(fall_ * k / 4), high * (1 - (k / 4) ** 2)) for k in range(1, 5)]
    land = t + round(fall_)
    keys += [(land + round(0.15 * beat), 0.12), (land + round(0.3 * beat), 0.0)]
    for f, z in keys:
        parent.location.z = z
        key(parent, "location", f, index=2)
    for strength in glows:
        for f, v in ((land - 1, REST), (land + 2, PULSE), (land + round(beat), REST * 1.5)):
            strength.default_value = v
            strength.keyframe_insert("default_value", frame=f + 1)
    return land + round(0.6 * beat), glows


def water(spill, medians, paths, walls, args, t, beat):
    """The --spill strokes on a parent that fills the walls and spills over them from frame
    `t`; returns their glow strengths."""
    scene = bpy.context.scene
    wx, wy, ww, wh = centre([p for i in walls for p in medians[i]])
    sx, sy, sw, sh = centre([p for i in spill for p in medians[i]])
    fit = 0.7 * min(ww / sw, wh / sh)
    home = ((sx - CENTRE[0]) * SCALE, (sy - CENTRE[1]) * SCALE, 0)
    inside = ((wx - CENTRE[0]) * SCALE, (wy - CENTRE[1]) * SCALE)
    parent = bpy.data.objects.new("water", None)
    scene.collection.objects.link(parent)
    parent.location = home
    colour, glass_ = linear(args.water), glass(args.water)
    trace = round(0.9 * beat)
    strengths = []
    # One after another if staggered (for 蠱, worms breeding), then all rise together.
    for k, i in enumerate(spill):
        start = t + round(k * args.stagger * beat)
        glow, strength = edge(colour, f"water{i}")
        draw(neon(f"neon{i}", paths[i], BODY + NEON, glow, parent), start, trace)
        show(body(f"body{i}", paths[i], BODY, BODY / 2, glass_, parent), start + trace)
        strength.default_value = REST
        strength.keyframe_insert("default_value", frame=start)
        strength.default_value = PULSE * 0.4
        strength.keyframe_insert("default_value", frame=start + trace + 1)
        strengths.append(strength)
    t += round((len(spill) - 1) * args.stagger * beat)
    b = lambda n: t + round(n * beat)
    rim = args.wall_height + 0.25
    for f, (x, y, z), s in (
        (0, (*inside, 0.15), fit),
        (b(1.0), (*inside, 0.15), fit),
        (b(2.4), (*inside, rim), fit * 1.25),  # fills up past the rim
        (b(2.9), (home[0], (inside[1] + home[1]) / 2, rim + 0.4), 0.8),  # over the far rim
        (b(3.4), home, 1.0),  # lands, spread out
    ):
        parent.location = (x, y, z)
        key(parent, "location", f)
        parent.scale = (s, s, 1)
        key(parent, "scale", f)
    for strength in strengths:
        for f, v in ((b(1.4), REST), (b(2.4), PULSE * 0.5), (b(2.9), REST * 1.5)):
            strength.default_value = v
            strength.keyframe_insert("default_value", frame=f + 1)
    return strengths


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    data = json.load(open(args.data))
    medians, paths = data["medians"], data["strokes"]
    order = [int(i) for i in args.order.split(",")] if args.order else list(range(len(medians)))
    walls = {int(i) for i in args.walls.split(",") if i}
    spill = [int(i) for i in args.spill.split(",") if i]
    frames = frame_count(args.beats, args.bpm)
    beat = 60 * FPS / args.bpm
    colour = linear(args.edge)

    black, smoke = obsidian(), glass(args.edge)

    # The lying strokes a beat apart from beat 0.5, then the walls a beat apart.
    t = round(0.5 * beat)
    moon = [int(i) for i in args.moon.split(",") if i]
    last = [i for i in order if i in {int(i) for i in args.last.split(",") if i}]
    drop = [i for i in order if i in {int(i) for i in args.drop.split(",") if i}]
    lift = [i for i in order if i in {int(i) for i in args.lift.split(",") if i}]
    lying = [i for i in order if i not in walls and i not in spill and i not in moon and i not in last and i not in drop and i not in lift]
    rising = [i for i in order if i in walls]
    # Standing, the lying strokes turn up about the lowest point of the first one (a trunk's foot).
    pivot = None
    if args.stand:
        foot = min(medians[lying[0]], key=lambda p: p[1])
        pivot = bpy.data.objects.new("pivot", None)
        scene.collection.objects.link(pivot)
        pivot.location = (0, (foot[1] - CENTRE[1]) * SCALE, 0)
    t, glows = lie(lying, paths, t, beat, colour, smoke, pivot)
    if lift:
        freed = bpy.data.objects.new("lift", None)
        scene.collection.objects.link(freed)
        x, y, _, _ = centre([p for i in lift for p in medians[i]])
        freed.location = ((x - CENTRE[0]) * SCALE, (y - CENTRE[1]) * SCALE, 0)
        t, more = lie(lift, paths, t, beat, linear(args.water), glass(args.water), freed, step=0.4)
        glows += more
    t += round(0.4 * beat)
    for i in rising:
        top, _ = edge(colour, f"crest{i}")
        length = round(0.9 * beat)
        h = args.wall_height
        draw(neon(f"crest{i}", paths[i], h + NEON, top), t, length)
        # The wall rises out of the floor to meet its crest's finished outline.
        wall = body(f"wall{i}", paths[i], h, h / 2, smoke if args.glass_walls else black)
        for f, z in ((t + length, -h / 2), (t + length + round(0.5 * beat), h / 2)):
            wall.location.z = z
            key(wall, "location", f, index=2)
        t += round(args.wall_step * beat)
    if args.pool:
        glows.append(pool(args.pool, args, t, beat, frames))
        t += round(1.0 * beat)
    # Water: traced small inside the walls, it rises past the rim and spills over the far side.
    if spill:
        glows += water(spill, medians, paths, walls, args, t, beat)
        t += round((3.6 + (len(spill) - 1) * args.stagger) * beat)
    # A thing standing under the floor pushes up through it in three strains.
    if pivot and args.grow:
        z = -args.grow
        pivot.location.z = z
        key(pivot, "location", 0, index=2)
        key(pivot, "location", t, index=2)
        for k in range(3):
            z += args.grow / 3
            pivot.location.z = z
            key(pivot, "location", t + round(0.35 * beat), index=2)
            for strength in glows:
                for f, v in ((t, REST), (t + round(0.35 * beat), PULSE * (0.3 + 0.2 * k)), (t + round(0.9 * beat), REST)):
                    strength.default_value = v
                    strength.keyframe_insert("default_value", frame=f + 1)
            t += round(beat)
            key(pivot, "location", t, index=2)
    # Cut free once the walls stand, the lifted strokes rise and hover, bobbing, to the end.
    if lift:
        keys = [(0, 0.0), (t, 0.0), (t + round(0.6 * beat), 3.0)]
        f, up = t + round(0.6 * beat), True
        while f < frames:
            f += round(beat)
            keys.append((f, 2.8 if up else 3.0))
            up = not up
        for f, z in keys:
            freed.location.z = z
            key(freed, "location", f, index=2)
        for strength in more:
            for f, v in ((t - 1, REST), (t + 2, PULSE), (t + round(beat), REST * 1.5)):
                strength.default_value = v
                strength.keyframe_insert("default_value", frame=f + 1)
        t += round(0.8 * beat)
    if drop:
        t, fallen = fall(drop, medians, paths, t, beat, colour, smoke)
        glows += fallen
    if moon:
        t, wet = phases(moon, medians, paths, t, beat, args, smoke)
        glows += wet
    if last:
        t, more = lie(last, paths, t, beat, colour, smoke, None)
        glows += more
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
    light.specular_factor = 0  # its highlight showed as a white sliver at the frame's edge
    lo = bpy.data.objects.new("key", light)
    lo.rotation_euler = (math.radians(-55), 0, math.radians(25))
    scene.collection.objects.link(lo)
    # A dark glossy floor, so the strokes' glow reflects under them.
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
    bpy.context.object.data.materials.append(black)

    camera(scene, frames, beat, args.camera, args.zoom)
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
