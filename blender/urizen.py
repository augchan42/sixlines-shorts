"""Urizen, the old man of Blake's The Ancient of Days (1794, public domain), as a faceted talking
head: a low-poly head built from a sphere in code (brow, sunken eyes, nose, cheekbones, a jaw that
opens), white hair and beard as triangle shards blown to the left as the wind blows them in the
painting, in front of Blake's sun disc and a sky of triangles (metal.py's faceted treatment).

The user, 2026-09-30, after the Metal Qian treatments: "maybe we need to come up with a style
that's best suited for Blender ... we'll stick to polygons and do something fun with those ...
like a talking head with lots of vectors and triangles", then "let's try your best shot at ...
Blake or Urizen's talking head". Notes: docs/notes/2026-09-30-metal-treatments.md.

  Blender -b --factory-startup --python-exit-code 1 -P blender/urizen.py -- \
    --out out/metal/urizen.png [--preview] [--backdrop neon|dusk]

The user on the first stills: "the Urizen head is spectacular", "the background can be neon and
mostly black with some polygon lines ... do it minimal. Don't try to force things. Do what
Blender's good at." So the default backdrop is neon: black, Blake's sun as a thin amber polygon
outline behind the head, a faint cyan wire geodesic sphere, neon rim light. The first backdrop
(the dusk sky of triangles, sun disc, rays, clouds) is kept as --backdrop dusk.

Talking: --props series/specials/urizen-qian6.props.json (scripts/guide-props.mjs) renders the
frames of a short to --out's folder as 0001.png ...: the jaw opens with the voice (props `jaw`,
the beard turning with it), the camera pushes in slowly, and the sun outline goes out when he
has said "Withdraw?" (marks e7). Frames stop at the close's flicker, which covers the rest.
  Blender -b --factory-startup --python-exit-code 1 -P blender/urizen.py -- \
    --out out/urizen/qian6/ --props series/specials/urizen-qian6.props.json [--preview] [--frames 1-300]
"""

import argparse
import json
import math
import os
import random
import sys

import bpy
from mathutils import Matrix, Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import metal  # noqa: E402
from hexagram import bloom  # noqa: E402

metal.TREAT = "faceted"
linear, toon, emission, put = metal.linear, metal.toon, metal.emission, metal.put

SKIN = [(0.0, "#3a1a24"), (0.3, "#9a5040"), (0.7, "#f2b48c")]
WHITE = [(0.0, "#3a3452"), (0.3, "#a8a4c4"), (0.7, "#fffaf0")]
# The jaw turns about this hinge (just in front of the ears, below the eyes).
HINGE = Vector((0.0, 0.2, -0.15))
MOUTH_Z = -0.43  # the mouth line on the unit sphere, before shaping
# Where the hair and beard converge: left of the head, a little below the eyes, behind the face,
# inside the frame so the point shows.
TAIL = Vector((-2.0, 0.5, -0.3))


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True)
    p.add_argument("--preview", action="store_true")
    p.add_argument("--backdrop", default="neon", choices=["neon", "dusk"])
    p.add_argument("--props")
    # ribbons: the user's pick, 2026-10-01 ("This is best so far"; of a scalp cap: "Cap is dumb").
    p.add_argument("--hair", default="ribbons", choices=["shards", "ribbons", "locks", "cards"])
    p.add_argument("--wind", action="store_true", help="the hair and beard move in a wind from the right")
    p.add_argument("--frames", help="first-last, 1-based, to render part of a short")
    return p.parse_args(argv)


def gauss(d, s):
    return math.exp(-((d / s) ** 2))


def clamp01(t):
    return max(0.0, min(1.0, t))


