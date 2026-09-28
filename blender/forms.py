"""Draws a character through its scripts in neon, as blender/character.py draws the kaishu:
each older form (bone, bronze, seal: scripts/ancient-forms.mjs) is traced on the dark glass
floor, holds, and fades as the next is traced where it stood; the kaishu comes last, stroke
by stroke, and holds. A label under each form names its script and age. The camera looks
down, a little from the front, and drifts in; there is no shake.

  Blender -b --factory-startup --python-exit-code 1 -P blender/forms.py -- \
    --forms public/local/ancient/馬-bone.json,public/local/ancient/馬-bronze.json,public/local/ancient/馬-seal.json,public/local/hanzi/馬.json \
    --labels "SHANG, C. 1200 BC\\nCARVED ON BONE|..." --pixel public/fonts/PixelOperator-Bold.ttf \
    --bpm 90 --per 4 --hold 6 --out out/forms/馬.mp4 [--still N] [--preview]

Run through scripts/forms.mjs, which reads series/forms/<char>.json.
"""

import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from character import BODY, NEON, body, draw, glass, neon, show  # noqa: E402
from hexagram import PULSE, REST, bloom, edge, key, linear, obsidian, render_settings  # noqa: E402
from layout import FPS, frame_count  # noqa: E402

LABEL = "#e8f5e4"
LABEL_Y = -4.9  # metres: under the lowest form (the kaishu's hook reaches about -4)
# Metres either side of the centre a form may reach and stay in the portrait frame with its
# glow, from the closest camera (lens 35, 14.6 m away: about 4.2 m either side). 馬 fits;
# 井's regular script, as wide as the box, does not.
HALF_WIDTH = 3.6


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--forms", required=True, help="stroke data files, oldest first, comma separated")
    p.add_argument("--labels", required=True, help="one label per form, separated by |; \\n breaks a line")
    p.add_argument("--pixel", required=True, help="font for the labels")
    p.add_argument("--bpm", type=float, required=True)
    p.add_argument("--per", type=float, default=4.0, help="beats each older form has before the next is traced")
    p.add_argument("--hold", type=float, default=6.0, help="beats the last form holds, finished")
    p.add_argument("--edge", default="#ff6a3d")
    p.add_argument("--out", required=True)
    p.add_argument("--still", type=int)
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def label(i, text, font):
    """The label under a form; returns its object and its emission strength to fade."""
    m = bpy.data.materials.new(f"label{i}")
    m.use_nodes = True
    nodes, links = m.node_tree.nodes, m.node_tree.links
    nodes.clear()
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = linear(LABEL)
    emit.inputs["Strength"].default_value = 0.0
    links.new(emit.outputs["Emission"], nodes.new("ShaderNodeOutputMaterial").inputs["Surface"])
    curve = bpy.data.curves.new(f"label{i}", "FONT")
    curve.body = text.replace("\\n", "\n")
    curve.font = bpy.data.fonts.load(os.path.abspath(font))
    curve.size = 0.36
    curve.space_line = 1.25
    curve.align_x, curve.align_y = "CENTER", "TOP"
    o = bpy.data.objects.new(f"label{i}", curve)
    bpy.context.scene.collection.objects.link(o)
    o.location = (-0.3, LABEL_Y, 0.02)
    o.data.materials.append(m)
    return o, emit.inputs["Strength"]


def fade(socket, points):
    for f, v in points:
        socket.default_value = v
        socket.keyframe_insert("default_value", frame=f + 1)


def hide_from(objs, at):
    """Hidden from frame `at`; keys only from `at - 1`, so earlier keys (show) still hold."""
    for o in objs:
        for f, hidden in ((at - 1, False), (at, True)):
            o.hide_render = hidden
            key(o, "hide_render", f)


def half_width():
    """How far the widest form reaches either side of the centre, in metres."""
    bpy.context.view_layer.update()
    xs = [(o.matrix_world @ Vector(c)).x for o in bpy.data.objects if o.name.startswith("neon") for c in o.bound_box]
    return max(abs(x) for x in xs)


def camera(scene, frames, scale=1.0):
    """High, a little in front, looking down at the character; drifts in over the clip. A
    character too wide for the frame (HALF_WIDTH) is seen from further back by `scale`."""
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    target.location = (0, -0.5, 0)
    data = bpy.data.cameras.new("camera")
    data.lens = 35
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
    for f, loc in ((0, (0, -4.2, 16.5)), (frames - 1, (0, -3.2, 14.2))):
        cam.location = tuple(v * scale for v in loc)
        key(cam, "location", f)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    files = args.forms.split(",")
    labels = args.labels.split("|")
    if len(files) != len(labels):
        raise SystemExit("--forms and --labels must agree")
    beat = 60 * FPS / args.bpm
    colour = linear(args.edge)
    black, smoke = obsidian(), glass(args.edge)

    t = round(0.5 * beat)
    last = len(files) - 1
    for n, f in enumerate(files):
        data = json.load(open(f))
        paths = data["strokes"]
        glow, strength = edge(colour, f"glow{n}")
        objs = []
        # An older form's outlines trace together, a little apart; the kaishu, stroke by stroke.
        step = round((0.3 if n == last else 0.12) * beat)
        length = round((0.8 if n == last else 1.4) * beat)
        for i, d in enumerate(paths):
            start = t + i * step
            c = neon(f"neon{n}-{i}", d, BODY + NEON, glow)
            draw(c, start, length)
            objs.append(bpy.data.objects[f"neon{n}-{i}"])
            b = body(f"body{n}-{i}", d, BODY, BODY / 2, smoke)
            show(b, start + length)
            objs.append(b)
        done = t + (len(paths) - 1) * step + length
        text, text_strength = label(n, labels[n], args.pixel)
        objs.append(text)
        # Unseen until its form starts: an unlit label is still opaque and would cover the one showing.
        text.hide_render = True
        key(text, "hide_render", 0)
        text.hide_render = False
        key(text, "hide_render", t)
        fade(text_strength, ((0, 0.0), (t, 0.0), (t + round(0.6 * beat), 2.0)))
        fade(strength, ((0, REST), (done - 1, REST), (done + round(0.3 * beat), PULSE * 0.4), (done + round(0.9 * beat), REST)))
        if n == last:
            t = done + round(args.hold * beat)
            break
        # The next form is traced where this one stands; this one dims out as it is.
        nxt = t + round(args.per * beat)
        out = round(0.9 * beat)
        fade(strength, ((nxt, REST), (nxt + out, 0.0)))
        fade(text_strength, ((nxt, 2.0), (nxt + round(0.5 * beat), 0.0)))
        hide_from(objs, nxt + out)
        t = nxt
    frames = t + 1

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
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
    bpy.context.object.data.materials.append(black)

    camera(scene, frames, max(1.0, half_width() / HALF_WIDTH))
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
