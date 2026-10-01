"""The timeline structure short's corridor of dates (docs/superpowers/specs/2026-09-30-structure-shorts-design.md,
section 7): a wet floor running away from the camera between two thin neon strips, the dates
standing on it in the terminal's pixel font, alternately left and right, turned a little
towards the middle; a Blade Runner searchlight (blender/searchlight.py) sweeping slowly through
thin haze. Sized for the terminal's window (980x1160) in src/templates/Lesson.tsx.

One clip per page. Page 0 looks down the whole corridor; page k (1 on) pushes slowly up to date
k, arriving at `at` seconds, when that date turns from green to amber, then drifts a little
closer. Calm: every move eased, nothing shakes.

--scene is written by scripts/timeline.mjs from the short's script: {page, secs, at, dates}.

With `flight` in the scene (the lesson's page timings, from scripts/lesson-plan.mjs) it is one
clip for the whole short instead, a fly-through as in a game: the camera stops at each date while
its page's answer is on the screen, then speeds up and slows into the next, low over the floor;
each page plays its stretch of the clip (src/templates/Lesson.tsx, `clip.flight`).

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
PIC_Z, PIC_H = 0.95, 2.1  # the pictures stand above the dates: bottom edge, height
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
    # A holder facing -y, turned a little towards the middle of the corridor; the date stands
    # upright in it, the pictures above.
    holder = bpy.data.objects.new(f"stand{k}", None)
    bpy.context.scene.collection.objects.link(holder)
    holder.location = (side * SIDE, k * STEP, 0)
    holder.rotation_euler = (0, 0, math.radians(side * 18))
    o.parent = holder
    o.location = (0, 0, 0.05)
    o.rotation_euler = (math.radians(90), 0, 0)
    return o, holder


def picture(name, path, parent, x, height, frame_colour):
    """A picture standing above a date: the image lit by itself, in a thin green frame."""
    img = bpy.data.images.load(path, check_existing=True)
    w = height * img.size[0] / img.size[1]
    bpy.ops.mesh.primitive_plane_add(size=1)
    o = bpy.context.object
    o.name = name
    o.scale = (w, height, 1)
    o.rotation_euler = (math.radians(90), 0, 0)
    o.location = (x, -0.02, PIC_Z + height / 2)
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nodes, links = m.node_tree.nodes, m.node_tree.links
    b = nodes["Principled BSDF"]
    tex = nodes.new("ShaderNodeTexImage")
    tex.image = img
    b.inputs["Base Color"].default_value = (0, 0, 0, 1)
    links.new(tex.outputs["Color"], b.inputs["Emission Color"])
    b.inputs["Emission Strength"].default_value = 0.9
    o.data.materials.append(m)
    o.parent = parent
    frame, glow = emission(name + "-frame", frame_colour, 2.5)
    bpy.ops.mesh.primitive_plane_add(size=1)
    f = bpy.context.object
    f.scale = (w + 0.06, height + 0.06, 1)
    f.rotation_euler = (math.radians(90), 0, 0)
    f.location = (x, 0.0, PIC_Z + height / 2)
    f.data.materials.append(frame)
    f.parent = parent
    return glow


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
        # Aimed a little above the middle of picture and date, so they sit below the
        # terminal's text at the top of the window.
        aim = (side * SIDE * 0.7, y, 1.9)
        moves = [(0, (0, y - 13.0, 2.6), (side * SIDE * 0.3, y, 1.6)), (arrive, (0, y - 7.5, 2.2), aim), (frames - 1, (0, y - 6.6, 2.1), aim)]
    for frame, loc, aim in moves:
        cam.location = loc
        key(cam, "location", frame)
        target.location = aim
        key(target, "location", frame)


# Flight timing, in seconds: the camera stops at a date just before its answer starts to type,
# and leaves this long before the page ends.
ARRIVE_EARLY, LEAVE = 0.3, 1.3
VIEW_BACK, VIEW_Z = 7.5, 2.2  # the stopped camera: how far short of its date, how high
OPEN = [(0, -3.0, 2.4), (0, -1.8, 2.3)]  # page 0 (the whole span): a slow push, then away


def flight_stops(flight):
    """(arrive, leave) clip frames for each page: page 0 from the start, the others at their
    answer, each until a little before its page ends (the last one to the end)."""
    stops = []
    for k, t in enumerate(flight):
        arrive = 0 if k == 0 else t["from"] + t["aAt"] - round(ARRIVE_EARLY * FPS)
        leave = t["from"] + t["frames"] - round(LEAVE * FPS) if k < len(flight) - 1 else t["from"] + t["frames"] - 1
        stops.append((arrive, leave))
    return stops


def view(k):
    """The stopped camera at date k and where it looks: from a little across the corridor, at the
    middle of picture and date."""
    side = -1 if k % 2 else 1
    y = k * STEP
    return (-side * 0.5, y - VIEW_BACK, VIEW_Z), (side * SIDE * 0.7, y, 1.9)


def fly(scene, flight):
    """The fly-through camera: still at each stop, eased between (Blender's auto-clamped
    handles make every stop and start smooth); low and through the middle in between."""
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    data = bpy.data.cameras.new("camera")
    data.lens = 32
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
    stops = flight_stops(flight)
    for k, (arrive, leave) in enumerate(stops):
        if k == 0:
            poses = [(arrive, OPEN[0], (0, 22, 1.2)), (leave, OPEN[1], (0, 22, 1.2))]
        else:
            loc, aim = view(k)
            poses = [(arrive, loc, aim), (leave, loc, aim)]
        for frame, loc, aim in poses:
            cam.location = loc
            key(cam, "location", frame)
            target.location = aim
            key(target, "location", frame)
        if k + 1 < len(stops):
            # Halfway to the next date: through the middle, a little lower, faster.
            mid = (leave + stops[k + 1][0]) // 2
            cam.location = (0, cam.location.y, 1.75)
            for i in (0, 2):
                key(cam, "location", mid, index=i)
    return cam, stops


def main():
    args = parse()
    spec = json.load(open(args.scene))
    flight = spec.get("flight")
    page, secs, at, dates = spec.get("page", -1), spec.get("secs", 0), spec.get("at", 4.0), spec["dates"]
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = spec["frames"] if flight else round(secs * FPS)
    stops = flight_stops(flight) if flight else None
    world = bpy.data.worlds.new("black")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0
    scene.world = world

    corridor(scene)
    font = bpy.data.fonts.load(os.path.abspath(FONT))
    for k, text in enumerate(dates):
        if k == 0:
            continue
        o, holder = date_sign(k, text, font)
        pics = [os.path.join(spec["pictures_dir"], f"{n}.jpg") for n in spec.get("pictures", {}).get(str(k), [])]
        widths, x = [], 0.0
        if pics:
            # Side by side, centred over the date, with a small gap.
            sizes = [bpy.data.images.load(p, check_existing=True).size for p in pics]
            widths = [PIC_H * w / h for w, h in sizes]
            gap = 0.25
            x = -(sum(widths) + gap * (len(widths) - 1)) / 2
        glows = []
        if pics:
            for n, (path, w) in enumerate(zip(pics, widths)):
                glows.append(picture(f"pic{k}-{n}", path, holder, x + w / 2, PIC_H, GREEN))
                x += w + gap
        m, b = emission(f"date{k}-glow", GREEN, 3.0)
        o.data.materials.append(m)
        if flight:
            # Amber while the camera is stopped at it: the date and its frames to look at.
            arrive, leave = stops[k]
            for g in [b, *glows]:
                colour = g.inputs["Emission Color"]
                for frame, c in [(arrive - 6, GREEN), (arrive + 6, AMBER), (leave, AMBER), (leave + 12, GREEN)]:
                    colour.default_value = linear(c)
                    colour.keyframe_insert("default_value", frame=frame + 1)
        elif k == page:
            # Green until the camera arrives, then amber: the date and its frames to look at.
            for g in [b, *glows]:
                colour = g.inputs["Emission Color"]
                colour.default_value = linear(GREEN)
                colour.keyframe_insert("default_value", frame=round(at * FPS) - 6 + 1)
                colour.default_value = linear(AMBER)
                colour.keyframe_insert("default_value", frame=round(at * FPS) + 6 + 1)

    if flight:
        cam, _ = fly(scene, flight)
        haze(scene, density=0.01)
        # The beam goes along with the camera, ahead of it, crossing the floor slowly from side
        # to side, once each way a page.
        lamp = searchlight(scene, frames, (0, 6, 16), [], energy=60000)
        aim = bpy.data.objects["searchlight-aim"]
        for k, t in enumerate(flight):
            for part, x in ((0, -3), (0.5, 3)):
                f = t["from"] + round(part * t["frames"])
                scene.frame_set(f + 1)
                y = cam.matrix_world.translation.y
                aim.location = (x, y + 9 + 4 * part, 0)
                key(aim, "location", f)
                lamp.location = (0, y + 13, 16)
                key(lamp, "location", f)
        scene.frame_set(frames)
        y = cam.matrix_world.translation.y
        aim.location, lamp.location = (-3, y + 9, 0), (0, y + 13, 16)
        key(aim, "location", frames - 1)
        key(lamp, "location", frames - 1)
    else:
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
