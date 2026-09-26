"""Hexagrams whose own lines act a short picture, in the hexagram build's look: one function
per act, each a few line moves, since most need no more (21's bite, 29's water and 62's
bird have scripts of their own). Every act starts and, unless its story changes the
hexagram, ends on the hexagram the build just showed; the camera starts where the build
ends. No words or signs; the sentence typed under it says what it means.

The user, 2026-09-26: where the lines lend themselves to a picture, act it out as 21's
bite (blender/bite.py) does; samples of 21, 29 and 62 passed.

Timed for a lesson of --beats beats: the act is done by the last 4, which hold.

  Blender -b --factory-startup --python-exit-code 1 -P blender/acts.py -- --act return \\
    --lines 100000 --rain public/assets/3d/rain.mp4 --bpm 90 --beats 12 \\
    --out out/return.mp4 [--still N] [--preview]
"""

import argparse
import math
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from abyss import shown  # noqa: E402
from bite import AMBER, ease, glow, recolour  # noqa: E402
from hexagram import PULSE, REST, add_slab, bloom, key, lights_and_world, linear, obsidian, rain_plane, render_settings  # noqa: E402
from layout import FPS, LINE_GAP, LINE_H, LINE_W, YIN_GAP, frame_count, line_z  # noqa: E402

HALF = (LINE_W - YIN_GAP) / 2  # a yin half's width
AT = (YIN_GAP + HALF) / 2  # a yin half's centre, either side


class Stage:
    """The hexagram's slabs, with helpers for the moves the acts share."""

    def __init__(self, lines, at, edge):
        self.at = at
        self.black, self.green, self.amber = obsidian(), linear(edge), linear(AMBER)
        self.lines = lines
        self.slabs = {}  # line -> [(object, strength)]: one for yang, two (left, right) for yin
        for i, ch in enumerate(lines):
            z = line_z(i)
            if ch == "1":
                self.slabs[i] = [add_slab(i, 0.0, z, LINE_W, self.black, self.green)]
            else:
                self.slabs[i] = [add_slab(i, sx * AT, z, HALF, self.black, self.green) for sx in (-1, 1)]

    def halves(self, i):
        """Two halves of yang line i, hidden, each half the line and touching: shown in
        place of the whole line when it splits (as the caught line in bite.py)."""
        out = []
        for sx in (-1, 1):
            o, s = add_slab(i, sx * LINE_W / 4, line_z(i), LINE_W / 2, self.black, self.green)
            shown(o, ((0, False),))
            out.append((o, s))
        return out

    def swap(self, before, after, frame):
        """Hides the slabs in `before` and shows those in `after` from `frame`. Keys only
        the frame before and `frame`, so a later swap back keeps this one."""
        for o, _ in before:
            shown(o, ((frame - 1, True), (frame, False)))
        for o, _ in after:
            shown(o, ((frame - 1, False), (frame, True)))

    def flash(self, strength, frame):
        """Amber at `frame`, cooling back to green, as bite.py's break."""
        at = self.at
        glow(strength, ((frame - 1, REST), (frame, PULSE), (frame + at(1.5), REST)))
        recolour(strength.node, ((frame - 1, self.green), (frame, self.amber), (frame + at(0.6), self.amber), (frame + at(2), self.green)))


def act_return(st, end):
    """24 Return (100000): the light at the bottom goes out and comes back. The yang line
    splits and its halves slide apart and dim, leaving six yin lines; then they slide back
    together, and the line is whole again in an amber flash."""
    at = st.at
    [whole] = st.slabs[0]
    parts = st.halves(0)
    st.swap([whole], parts, at(1.5))
    back = end - 2.0
    for (o, s), sx in zip(parts, (-1, 1)):
        ease(o, 0, ((at(1.5), sx * LINE_W / 4), (at(2.6), sx * (AT + 0.35)), (at(back), sx * (AT + 0.35)), (at(back + 1.2), sx * LINE_W / 4)))
        ease(o, 0, ((at(1.5), 1.0), (at(2.6), HALF / (LINE_W / 2)), (at(back), HALF / (LINE_W / 2)), (at(back + 1.2), 1.0)), path="scale")
        glow(s, ((at(1.5), REST), (at(2.6), REST * 0.15), (at(back), REST * 0.15), (at(back + 1.2), REST)))
    st.swap(parts, [whole], at(back + 1.2))
    st.flash(whole[1], at(back + 1.2))


