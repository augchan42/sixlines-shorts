"""Ashoka-type stupas (阿育王塔, Ashoka stupa) in neon lines, in two forms
(docs/research/2026-09-29-leifeng-stupa.md; proportions read off photographs the user sent, in
body widths W):

  bronze  the form of Qian Chu's 84,000 small stupas, after a bronze one: a base block with a
          panel on each face, two steps, a square body with a round medallion on each face, an
          overhanging roof, a stepped pyramid of five tiers, four small flame-shaped horns at
          the roof's corners, a dome, a lotus collar, eleven rings and a bud. About 3.7 W tall.
  silver  after the gilt silver stupa found in Leifeng Pagoda's vault in 2001: a plinth; a
          square body with a relief panel on each face under a cornice; four tall corner horns
          (山花蕉葉, "banana leaves") flaring outward at the top; a mast with five rings (相輪)
          and a leaf-shaped finial. About 2.3 W tall.

`FORMS[form](W)` gives the outline as named polylines in trace order, each with the fraction of
the build at which it starts; `build` makes them tubes of light (traced in, or finished), under
one empty so a copy can be moved and scaled as one.
"""

import math

import bpy
from mathutils import Vector

from character import NEON, draw
from hexagram import key


def square(half, z):
    """A closed square ring at height z, as an open polyline ending where it starts."""
    pts = [(-half, -half), (half, -half), (half, half), (-half, half)]
    return [(x, y, z) for x, y in pts + pts[:1]]


def circle(r, z, n=24, at=(0, 0)):
    return [(at[0] + r * math.cos(2 * math.pi * i / n), at[1] + r * math.sin(2 * math.pi * i / n), z) for i in range(n + 1)]


