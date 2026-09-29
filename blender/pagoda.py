"""Leifeng Pagoda (雷峰塔) in neon lines: octagonal, five storeys, a brick body with wooden eaves
(docs/research/2026-09-29-leifeng-stupa.md, section 4), its look after an old ink painting of it
by the lake that the user sent: a platform; the body's eight corners rising and narrowing a
little; at each storey an eave standing out from the wall, its corners turned up; an octagonal
roof and a spire of rings on top.

`lines(R, storey)` gives the outline as named polylines in trace order, each with its storey
(0 the platform, 1 to 5, 6 the roof and spire); `build` makes them tubes of light traced in
storey by storey, and can take them away again from the top down, as the pagoda fell.
"""

import math

import bpy

from character import NEON, draw

STOREYS = 5


def ring(r, z, lift=0.0, n=8, turn=math.pi / 8):
    """An octagon at height z, corners lifted by `lift` (an eave's up-turned corners), as an open
    polyline ending where it starts; with lift, each side sags between its corners."""
    pts = []
    for i in range(n):
        a0, a1 = turn + 2 * math.pi * i / n, turn + 2 * math.pi * (i + 1) / n
        for k in range(4 if lift else 1):
            t = k / 4
            x = r * ((1 - t) * math.cos(a0) + t * math.cos(a1))
            y = r * ((1 - t) * math.sin(a0) + t * math.sin(a1))
            pts.append((x, y, z + lift * (1 - math.sin(math.pi * t))))
    return pts + pts[:1]


def corner(r, z, n=8, turn=math.pi / 8):
    return [(r * math.cos(turn + 2 * math.pi * i / n), r * math.sin(turn + 2 * math.pi * i / n), z) for i in range(n)]


def lines(R, storey):
    """The pagoda: platform radius 1.3 R; the wall's radius narrowing from R to 0.78 R; eaves
    standing 0.35 R out; each storey `storey` metres high; roof and spire on top."""
    out = []
    out.append(("platform0", 0, ring(1.3 * R, 0)))
    out.append(("platform1", 0, ring(1.3 * R, 0.08 * storey)))
    z0 = 0.08 * storey
    wall = lambda k: R * (1 - 0.055 * k)  # noqa: E731
    for k in range(STOREYS):
        za, zb = z0 + k * storey, z0 + (k + 1) * storey
        ra, rb = wall(k), wall(k + 1)
        for i, (a, b) in enumerate(zip(corner(ra, za), corner(rb, zb - 0.25 * storey))):
            out.append((f"s{k}-corner{i}", k + 1, [a, b]))
        # The eave: from the wall out to the up-turned edge, and back in at the wall above it.
        ze = zb - 0.25 * storey
        out.append((f"s{k}-wall", k + 1, ring(rb, ze)))
        out.append((f"s{k}-eave", k + 1, ring(rb + 0.35 * R, ze - 0.06 * storey, lift=0.12 * storey)))
        out.append((f"s{k}-above", k + 1, ring(rb * 0.97, zb)))
        # A doorway on alternate faces.
        for i in range(0, 8, 2):
            a = 2 * math.pi * i / 8
            w, h = 0.16 * R, 0.4 * storey
            cx, cy = rb * math.cos(math.pi / 8) * 1.01 * math.cos(a), rb * math.cos(math.pi / 8) * 1.01 * math.sin(a)
            dx, dy = -math.sin(a) * w, math.cos(a) * w
            zd = za + 0.12 * storey
            door = [(cx - dx, cy - dy, zd), (cx - dx, cy - dy, zd + h), (cx + dx, cy + dy, zd + h), (cx + dx, cy + dy, zd)]
            out.append((f"s{k}-door{i}", k + 1, door))
    top = z0 + STOREYS * storey
    rt = wall(STOREYS)
    eave = rt + 0.4 * R
    for i, c in enumerate(corner(eave, top + 0.1 * storey)):
        out.append((f"roof{i}", STOREYS + 1, [c, (0, 0, top + 0.9 * storey)]))
    out.append(("roofedge", STOREYS + 1, ring(eave, top, lift=0.15 * storey)))
    out.append(("spire", STOREYS + 1, [(0, 0, top + 0.9 * storey), (0, 0, top + 2.0 * storey)]))
    for i in range(6):
        r = 0.09 * R * (1 - 0.06 * i)
        out.append((f"spirering{i}", STOREYS + 1, [(r * math.cos(2 * math.pi * j / 16), r * math.sin(2 * math.pi * j / 16), top + (1.05 + 0.13 * i) * storey) for j in range(17)]))
    return out


def build(R, storey, material, rise, fall=None, radius=NEON, keep=("platform",)):
    """The pagoda traced in storey by storey over `rise` (start, end frames); if `fall` is given,
    taken away again over it from the top down, all but the `keep` parts. Returns the objects."""
    objs = []
    a, b = rise
    per = (b - a) / (STOREYS + 2)
    for name, k, pts in lines(R, storey):
        c = bpy.data.curves.new(f"leifeng-{name}", "CURVE")
        c.dimensions = "3D"
        c.bevel_depth, c.bevel_resolution, c.use_fill_caps = radius, 1, True
        s = c.splines.new("POLY")
        s.points.add(len(pts) - 1)
        for p, co in zip(s.points, pts):
            p.co = (*co, 1)
        c.materials.append(material)
        o = bpy.data.objects.new(f"leifeng-{name}", c)
        bpy.context.scene.collection.objects.link(o)
        objs.append(o)
        draw(c, round(a + k * per), max(1, round(per * 1.4)))
        if fall and not name.startswith(keep):
            f0, f1 = fall
            at = round(f0 + (f1 - f0) * (STOREYS + 1 - k) / (STOREYS + 2))
            for f, v in ((at, 1.0), (at + round((f1 - f0) / 3), 0.0)):
                c.bevel_factor_end = v
                c.keyframe_insert("bevel_factor_end", frame=f + 1)
    return objs


def case(r, tall, material, span, radius=NEON):
    """The iron case round the vault's stupa: two rings and four uprights, traced in over span."""
    parts = [ring(r, 0, n=24, turn=0), ring(r, tall, n=24, turn=0)]
    parts += [[(r * math.cos(a), r * math.sin(a), 0), (r * math.cos(a), r * math.sin(a), tall)] for a in (0.4, 2.0, 3.5, 5.1)]
    objs = []
    for i, pts in enumerate(parts):
        c = bpy.data.curves.new(f"case{i}", "CURVE")
        c.dimensions = "3D"
        c.bevel_depth, c.bevel_resolution, c.use_fill_caps = radius, 1, True
        s = c.splines.new("POLY")
        s.points.add(len(pts) - 1)
        for p, co in zip(s.points, pts):
            p.co = (*co, 1)
        c.materials.append(material)
        o = bpy.data.objects.new(f"case{i}", c)
        bpy.context.scene.collection.objects.link(o)
        objs.append(o)
        draw(c, span[0], max(1, span[1] - span[0]))
    return objs

