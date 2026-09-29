"""The Wuyue video's shots (scripts/wuyue.mjs gives each shot's timing and cuts them together).

Everything lies on character.py's dark glossy floor: the 吳越 sign in magenta neon at Hangzhou,
names traced in neon from their stroke data, and lines of light between them. Magenta is Wuyue;
cyan-white is kept for what crosses the sea. The camera eases between low, close views and views
straight down; nothing shakes or flickers, and each shot has at most one flare.

  hook      the lit sign, low and close; a cyan-white line arrives from off frame; one flare;
            the camera rises to the whole sign
  family    錢 (Qian, the ruling family) traces in; a line from 907 to 978 draws in five spans,
            one per reign
  exchange  the map: a faint border round Hangzhou; a line north; 高麗 (Goryeo, Korea) and 日本
            (Japan) trace in; lines out to both; the cyan-white line back from Korea; one flare
  printing  one page of light columns traces in; a stupa like Qian Chu's small bronze ones builds
            round it; copies of it light up outward in a wave while the camera rises over them
  leifeng   Leifeng Pagoda builds storey by storey and stands
  surrender the map as the exchange left it; the border fades, the routes stay lit
  vault     the standing pagoda fades to its platform; the camera comes down to where its vault
            was, and the iron case and the silver stupa found there trace in; one flare
  end       the map as the video left it; its routes and places fade while the camera comes down
            to the 吳越 sign, which flares, and WUYUE fades in under it

  Blender -b --factory-startup --python-exit-code 1 -P blender/wuyue.py -- --shot hook \\
    --hanzi public/local/hanzi --font goudos.ttf --map '{"korea":[24,46],...}' \\
    --timeline '[[-8,-2.5],...]' --timing '{"frames":288,...}' --width 1080 --height 1920 --out hook.mp4
"""

import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from character import BODY, NEON, draw, glass  # noqa: E402
from hexagram import PULSE, REST, bloom, edge, key, linear, render_settings  # noqa: E402
from sign import MARGIN, arrange, bounds, label, sign_char, stage  # noqa: E402
import pagoda  # noqa: E402
import stupa  # noqa: E402

HOME, SEA = "#ff5ec8", "#bfe9ff"  # Wuyue's magenta; cyan-white for what crosses the sea
GREY = "#a89aa3"
LANE = 0.5  # metres between an outward line and the line back beside it
SETTLED = REST * 1.5  # a finished sign's glow (sign.py's default)


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :]
    p = argparse.ArgumentParser()
    p.add_argument("--shot", required=True, choices=("hook", "family", "exchange", "printing", "leifeng", "surrender", "vault", "end"))
    p.add_argument("--hanzi", required=True, help="the folder of stroke data files")
    p.add_argument("--font", required=True)
    p.add_argument("--map", required=True, help="JSON: korea, japan and north, x,y metres from the sign")
    p.add_argument("--timeline", required=True, help="JSON: the reigns' spans, [x0, x1] metres each")
    p.add_argument("--timing", required=True, help="JSON: frames, and the shot's events in frames")
    p.add_argument("--width", type=int, default=1080)
    p.add_argument("--height", type=int, default=1920)
    p.add_argument("--samples", type=int, default=64)
    p.add_argument("--out", required=True)
    return p.parse_args(argv)


# --- pieces ---------------------------------------------------------------------------------


def route(name, a, b, side, bend, colour, start, end, strength=SETTLED):
    """A line of light from a to b, set `side` half a lane off the straight line and bowed by
    `bend` (either way, 0 for straight), drawing itself in from frame start to end."""
    a, b = Vector(a), Vector(b)
    along = b - a
    normal = Vector((-along.y, along.x, 0)).normalized()
    a, b = a + normal * side * LANE / 2, b + normal * side * LANE / 2
    bow = normal * along.length * 0.05 * bend
    c = bpy.data.curves.new(name, "CURVE")
    c.dimensions = "3D"
    c.bevel_depth, c.bevel_resolution, c.use_fill_caps = NEON, 1, True
    s = c.splines.new("BEZIER")
    s.bezier_points.add(1)
    s.resolution_u = 48
    p0, p1 = s.bezier_points
    for p in (p0, p1):
        p.handle_left_type = p.handle_right_type = "FREE"
    p0.co, p0.handle_right = a, a + along / 3 + bow
    p0.handle_left = a - (p0.handle_right - a)
    p1.co, p1.handle_left = b, b - along / 3 + bow
    p1.handle_right = b + (b - p1.handle_left)
    o = bpy.data.objects.new(name, c)
    bpy.context.scene.collection.objects.link(o)
    o.location.z = BODY + NEON
    mat, glow = edge(linear(colour), name)
    glow.default_value = strength
    c.materials.append(mat)
    draw(c, start, max(1, end - start))
    return o, glow