def act_meet(st, end):
    """44 Coming to Meet (011111): one yin at the bottom, under five yang. It presses up and
    a crack opens in the yang line above it; the crack is stopped early and closes, the
    first line's "tie it to a metal brake"."""
    at = st.at
    [whole] = st.slabs[1]
    parts = st.halves(1)
    st.swap([whole], parts, at(1.5))
    shut = end - 2.2
    for (o, s), sx in zip(parts, (-1, 1)):
        ease(o, 0, ((at(1.5), sx * LINE_W / 4), (at(3.2), sx * (LINE_W / 4 + 0.18)), (at(shut), sx * (LINE_W / 4 + 0.18)), (at(shut + 0.8), sx * LINE_W / 4)))
    for (o, s), sx in zip(st.slabs[0], (-1, 1)):
        ease(o, 2, ((at(1.5), line_z(0)), (at(3.2), line_z(0) + 0.14), (at(shut), line_z(0) + 0.14), (at(shut + 0.8), line_z(0))))
        glow(s, ((at(1.5), REST), (at(3.2), REST * 2), (at(shut), REST * 2), (at(shut + 0.8), REST)))
    st.swap(parts, [whole], at(shut + 0.8))
    st.flash(whole[1], at(shut + 0.8))


def act_truth(st, end):
    """61 Inner Truth (110011): the two yin lines in the middle are the empty heart. Their
    halves slide apart and the emptiness at the centre opens, then closes."""
    at = st.at
    close = end - 1.6
    for i in (2, 3):
        for (o, s), sx in zip(st.slabs[i], (-1, 1)):
            ease(o, 0, ((at(1.5), sx * AT), (at(3.5), sx * (AT + 0.8)), (at(close), sx * (AT + 0.8)), (at(close + 1.4), sx * AT)))


def act_breakthrough(st, end):
    """43 Breakthrough (111110): five yang under one yin. A glow climbs the five yang, bottom
    to top, one line a beat; when it reaches the top, the yin line's halves slide apart and
    fade, and the five hold with the top place empty."""
    at = st.at
    for i in range(5):
        [(o, s)] = st.slabs[i]
        b = 1.0 + i * 0.8
        glow(s, ((at(b), REST), (at(b + 0.4), PULSE * 0.4), (at(b + 1.6), REST)))
    for (o, s), sx in zip(st.slabs[5], (-1, 1)):
        ease(o, 0, ((at(5.0), sx * AT), (at(end - 0.5), sx * (AT + 1.6))))
        glow(s, ((at(5.0), REST), (at(end - 0.5), 0.0)))
        shown(o, ((at(end - 0.4) - 1, True), (at(end - 0.4), False)))


def act_army(st, end):
    """7 The Army (010000): one yang, the general, in the second place among five yin. The
    general steps forward, and the yin lines fall in behind it one by one, nearest first."""
    at = st.at
    step = -1.3  # toward the camera
    order = sorted(range(6), key=lambda i: abs(i - 1))
    for n, i in enumerate(order):
        b = 1.0 + n * 0.7
        for o, s in st.slabs[i]:
            ease(o, 1, ((at(b), 0.0), (at(b + 1.2), step)))
            glow(s, ((at(b), REST), (at(b + 0.3), PULSE * 0.25), (at(b + 1.4), REST)))


def act_peace(st, end):
    """11 Peace (111000): heaven below rises, earth above sinks; they meet, and the gap
    between the trigrams closes."""
    at = st.at
    shift = (line_z(3) - line_z(2) - LINE_H - LINE_GAP) / 2
    for i in range(6):
        dz = shift if i < 3 else -shift
        for o, s in st.slabs[i]:
            ease(o, 2, ((at(1.5), line_z(i)), (at(end - 1.5), line_z(i) + dz)))
            glow(s, ((at(end - 1.6), REST), (at(end - 1.5), PULSE * 0.4), (at(end), REST)))


def act_standstill(st, end):
    """12 Standstill (000111): heaven above rises, earth below sinks; they drift apart and
    dim."""
    at = st.at
    for i in range(6):
        dz = 0.6 if i >= 3 else -0.6
        for o, s in st.slabs[i]:
            ease(o, 2, ((at(1.5), line_z(i)), (at(end - 0.5), line_z(i) + dz)))
            glow(s, ((at(1.5), REST), (at(end - 0.5), REST * 0.4)))


def act_modesty(st, end):
    """15 Modesty (001000): the one yang, the mountain, has the most to show and steps back
    behind the yin lines, dimmer."""
    at = st.at
    [(o, s)] = st.slabs[2]
    ease(o, 1, ((at(1.5), 0.0), (at(end - 1.0), 1.8)))
    glow(s, ((at(1.5), REST), (at(end - 1.0), REST * 0.5)))