def shape(v):
    """A point on the unit sphere to a point on an old man's head; front is -y, up is +z."""
    x, y, z = v
    X, Y, Z = x * 0.8, y * 0.95, z * 1.12
    if z < 0:
        X *= 1 - 0.32 * min(1.0, -z)  # the jaw narrows to the chin
    front = max(0.0, -y)
    Y -= 0.14 * front * gauss(z - 0.3, 0.1) * gauss(x, 0.55)  # the brow ridge
    for sx in (-0.34, 0.34):
        Y += 0.16 * front * gauss(x - sx, 0.13) * gauss(z - 0.13, 0.1)  # sunken eyes
        Y -= 0.07 * front * gauss(x - sx * 1.45, 0.14) * gauss(z + 0.05, 0.12)  # cheekbones
        Y += 0.06 * front * gauss(x - sx * 1.3, 0.15) * gauss(z + 0.35, 0.15)  # hollow cheeks
    # The nose: a ridge from between the eyes to a tip above the mouth.
    n = clamp01((0.22 - z) / 0.47) if z > -0.25 else clamp01(1 - (-0.25 - z) / 0.07)
    Y -= 0.4 * front * n * gauss(x, 0.085 + 0.05 * n)
    Y -= 0.1 * front * gauss(z + 0.86, 0.14) * gauss(x, 0.3)  # the chin
    X *= 1 - 0.07 * gauss(z - 0.35, 0.2)  # temples
    return Vector((X, Y, Z))


def jaw_weight(u):
    """How much a point (on the unit sphere) moves with the jaw."""
    return clamp01((MOUTH_Z - u.z) / 0.12) * clamp01((0.45 - u.y) / 0.5)


def open_jaw(p, angle):
    return HINGE + Matrix.Rotation(angle, 3, "X") @ (p - HINGE)