def names(chars, n0, colour, at, layout, start=None, end=None, step=0):
    """Characters in neon, their group's middle at `at`. Finished (one glow, returned) when
    `start` is None; otherwise traced from `start` to `end`, `step` frames between strokes (0:
    all together). Returns (each character's root, objects and glows), all their objects, and
    the glow."""
    mat, glow = edge(linear(colour), f"names{n0}")
    glow.default_value = SETTLED
    clip = None
    if start is not None:
        counts = [len(json.load(open(f))["strokes"]) for f in chars]
        d = max(1, (end - start) - step * (sum(counts) - 1))
        clip, k = {"strokes": [], "draw": d}, 0
        for c, n in enumerate(counts):
            for i in range(n):
                clip["strokes"].append([n0 + c, i, start + k * step])
                k += 1
    group = [sign_char(n0 + c, f, None if clip else mat, glass(colour), linear(colour), clip) for c, f in enumerate(chars)]
    objs = arrange(group, layout)
    x0, y0, x1, y1 = bounds(objs)
    for root, _, _ in group:
        root.location.x += at[0] - (x0 + x1) / 2
        root.location.y += at[1] - (y0 + y1) / 2
    return group, objs, glow


def under(objs, text, font, size=2.0, fade_in=None, gap=1.1):
    """A grey label centred under the objects; returns it and its strength."""
    x0, y0, x1, _ = bounds(objs)
    o = label(text, text, font, size, GREY, 1.0, fade_in)
    o.location = ((x0 + x1) / 2, y0 - gap, 0.02)
    return o, o.data.materials[0].node_tree.nodes["Emission"].inputs["Strength"]


def fade(strength, a, b, v0, v1):
    for f, v in ((a, v0), (b, v1)):
        strength.default_value = v
        strength.keyframe_insert("default_value", frame=f + 1)


def flare(glow, f, settled=SETTLED, peak=PULSE):
    """The one flare: up to `peak` and back to the settled glow."""
    for g, v in ((f - 1, settled), (f + 2, peak), (f + 20, settled)):
        glow.default_value = v
        glow.keyframe_insert("default_value", frame=g + 1)


def left_mid(objs, pad=0.4):
    x0, y0, _, y1 = bounds(objs)
    return (x0 - pad, (y0 + y1) / 2, 0)


def right_mid(objs, pad=0.4):
    _, y0, x1, y1 = bounds(objs)
    return (x1 + pad, (y0 + y1) / 2, 0)


def border(centre, rx, ry, strength):
    """A faint closed loop round Hangzhou: Wuyue's border, drawn as one line of light."""
    c = bpy.data.curves.new("border", "CURVE")
    c.dimensions = "3D"
    c.bevel_depth, c.bevel_resolution = NEON * 0.7, 1
    s = c.splines.new("POLY")
    n = 96
    s.points.add(n - 1)
    for i, p in enumerate(s.points):
        a = 2 * math.pi * i / n
        p.co = (centre[0] + rx * math.cos(a), centre[1] + ry * math.sin(a), 0, 1)
    s.use_cyclic_u = True
    o = bpy.data.objects.new("border", c)
    bpy.context.scene.collection.objects.link(o)
    o.location.z = BODY + NEON
    mat, glow = edge(linear(HOME), "border")
    glow.default_value = strength
    c.materials.append(mat)
    return o, glow


def marker(at):
    """An empty, for the camera to take into account."""
    e = bpy.data.objects.new("marker", None)
    bpy.context.scene.collection.objects.link(e)
    e.location = at
    return e