def act_nourish(st, end):
    """27 Nourishment (100001): the open mouth, yang jaws above and below. It closes
    slowly, the yin lines between drawing together, and opens again."""
    at = st.at
    mid = (line_z(0) + line_z(5)) / 2
    shut, back = end - 3.5, end - 0.5
    for i in range(6):
        z = line_z(i)
        closed = mid + (z - mid) * 0.72
        for o, s in st.slabs[i]:
            ease(o, 2, ((at(1.5), z), (at(shut), closed), (at(shut + 1.0), closed), (at(back), z)))


def act_ridgepole(st, end):
    """28 Greatness in Excess (011110): four yang, heavy, between two weak yin ends. The
    four settle lower, and the yin ends bow under them, their outer ends dropping."""
    at = st.at
    for i in range(1, 5):
        [(o, s)] = st.slabs[i]
        ease(o, 2, ((at(1.5), line_z(i)), (at(end - 1.0), line_z(i) - 0.15)))
    for i in (0, 5):
        for (o, s), sx in zip(st.slabs[i], (-1, 1)):
            ease(o, 1, ((at(1.5), 0.0), (at(end - 1.0), sx * math.radians(7))), path="rotation_euler")
            ease(o, 2, ((at(1.5), line_z(i)), (at(end - 1.0), line_z(i) - 0.15)))


def act_fire(st, end):
    """30 Clinging Fire (101101): each trigram is a flame, bright outside and hollow in the
    middle. The hollow centre of each, its yin line, warms to amber."""
    at = st.at
    for i in (1, 4):
        for o, s in st.slabs[i]:
            recolour(s.node, ((at(1.5), st.green), (at(end - 1.0), st.amber)))
            glow(s, ((at(1.5), REST), (at(end - 1.0), REST * 1.6)))


def act_thunder(st, end):
    """51 The Arousing (100100): thunder doubled. The yang at the bottom of each trigram
    jolts up and settles, the lower first, then the upper, then both once more, lighter."""
    at = st.at
    jolts = ((0, 1.5, 0.2), (3, 3.0, 0.2), (0, 5.0, 0.1), (3, 5.0, 0.1))
    for i in (0, 3):
        [(o, s)] = st.slabs[i]
        points, lights = [], []
        for j, b, h in jolts:
            if j == i:
                points += [(at(b) - 1, line_z(i)), (at(b) + 2, line_z(i) + h), (at(b + 0.8), line_z(i))]
                lights += [(at(b) - 1, REST), (at(b), PULSE * h * 2), (at(b + 1.0), REST)]
        ease(o, 2, points)
        glow(s, lights)


ACTS = {
    "army": act_army, "peace": act_peace, "standstill": act_standstill, "modesty": act_modesty,
    "return": act_return, "nourish": act_nourish, "ridgepole": act_ridgepole, "fire": act_fire,
    "breakthrough": act_breakthrough, "meet": act_meet, "thunder": act_thunder, "truth": act_truth,
}


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--act", required=True, choices=sorted(ACTS))
    p.add_argument("--lines", required=True, help="six lines, bottom first, 1 = yang")
    p.add_argument("--rain", required=True)
    p.add_argument("--pixel", help="unused; scripts/lesson3d.mjs passes it to every scene")
    p.add_argument("--edge", default="#6cff7a")
    p.add_argument("--bpm", type=float, required=True)
    p.add_argument("--beats", type=float, required=True)
    p.add_argument("--out", required=True)
    p.add_argument("--still", type=int)
    p.add_argument("--preview", action="store_true")
    return p.parse_args(argv)


def camera(scene, frames, beat):
    """From where the build ends (square on, 13 away), round 12° so the lines have depth,
    then a slow push in through the hold."""
    target = bpy.data.objects.new("target", None)
    scene.collection.objects.link(target)
    data = bpy.data.cameras.new("camera")
    data.lens = 35
    data.dof.use_dof = True
    data.dof.focus_object = target
    data.dof.aperture_fstop = 0.1
    cam = bpy.data.objects.new("camera", data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    track = cam.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = target, "TRACK_NEGATIVE_Z", "UP_Y"
    for f, deg, dist in ((0, 0, 13.0), (round(3 * beat), 12, 13.4), (frames - 1, 12, 12.4)):
        a = math.radians(deg)
        cam.location = (dist * math.sin(a), -dist * math.cos(a), -0.9)
        key(cam, "location", f)
        target.location = (1.4 * math.sin(a), 0, -0.9)
        key(target, "location", f)


def main():
    args = parse()
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    frames = frame_count(args.beats, args.bpm)
    beat = 60 * FPS / args.bpm
    stage = Stage(args.lines, lambda b: round(b * beat), args.edge)
    ACTS[args.act](stage, args.beats - 4)

    rain_plane(args.rain)
    camera(scene, frames, beat)
    lights_and_world(scene)
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