def head(coll):
    """The head: an icosphere shaped, a slit cut for the mouth, cut down to triangles; a shape key
    'open' turns the jaw."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=1)
    o = bpy.context.object
    o.name = "head"
    me = o.data
    units = [v.co.normalized() for v in me.vertices]
    # The mouth slit: faces across the mouth line at the front.
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(me)
    slit = [f for f in bm.faces if abs(f.calc_center_median().x) < 0.24 and abs(f.calc_center_median().z - MOUTH_Z) < 0.035 and f.calc_center_median().y < -0.6]
    bmesh.ops.delete(bm, geom=slit, context="FACES")
    bm.to_mesh(me)
    bm.free()
    units = [v.co.normalized() for v in me.vertices]
    for v, u in zip(me.vertices, units):
        v.co = shape(u)
    # Low-poly: collapse to about a third of the triangles, then keep that mesh.
    dec = o.modifiers.new("low", "DECIMATE")
    dec.ratio = 0.3
    bpy.ops.object.modifier_apply(modifier="low")
    o.shape_key_add(name="basis")
    key = o.shape_key_add(name="open")
    # Weights from each vertex's place on the head (its direction from the centre, unshaped).
    for i, v in enumerate(me.vertices):
        u = v.co.normalized()
        w = jaw_weight(Vector((u.x, u.y, u.z)))
        key.data[i].co = open_jaw(v.co, 0.24 * w) if w > 0 else v.co.copy()
    put(o, coll, toon("skin", SKIN))
    # The mouth: dark, behind the slit.
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1, location=(0, -0.62, MOUTH_Z - 0.05))
    m = bpy.context.object
    m.scale = (0.24, 0.12, 0.14)
    put(m, coll, emission("mouth", "#1c0608", 1.0))
    return o, [v.co.copy() for v in me.vertices]


def shards(name, roots, coll, mats, wind, origin=Vector(), seed=0):
    """Triangle shards: each a three-sided spike in two segments, bending with the wind; each
    shard takes one of the materials at random, so locks read apart."""
    rnd = random.Random(seed)
    verts, faces, which = [], [], []
    for p, d, length, width in roots:
        n0 = len(faces)
        d = d.normalized()
        u = d.orthogonal().normalized()
        v = d.cross(u)
        k = len(verts)
        ring = lambda c, r: [c + (u * math.cos(a) + v * math.sin(a)) * r for a in (0, 2.1, 4.2)]  # noqa: E731
        mid = p + d * length * 0.5 + wind * length * 0.2
        tip = p + d * length + wind * length * 0.65
        verts += [q - origin for q in ring(p, width) + ring(mid, width * 0.6) + [tip]]
        for i in range(3):
            j = (i + 1) % 3
            faces += [(k + i, k + j, k + 3 + j), (k + i, k + 3 + j, k + 3 + i), (k + 3 + i, k + 3 + j, k + 6)]
        faces.append((k + 2, k + 1, k))
        which += [rnd.randrange(len(mats))] * (len(faces) - n0)
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(q) for q in verts], [], faces)
    for m in mats:
        mesh.materials.append(m)
    for poly, w in zip(mesh.polygons, which):
        poly.material_index = w
    o = bpy.data.objects.new(name, mesh)
    o.location = origin
    coll.objects.link(o)
    # How far each vertex moves in the wind: roots fixed, the middle ring a little, tips most.
    g = o.vertex_groups.new(name="tips")
    for k in range(0, len(verts), 7):
        g.add([k, k + 1, k + 2], 0.0, "REPLACE")
        g.add([k + 3, k + 4, k + 5], 0.35, "REPLACE")
        g.add([k + 6], 1.0, "REPLACE")
    return o


def hair_and_beard(coll, rnd):
    white = [toon("white", WHITE), toon("grey", [(0.0, "#2a2640"), (0.3, "#8a86a8"), (0.7, "#e8e4f0")]), toon("warm", [(0.0, "#40303a"), (0.3, "#b0a098"), (0.7, "#fff0dc")])]
    jit = lambda s: Vector((rnd.gauss(0, s), rnd.gauss(0, s), rnd.gauss(0, s)))  # noqa: E731
    left = Vector((-1.0, 0.0, 0.0))
    # Sample roots on the shaped head from directions on the sphere.
    dirs = [Vector((rnd.gauss(0, 1), rnd.gauss(0, 1), rnd.gauss(0, 1))).normalized() for _ in range(4000)]
    hair, beard, tache, brows, crown = [], [], [], [], []
    for u in dirs:
        p = shape(u)
        if u.z > 0.5 and len(crown) < 140:
            # The crown: short, wide shards lying flat over the top of the head, so no scalp shows.
            d = Vector((-1.0, 0.25, -0.25 * u.z)) + jit(0.12)
            crown.append((p - u * 0.02, d, rnd.uniform(0.4, 1.0), rnd.uniform(0.09, 0.15)))
        elif (u.z > 0.3 or (u.y > 0.25 and u.z > -0.35)) and len(hair) < 280:
            # Every lock of hair and beard runs to one point left of the head, so the mass
            # narrows to a tail as in the painting (the user: 'flowing and then converging at a
            # point ... Yours is sort of an inverse of that').
            d = TAIL + jit(0.12) - p
            hair.append((p - u * 0.04, d, d.length * rnd.uniform(0.8, 1.0), rnd.uniform(0.06, 0.11)))
        elif -1.02 < u.z < MOUTH_Z - 0.08 and u.y < 0.15 and not (abs(u.x) < 0.2 and u.z > MOUTH_Z - 0.2) and len(beard) < 170:
            # In the painting the beard streams left with the hair, one long mass in the wind
            # (the user, with the painting: "See the hair???").
            d = TAIL + jit(0.12) - p
            beard.append((p - u * 0.03, d, d.length * rnd.uniform(0.8, 1.0), rnd.uniform(0.07, 0.14)))
        elif u.y < -0.75 and 0.07 < abs(u.x) < 0.34 and MOUTH_Z + 0.02 < u.z < MOUTH_Z + 0.12 and len(tache) < 40:
            side = math.copysign(1, u.x)
            tache.append((p, Vector((side, -0.4, -0.9)), rnd.uniform(0.45, 0.9), rnd.uniform(0.06, 0.1)))
        elif u.y < -0.7 and 0.14 < abs(u.x) < 0.56 and 0.25 < u.z < 0.34 and len(brows) < 30:
            side = math.copysign(1, u.x)
            brows.append((p, Vector((side, -0.5, 0.35)), rnd.uniform(0.22, 0.42), rnd.uniform(0.05, 0.08)))
    hair_and_beard.blown = [(shards("hair", hair, coll, white, Vector(), seed=1), 0.22), (shards("crown", crown, coll, white, left * 0.4, seed=5), 0.08), (shards("moustache", tache, coll, white, left * 0.3, seed=2), 0.06)]
    shards("brows", brows, coll, white, left * 0.2, seed=3)
    # The beard hangs from the jaw, so it turns about the jaw's hinge.
    return shards("beard", beard, coll, white, Vector(), origin=HINGE, seed=4)


# Hair as locks, the way stylized hair is modelled (hair cards: a few tapered strips, one per
# clump, bent in 3-6 segments), not hundreds of spikes. The user, 2026-10-01, after the shards:
# "Does it look right still?" -- they read as bristles. Three styles to compare as stills:
#   ribbons: about a dozen wide, flat, wavy bands, like the painting's broad strokes;
#   locks: about a dozen thick three-sided tubes, faceted, waving and tapering;
#   cards: about forty thin wavy strips.
STYLES = {
    # count of hair and beard locks, root width, cross-section, segments, wave amplitude
    "ribbons": dict(hair=20, beard=16, width=0.2, section="flat", segments=7, wave=0.1),
    "locks": dict(hair=13, beard=8, width=0.12, section="tube", segments=7, wave=0.08),
    "cards": dict(hair=40, beard=24, width=0.08, section="flat", segments=7, wave=0.07),
}


def lock_path(p, u, tail, rnd, wave, segments, lift=0.35, bend=Vector((-0.7, 0.15, 0.0))):
    """Points from a root p (on the head, u its direction) to the tail: out from the scalp, then
    bending into the stream (a quadratic curve), with an S-wave across it that is still at both
    ends."""
    c = p + u * lift + bend
    k, phase = rnd.choice((1.5, 2, 2.5)), rnd.uniform(0, math.pi)
    pts = []
    for i in range(segments + 1):
        t = i / segments
        q = (1 - t) ** 2 * p + 2 * t * (1 - t) * c + t * t * tail
        pts.append(q + Vector((0, 0, 1)) * wave * math.sin(math.pi * k * t + phase) * math.sin(math.pi * t))
    return pts


def locks(name, roots, coll, mats, style, rnd, origin=Vector()):
    """One mesh of locks: each root's path swept with a flat or three-sided section that narrows
    to a point at the tail; each lock one material, faces flat-shaded; vertex group 'tips' weights
    each ring by how far along the lock it is, for the wind."""
    st = STYLES[style]
    verts, faces, which, weights = [], [], [], []
    for p, u, tail in roots:
        if name == "beard":
            # The beard hangs in front of the chin first, then sweeps left, so it covers both
            # sides of the face (the user: 'The beard should be full. It should not just be on
            # one side of the face').
            pts = lock_path(p, u, tail, rnd, st["wave"], st["segments"], lift=0.2, bend=Vector((0.1, -0.35, -0.7)))
        elif name == "hair" and u.x > 0.25:
            # Hair from the right side of the head blows up and over the crown to the left, so
            # there is hair on both sides, all of it going one way (the user: 'there should be hair
            # on both sides ... it should be flowing from one side to the other').
            pts = lock_path(p, u, tail, rnd, st["wave"], st["segments"], lift=0.3, bend=Vector((-0.3, 0.1, 0.75)))
        else:
            pts = lock_path(p, u, tail, rnd, st["wave"], st["segments"], lift=0.1 if name != "hair" else 0.3)
        w0 = st["width"] * rnd.uniform(0.7, 1.3) * (1.3 if name == "beard" else 1.0)
        twist = rnd.uniform(-0.6, 0.6)
        n0 = len(faces)
        rings = []
        for i, q in enumerate(pts[:-1]):
            t = i / st["segments"]
            tan = (pts[i + 1] - q).normalized()
            # Across the lock: mostly up and down on screen, turning a little along it.
            a = tan.cross(Vector((0, 1, 0))).normalized()
            b = tan.cross(a).normalized()
            ang = twist * t
            a, b = a * math.cos(ang) + b * math.sin(ang), b * math.cos(ang) - a * math.sin(ang)
            r = w0 * (1 - t) ** 0.7
            if st["section"] == "flat":
                ring = [q + a * r, q - a * r]
            else:
                ring = [q + (a * math.cos(g) + b * math.sin(g)) * r for g in (0, 2.1, 4.2)]
            rings.append([len(verts) + j for j in range(len(ring))])
            verts += [v - origin for v in ring]
            weights += [t] * len(ring)
        tip = len(verts)
        verts.append(pts[-1] - origin)
        weights.append(1.0)
        m = len(rings[0])
        for r0, r1 in zip(rings, rings[1:]):
            for j in range(m if m > 2 else 1):
                j2 = (j + 1) % m
                faces += [(r0[j], r0[j2], r1[j2]), (r0[j], r1[j2], r1[j])]
        last = rings[-1]
        for j in range(m if m > 2 else 1):
            faces.append((last[j], last[(j + 1) % m], tip))
        which += [rnd.randrange(len(mats))] * (len(faces) - n0)
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(v) for v in verts], [], faces)
    for mt in mats:
        mesh.materials.append(mt)
    for poly, w in zip(mesh.polygons, which):
        poly.material_index = w
    o = bpy.data.objects.new(name, mesh)
    o.location = origin
    coll.objects.link(o)
    g = o.vertex_groups.new(name="tips")
    for i, w in enumerate(weights):
        g.add([i], w, "REPLACE")
    return o


def hair_locks(coll, rnd, style):
    """Hair, beard and moustache as locks flowing into the tail; the brows stay shards."""
    white = [toon("white", WHITE), toon("grey", [(0.0, "#2a2640"), (0.3, "#8a86a8"), (0.7, "#e8e4f0")]), toon("warm", [(0.0, "#40303a"), (0.3, "#b0a098"), (0.7, "#fff0dc")])]
    st = STYLES[style]
    jit = lambda s: Vector((rnd.gauss(0, s), rnd.gauss(0, s), rnd.gauss(0, s)))  # noqa: E731
    dirs = [Vector((rnd.gauss(0, 1), rnd.gauss(0, 1), rnd.gauss(0, 1))).normalized() for _ in range(6000)]
    # Hair from the top and back only, so no lock crosses the face.
    # Hair all round the head but the face: the top, the back and both sides above the jaw.
    on_scalp = [u for u in dirs if (u.z > 0.45 and u.y > -0.45) or (u.y > 0.15 and u.z > -0.35) or (abs(u.x) > 0.6 and u.z > -0.2 and u.y > -0.35)]
    on_jaw = [u for u in dirs if -1.0 < u.z < MOUTH_Z - 0.08 and u.y < 0.2 and not (abs(u.x) < 0.2 and u.z > MOUTH_Z - 0.2)]
    on_lip = [u for u in dirs if u.y < -0.75 and 0.07 < abs(u.x) < 0.34 and MOUTH_Z + 0.02 < u.z < MOUTH_Z + 0.12]
    brows = [u for u in dirs if u.y < -0.7 and 0.14 < abs(u.x) < 0.56 and 0.25 < u.z < 0.34][:30]

    def spread(cands, n):
        """n roots spread out: each the candidate farthest from those already chosen."""
        out = [cands[0]]
        while len(out) < min(n, len(cands)):
            out.append(max(cands[:600], key=lambda c: min((c - o).length for o in out)))
        return out

    # The tail: hair converges a little above the beard's point, the two meeting at the end.
    hair = [(shape(u) - u * 0.03, u, TAIL + Vector((0, 0, 0.12)) + jit(0.06)) for u in spread(on_scalp, st["hair"])]
    # The beard's point is lower and further forward than the hair's, so it passes in front of the neck.
    # Roots chosen on one side of the jaw and mirrored, so the beard line is even on both sides
    # (the user: 'Why is the beard uneven? One side is higher than the other').
    half = spread([u for u in on_jaw if u.x >= 0], st["beard"] // 2)
    even = half + [Vector((-u.x, u.y, u.z)) for u in half]
    beard = [(shape(u) - u * 0.03, u, TAIL + Vector((0, -0.45, -0.35)) + jit(0.06)) for u in even]
    tache = [(shape(u), u, shape(u) + Vector((-0.5, 0.1, -0.5)) + jit(0.05)) for u in spread(on_lip, 4)]
    hair_and_beard.blown = [(locks("hair", hair, coll, white, style, rnd), 0.22), (locks("moustache", tache, coll, white, style, rnd), 0.05)]
    left = Vector((-1.0, 0.0, 0.0))
    shards("brows", [(shape(u), Vector((math.copysign(1, u.x), -0.5, 0.35)), rnd.uniform(0.22, 0.42), rnd.uniform(0.05, 0.08)) for u in brows], coll, white, left * 0.2, seed=3)
    return locks("beard", beard, coll, white, style, rnd, origin=HINGE)


def backdrop(glow, ink):
    """Blake's sun disc behind the head like a halo, its rays, the triangle sky, dark clouds."""
    metal.HORIZON = -9.0
    metal.triangle_sky(glow)
    c = Vector((0.3, 14.0, 0.9))
    bpy.ops.mesh.primitive_circle_add(vertices=18, radius=3.9, fill_type="NGON", location=c, rotation=(math.pi / 2, 0, 0))
    put(bpy.context.object, ink, emission("sun", metal.SUN, 2.0))
    bpy.ops.mesh.primitive_torus_add(major_radius=4.35, minor_radius=0.3, location=c + Vector((0, 0.05, 0)), rotation=(math.pi / 2, 0, 0), major_segments=18, minor_segments=4)
    put(bpy.context.object, ink, emission("ring", metal.RING, 1.3))
    rays = emission("rays", metal.RING, 0.6)
    for i in range(31):
        a = i * 2 * math.pi / 31
        tip = Vector((math.cos(a), 0, math.sin(a))) * 22
        side = Vector((-math.sin(a), 0, math.cos(a))) * 0.05
        base = c + Vector((0, 0.4, 0))
        mesh = bpy.data.meshes.new(f"ray{i}")
        mesh.from_pydata([base + side, base - side, base + tip], [], [(0, 1, 2)])
        o = bpy.data.objects.new(f"ray{i}", mesh)
        mesh.materials.append(rays)
        glow.objects.link(o)
    red = toon("cloud-red", [(0.0, metal.VIOLET), (0.3, metal.CRIMSON), (0.62, "#e0705a")])
    dark = toon("cloud-dark", [(0.0, metal.DARK), (0.3, metal.VIOLET), (0.62, "#8a4a78")])
    for k, (bx, bz, mat, s) in enumerate([(-4.4, -3.2, red, 1.0), (5.0, -2.6, red, 0.9), (-5.6, -6.2, dark, 1.3), (5.8, -5.8, dark, 1.2), (5.0, 5.8, dark, 0.8)]):
        for j, (dx, dz, r) in enumerate([(0, 0, 1.0), (1.0, 0.3, 0.8), (-1.0, 0.2, 0.85), (0.5, -0.45, 0.7), (-0.6, -0.4, 0.65), (1.7, -0.2, 0.55), (-1.8, -0.3, 0.5)]):
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=r * s, location=(bx + dx * s, 12.5, bz + dz * s))
            o = bpy.context.object
            put(o, ink, mat)
            metal.facets(o, 0.12 * s, 0, seed=k * 10 + j)


