"""The timeline structure short's corridor of dates (docs/superpowers/specs/2026-09-30-structure-shorts-design.md,
section 7): a wet floor running away from the camera between two thin neon strips, the dates
standing on it in the terminal's pixel font, alternately left and right, turned a little
towards the middle; a Blade Runner searchlight (blender/searchlight.py) sweeping slowly through
thin haze. Sized for the terminal's window (980x1160) in src/templates/Lesson.tsx.

One clip per page. Page 0 looks down the whole corridor; page k (1 on) pushes slowly up to date
k, arriving at `at` seconds, when that date turns from green to amber, then drifts a little
closer. Calm: every move eased, nothing shakes.

--scene is written by scripts/timeline.mjs from the short's script: {page, secs, at, dates}.

  Blender -b --factory-startup --python-exit-code 1 -P blender/timeline.py -- \
    --scene out/timeline/timeline-4.json --out out/timeline-4.mp4 [--still N] [--preview]
"""

import argparse
import json
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hexagram import bloom, key, linear, render_settings  # noqa: E402
from layout import FPS  # noqa: E402
from searchlight import haze, searchlight, wet  # noqa: E402

W, H = 980, 1160
GREEN, AMBER = "#6cff7a", "#ffb347"  # AMBER as in src/scenes/Diagram.tsx
STEP = 10.0  # metres between dates along the corridor
SIDE = 2.2  # how far left or right of the middle each date stands
FONT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "fonts", "PixelOperator-Bold.ttf")


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--scene", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--still", type=int)
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def emission(name, colour, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0, 0, 0, 1)
    b.inputs["Emission Color"].default_value = linear(colour)
    b.inputs["Emission Strength"].default_value = strength
    return m, b


def date_sign(k, text, font):
    """Date k (1 on) standing on the floor, facing back down the corridor."""
    curve = bpy.data.curves.new(f"date{k}", "FONT")
    curve.body = text
    curve.font = font
    curve.size = 0.9
    curve.extrude = 0.03
    curve.align_x, curve.align_y = "CENTER", "BOTTOM"
    o = bpy.data.objects.new(f"date{k}", curve)
    bpy.context.scene.collection.objects.link(o)
    side = -1 if k % 2 else 1
    o.location = (side * SIDE, k * STEP, 0.05)
    # Upright, facing -y, turned a little towards the middle of the corridor.
    o.rotation_euler = (math.radians(90), 0, math.radians(side * 18))
    return o


def corridor(scene):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 50, 0))
    floor = bpy.context.object
    floor.scale = (9, 130, 1)
    floor.data.materials.append(wet())
    strip, _ = emission("strip", GREEN, 2.0)
    for x in (-5.5, 5.5):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, 50, 0.02))
        o = bpy.context.object
        o.scale = (0.04, 130, 0.02)
        o.data.materials.append(strip)


def camera(scene, frames, page, at):
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    data = bpy.data.cameras.new("camera")
    data.lens = 32
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
    arrive = round(at * FPS)
    if page == 0:
        # Down the whole corridor, a slow push.
        moves = [(0, (0, -10.0, 5.0), (0, 30, 0.0)), (frames - 1, (0, -8.0, 4.6), (0, 30, 0.0))]
    else:
        side = -1 if page % 2 else 1
        y = page * STEP
        aim = (side * SIDE * 0.6, y, 1.0)
        moves = [(0, (0, y - 12.0, 2.6), (side * SIDE * 0.3, y, 0.8)), (arrive, (0, y - 6.5, 2.2), aim), (frames - 1, (0, y - 5.5, 2.1), aim)]
    for frame, loc, aim in moves:
        cam.location = loc
        key(cam, "location", frame)
        target.location = aim
        key(target, "location", frame)


def main():
    args = parse()
    spec = json.load(open(args.scene))
    page, secs, at, dates = spec["page"], spec["secs"], spec.get("at", 4.0), spec["dates"]
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = round(secs * FPS)
    world = bpy.data.worlds.new("black")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0
    scene.world = world

    corridor(scene)
    font = bpy.data.fonts.load(os.path.abspath(FONT))
    for k, text in enumerate(dates):
        if k == 0:
            continue
        o = date_sign(k, text, font)
        m, b = emission(f"date{k}-glow", GREEN, 3.0)
        o.data.materials.append(m)
        if k == page:
            # Green until the camera arrives, then amber: the date to look at.
            colour = b.inputs["Emission Color"]
            colour.default_value = linear(GREEN)
            colour.keyframe_insert("default_value", frame=round(at * FPS) - 6 + 1)
            colour.default_value = linear(AMBER)
            colour.keyframe_insert("default_value", frame=round(at * FPS) + 6 + 1)

    camera(scene, frames, page, at)
    haze(scene, density=0.01)
    y = max(page, 1) * STEP
    # The beam crosses the floor ahead of the camera, slowly, once each way.
    searchlight(scene, frames, (0, y + 6, 16), [(0, (-3, y - 2, 0)), (frames // 2, (3, y + 3, 0)), (frames - 1, (-2, y + 6, 0))], energy=60000)
    bloom(scene)
    render_settings(scene, frames, args.out, args.preview)
    scene.render.resolution_x, scene.render.resolution_y = (W // 2, H // 2) if args.preview else (W, H)
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