class Camera:
    """A camera tracking an empty, keyed as (frame, aim, eye) poses; Blender eases between them."""

    def __init__(self, scene, aspect):
        data = bpy.data.cameras.new("camera")
        data.lens, data.sensor_fit, data.sensor_width = 35, "HORIZONTAL", 36
        self.cam = bpy.data.objects.new("camera", data)
        scene.collection.objects.link(self.cam)
        scene.camera = self.cam
        self.target = bpy.data.objects.new("target", None)
        scene.collection.objects.link(self.target)
        track = self.cam.constraints.new("TRACK_TO")
        track.target, track.track_axis, track.up_axis = self.target, "TRACK_NEGATIVE_Z", "UP_Y"
        self.aspect = aspect

    def pose(self, f, aim, eye):
        self.target.location, self.cam.location = Vector(aim), Vector(eye)
        key(self.target, "location", f)
        key(self.cam, "location", f)

    def top(self, objs, head=0.2):
        """Looking nearly straight down (1 m in front for 15.5 m up, as the lessons end) on the
        objects' middle, far enough that they fit with MARGIN, with the top `head` of the frame
        kept clear for the text cards: (aim, eye)."""
        x0, y0, x1, y1 = bounds(objs)
        y1 += (y1 - y0) * head / (1 - head)
        half = 18 / 35
        dist = max(MARGIN[0] * (x1 - x0) / 2 / half, MARGIN[1] * (y1 - y0) / 2 / (half * self.aspect))
        aim = Vector(((x0 + x1) / 2, (y0 + y1) / 2, 0))
        return aim, aim + Vector((0, -dist / 15.5, dist))

    def fit(self, wide, tall, head=0.2):
        """How far back a side view must stand for `wide` x `tall` metres to fit with MARGIN,
        the top `head` of the frame kept clear."""
        half = 18 / 35
        return max(MARGIN[0] * wide / 2 / half, MARGIN[1] * tall / 2 / (half * self.aspect) / (1 - head))

    @staticmethod
    def toward(azimuth, elevation):
        """The unit vector from the aim to the eye: `azimuth` degrees round from due south
        (positive towards the east), `elevation` degrees up."""
        a, e = math.radians(azimuth), math.radians(elevation)
        return Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))

    def low(self, objs, back=9.0, up=6.0):
        """Low and close over the objects' middle, from the south: (aim, eye)."""
        x0, y0, x1, y1 = bounds(objs)
        aim = Vector(((x0 + x1) / 2, (y0 + y1) / 2, 0))
        return aim, aim + Vector((back * 0.22, -back, up))


def hz(args, c):
    return os.path.join(args.hanzi, f"{c}.json")


def home(args, size=2.0):
    """The finished 吳越 sign, centred at the origin, HANGZHOU under it."""
    group, objs, glow = names([hz(args, "吳"), hz(args, "越")], 0, HOME, (0, 0), "stack")
    lab, lab_glow = under(objs, "HANGZHOU", args.font, size)
    return group, objs, glow, lab, lab_glow


# --- shots ----------------------------------------------------------------------------------


def hook(args, t, m, cam):
    group, objs, glow, lab, _ = home(args)
    wu = group[0][1]
    # From where Korea lies (off frame here), to 吳, on the lane the exchange brings it home on.
    far = (m["korea"][0] - 11, m["korea"][1], 0)
    route("back", far, right_mid(wu), 1, -1, SEA, *t["back"])
    flare(glow, t["flare"])
    aim, eye = cam.low(wu)
    cam.pose(0, aim, eye)
    cam.pose(t["rise"][0], aim + Vector((0.3, 0.6, 0)), eye + Vector((0.4, 0.8, 0.8)))
    cam.pose(t["rise"][1], *cam.top(objs + [lab]))


def family(args, t, m, cam):
    group, objs, _ = names([hz(args, "錢")], 0, HOME, (0, 0), "stack", *t["qian"], step=6)
    lab, _ = under(objs, "QIAN, THE RULING FAMILY", args.font, 1.6, (t["qian"][1], 20))
    # The reigns: one straight span each, drawn one after another, each over its share of time.
    _, low_y, _, _ = bounds([lab])
    y = low_y - 3.0
    spans = json.loads(args.timeline)
    total = sum(b - a for a, b in spans)
    a0, a1 = t["reigns"]
    f, lines = a0, []
    for i, (x0, x1) in enumerate(spans):
        d = (a1 - a0) * (x1 - x0) / total
        o, _ = route(f"reign{i}", (x0, y, 0), (x1, y, 0), 0, 0, HOME, round(f), round(f + d))
        lines.append(o)
        f += d
    for text, x in (("907", spans[0][0]), ("978", spans[-1][1])):
        o = label(text, text, args.font, 1.4, GREY, 1.0, (a1, 20))
        o.location = (x, y - 0.9, 0.02)
        lines.append(o)
    aim, eye = cam.low(group[0][1])
    cam.pose(0, aim, eye)
    cam.pose(t["crane"][0], aim + Vector((0, 0.5, 0)), eye + Vector((0, 0.6, 0.6)))
    cam.pose(t["crane"][1], *cam.top(objs + [lab] + lines))