def box(half, z0, z1):
    """A box's edges: bottom ring, the four uprights, top ring."""
    ups = [[(sx * half, sy * half, z0), (sx * half, sy * half, z1)] for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
    return [square(half, z0)] + ups + [square(half, z1)]


def panel(W, z0, z1, inset):
    """The relief panel's frame on each face of the body."""
    h, a, out = W / 2 - inset, W / 2 + 0.004 * W, []
    for face in range(4):
        c, s = math.cos(face * math.pi / 2), math.sin(face * math.pi / 2)
        # On the face x = a (turned by `face` quarter turns): a rectangle from -h to h along y.
        rect = [(a, -h, z0 + inset), (a, h, z0 + inset), (a, h, z1 - inset), (a, -h, z1 - inset), (a, -h, z0 + inset)]
        out.append([(x * c - y * s, x * s + y * c, z) for x, y, z in rect])
    return out


def horn(W, sx, sy, z0):
    """One corner horn: two faces meeting at the corner, their tops curling outward, as one loop,
    and the corner edge."""
    half, along, tall, flare = W / 2, 0.3 * W, 1.0 * W, 0.12 * W
    corner = Vector((sx * half, sy * half, z0))
    out = Vector((sx, sy, 0)).normalized()
    ix = Vector((sx * (half - along), sy * half, z0))  # the inner base along the x face
    iy = Vector((sx * half, sy * (half - along), z0))
    top = corner + out * flare + Vector((0, 0, tall))

    def arc(a, b, lift, n=6):
        return [a.lerp(b, i / n) + Vector((0, 0, lift * math.sin(math.pi * i / n))) for i in range(1, n + 1)]

    bx = ix + Vector((0, sy * 0.06 * W, 0.8 * tall))
    by = iy + Vector((sx * 0.06 * W, 0, 0.8 * tall))
    loop = [ix, bx] + arc(bx, top, 0.08 * W) + arc(top, by, 0.08 * W) + [iy, corner, ix]
    return [[tuple(p) for p in loop], [tuple(corner), tuple(corner + out * flare * 0.5 + Vector((0, 0, tall * 0.9)))]]


def leaf(z0, tall, wide, turn, n=10):
    """The finial: a pointed leaf standing on the mast, in the plane turned by `turn`."""
    side = []
    for i in range(n + 1):
        t = i / n
        side.append((wide / 2 * math.sin(math.pi * t ** 0.8) * (1 - t) ** 0.3, z0 + tall * t))
    pts = [(-w, z) for w, z in reversed(side)] + [(w, z) for w, z in side[1:]]
    c, s = math.cos(turn), math.sin(turn)
    return [(x * c, x * s, z) for x, z in pts]


def face_circle(r, zc, a, face, n=24):
    """A circle on the body's face x = a (turned by `face` quarter turns), centred at height zc."""
    c, s = math.cos(face * math.pi / 2), math.sin(face * math.pi / 2)
    pts = [(a, r * math.cos(2 * math.pi * i / n), zc + r * math.sin(2 * math.pi * i / n)) for i in range(n + 1)]
    return [(x * c - y * s, x * s + y * c, z) for x, y, z in pts]


def arch(r, z0, tall, turn, n=12):
    """A dome's profile: half an ellipse standing on the ring of radius r at z0."""
    c, s = math.cos(turn), math.sin(turn)
    pts = [(r * math.cos(math.pi * i / n), z0 + tall * math.sin(math.pi * i / n)) for i in range(n + 1)]
    return [(x * c, x * s, z) for x, z in pts]


def bronze(W, simple=False):
    """Qian Chu's stupa: the outline, bottom to top. `simple` leaves out the panels, medallions
    and tiers' uprights, and has five rings, for copies seen from afar."""
    out = []

    def add(name, frac, polylines):
        for i, p in enumerate(polylines):
            out.append((f"{name}{i}", frac, p))

    add("base", 0.0, box(0.815 * W, 0, 0.58 * W))
    if not simple:
        add("basepanel", 0.08, panel(1.63 * W, 0, 0.58 * W, 0.12 * W))
    add("step", 0.12, box(0.675 * W, 0.58 * W, 0.72 * W) + box(0.58 * W, 0.72 * W, 0.84 * W))
    add("body", 0.2, box(W / 2, 0.84 * W, 1.63 * W))
    if not simple:
        add("medallion", 0.3, [face_circle(0.3 * W, 1.235 * W, W / 2 + 0.004 * W, f) for f in range(4)])
    add("roof", 0.36, box(0.775 * W, 1.63 * W, 1.89 * W))
    z = 1.89 * W
    for k in range(5):
        tier = box((0.65 - 0.1 * k) * W, z, z + 0.07 * W)
        add(f"tier{k}-", 0.44 + 0.03 * k, [tier[-1]] if simple else tier)
        z += 0.07 * W
    for i, (sx, sy) in enumerate(((-1, -1), (1, -1), (1, 1), (-1, 1))):
        turn = math.atan2(sy, sx) + math.pi / 2
        pts = leaf(1.89 * W, 0.4 * W, 0.26 * W, turn)
        out.append((f"horn{i}", 0.5, [(x + sx * 0.68 * W, y + sy * 0.68 * W, zz) for x, y, zz in pts]))
    add("dome", 0.6, [circle(0.135 * W, z)] + [arch(0.135 * W, z, 0.29 * W, t) for t in (0, math.pi / 2)])
    add("lotus", 0.66, [circle(0.12 * W, z + 0.29 * W), circle(0.15 * W, z + 0.4 * W)])
    add("mast", 0.66, [[(0, 0, z + 0.29 * W), (0, 0, 3.4 * W)]])
    for k in range(0, 11, 2 if simple else 1):
        out.append((f"ring{k}", 0.68 + 0.012 * k, circle(0.11 * W, z + (0.45 + 0.062 * k) * W)))
    add("bud", 0.82, [leaf(3.39 * W, 0.29 * W, 0.2 * W, t) for t in (0, math.pi / 2)])
    return out


def silver(W):
    """The Leifeng stupa's outline: [(name, fraction of the build at which it starts, points)]."""
    plinth, body = 0.16 * W, 0.48 * W
    top = plinth + body
    out = []
    for i, p in enumerate(box(0.55 * W, 0, plinth)):
        out.append((f"plinth{i}", 0.0, p))
    for i, p in enumerate(box(W / 2, plinth, top)):
        out.append((f"body{i}", 0.12, p))
    for i, p in enumerate(panel(W, plinth, top, 0.08 * W)):
        out.append((f"panel{i}", 0.25, p))
    out.append(("cornice", 0.3, square(0.54 * W, top)))
    for i, (sx, sy) in enumerate(((-1, -1), (1, -1), (1, 1), (-1, 1))):
        for j, p in enumerate(horn(W, sx, sy, top)):
            out.append((f"horn{i}-{j}", 0.36 + 0.04 * i, p))
    rings = [(0.35, 0.2), (0.55, 0.19), (0.73, 0.18), (0.9, 0.17), (1.06, 0.16)]
    out.append(("mast", 0.52, [(0, 0, top), (0, 0, top + 1.14 * W)]))
    for i, (h, r) in enumerate(rings):
        for j, dz in enumerate((-0.03, 0.03)):
            out.append((f"ring{i}-{j}", 0.58 + 0.06 * i, circle(r * W, top + (h + dz) * W)))
    for i in range(2):
        out.append((f"finial{i}", 0.88, leaf(top + 1.12 * W, 0.5 * W, 0.2 * W, i * math.pi / 2)))
    return out


FORMS = {"bronze": bronze, "bronze-simple": lambda W: bronze(W, simple=True), "silver": silver}


def build(name, form, W, material, at=(0, 0, 0), span=None, collection=None, radius=NEON):
    """The stupa's tubes under one empty at `at`. Traced in over `span` (start, end frames), each
    line starting at its fraction of it and taking a fifth of it; finished if span is None.
    Returns the empty and the tube objects."""
    coll = collection or bpy.context.scene.collection
    root = bpy.data.objects.new(name, None)
    coll.objects.link(root)
    root.location = at
    objs = []
    for part, frac, pts in FORMS[form](W):
        c = bpy.data.curves.new(f"{name}-{part}", "CURVE")
        c.dimensions = "3D"
        c.bevel_depth, c.bevel_resolution, c.use_fill_caps = radius, 1, True
        s = c.splines.new("POLY")
        s.points.add(len(pts) - 1)
        for p, co in zip(s.points, pts):
            p.co = (*co, 1)
        c.materials.append(material)
        o = bpy.data.objects.new(f"{name}-{part}", c)
        coll.objects.link(o)
        o.parent = root
        objs.append(o)
        if span:
            a, b = span
            draw(c, round(a + (b - a) * frac * 0.8), max(1, round((b - a) * 0.2)))
    return root, objs


def keyed_scale(o, frames_values):
    for f, v in frames_values:
        o.scale = (v, v, v)
        key(o, "scale", f)
