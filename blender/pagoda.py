"""Leifeng Pagoda (雷峰塔) in neon lines: octagonal, five storeys, a brick body with wooden eaves
(docs/research/2026-09-29-leifeng-stupa.md, section 4), its look after an old ink painting of it
by the lake that the user sent: a platform; the body's eight corners rising and narrowing a
little; at each storey an eave standing out from the wall, its corners turned up; an octagonal
roof and a spire of rings on top.

`lines(R, storey)` gives the outline as named polylines in trace order, each with its storey
(0 the platform, 1 to 5, 6 the roof and spire); `build` makes them tubes of light traced in
storey by storey (or finished), the platform apart from the tower so the tower can fade and
leave it, as the pagoda fell and its foundation survived.
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


def curve(name, pts, material, radius):
    c = bpy.data.curves.new(name, "CURVE")
    c.dimensions = "3D"
    c.bevel_depth, c.bevel_resolution, c.use_fill_caps = radius, 1, True
    s = c.splines.new("POLY")
    s.points.add(len(pts) - 1)
    for p, co in zip(s.points, pts):
        p.co = (*co, 1)
    c.materials.append(material)
    o = bpy.data.objects.new(name, c)
    bpy.context.scene.collection.objects.link(o)
    return o


def build(R, storey, tower_mat, base_mat, rise=None, radius=NEON):
    """The pagoda, traced in storey by storey over `rise` (start, end frames), or finished if
    rise is None. The tower and its platform (what survived the fall) take their own materials,
    so the tower can fade and leave the platform. Returns (tower objects, platform objects)."""
    tower, base = [], []
    for name, k, pts in lines(R, storey):
        o = curve(f"leifeng-{name}", pts, base_mat if k == 0 else tower_mat, radius)
        (base if k == 0 else tower).append(o)
        if rise:
            a, b = rise
            per = (b - a) / (STOREYS + 2)
            draw(o.data, round(a + k * per), max(1, round(per * 1.4)))
    return tower, base


def case(r, tall, material, span, radius=NEON):
    """The iron case round the vault's stupa, after the photograph: a drum as deep as the
    stupa's plinth and body, three rings and eight staves, traced in over span."""
    parts = [ring(r, z, n=32, turn=0) for z in (0, tall / 2, tall)]
    parts += [[(r * math.cos(a), r * math.sin(a), 0), (r * math.cos(a), r * math.sin(a), tall)] for a in (math.pi / 4 * i + 0.2 for i in range(8))]
    objs = [curve(f"case{i}", pts, material, radius) for i, pts in enumerate(parts)]
    for o in objs:
        draw(o.data, span[0], max(1, span[1] - span[0]))
    return objs
