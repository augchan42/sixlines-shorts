"""The 64 hexagrams as the corners of a six-dimensional cube, drawn in 3D for the structure
shorts (docs/superpowers/specs/2026-09-30-structure-shorts-design.md): thin neon edges, small
glowing corners, black behind, the camera orbiting slowly. Sized for the terminal's window
(980x1160) in src/templates/Lesson.tsx.

What is lit comes from --scene (written by scripts/hypercube.mjs from src/lib/cube.ts, which
holds the maths and its tests): `points` (64 xyz, Qian at the top), `edges`, and either
`focus` (a corner amber, its six edges and neighbours bright, from `at` seconds) or `path`
(corners joined one edge at a time at `times`, each edge and corner turning amber).

  Blender -b --factory-startup --python-exit-code 1 -P blender/hypercube.py -- \
    --scene out/cube-scene.json --out out/cube.mp4 [--still N] [--preview]
"""

import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hexagram import bloom, key, linear, render_settings  # noqa: E402
from layout import FPS  # noqa: E402

GREEN, AMBER = "#6cff7a", "#ffb000"
EDGE_R, BEAD_R = 0.005, 0.02  # tube and corner radii, for a cube about 1.6 across
DIM_EDGE, DIM_BEAD = 0.3, 0.7  # emission of the unlit cube
BRIGHT, LIT = 4.0, 5.0  # a lit neighbour, and amber on what to look at
RAMP = 6  # frames for a light to come up
W, H = 980, 1160


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--scene", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--still", type=int, help="render only this frame, as a png")
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def glow(name, colour, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0, 0, 0, 1)
    b.inputs["Emission Color"].default_value = linear(colour)
    b.inputs["Emission Strength"].default_value = strength
    return m, b.inputs["Emission Strength"], b.inputs["Emission Color"]


def light_up(socket, frame, start, end):
    """Emission from `start` to `end` over RAMP frames, beginning at clip frame `frame`."""
    socket.default_value = start
    key(socket, "default_value", max(0, frame))
    socket.default_value = end
    key(socket, "default_value", max(0, frame) + RAMP)


def to_amber(colour_socket, frame):
    colour_socket.default_value = linear(GREEN)
    key(colour_socket, "default_value", max(0, frame))
    colour_socket.default_value = linear(AMBER)
    key(colour_socket, "default_value", max(0, frame) + RAMP)


def tube(a, b, material, name):
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=EDGE_R, depth=d.length, location=(a + b) / 2)
    o = bpy.context.object
    o.name = name
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = d.to_track_quat("Z", "Y")
    o.data.materials.append(material)
    return o


def bead(p, material, name, r=BEAD_R):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=r, location=p)
    o = bpy.context.object
    o.name = name
    bpy.ops.object.shade_smooth()
    o.data.materials.append(material)
    return o


def camera(scene, frames, radius):
    """Slowly round the cube, a little above it: 24 degrees in 10 s, whatever the clip's length."""
    pivot = bpy.data.objects.new("pivot", None)
    scene.collection.objects.link(pivot)
    cam = bpy.data.cameras.new("cam")
    cam.lens = 50
    cam.sensor_fit = "VERTICAL"
    o = bpy.data.objects.new("cam", cam)
    scene.collection.objects.link(o)
    o.parent = pivot
    dist = radius * 5.6
    tilt = math.radians(14)
    o.location = (0, -dist * math.cos(tilt), dist * math.sin(tilt))
    track = o.constraints.new("TRACK_TO")
    track.target = pivot
    track.track_axis, track.up_axis = "TRACK_NEGATIVE_Z", "UP_Y"
    scene.camera = o
    turn = math.radians(24) * frames / (10 * FPS)
    pivot.rotation_euler = (0, 0, 0)
    key(pivot, "rotation_euler", 0)
    pivot.rotation_euler = (0, 0, turn)
    key(pivot, "rotation_euler", frames)


def world(scene):
    w = bpy.data.worlds.new("black")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0
    scene.world = w


def main():
    args = parse()
    s = json.load(open(args.scene))
    scene = bpy.context.scene
    # Steady turns and ramps: every key linear.
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = round(s["secs"] * FPS)
    pts = s["points"]
    radius = max(math.sqrt(sum(c * c for c in p)) for p in pts)

    base_edge, _, _ = glow("edge", GREEN, DIM_EDGE)
    base_bead, _, _ = glow("bead", GREEN, DIM_BEAD)
    lit_edges, lit_beads = {}, {}  # (a, b) or v -> clip frame it lights, and whether amber
    if s.get("focus") is not None:
        f = round(s.get("at", 1) * FPS)
        v = s["focus"]
        lit_beads[v] = (f, True)
        for w in range(64):
            if bin(v ^ w).count("1") == 1:
                lit_edges[tuple(sorted((v, w)))] = (f + RAMP, False)
                lit_beads[w] = (f + RAMP, False)
    if s.get("path"):
        path, times = s["path"], s["times"]
        lit_beads[path[0]] = (round((times[0] - 0.4) * FPS), True)
        for k, t in enumerate(times):
            lit_edges[tuple(sorted((path[k], path[k + 1])))] = (round(t * FPS), True)
            lit_beads[path[k + 1]] = (round(t * FPS) + RAMP, True)

    for a, b in s["edges"]:
        e = (min(a, b), max(a, b))
        if e in lit_edges:
            frame, amber = lit_edges[e]
            m, strength, colour = glow(f"edge-{a}-{b}", GREEN, DIM_EDGE)
            light_up(strength, frame, DIM_EDGE, LIT if amber else BRIGHT)
            if amber:
                to_amber(colour, frame)
            tube(pts[a], pts[b], m, f"edge-{a}-{b}")
        else:
            tube(pts[a], pts[b], base_edge, f"edge-{a}-{b}")
    for v, p in enumerate(pts):
        if v in lit_beads:
            frame, amber = lit_beads[v]
            m, strength, colour = glow(f"bead-{v}", GREEN, DIM_BEAD)
            light_up(strength, frame, DIM_BEAD, LIT if amber else BRIGHT)
            if amber:
                to_amber(colour, frame)
            bead(p, m, f"bead-{v}", BEAD_R * (1.6 if amber else 1.25))
        else:
            bead(p, base_bead, f"bead-{v}")

    world(scene)
    camera(scene, frames, radius)
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
