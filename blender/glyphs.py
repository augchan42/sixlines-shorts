"""Writes a hexagram's Judgment in neon, as a lesson picture: its characters lie on a dark
glass floor in rows, each traced stroke by stroke like a Hong Kong neon sign (the strokes of
blender/character.py), with its English gloss flickering on under it. Once all are written,
the --stress characters (the words the lesson turns on) flare and turn amber. The camera looks down at an
angle and drifts in; there is no shake.

Timed for a lesson of --beats beats: one character a beat from beat 0.3, the flare a beat
after the last, and the last 5 beats left clear for the sentence the template types under it.

Run through scripts/lesson3d.mjs, or directly:
  Blender -b --factory-startup --python-exit-code 1 -P blender/glyphs.py -- \
    --hanzi public/local/hanzi --glyphs "履|虎|尾|不|咥|人" --glosses "tread|tiger|tail|not|bite|person" \
    --rows 3,3 --stress 3,4,5 --pixel public/fonts/PixelOperator-Bold.ttf \
    --bpm 120 --beats 12 --out out/glyphs.mp4 [--still N] [--preview]
"""

import argparse
import json
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import character  # noqa: E402
from character import BODY, NEON, body, draw, glass, neon, show  # noqa: E402
from hexagram import PULSE, REST, bloom, edge, key, linear, obsidian, render_settings  # noqa: E402
from layout import FPS, frame_count  # noqa: E402

SIZE = 1.9  # a character's box, metres
STEP_X = 2.25  # between characters in a row
STEP_Y = 3.1  # between rows, so the gloss fits under each character
GLOSS = "#e8f5e4"
STRESS = "#ffb347"  # the end card's amber backlight


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--hanzi", required=True, help="folder of Make Me a Hanzi stroke files")
    p.add_argument("--glyphs", required=True, help="the characters, separated by |")
    p.add_argument("--glosses", required=True, help="one English gloss per character, separated by |")
    p.add_argument("--rows", required=True, help="characters per row, top row first, e.g. 3,3")
    p.add_argument("--stress", default="", help="indices of the characters that flare at the end")
    p.add_argument("--pixel", required=True, help="font for the glosses")
    p.add_argument("--edge", default="#6cff7a")
    p.add_argument("--bpm", type=float, required=True)
    p.add_argument("--beats", type=float, required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--still", type=int)
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def positions(rows):
    """The centre (x, y) of each character on the floor, rows centred, top row first."""
    out = []
    for r, n in enumerate(rows):
        y = ((len(rows) - 1) / 2 - r) * STEP_Y
        out += [((k - (n - 1) / 2) * STEP_X, y) for k in range(n)]
    return out


def glyph(i, data, at, t, beat, colour, smoke):
    """Traces one character's strokes centred at `at`, from frame `t` over most of a beat;
    returns the neon materials, to flare."""
    # character.world() maps hanzi units to metres about CENTRE with SCALE; moving CENTRE
    # moves the character.
    character.SCALE = SIZE / 1024
    character.CENTRE = (512 - at[0] / character.SCALE, 388 - at[1] / character.SCALE)
    strokes = data["strokes"]
    each = max(2, round(0.8 * beat / len(strokes)))
    glows = []
    for k, d in enumerate(strokes):
        start = t + k * each
        glow, strength = edge(colour, f"g{i}s{k}")
        draw(neon(f"g{i}s{k}", d, BODY + NEON, glow), start, each + 2)
        show(body(f"g{i}b{k}", d, BODY, BODY / 2, smoke), start + each)
        glows.append(glow)
    return glows


def gloss(i, text, at, t, font):
    """The English under a character, flickering on like a sign at frame `t`."""
    m = bpy.data.materials.new(f"gloss{i}")
    m.use_nodes = True
    nodes, links = m.node_tree.nodes, m.node_tree.links
    nodes.clear()
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = linear(GLOSS)
    emit.inputs["Strength"].default_value = 2.0
    links.new(emit.outputs["Emission"], nodes.new("ShaderNodeOutputMaterial").inputs["Surface"])
    curve = bpy.data.curves.new(f"gloss{i}", "FONT")
    curve.body = text
    curve.font = bpy.data.fonts.load(os.path.abspath(font))
    curve.size = 0.42
    curve.align_x, curve.align_y = "CENTER", "CENTER"
    o = bpy.data.objects.new(f"gloss{i}", curve)
    bpy.context.scene.collection.objects.link(o)
    o.location = (at[0], at[1] - SIZE * 0.62, 0.02)
    bpy.context.view_layer.update()
    if o.dimensions.x > STEP_X * 0.95:
        curve.size *= STEP_X * 0.95 / o.dimensions.x
    o.data.materials.append(m)
    for f, hidden in ((0, True), (t, False), (t + 2, True), (t + 3, False)):
        o.hide_render = hidden
        key(o, "hide_render", f)


def camera(scene, frames, span):
    """High in front, looking down at the rows at an angle, drifting in over the clip."""
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    data = bpy.data.cameras.new("camera")
    data.lens = 35
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
    # The rows sit in the upper part of the frame, clear of the sentence typed at the bottom.
    far = span / 2 + 7.5
    for f, k in ((0, 1.0), (frames - 1, 0.9)):
        cam.location = (0, -0.75 * far * k - 2.0, 1.1 * far * k)
        key(cam, "location", f)
        target.location = (0, -1.6, 0)
        key(target, "location", f)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    glyphs, glosses = args.glyphs.split("|"), args.glosses.split("|")
    rows = [int(n) for n in args.rows.split(",")]
    if len(glyphs) != len(glosses) or len(glyphs) != sum(rows):
        raise SystemExit("--glyphs, --glosses and --rows must agree")
    stress = {int(i) for i in args.stress.split(",") if i}
    frames = frame_count(args.beats, args.bpm)
    beat = 60 * FPS / args.bpm
    colour = linear(args.edge)
    smoke = glass(args.edge)

    glows = []
    at = positions(rows)
    for i, (ch, text) in enumerate(zip(glyphs, glosses)):
        t = round((0.3 + i) * beat)
        data = json.load(open(os.path.join(args.hanzi, f"{ch}.json")))
        glows.append(glyph(i, data, at[i], t, beat, colour, smoke))
        gloss(i, text, at[i], t + round(0.8 * beat), args.pixel)
    # A beat after the last character, the stressed ones flare and turn amber.
    t = round((0.3 + len(glyphs) + 0.2) * beat)
    for i in stress:
        for m in glows[i]:
            b = m.node_tree.nodes["Principled BSDF"]
            for f, v, c in ((t - 1, REST, colour), (t + 2, PULSE, linear(STRESS)), (t + round(beat), REST * 1.5, linear(STRESS))):
                b.inputs["Emission Strength"].default_value = v
                b.inputs["Emission Strength"].keyframe_insert("default_value", frame=f + 1)
                for name in ("Emission Color", "Base Color"):
                    b.inputs[name].default_value = c
                    b.inputs[name].keyframe_insert("default_value", frame=f + 1)

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
    bpy.context.object.data.materials.append(obsidian())

    camera(scene, frames, len(rows) * STEP_Y)
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