def wire(o, thickness, mat):
    """Keep only an object's edges, as glowing lines."""
    w = o.modifiers.new("wire", "WIREFRAME")
    w.thickness = thickness
    w.use_replace = True
    o.data.materials.clear()
    o.data.materials.append(mat)


def neon(glow):
    """Black, and a few lines: Blake's sun as an amber 18-sided outline behind the head, and a
    faint cyan geodesic sphere further back."""
    c = Vector((0.3, 14.0, 0.9))
    bpy.ops.mesh.primitive_circle_add(vertices=18, radius=3.9, fill_type="NGON", location=c, rotation=(math.pi / 2, 0, 0))
    halo = bpy.context.object
    put(halo, glow)
    wire(halo, 0.07, emission("halo", "#ffb040", 4.0))
    halo.modifiers["wire"].use_boundary = True
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=9.0, location=c + Vector((0, 8, 0)))
    geo = bpy.context.object
    geo.rotation_euler = (0.3, 0.2, 0.1)
    put(geo, glow)
    wire(geo, 0.025, emission("geodesic", "#30e0ff", 0.35))
    return halo


def main():
    args = parse()
    metal.TINT = args.backdrop == "neon"
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    world = bpy.data.worlds.new("dark")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = linear(metal.DARK)
    scene.world = world
    glow, ink = metal.collection("glow"), metal.collection("ink")
    rnd = random.Random(11)
    halo = None
    if args.backdrop == "dusk":
        backdrop(glow, ink)
    else:
        halo = neon(glow)
    # No eyeballs (the user: 'with eyes looks [wrong]. Less is more'): the sockets under the
    # brow are enough.
    face, _ = head(ink)
    beard = hair_and_beard(ink, rnd) if args.hair == "shards" else hair_locks(ink, rnd, args.hair)
    if args.wind:
        wind([*hair_and_beard.blown, (beard, 0.14)])

    # A warm key from the front left and above, the sun's rim from behind, a cool fill right.
    lights = [("key", 3.2, "#ffd8b0", (55, 0, -35)), ("rim", 5.0, "#ff9a50", (-70, 0, 15)), ("fill", 0.9, "#5a7ab0", (70, 0, 60))]
    if args.backdrop == "neon":
        # Neon: a warm key, a cyan rim from behind left, a magenta edge from the right.
        lights = [("key", 2.6, "#ffd8b0", (55, 0, -35)), ("rim", 5.0, "#30d8ff", (-65, 0, -40)), ("edge", 3.0, "#ff3fa8", (-20, 0, 80))]
    for name, energy, colour, rot in lights:
        light = bpy.data.lights.new(name, "SUN")
        light.energy, light.color = energy, linear(colour)[:3]
        lo = bpy.data.objects.new(name, light)
        lo.rotation_euler = tuple(math.radians(a) for a in rot)
        scene.collection.objects.link(lo)

    cam = bpy.data.cameras.new("camera")
    cam.lens = 50
    cam.sensor_fit = "VERTICAL"
    cam.sensor_height = 36
    co = bpy.data.objects.new("camera", cam)
    co.location = (-0.45, -8.0, -0.45)  # the head right of centre, the hair and beard streaming left
    co.rotation_euler = (math.radians(90), 0, 0)
    scene.collection.objects.link(co)
    scene.camera = co

    bloom(scene)
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 16 if args.preview else 64
    scene.render.resolution_x, scene.render.resolution_y = (540, 960) if args.preview else (1080, 1920)
    scene.view_settings.view_transform = "Standard"
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = os.path.abspath(args.out) + ("/" if args.out.endswith("/") else "")
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    if args.props:
        talk(scene, args, face, beard, halo, co)
        bpy.ops.render.render(animation=True)
    else:
        bpy.ops.render.render(write_still=True)