def world_map(args, t, m, drawn):
    """The map for the exchange (drawing itself) or the end (as the exchange left it)."""
    group, objs, glow, lab, lab_glow = home(args, 3.6)
    wu = group[0][1]
    x0, y0, x1, y1 = bounds(objs + [lab])
    edge, edge_glow = border(((x0 + x1) / 2, (y0 + y1) / 2), (x1 - x0) / 2 + 5, (y1 - y0) / 2 + 5, REST * 0.4)
    when = (lambda k: (-3, -1)) if drawn else (lambda k: t[k])  # drawn: already there at frame 0
    if not drawn:
        fade(edge_glow, 0, 30, 0.0, REST * 0.4)
    wx0, _, wx1, wy1 = bounds(wu)
    north_end = (m["north"][0], m["north"][1], 0)
    route("north", ((wx0 + wx1) / 2, wy1 + 0.6, 0), north_end, 0, 0, HOME, *when("north"))
    nl = label("NORTHERN COURTS", "NORTHERN COURTS", args.font, 3.6, GREY, 1.0, None if drawn else (t["north"][1], 20))
    nl.location = (north_end[0], north_end[1], 0.02)
    lx0, _, lx1, _ = bounds([nl])  # to the left of the line's end, clear of Korea
    nl.location.x -= lx1 - north_end[0] + 1.5
    places = when("places")
    ko, ko_objs, _ = names([hz(args, "高"), hz(args, "麗")], 2, SEA, m["korea"], "row", *places)
    ja, ja_objs, _ = names([hz(args, "日"), hz(args, "本")], 4, SEA, m["japan"], "row", *places)
    kl, _ = under(ko_objs, "GORYEO (KOREA)", args.font, 3.6, None if drawn else (places[1], 20))
    jl, _ = under(ja_objs, "JAPAN", args.font, 3.6, None if drawn else (places[1], 20))
    start = right_mid(wu)
    route("to-korea", start, left_mid(ko[0][1]), 1, 1, HOME, *when("requests"))
    route("to-japan", start, left_mid(ja[0][1]), 0, 1, HOME, *when("requests"))
    route("back", left_mid(ko[0][1]), start, 1, -1, SEA, *when("back"))
    everything = objs + [lab, nl] + ko_objs + ja_objs + [kl, jl]
    return glow, lab, lab_glow, (edge, edge_glow), objs, everything, (north_end, nl)


def exchange(args, t, m, cam):
    glow, lab, _, _, objs, everything, (north_end, _) = world_map(args, t, m, drawn=False)
    flare(glow, t["flare"])
    first = cam.top(objs + [lab, marker(north_end)])
    cam.pose(0, *first)
    cam.pose(t["widen"][0], *first)
    aim, eye = cam.top(everything)
    cam.pose(t["widen"][1], aim, eye)


def surrender(args, t, m, cam):
    """978: the map as the exchange left it, framed on Wuyue and the line north to the Song's
    court; Wuyue's border fades, the routes stay lit."""
    _, lab, _, (edge, edge_glow), objs, _, (north_end, nl) = world_map(args, t, m, drawn=True)
    fade(edge_glow, *t["border"], REST * 0.4, 0.0)
    for f, hidden in ((0, False), (t["border"][1] + 1, True)):  # unlit, the tube still shows
        edge.hide_render = hidden
        key(edge, "hide_render", f)
    aim, eye = cam.top(objs + [lab, nl, marker(north_end), edge])
    cam.pose(0, aim, eye)
    cam.pose(t["frames"], aim, aim + (eye - aim) * 0.96)


def fade_out(objs, a, b):
    """Every light on the objects dims to nothing over frames a to b, and they are hidden after."""
    for o in objs:
        for slot in o.material_slots:
            for n in slot.material.node_tree.nodes if slot.material and slot.material.use_nodes else []:
                inp = n.inputs.get("Emission Strength") if n.type == "BSDF_PRINCIPLED" else n.inputs.get("Strength") if n.type == "EMISSION" else None
                if inp is not None and not inp.is_linked:
                    fade(inp, a, b, inp.default_value, 0.0)
        for f, hidden in ((0, False), (b + 1, True)):  # unlit, a tube still shows
            o.hide_render = hidden
            key(o, "hide_render", f)


