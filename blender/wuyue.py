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
  printing  one page of light columns traces in; copies of it appear outward in a wave while the
            camera rises over the field of them
  end       the map as the exchange left it; the border fades, the routes stay lit; the camera
            comes down to the sign, which flares, and WUYUE fades in under it

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

HOME, SEA = "#ff5ec8", "#bfe9ff"  # Wuyue's magenta; cyan-white for what crosses the sea
GREY = "#a89aa3"
LANE = 0.5  # metres between an outward line and the line back beside it
SETTLED = REST * 1.5  # a finished sign's glow (sign.py's default)


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :]
    p = argparse.ArgumentParser()
    p.add_argument("--shot", required=True, choices=("hook", "family", "exchange", "printing", "end"))
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


def flare(glow, f):
    """The one flare: up to PULSE and back to the settled glow."""
    for g, v in ((f - 1, SETTLED), (f + 2, PULSE), (f + 20, SETTLED)):
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
    return glow, lab, lab_glow, (edge, edge_glow), objs, everything, north_end


def exchange(args, t, m, cam):
    glow, lab, _, _, objs, everything, north_end = world_map(args, t, m, drawn=False)
    flare(glow, t["flare"])
    first = cam.top(objs + [lab, marker(north_end)])
    cam.pose(0, *first)
    cam.pose(t["widen"][0], *first)
    aim, eye = cam.top(everything)
    cam.pose(t["widen"][1], aim, eye)


def end(args, t, m, cam):
    glow, lab, lab_glow, (edge, edge_glow), objs, everything, _ = world_map(args, t, m, drawn=True)
    fade(edge_glow, *t["border"], REST * 0.4, 0.0)
    for f, hidden in ((0, False), (t["border"][1] + 1, True)):  # unlit, the tube still shows
        edge.hide_render = hidden
        key(edge, "hide_render", f)
    fade(lab_glow, t["descend"][0], t["descend"][0] + 30, 1.0, 0.0)
    for f, hidden in ((0, False), (t["descend"][0] + 31, True)):  # gone before WUYUE takes its place
        lab.hide_render = hidden
        key(lab, "hide_render", f)
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
    aim, eye = cam.top(everything)
    cam.pose(0, aim, eye)
    cam.pose(t["descend"][0], aim, eye)
    cam.pose(t["descend"][1], *cam.top(objs + labels))


def printing(args, t, m, cam):
    # The page: seven columns of light, traced one after another.
    cols, gap, tall = 7, 0.14, 1.2
    a0, a1 = t["page"]
    per = (a1 - a0) / cols
    hero = []
    for i in range(cols):
        x = (i - (cols - 1) / 2) * gap
        o, _ = route(f"col{i}", (x, tall / 2, 0), (x, -tall / 2, 0), 0, 0, HOME, round(a0 + i * per), round(a0 + (i + 1) * per))
        hero.append(o)
    # Its copies: one page collection, instanced over a grid, each appearing as the wave reaches it.
    page = bpy.data.collections.new("page")
    mat = bpy.data.materials.new("page")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = linear(HOME)
    emit.inputs["Strength"].default_value = REST * 0.15  # dimmer than the first page
    mat.node_tree.links.new(emit.outputs["Emission"], nodes.new("ShaderNodeOutputMaterial").inputs["Surface"])
    r = NEON
    for i in range(cols):
        mesh = bpy.data.meshes.new(f"pagecol{i}")
        x = (i - (cols - 1) / 2) * gap
        vs = [(x + dx, y, z) for y in (-tall / 2, tall / 2) for dx in (-r, r) for z in (BODY, BODY + 2 * r)]
        faces = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
        mesh.from_pydata(vs, [], faces)
        mesh.materials.append(mat)
        page.objects.link(bpy.data.objects.new(f"pagecol{i}", mesh))
    nx, ny, sx, sy = 31, 41, 1.6, 2.2
    s0, s1 = t["spread"]
    far = math.hypot((nx // 2) * sx, (ny // 2) * sy)
    for i in range(nx):
        for j in range(ny):
            x, y = (i - nx // 2) * sx, (j - ny // 2) * sy
            if (x, y) == (0, 0) or y > 13:  # the field ends below the text cards
                continue
            e = bpy.data.objects.new(f"page{i}-{j}", None)
            e.instance_type, e.instance_collection = "COLLECTION", page
            bpy.context.scene.collection.objects.link(e)
            e.location = (x, y, 0)
            at = round(s0 + (s1 - s0) * math.hypot(x, y) / far)
            for f, v in ((0, 0.0), (at, 0.0), (at + 8, 1.0)):
                e.scale = (v, v, v)
                key(e, "scale", f)
    aim, eye = cam.low(hero, back=3.2, up=2.2)
    cam.pose(0, aim, eye)
    cam.pose(t["rise"][0], aim, eye + Vector((0, 0.3, 0.4)))
    cam.pose(t["rise"][1], *cam.top([marker((-12, -16, 0)), marker((12, 16, 0))]))


SHOTS = {"hook": hook, "family": family, "exchange": exchange, "printing": printing, "end": end}


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
