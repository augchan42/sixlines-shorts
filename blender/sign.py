"""A still neon sign: one or more characters traced in neon exactly as blender/character.py
traces a lesson's lying strokes (a hollow tube on each stroke's real outline, over a smoked
glass body, on the dark glossy floor, under the same sun and bloom), with lines of text under
them in a muted colour so the neon leads. Nothing else is drawn.

As a still, the sign is finished. As a clip (--timing, from scripts/sign.mjs signTiming), each
stroke traces itself in as a lesson's lying strokes do, its glass body appearing under it; when
the last is done the neon flares once, as a finished lesson does, and settles; then the label
lines fade in and it holds. The camera does not move.

  Blender -b --factory-startup --python-exit-code 1 -P blender/sign.py -- \
    --data public/local/hanzi/吳.json,public/local/hanzi/越.json --layout stack \
    --labels "WUYUE|KINGDOM OF WUYUE · 907–978" --sizes 1.7,0.62 --font public/fonts/PixelOperator-Bold.ttf \
    --edge "#ff5ec8" --label-colour "#a89aa3" --width 1080 --height 1920 --out out/signs/wuyue-pixel.png

Run through scripts/sign.mjs, which reads series/signs/<name>.json.
"""

import argparse
import math
import os
import sys
import json

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import character  # noqa: E402
from character import BODY, body, draw, glass, neon, show  # noqa: E402
from hexagram import PULSE, REST, bloom, edge, linear, obsidian, render_settings  # noqa: E402

GAP = 0.9  # metres between two characters' outlines
LABEL_GAP = 1.1  # metres from the characters to the first label line
LINE_GAP = 0.55  # metres between label lines
MARGIN = (1.3, 1.14)  # the frame is this much wider (x) and taller (y) than the sign, at least


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--data", required=True, help="stroke data files, one per character, in reading order, comma separated")
    p.add_argument("--layout", choices=("stack", "row"), default="stack", help="stack: top to bottom; row: left to right")
    p.add_argument("--labels", default="", help="lines of text under the characters, separated by |")
    p.add_argument("--sizes", default="", help="each label line's size in metres, comma separated")
    p.add_argument("--font", help="font for the labels")
    p.add_argument("--edge", default="#ff5ec8")
    p.add_argument("--label-colour", default="#a89aa3")
    p.add_argument("--label-strength", type=float, default=1.0)
    p.add_argument("--tube", type=float, default=1.0, help="the neon tube's radius, times character.py's")
    p.add_argument("--glow", type=float, default=1.5, help="the neon's emission, times REST (a finished lesson rests at 1.5)")
    p.add_argument("--width", type=int, default=1080)
    p.add_argument("--height", type=int, default=1920)
    p.add_argument("--samples", type=int, default=64)
    p.add_argument("--timing", help="a clip's timing as JSON (scripts/sign.mjs signTiming); a still without it")
    p.add_argument("--out", required=True)
    return p.parse_args(argv)


def bounds(objs):
    """World-space (min x, min y, max x, max y) of the objects."""
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    return min(p.x for p in pts), min(p.y for p in pts), max(p.x for p in pts), max(p.y for p in pts)


def sign_char(n, file, glow_mat, smoke, colour, clip):
    """A character's strokes lying on the floor under an empty at the origin; returns the empty,
    its objects, and, in a clip, each stroke's glow strength. In a still they are finished and
    share one glow; in a clip each stroke has its own, to trace in at its frame."""
    root = bpy.data.objects.new(f"char{n}", None)
    bpy.context.scene.collection.objects.link(root)
    objs, glows = [], []
    for i, d in enumerate(json.load(open(file))["strokes"]):
        at = clip and next(f for c, s, f in clip["strokes"] if (c, s) == (n, i))
        mat = glow_mat
        if clip:
            mat, strength = edge(colour, f"glow{n}-{i}")
            glows.append(strength)
            for f, v in ((at - 1, REST), (at + round(clip["draw"] * 1.0), PULSE * 0.4), (at + round(clip["draw"] * 1.75), REST)):
                strength.default_value = v
                strength.keyframe_insert("default_value", frame=f + 1)
        c = neon(f"neon{n}-{i}", d, BODY + character.NEON, mat, root)
        objs.append(bpy.data.objects[f"neon{n}-{i}"])
        glass_body = body(f"body{n}-{i}", d, BODY, BODY / 2, smoke, root)
        objs.append(glass_body)
        if clip:
            draw(c, at, clip["draw"])
            show(glass_body, at + clip["draw"])
    return root, objs, glows