def wind(blown):
    """The wind in The Ancient of Days blows his hair and beard to the left. Here a field of
    coloured noise drifts leftward through them, a unit a second (--wind): each shard's tip moves
    with the colour it sits in (x, y, z from r, g, b), its root not at all, so gusts pass along the
    locks rather than the whole head swaying. The user, 2026-09-30: "does the hair flow? ...
    clearly in the original artwork, the wind is blowing"."""
    tex = bpy.data.textures.new("gust", "CLOUDS")
    tex.cloud_type = "COLOR"
    tex.noise_scale = 0.9
    tex.noise_depth = 1
    field = bpy.data.objects.new("gust", None)
    bpy.context.scene.collection.objects.link(field)
    field.location = (0.0, 0.0, 0.0)
    field.keyframe_insert("location", index=0, frame=1)
    field.location.x = -60.0
    field.keyframe_insert("location", index=0, frame=1800)
    for fc in field.animation_data.action.layers[0].strips[0].channelbags[0].fcurves if hasattr(field.animation_data.action, "layers") else field.animation_data.action.fcurves:
        for k in fc.keyframe_points:
            k.interpolation = "LINEAR"
    for o, strength in blown:
        d = o.modifiers.new("wind", "DISPLACE")
        d.texture = tex
        d.texture_coords = "OBJECT"
        d.texture_coords_object = field
        d.direction = "RGB_TO_XYZ"
        d.mid_level = 0.5
        d.strength = strength
        d.vertex_group = "tips"


