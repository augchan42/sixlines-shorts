"""The Wuyue video's smoke test: the returning route (scripts/wuyue.mjs gives the timing).

The finished 吳越 sign lies lit on the dark floor at Hangzhou, HANGZHOU under it. A magenta line
of light draws out across the floor to the north-east; at its end 高麗 (Goryeo, Korea) traces
itself in, cyan-white, with GORYEO (KOREA) fading in under it; a cyan-white line draws back
beside the first, and the sign flares once as it arrives. Cyan-white is kept for what crosses the
sea. The camera starts low and close over 吳 and rises, easing, to look down on the whole map.

  Blender -b --factory-startup --python-exit-code 1 -P blender/wuyue.py -- \
    --home 吳.json,越.json --shore 高.json,麗.json --at 26,44 --font goudos.ttf \
    --timing '{"frames":330,...}' --width 1080 --height 1920 --out route.mp4
"""

import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import character  # noqa: E402
from character import BODY, NEON, glass  # noqa: E402
from hexagram import PULSE, REST, bloom, edge, key, linear, render_settings  # noqa: E402
from sign import MARGIN, arrange, bounds, label, sign_char, stage  # noqa: E402

HOME, SEA = "#ff5ec8", "#bfe9ff"  # Wuyue's magenta; cyan-white for what crosses the sea
GREY = "#a89aa3"
LANE = 0.5  # metres between the outward and the returning line


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :]
    p = argparse.ArgumentParser()
    p.add_argument("--home", required=True)
    p.add_argument("--shore", required=True)
    p.add_argument("--at", required=True, help="the far shore's middle, x,y metres from Hangzhou's")
    p.add_argument("--font", required=True)
    p.add_argument("--timing", required=True)
    p.add_argument("--width", type=int, default=1080)
    p.add_argument("--height", type=int, default=1920)
    p.add_argument("--samples", type=int, default=64)
    p.add_argument("--out", required=True)
    return p.parse_args(argv)


def route(name, a, b, side, bend, colour, start, end):
    """A line of light from a to b, set `side` half a lane off the straight line and bowed by
    `bend` (either way), drawing itself in from start to end."""
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
    for bp, co, h in ((s.bezier_points[0], a, a + along / 3 + bow), (s.bezier_points[1], b, b - along / 3 + bow)):
        bp.handle_left_type = bp.handle_right_type = "FREE"
        bp.co = co
        bp.handle_right = h if bp is s.bezier_points[0] else co + (co - h)
        bp.handle_left = co - (h - co) if bp is s.bezier_points[0] else h
    o = bpy.data.objects.new(name, c)
    bpy.context.scene.collection.objects.link(o)
    o.location.z = BODY + NEON
    mat, strength = edge(linear(colour), name)
    strength.default_value = REST * 1.5
    c.materials.append(mat)
    character.draw(c, start, end - start)
    return o


def place(chars, layout, at):
    """Arranges the characters and moves the group's middle to `at`; returns their objects."""
    objs = arrange(chars, layout)
    x0, y0, x1, y1 = bounds(objs)
    for root, _, _ in chars:
        root.location.x += at[0] - (x0 + x1) / 2
        root.location.y += at[1] - (y0 + y1) / 2
    return objs


def under(objs, text, font, fade=None):
    """A grey label under the objects."""
    _, y0, _, _ = bounds(objs)
    o = label(text, text, font, 2.0, GREY, 1.0, fade)
    x0, _, x1, _ = bounds(objs)
    o.location = ((x0 + x1) / 2, y0 - 1.1, 0.02)
    return o


def main():
    args = parse()
    t = json.loads(args.timing)
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)

    # Hangzhou: the finished sign, one glow to flare.
    home_mat, home_glow = edge(linear(HOME), "home")
    home_glow.default_value = REST * 1.5
    home = [sign_char(n, f, home_mat, glass(HOME), linear(HOME), None) for n, f in enumerate(args.home.split(","))]
    home_objs = place(home, "stack", (0, 0))
    under(home_objs, "HANGZHOU", args.font)
    for f, v in ((t["flare"] - 1, REST * 1.5), (t["flare"] + 2, PULSE), (t["flare"] + 20, REST * 1.5)):
        home_glow.default_value = v
        home_glow.keyframe_insert("default_value", frame=f + 1)

    # Goryeo: traced in all at once, every stroke together, over the shore's time.
    files = args.shore.split(",")
    n0 = len(home)
    s0, s1 = t["shore"]
    clip = {"strokes": [], "draw": s1 - s0}
    for k, f in enumerate(files):
        clip["strokes"] += [[n0 + k, i, s0] for i in range(len(json.load(open(f))["strokes"]))]
    at = [float(v) for v in args.at.split(",")]
    shore = [sign_char(n0 + k, f, None, glass(SEA), linear(SEA), clip) for k, f in enumerate(files)]
    shore_objs = place(shore, "row", at)
    under(shore_objs, "GORYEO (KOREA)", args.font, (s1, 20))

    # The lines: out from the sign's top right corner to the shore's lower left, and back.
    # They leave from the right edge of 吳 (half way up it) and meet the left edge of 高
    # (half way up it), so they read as running between the two names.
    wx0, wy0, wx1, wy1 = bounds(home[0][1])
    gx0, gy0, gx1, gy1 = bounds(shore[0][1])
    a, b = (wx1 + 0.4, (wy0 + wy1) / 2, 0), (gx0 - 0.4, (gy0 + gy1) / 2, 0)
    # Going back the line runs the other way, so the same side is the other lane and the bow
    # bends back to match the first.
    route("out", a, b, 1, 1, HOME, *t["out"])
    route("back", b, a, 1, -1, SEA, *t["back"])

    stage(scene, floor=400)
    render_settings(scene, t["frames"], args.out, False)
    scene.eevee.taa_render_samples = args.samples
    scene.render.resolution_x, scene.render.resolution_y = args.width, args.height

    # The camera: low and close over 吳, then rising to look down on the whole map by the time
    # 高麗 starts to trace in, and holding there.
    data = bpy.data.cameras.new("camera")
    data.lens, data.sensor_fit, data.sensor_width = 35, "HORIZONTAL", 36
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    track = cam.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"

    first = bounds(home[0][1])
    near = Vector(((first[0] + first[2]) / 2, (first[1] + first[3]) / 2, 0))
    everything = home_objs + shore_objs
    x0, y0, x1, y1 = bounds(everything)
    aspect = args.height / args.width
    half = 18 / 35
    dist = max(MARGIN[0] * (x1 - x0) / 2 / half, MARGIN[1] * (y1 - y0) / 2 / (half * aspect))
    far = Vector(((x0 + x1) / 2, (y0 + y1) / 2, 0))
    for f, aim, eye in (
        (0, near, near + Vector((2, -9, 6))),
        (t["out"][0], near + Vector((0.5, 1, 0)), near + Vector((2.5, -8, 7))),
        (t["shore"][0], far, far + Vector((0, -dist / 15.5, dist))),
    ):
        target.location, cam.location = aim, eye
        key(target, "location", f)
        key(cam, "location", f)

    bloom(scene)
    bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