def label(n, text, font, size, colour, strength, fade=None):
    """A line of flat emissive text lying on the floor, centred at x 0, fading in over `fade`
    (start frame, length) if given; returns its object."""
    m = bpy.data.materials.new(f"label{n}")
    m.use_nodes = True
    nodes, links = m.node_tree.nodes, m.node_tree.links
    nodes.clear()
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = linear(colour)
    emit.inputs["Strength"].default_value = strength
    if fade:
        for f, v in ((fade[0], 0.0), (fade[0] + fade[1], strength)):
            emit.inputs["Strength"].default_value = v
            emit.inputs["Strength"].keyframe_insert("default_value", frame=f + 1)
    links.new(emit.outputs["Emission"], nodes.new("ShaderNodeOutputMaterial").inputs["Surface"])
    curve = bpy.data.curves.new(f"label{n}", "FONT")
    curve.body = text
    curve.font = bpy.data.fonts.load(os.path.abspath(font))
    curve.size = size
    curve.align_x, curve.align_y = "CENTER", "TOP"
    o = bpy.data.objects.new(f"label{n}", curve)
    bpy.context.scene.collection.objects.link(o)
    o.location = (0, 0, 0.02)
    o.data.materials.append(m)
    # Unlit text still shows as dark letters against the floor's glow, so it is hidden until it fades in.
    if fade:
        show(o, fade[0])
    return o


def arrange(chars, layout):
    """Moves each character (from sign_char) into its place, top to bottom ("stack") or left to
    right ("row"), GAP apart, centred on x 0 with the first at the top (or left) at 0; returns
    all their objects."""
    at = 0.0
    for root, objs, _ in chars:
        x0, y0, x1, y1 = bounds(objs)
        if layout == "stack":
            root.location = (-(x0 + x1) / 2, at - y1, 0)
            at -= (y1 - y0) + GAP
        else:
            root.location = (at - x0, -(y0 + y1) / 2, 0)
            at += (x1 - x0) + GAP
    every = [o for _, objs, _ in chars for o in objs]
    x0, y0, x1, y1 = bounds(every)
    for root, _, _ in chars:
        root.location.x -= (x0 + x1) / 2
    return every


def stage(scene, floor=200):
    """character.py's black world, sun and dark glossy floor."""
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
    bpy.ops.mesh.primitive_plane_add(size=floor, location=(0, 0, 0))
    bpy.context.object.data.materials.append(obsidian())


def camera(scene, objs, aspect):
    """Nearly straight down on the sign, as a lesson ends (a few degrees from the front, so the
    floor still reflects), far enough that the sign fits with MARGIN either way, and centred in
    the frame by shifting the lens (the near side looks larger, so aiming at the middle is not
    enough)."""
    x0, y0, x1, y1 = bounds(objs)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    data = bpy.data.cameras.new("camera")
    data.lens, data.sensor_fit, data.sensor_width = 35, "HORIZONTAL", 36
    half = 18 / 35  # half the view's width per metre of distance
    dist = max(MARGIN[0] * (x1 - x0) / 2 / half, MARGIN[1] * (y1 - y0) / 2 / (half * aspect))
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    target.location = (cx, cy, 0)
    track = cam.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
    # The lesson's top view: 1 m in front for 15.5 m up.
    cam.location = (cx, cy - dist / 15.5, dist)
    bpy.context.view_layer.update()
    pts = [world_to_camera_view(scene, cam, o.matrix_world @ Vector(c)) for o in objs for c in o.bound_box]
    u0, u1 = min(p.x for p in pts), max(p.x for p in pts)
    v0, v1 = min(p.y for p in pts), max(p.y for p in pts)
    # Lens shift is in units of the frame's longer side.
    data.shift_x = (u0 + u1 - 1) / 2 * min(1, 1 / aspect)
    data.shift_y = (v0 + v1 - 1) / 2 * min(1, aspect)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    character.NEON *= args.tube
    glow_mat, strength = edge(linear(args.edge), "glow")
    strength.default_value = REST * args.glow
    smoke = glass(args.edge)
    clip = json.loads(args.timing) if args.timing else None

    # Each character measured where it is drawn, then moved into its place.
    chars = [sign_char(n, f, glow_mat, smoke, linear(args.edge), clip) for n, f in enumerate(args.data.split(","))]
    every = arrange(chars, args.layout)
    x0, y0, x1, y1 = bounds(every)

    lines = [t for t in args.labels.split("|") if t]
    sizes = [float(s) for s in args.sizes.split(",") if s]
    if len(sizes) != len(lines):
        raise SystemExit("--labels and --sizes must agree")
    y = y0 - LABEL_GAP
    for n, (text, size) in enumerate(zip(lines, sizes)):
        o = label(n, text, args.font, size, args.label_colour, args.label_strength, clip and clip["labels"][n])
        o.location.y = y
        _, low, _, _ = bounds([o])
        y = low - LINE_GAP
        every.append(o)

    stage(scene)

    # The finished sign flares once, as a finished lesson does, and settles at the still's glow.
    if clip:
        t = clip["flare"]
        for strength in (g for _, _, glows in chars for g in glows):
            for f, v in ((t - 1, REST), (t + 2, PULSE), (t + round(clip["draw"] * 1.25), REST * args.glow)):
                strength.default_value = v
                strength.keyframe_insert("default_value", frame=f + 1)

    render_settings(scene, clip["frames"] if clip else 1, args.out, False)
    scene.eevee.taa_render_samples = args.samples
    # Before the camera, which measures the sign in this frame.
    scene.render.resolution_x, scene.render.resolution_y = args.width, args.height
    camera(scene, every, args.height / args.width)
    bloom(scene)
    if clip:
        bpy.ops.render.render(animation=True)
        return
    scene.frame_set(1)
    scene.render.image_settings.media_type = "IMAGE"
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = os.path.abspath(args.out)
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