OPEN = 0.7  # the jaw's widest, as a share of the shape key's (0.24 rad): a full turn reads as a yawn


def talk(scene, args, face, beard, halo, camera):
    """Keys a short's frames from its props: frame f of the short is Blender's frame f + 1."""
    props = json.load(open(args.props))
    fps = 30
    last = props["marks"]["close"] + 7  # the ivory close covers the head from here
    scene.render.fps = fps
    lo, hi = (int(x) for x in args.frames.split("-")) if args.frames else (1, last)
    scene.frame_start, scene.frame_end = lo, min(hi, last)
    key = face.data.shape_keys.key_blocks["open"]
    for f, v in enumerate(props["jaw"][:last]):
        key.value = OPEN * v
        key.keyframe_insert("value", frame=f + 1)
        beard.rotation_euler.x = 0.24 * OPEN * v
        beard.keyframe_insert("rotation_euler", index=0, frame=f + 1)
    # A slow push-in over the whole short, eased at both ends.
    camera.keyframe_insert("location", index=1, frame=1)
    camera.location.y += 0.9
    camera.keyframe_insert("location", index=1, frame=last)
    # The sun outline goes out at once when "Withdraw?" ends.
    if halo:
        strength = halo.data.materials[0].node_tree.nodes["Emission"].inputs["Strength"]
        off = props["marks"]["e7"] + 1
        for frame, value in ((off - 1, 4.0), (off, 0.0)):
            strength.default_value = value
            strength.keyframe_insert("default_value", frame=frame)


if __name__ == "__main__":
    main()
