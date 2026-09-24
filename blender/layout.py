"""Slab layout and timing for the 3D hexagram, without bpy so it can be unit-tested.

One Blender unit is 100px of the 2D Hexagram in src/scenes/Montage.tsx, whose spacing
follows the site's OG image.
"""

import math

FPS = 30
LINE_W = 6.2  # 620px
LINE_H = 0.5  # LINE = 50px
LINE_GAP = 0.3  # LINE * 0.6, between lines of a trigram
TRIGRAM_GAP = 0.9  # LINE * 1.8, between the trigrams
YIN_GAP = 0.7  # 70px, the break in a yin line


def frame_count(beats, bpm):
    """Frames to render; the same formula as clipFrames in src/lib/clips.ts."""
    return math.ceil(beats * 60 * FPS / bpm) + 1


def land_frame(line, bpm):
    """Clip frame (from 0) on which a line lands. Line 0 is the bottom; one every half-beat."""
    return round(line * 0.5 * 60 * FPS / bpm)


def line_z(line):
    """Centre height of a line, with the whole hexagram centred on z = 0."""
    total = 6 * LINE_H + 4 * LINE_GAP + TRIGRAM_GAP
    z = -total / 2 + LINE_H / 2 + line * (LINE_H + LINE_GAP)
    return z + (TRIGRAM_GAP - LINE_GAP if line >= 3 else 0)


def slabs(lines):
    """(line, x_centre, z_centre, width) per slab. `lines` is bottom first, "1" = yang."""
    out = []
    for i, ch in enumerate(lines):
        z = line_z(i)
        if ch == "1":
            out.append((i, 0.0, z, LINE_W))
        else:
            w = (LINE_W - YIN_GAP) / 2
            offset = (YIN_GAP + w) / 2
            out += [(i, -offset, z, w), (i, offset, z, w)]
    return out
