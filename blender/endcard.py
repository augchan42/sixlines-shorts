"""Renders an end card: the short's hexagram changes into six yang lines, the Six Lines icon,
and "SIX LINES" rises above them, with the tagline and site below. Blade Runner setting:
haze, a searchlight sweeping through it behind the lines, and an amber backlight.

Treatments (--mode):
  join  each yin line's halves slide together and fuse, one per half-beat from the bottom
  flip  each yin line rolls over on its long axis, like a cast coin, and comes back solid
  snap  every yin line shuts at once on the downbeat, with one flare and a camera kick
  fill  each yin line fills like a health bar, left to right across the gap, one after another

Run through scripts/endcard.mjs, or directly:
  Blender -b --factory-startup --python-exit-code 1 -P blender/endcard.py -- \
    --lines 010010 --bpm 100 --beats 7 --mode join --rain public/assets/3d/rain.mp4 \
    --serif …/goudos.ttf --pixel public/fonts/PixelOperator-Bold.ttf --out out/endcard.mp4
"""

import argparse
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hexagram import (  # noqa: E402
    PULSE, REST, add_slab, bloom, edge, key, linear, obsidian, rain_plane, render_settings,
)
from layout import FPS, LINE_W, frame_count, line_z, slabs  # noqa: E402

CREAM = "#f4efe4"
AMBER = "#ffb347"
SLIDE = 6  # frames for halves to meet or a line to turn


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--lines", required=True)
    p.add_argument("--bpm", type=float, required=True)
    p.add_argument("--beats", type=float, default=7)
    p.add_argument("--mode", choices=["join", "flip", "snap", "fill"], required=True)
    p.add_argument("--rain", required=True)
    p.add_argument("--serif", required=True)
    p.add_argument("--pixel", required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--edge", default="#6cff7a")
    p.add_argument("--tagline", default="Reveal the moment.")
    p.add_argument("--tagline-font", help="type the tagline in this font, with a cursor; default: the serif, faded in")
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def show(o, frame):
    """Hidden before `frame`, rendered from it on."""
    o.hide_render = True
    key(o, "hide_render", frame - 1)
    o.hide_render = False
    key(o, "hide_render", frame)


def hide(o, frame):
    o.hide_render = False
    key(o, "hide_render", frame - 1)
    o.hide_render = True
    key(o, "hide_render", frame)


def flare(strength, frame, peak=PULSE):
    for f, v in ((frame - 1, REST), (frame, peak), (frame + 12, REST)):
        strength.default_value = v
        strength.keyframe_insert("default_value", frame=f + 1)


def change(lines, mode, beat, black, colour):
    """Builds the hexagram as it stands at the end of the short and animates each yin line
    into a yang one. Returns the frame the last line becomes solid."""
    yin = [i for i, ch in enumerate(lines) if ch == "0"]
    halves = {}
    for i, x, z, w in slabs(lines):
        o, strength = add_slab(i, x, z, w, black, colour)
        halves.setdefault(i, []).append((o, strength, x, w))
    if not yin:
        # Already six yang lines (The Creative): each flares in turn instead.
        for k, i in enumerate(range(6)):
            flare(halves[i][0][1], round((0.5 + 0.5 * k) * beat))
        return round(3 * beat)

    if mode == "fill":
        return fill(yin, halves, beat, black, colour)

    done = 0
    for k, i in enumerate(yin):
        at = round(beat) if mode == "snap" else round((0.5 + 0.5 * k) * beat)
        slide = 3 if mode == "snap" else SLIDE
        solid, strength = add_slab(i, 0.0, line_z(i), LINE_W, black, colour)
        joined = at + slide
        if mode in ("join", "snap"):
            # The halves slide in until they touch, then the solid line takes their place.
            for o, _, x, w in halves[i]:
                inner = math.copysign(w / 2, x)
                o.location.x = x
                key(o, "location", at, index=0)
                o.location.x = inner
                key(o, "location", joined, index=0)
                hide(o, joined)
            show(solid, joined)
        else:
            # The halves turn a quarter over, edge-on; the solid line turns the rest of the way.
            mid = at + slide // 2
            for o, _, _, _ in halves[i]:
                o.rotation_euler.x = 0
                key(o, "rotation_euler", at, index=0)
                o.rotation_euler.x = math.radians(90)
                key(o, "rotation_euler", mid, index=0)
                hide(o, mid)
            solid.rotation_euler.x = math.radians(90)
            key(solid, "rotation_euler", mid, index=0)
            solid.rotation_euler.x = math.radians(180)
            key(solid, "rotation_euler", joined, index=0)
            show(solid, mid)
        flare(strength, joined, PULSE * (1.6 if mode == "snap" else 1.0))
        done = max(done, joined)
    return done


def fill(yin, halves, beat, black, colour):
    """Health bars: one yin line after another, the line grows from its left half across the
    gap, left to right, over two beats in all. Returns the frame the last bar is full."""
    each = round(2 * beat / len(yin))
    done = 0
    for k, i in enumerate(yin):
        at = round(0.5 * beat) + k * each
        (left, _, _, wl), (right, _, _, wr) = sorted(halves[i], key=lambda h: h[2])
        bar, strength = add_slab(i, 0.0, line_z(i), LINE_W, black, colour)
        # Origin on the left end, so scaling x grows it rightward only.
        for v in bar.data.vertices:
            v.co.x += LINE_W / 2
        bar.location.x = -LINE_W / 2
        full = at + each
        for f, sx in ((at, wl / LINE_W), (full, (LINE_W - wr) / LINE_W), (full + 1, 1.0)):
            bar.scale.x = sx
            key(bar, "scale", f, index=0)
        hide(left, at)
        show(bar, at)
        # It reaches the right half: from here the full bar looks the same and stands alone.
        hide(right, full + 1)
        flare(strength, full + 1)
        done = full + 1
    return done


def text(body, font, size, z, extrude=0.0, outline=0.0):
    curve = bpy.data.curves.new(body, "FONT")
    curve.body = body
    curve.font = bpy.data.fonts.load(os.path.abspath(font))
    curve.size = size
    curve.align_x, curve.align_y = "CENTER", "CENTER"
    curve.extrude = extrude
    if outline:
        # No fill, just the glyph outlines as glowing tubes: the lines' thin polygon look.
        curve.fill_mode = "NONE"
        curve.bevel_depth = outline
    o = bpy.data.objects.new(body, curve)
    bpy.context.scene.collection.objects.link(o)
    o.rotation_euler = (math.radians(90), 0, 0)  # stand it up, facing the camera
    o.location = (0, 0, z)
    return o


def wordmark(font, colour, at):
    """SIX / LINES above the lines, as on the icon, traced in the lines' glowing edge."""
    glow, strength = edge(colour, "edge-wordmark")
    for body, z in (("SIX", 5.15), ("LINES", 3.55)):
        o = text(body, font, 1.5, z, outline=0.016)
        o.data.materials.append(glow)
        show(o, at)
        for f, dz in ((at, -1.2), (at + 10, 0.04), (at + 14, 0.0)):
            o.location.z = z + dz
            key(o, "location", f, index=2)
    flare(strength, at + 10, PULSE * 0.6)


def emissive(name, colour, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nodes, links = m.node_tree.nodes, m.node_tree.links
    nodes.clear()
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = linear(colour)
    emit.inputs["Strength"].default_value = strength
    out = nodes.new("ShaderNodeOutputMaterial")
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return m, emit.inputs["Strength"]


def lit_text(body, font, size, z, colour, strength, at):
    """Flat emissive text that brightens in over half a second."""
    o = text(body, font, size, z)
    m, s = emissive(f"text-{body}", colour, strength)
    o.data.materials.append(m)
    show(o, at)
    for f, v in ((at, 0.0), (at + 15, strength)):
        s.default_value = v
        s.keyframe_insert("default_value", frame=f + 1)


def visible(o, spans):
    """Rendered only during the given [start, end) frame spans; end None means to the last frame."""
    o.hide_render = True
    key(o, "hide_render", 0)
    for start, end in spans:
        o.hide_render = False
        key(o, "hide_render", start)
        if end is not None:
            o.hide_render = True
            key(o, "hide_render", end)


def typed_text(body, font, size, z, colour, strength, at, beat, frames, width=7.4):
    """Typed one character a frame from the left of where the finished line sits centred, with
    a block cursor that follows and then blinks on the half-beat. Returns the last typed frame."""
    m, _ = emissive(f"typed-{body}", colour, strength)
    probe = text(body, font, size, z)
    bpy.context.view_layer.update()
    if probe.dimensions.x > width:  # keep it inside the frame
        size *= width / probe.dimensions.x
        probe.data.size = size
        bpy.context.view_layer.update()
    full = probe.dimensions.x
    bpy.data.objects.remove(probe)
    left = -full / 2

    def measure(s):
        o = text(s, font, size, z)
        bpy.context.view_layer.update()
        w = o.dimensions.x
        bpy.data.objects.remove(o)
        return w

    # Where the cursor stands after each prefix. The font need not be monospace; a trailing
    # space has no extent of its own, so each prefix is measured with an "x" after it.
    x = measure("x")
    ends = [0.0] + [measure(body[:k] + "x") - x for k in range(1, len(body) + 1)]
    cw = 0.5 * size
    done = at + len(body) - 1
    for k in range(1, len(body) + 1):
        o = text(body[:k], font, size, z)
        o.data.align_x = "LEFT"
        o.location.x = left
        o.data.materials.append(m)
        visible(o, [(at + k - 1, None if k == len(body) else at + k)])
    half = round(beat / 2)
    for k in range(len(body) + 1):
        gap = 0.08 * size if k else 0.0
        bpy.ops.mesh.primitive_plane_add(size=1, location=(left + ends[k] + gap + cw / 2, -0.01, z))
        cursor = bpy.context.object
        cursor.rotation_euler = (math.radians(90), 0, 0)
        cursor.scale = (cw * 0.8, size * 0.8, 1)
        cursor.data.materials.append(m)
        if k < len(body):  # sits after the k characters typed so far
            visible(cursor, [(at + k - 1, at + k)] if k else [(at - half, at)])
        else:
            visible(cursor, [(f, f + half) for f in range(done, frames, 2 * half)])
    return done


def blade_runner(scene, frames):
    """Haze in the air, a searchlight sweeping through it behind the lines, amber from behind."""
    world = bpy.data.worlds.new("haze")
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    nodes["Background"].inputs["Strength"].default_value = 0
    fog = nodes.new("ShaderNodeVolumePrincipled")
    fog.inputs["Density"].default_value = 0.018
    fog.inputs["Anisotropy"].default_value = 0.6  # light scatters forward, toward the camera
    links.new(fog.outputs["Volume"], nodes["World Output"].inputs["Volume"])
    scene.world = world
    scene.eevee.volumetric_start, scene.eevee.volumetric_end = 1, 40
    scene.eevee.volumetric_tile_size = "4"
    scene.eevee.volumetric_samples = 96
    scene.eevee.use_volumetric_shadows = True

    key_light = bpy.data.lights.new("key", "AREA")
    key_light.energy, key_light.size, key_light.color = 80, 8, (0.85, 1.0, 0.9)
    k = bpy.data.objects.new("key", key_light)
    k.location = (0, 0, 8)
    scene.collection.objects.link(k)

    # The searchlight: high behind the hexagram, pointing down past it toward the camera,
    # swinging slowly across. Its beam only shows where it cuts through the haze.
    beam = bpy.data.lights.new("searchlight", "SPOT")
    beam.energy = 20000
    beam.spot_size = math.radians(9)
    beam.spot_blend = 0.3
    beam.color = (0.8, 0.95, 1.0)
    beam.volume_factor = 5.0
    s = bpy.data.objects.new("searchlight", beam)
    scene.collection.objects.link(s)
    s.location = (0, 14, 12)
    for f, yaw in ((0, -28), (frames - 1, 22)):
        s.rotation_euler = (math.radians(-125), 0, math.radians(yaw))
        key(s, "rotation_euler", f)

    amber = bpy.data.lights.new("amber", "AREA")
    amber.energy, amber.size, amber.color = 400, 6, linear(AMBER)[:3]
    a = bpy.data.objects.new("amber", amber)
    a.location = (-5, 6, -3)
    a.rotation_euler = (math.radians(-100), 0, math.radians(-40))
    scene.collection.objects.link(a)


def camera(scene, frames, beat, mode, pull):
    """Starts where the build clip ends, square-on; pulls back to frame the whole icon."""
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    data = bpy.data.cameras.new("camera")
    data.lens = 35
    data.dof.use_dof = True
    data.dof.focus_object = target
    data.dof.aperture_fstop = 0.2
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
    stops = [(0, 13.0, -0.9), (pull, 13.0, -0.9), (pull + round(1.5 * beat), 18.5, -0.4), (frames - 1, 19.0, -0.4)]
    if mode == "snap":
        # A push on the downbeat, as the lines shut.
        stops[1:1] = [(round(beat), 13.0, -0.9), (round(beat) + 3, 12.2, -0.9), (round(beat) + 12, 13.0, -0.9)]
    for f, dist, tz in stops:
        cam.location = (0, -dist, tz)
        key(cam, "location", f)
        target.location = (0, 0, tz)
        key(target, "location", f)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = frame_count(args.beats, args.bpm)
    beat = 60 * FPS / args.bpm
    black, colour = obsidian(), linear(args.edge)
    solid = change(args.lines, args.mode, beat, black, colour)
    rise = solid + round(0.5 * beat)
    wordmark(args.serif, colour, rise)
    if args.tagline_font:
        typed = typed_text(args.tagline, args.tagline_font, 0.66, -3.55, CREAM, 3.0, rise + round(beat), beat, frames)
        lit_text("sixlines.day", args.pixel, 0.8, -4.6, args.edge, 5.0, typed + round(0.5 * beat))
    else:
        lit_text(args.tagline, args.serif, 0.72, -3.55, CREAM, 3.0, rise + round(beat))
        lit_text("sixlines.day", args.pixel, 0.8, -4.55, args.edge, 5.0, rise + round(1.5 * beat))
    rain_plane(args.rain)
    # Dimmer than in the build, so the haze and the searchlight carry the frame.
    bpy.data.materials["rain"].node_tree.nodes["Emission"].inputs["Strength"].default_value = 0.18
    camera(scene, frames, beat, args.mode, rise)
    blade_runner(scene, frames)
    bloom(scene)
    render_settings(scene, frames, args.out, args.preview)
    bpy.ops.render.render(animation=True)


main()