def end(args, t, m, cam):
    """The map as the video left it, without its border; the routes and places fade while the
    camera comes down to the 吳越 sign, which flares, and WUYUE fades in under it."""
    before = set(bpy.data.objects)
    glow, lab, _, (edge, _), objs, everything, _ = world_map(args, t, m, drawn=True)
    edge.hide_render = lab.hide_render = True
    sign = set(objs)
    fade_out([o for o in set(bpy.data.objects) - before if o not in sign and o.material_slots and o not in (lab, edge)], *t["fade"])
    flare(glow, t["flare"])
    a, b = t["labels"]
    _, y0, _, _ = bounds(objs)
    y, labels = y0 - 1.1, []
    for i, (text, size) in enumerate((("WUYUE", 1.7), ("KINGDOM OF WUYUE ∙ 907–978", 0.62))):
        o = label(text, text, args.font, size, GREY, 1.0, (a + i * 12, b - a))
        o.location = (0, y, 0.02)
        _, low, _, _ = bounds([o])
        y = low - 0.55
        labels.append(o)
    cam.pose(0, *cam.top(everything))
    cam.pose(t["descend"][1], *cam.top(objs + labels))


# Where each of the page's seven columns breaks, as fractions of its length: lines of text.
BREAKS = [(0.0, 0.34, 0.4, 0.62, 0.68, 1.0), (0.0, 0.52, 0.58, 1.0), (0.0, 0.2, 0.26, 0.74, 0.8, 1.0),
          (0.0, 0.44, 0.5, 0.86), (0.0, 0.3, 0.36, 1.0), (0.0, 0.6, 0.66, 0.92), (0.0, 0.4, 0.46, 0.7)]


def printing(args, t, m, cam):
    # The page: seven columns of light, broken like lines of text, traced one after another,
    # flat on the floor; cyan-white, as texts are what travel in this story.
    gap, tall = 0.14, 1.2
    a0, a1 = t["page"]
    per = (a1 - a0) / len(BREAKS)
    hero = []
    for i, cuts in enumerate(BREAKS):
        x = (i - (len(BREAKS) - 1) / 2) * gap
        for j in range(0, len(cuts) - 1, 2):
            f0, f1 = cuts[j], cuts[j + 1]
            ya, yb = tall / 2 - f0 * tall, tall / 2 - f1 * tall
            o, _ = route(f"col{i}-{j}", (x, ya, 0), (x, yb, 0), 0, 0, SEA, round(a0 + (i + f0) * per), round(a0 + (i + f1) * per), REST)
            hero.append(o)
    # The stupa built round it, in the form of Qian Chu's small bronze ones; one small flare.
    W, radius = 1.6, NEON * 0.6
    mat, glow = edge(linear(HOME), "stupa")
    glow.default_value = REST * 0.6
    stupa.build("stupa", "bronze", W, mat, span=t["build"], radius=radius)
    flare(glow, t["flare"], REST * 0.6, PULSE / 5)
    # Its copies: one simpler finished stupa kept out of the scene, instanced over the floor,
    # each lighting up as the wave reaches it (the instancer's "on", 0 to 1, scales the light).
    # The field stops short of the frame's top, under the text.
    copy = bpy.data.collections.new("copy")
    dim, _ = edge(linear(HOME), "copy")
    nodes, links = dim.node_tree.nodes, dim.node_tree.links
    bsdf = nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0, 0, 0, 1)
    on = nodes.new("ShaderNodeAttribute")
    on.attribute_type, on.attribute_name = "INSTANCER", "on"
    times = nodes.new("ShaderNodeMath")
    times.operation, times.inputs[1].default_value = "MULTIPLY", REST * 0.35
    links.new(on.outputs["Fac"], times.inputs[0])
    links.new(times.outputs["Value"], bsdf.inputs["Emission Strength"])
    stupa.build("copy", "bronze-simple", W, dim, collection=copy, radius=radius)
    s0, s1 = t["spread"]
    step = 6.0
    spots = [(i * step, j * step) for i in range(-6, 7) for j in range(-7, 2) if (i, j) != (0, 0)]
    far = max(math.hypot(x, y) for x, y in spots)
    for x, y in spots:
        e = bpy.data.objects.new(f"copy{x}-{y}", None)
        e.instance_type, e.instance_collection = "COLLECTION", copy
        bpy.context.scene.collection.objects.link(e)
        e.location = (x, y, 0)
        at = round(s0 + (s1 - s0) * math.hypot(x, y) / far)
        for f, v in ((0, 0.0), (at, 0.0), (at + 15, 1.0)):
            e["on"] = v
            key(e, '["on"]', f)
    # Low over the page; back and round to the whole stupa; up over the field.
    aim, eye = cam.low(hero, back=3.2, up=2.2)
    cam.pose(0, aim, eye)
    cam.pose(t["build"][0], aim, eye + Vector((0, 0.2, 0.3)))
    H = 3.7 * W
    mid = Vector((0, 0, H * 0.55))
    dist = cam.fit(1.7 * W, H) * 1.3  # the near side looks larger
    cam.pose(t["orbit"][0], mid, mid + cam.toward(-25, 16) * dist)
    cam.pose(t["orbit"][1], mid, mid + cam.toward(-15, 18) * dist)
    high = Vector((0, -12, 0))
    cam.pose(t["rise"][1], high, high + cam.toward(-5, 50) * 60)


R, STOREY = 6.0, 7.0  # Leifeng: the wall's radius at the foot, and a storey's height
TALL = 0.08 * STOREY + 7 * STOREY


def whole(cam, azimuth):
    """The camera on the whole pagoda: (aim, eye)."""
    mid = Vector((0, 0, TALL * 0.5))
    return mid, mid + cam.toward(azimuth, 8) * cam.fit(2.7 * R, TALL) * 0.92


def leifeng(args, t, m, cam):
    """975: Leifeng Pagoda builds storey by storey, then stands."""
    tower_mat, tower_glow = edge(linear(HOME), "leifeng")
    tower_glow.default_value = REST * 0.8
    base_mat, base_glow = edge(linear(HOME), "platform")
    base_glow.default_value = REST * 0.8
    pagoda.build(R, STOREY, tower_mat, base_mat, rise=t["rise"], radius=NEON * 1.6)
    cam.pose(0, *whole(cam, 24))
    cam.pose(t["frames"], *whole(cam, 16))


def vault(args, t, m, cam):
    """1924 and 2001: the standing pagoda fades to its platform; the camera comes down to where
    its vault was, and the iron case and the silver stupa found in it trace in; one small flare."""
    tower_mat, tower_glow = edge(linear(HOME), "leifeng")
    base_mat, base_glow = edge(linear(HOME), "platform")
    base_glow.default_value = REST * 0.4
    tower, _ = pagoda.build(R, STOREY, tower_mat, base_mat, radius=NEON * 1.6)
    fade(tower_glow, *t["fade"], REST * 0.8, 0.0)
    for o in tower:
        for f, hidden in ((0, False), (t["fade"][1] + 1, True)):
            o.hide_render = hidden
            key(o, "hide_render", f)
    W = 1.6
    smat, glow = edge(linear(HOME), "silver")
    glow.default_value = REST * 0.6
    iron, iron_glow = edge(linear(HOME), "iron")
    iron_glow.default_value = REST * 0.3  # dim: rusted iron round the silver
    pagoda.case(1.2 * W, 0.62 * W, iron, t["case"], radius=NEON * 0.6)
    stupa.build("silver", "silver", W, smat, span=t["build"], radius=NEON * 0.6)
    flare(glow, t["flare"], REST * 0.6, PULSE / 5)
    # The hair: a short cyan-white strand in the stupa's body, lit with the last card.
    z = (0.16 + 0.24) * W
    hair, _ = route("hair", (-0.22 * W, 0, 0), (0.22 * W, 0.02, 0), 0, 1, SEA, t["relic"], t["relic"] + 20, REST * 1.6)
    hair.location.z = z
    hair.data.bevel_depth = NEON * 1.4
    cam.pose(0, *whole(cam, 16))
    cam.pose(t["descend"][0], *whole(cam, 14))
    low = Vector((0, 0, 2.3 * W * 0.5))
    near = cam.fit(1.9 * W, 2.3 * W) * 1.25
    cam.pose(t["descend"][1], low, low + cam.toward(4, 14) * near)
    cam.pose(t["relic"] - 10, low, low + cam.toward(-2, 15) * near * 0.97)
    cam.pose(t["frames"], low, low + cam.toward(-5, 15) * near * 0.85)  # a little in, on the strand


SHOTS = {"hook": hook, "family": family, "exchange": exchange, "printing": printing, "leifeng": leifeng,
         "surrender": surrender, "vault": vault, "end": end}


def main():
    args = parse()
    t, m = json.loads(args.timing), json.loads(args.map)
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    cam = Camera(scene, args.height / args.width)
    SHOTS[args.shot](args, t, m, cam)
    stage(scene, floor=600)
    render_settings(scene, t["frames"], args.out, False)
    scene.eevee.taa_render_samples = args.samples
    scene.render.resolution_x, scene.render.resolution_y = args.width, args.height
    bloom(scene)
    bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
