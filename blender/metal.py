"""Qian (1) in the Heavy Metal comic look (Moebius, Métal Hurlant): ink outlines, flat banded
colour, after Blake's The Ancient of Days (1794, public domain), the painting the app shows for
hexagram 1 (sixlines-expo assets/masterpieces/hexagram-01): his sun, his crimson clouds, his
dividers coming down out of the sky.

What the dividers measure is Shaughnessy's reading of Qian's dragons (The Composition of the
Zhouyi, Stanford PhD 1983, IV.4.iv; chinese-classics-reference/shaugnessy/text/05-chapter-four-
chunk5.md): the lines follow the Dragon constellation (Horn 角, Neck 亢, Di 氐, Fang 房, Heart 心,
Tail 尾) through the dusk sky of the year, c. 800 B.C.: submerged below the horizon at the winter
solstice (1/1), its horns in the fields in early March (1/2), leaping out of the depths in late
April to mid-May (1/4), flying across the whole sky at the summer solstice (1/5), its Neck on the
western horizon in mid-August (1/6), and its head gone, "a flock of dragons without heads"
(1/7). This still is line 5: the whole dragon across the sky at dusk, the sun going down.

The user, 2026-09-30: "another idea is like a heavy metal style animated short", "we can start
with Qian - hexagram 1 and get inspiration from Blake's ancient of days as we do in the app",
"we can also draw upon shaugnessy's phd interpretation of the 6 lines". A still for the smoke
test:

  Blender -b --factory-startup --python-exit-code 1 -P blender/metal.py -- \
    --out out/metal/qian.png [--preview] [--treatment flat|airbrush|ink|print]

The user on the first still (flat bands): "a bit too flat". Treatments, each on the same scene
with more depth (three rock layers fading into the haze, a near ledge, the dividers coming toward
the camera):
  flat      the first still's banded toon, kept to compare
  airbrush  the 1981 Heavy Metal film: smooth gradients, soft bands, rim light, 80s airbrush chrome
  ink       Moebius: flat colour, hatched shadows, cross-hatched where darkest, ruled sky
  print     a 70s magazine page: halftone dots in the shadows and the sky
  cassaday  John Cassaday's inks (Planetary) under Laura Martin's colour: shadows spotted solid
            black, feathered at their edges by tapering hatch lines, brush-weight outlines that
            taper and wobble, over smooth painted colour with rim light (the user asked how to get
            his hand-drawn look in Blender; docs/notes/2026-09-30-metal-treatments.md)
  painted   a painted magazine cover (the user sent Heavy Metal 282: "Is something like this
            possible"): lit, textured rock and floor, volumetric clouds and ground fog lit from
            behind, a warm key and a teal fill, gold dividers, no ink, an oil-paint filter
            (anisotropic Kuwahara) over the render
  faceted   low-poly vector art, Blender's own strength (the user: "if hand-drawn isn't possible,
            then we'll stick to polygons and do something fun with those ... vectors with lots of
            triangles"): everything triangulated and flat shaded, one colour per face, graded
            by the light; the sky a field of triangles coloured by height; no ink lines
"""

import argparse
import math
import os
import random
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hexagram import bloom  # noqa: E402

# Blake's palette, read off the painting, and a Moebius dusk.
SUN = "#f6d64a"
RING = "#e0892a"
CRIMSON = "#9e2f3c"
VIOLET = "#4a2c55"
DARK = "#120b14"
BONE = "#eee3c8"
# Stops as heights above the horizon, over a sky 31 high.
SKY = [(0.0, "#e2782e"), (0.07, "#b8423c"), (0.17, "#4a1f45"), (0.32, "#160e26"), (0.5, "#07060f")]
INK = (0.02, 0.01, 0.02)
HORIZON = -3.0
TREAT = "flat"  # set from --treatment in main()
FAR = 12.0  # the sky's stars and the sun sit this far back

# The Dragon constellation across the summer sky at dusk, tail up and left, horn down and right
# (Shaughnessy's Illustration V), as (x, z, size, colour) at the sky's distance. Heart is Antares
# (red), Horn is Spica (blue-white).
DRAGON = [
    ("Wei 尾 Tail", [(-4.6, 9.8), (-5.1, 8.7), (-4.8, 7.7), (-4.0, 7.3), (-3.2, 7.8)]),
    ("Xin 心 Heart", [(-2.4, 8.4), (-1.8, 8.9), (-1.2, 9.2)]),
    ("Fang 房", [(-0.4, 8.6), (-0.2, 7.9)]),
    ("Di 氐", [(0.8, 7.6), (1.5, 7.9), (1.2, 7.0)]),
    ("Gang 亢 Neck", [(2.3, 6.3), (2.8, 5.6)]),
    ("Jiao 角 Horn", [(3.7, 4.8), (4.4, 5.4)]),
]
BRIGHT = {(-1.8, 8.9): "#ff6a3c", (3.7, 4.8): "#bfe0ff"}


def parse():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True)
    p.add_argument("--preview", action="store_true")
    p.add_argument("--treatment", default="flat", choices=["flat", "airbrush", "ink", "print", "cassaday", "painted", "faceted"])
    return p.parse_args(argv)


def linear(hex_colour):
    c = [int(hex_colour[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple((x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (1.0,)


def nodes(name):
    m = bpy.data.materials.new(name)
    nt = m.node_tree
    nt.nodes.clear()
    return m, nt, nt.nodes.new("ShaderNodeOutputMaterial")


def emission(name, colour, strength=1.0):
    m, nt, out = nodes(name)
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = linear(colour)
    e.inputs["Strength"].default_value = strength
    nt.links.new(e.outputs[0], out.inputs[0])
    return m


def screen_pattern(nt, kind, angle=0.0, scale=110.0):
    """A pattern fixed to the screen, like ink on the page: hatch lines at an angle, or a grid of
    dots. Returns a socket, 0..1: a hatch's distance from its line, or a dot's distance from its
    centre (0.5 at a cell's corner)."""
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Rotation"].default_value = (0, 0, angle)
    mp.inputs["Scale"].default_value = (scale, scale * 1920 / 1080, 1)
    nt.links.new(tc.outputs["Window"], mp.inputs["Vector"])
    fr = nt.nodes.new("ShaderNodeVectorMath")
    fr.operation = "FRACTION"
    nt.links.new(mp.outputs[0], fr.inputs[0])
    if kind == "dots":
        sub = nt.nodes.new("ShaderNodeVectorMath")
        sub.operation = "SUBTRACT"
        sub.inputs[1].default_value = (0.5, 0.5, 0)
        nt.links.new(fr.outputs[0], sub.inputs[0])
        ln = nt.nodes.new("ShaderNodeVectorMath")
        ln.operation = "LENGTH"
        nt.links.new(sub.outputs[0], ln.inputs[0])
        return ln.outputs["Value"]
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(fr.outputs[0], sep.inputs[0])
    d = math_node(nt, "SUBTRACT", sep.outputs["Y"], 0.5)
    return math_node(nt, "ABSOLUTE", d)


def math_node(nt, op, a, b=None):
    m = nt.nodes.new("ShaderNodeMath")
    m.operation = op
    for i, v in enumerate([a, b]):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            m.inputs[i].default_value = v
        else:
            nt.links.new(v, m.inputs[i])
    return m.outputs[0]


def ink_over(nt, colour, mask, ink=INK):
    """Lay ink over a colour where mask is 1."""
    mix = nt.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    nt.links.new(mask, mix.inputs["Factor"])
    nt.links.new(colour, mix.inputs["A"])
    mix.inputs["B"].default_value = ink + (1,) if len(ink) == 3 else ink
    return mix.outputs["Result"]


def shade_marks(nt, colour, shade):
    """The treatment's marks over a flat colour, heavier where the shade is darker."""
    if TREAT == "ink":
        # Hatch where the shade is under 0.45, cross-hatch under 0.2; lines about a pixel and a half.
        for angle, below in [(math.radians(35), 0.45), (math.radians(-35), 0.2)]:
            h = screen_pattern(nt, "hatch", angle, 150)
            line = math_node(nt, "LESS_THAN", h, 0.16)
            dark = math_node(nt, "LESS_THAN", shade, below)
            colour = ink_over(nt, colour, math_node(nt, "MULTIPLY", line, dark))
    elif TREAT == "print":
        # Dots grow as the shade falls: radius 0 at shade 0.75, touching at shade 0.
        d = screen_pattern(nt, "dots", math.radians(15), 95)
        r = math_node(nt, "MULTIPLY", math_node(nt, "SUBTRACT", 0.75, shade), 0.62)
        colour = ink_over(nt, colour, math_node(nt, "LESS_THAN", d, r), (0.10, 0.03, 0.08))
    elif TREAT == "cassaday":
        # Solid black under 0.2; from 0.2 to 0.42 hatch lines that thicken toward the black and
        # join it, so the shadow's edge is feathered, not cut.
        h = screen_pattern(nt, "hatch", math.radians(28), 170)
        width = math_node(nt, "MULTIPLY", math_node(nt, "SUBTRACT", 0.42, shade), 2.3)
        feather = math_node(nt, "LESS_THAN", h, width)
        black = math_node(nt, "LESS_THAN", shade, 0.2)
        colour = ink_over(nt, colour, math_node(nt, "MAXIMUM", feather, black))
    return colour


def painted(name, stops):
    """A lit, rough surface: the band colours mottled by noise, with a bumped surface."""
    m, nt, out = nodes(name)
    b = nt.nodes.new("ShaderNodeBsdfPrincipled")
    b.inputs["Roughness"].default_value = 0.85
    tc = nt.nodes.new("ShaderNodeTexCoord")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 2.5
    noise.inputs["Detail"].default_value = 8
    nt.links.new(tc.outputs["Object"], noise.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = 0.35, linear(stops[0][1])
    els[1].position, els[1].color = 0.65, linear(stops[-1][1])
    els.new(0.5).color = linear(stops[1][1])
    nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.6
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], b.inputs["Normal"])
    nt.links.new(b.outputs[0], out.inputs[0])
    return m


def volume(name, colour, density, anisotropy=0.5, noisy=True):
    """A lit volume (cloud, fog): the density broken up by noise so it has edges and holes."""
    m, nt, out = nodes(name)
    v = nt.nodes.new("ShaderNodeVolumePrincipled")
    v.inputs["Color"].default_value = linear(colour)
    v.inputs["Anisotropy"].default_value = anisotropy
    if noisy:
        noise = nt.nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 1.6
        noise.inputs["Detail"].default_value = 6
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].position = 0.42
        ramp.color_ramp.elements[1].position = 0.7
        nt.links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
        dens = math_node(nt, "MULTIPLY", ramp.outputs["Color"], density)
        nt.links.new(dens, v.inputs["Density"])
    else:
        v.inputs["Density"].default_value = density
    nt.links.new(v.outputs[0], out.inputs["Volume"])
    return m


def toon(name, stops, rim=None):
    """Bands: the light's strength through Shader to RGB, cut by a ramp; hard bands (flat, ink,
    print) or soft (airbrush), then the treatment's marks, and for airbrush a rim of light on the
    edges that face away from the camera."""
    if TREAT == "painted":
        return painted(name, stops)
    m, nt, out = nodes(name)
    d = nt.nodes.new("ShaderNodeBsdfDiffuse")
    rgb = nt.nodes.new("ShaderNodeShaderToRGB")
    bw = nt.nodes.new("ShaderNodeRGBToBW")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "EASE" if TREAT in ("airbrush", "cassaday") else "LINEAR" if TREAT == "faceted" else "CONSTANT"
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = stops[0][0], linear(stops[0][1])
    els[1].position, els[1].color = stops[1][0], linear(stops[1][1])
    for pos, col in stops[2:]:
        els.new(pos).color = linear(col)
    e = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(d.outputs[0], rgb.inputs[0])
    nt.links.new(rgb.outputs["Color"], ramp.inputs["Fac"])
    nt.links.new(rgb.outputs["Color"], bw.inputs[0])
    colour = shade_marks(nt, ramp.outputs["Color"], bw.outputs[0])
    if TREAT in ("airbrush", "cassaday") and rim:
        lw = nt.nodes.new("ShaderNodeLayerWeight")
        lw.inputs["Blend"].default_value = 0.25
        edge = math_node(nt, "POWER", lw.outputs["Facing"], 3.0)
        mix = nt.nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "ADD"
        nt.links.new(edge, mix.inputs["Factor"])
        nt.links.new(colour, mix.inputs["A"])
        mix.inputs["B"].default_value = linear(rim)
        colour = mix.outputs["Result"]
    nt.links.new(colour, e.inputs["Color"])
    nt.links.new(e.outputs[0], out.inputs[0])
    return m


def chrome(name):
    """80s airbrush chrome: the surface's upward normal picks a band from a painted horizon (sky
    above, a hard dark line, warm ground below), the way the album-cover painters faked it."""
    m, nt, out = nodes(name)
    g = nt.nodes.new("ShaderNodeNewGeometry")
    tr = nt.nodes.new("ShaderNodeVectorTransform")
    tr.vector_type = "NORMAL"
    tr.convert_from, tr.convert_to = "WORLD", "CAMERA"
    nt.links.new(g.outputs["Normal"], tr.inputs[0])
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tr.outputs[0], sep.inputs[0])
    fac = math_node(nt, "MULTIPLY_ADD", sep.outputs["X"], 0.5)
    nt.nodes[-1].inputs[2].default_value = 0.5
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "EASE"
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = 0.0, linear("#2a1a22")
    els[1].position, els[1].color = 1.0, linear("#fff6e0")
    for pos, col in [(0.3, "#8a5a40"), (0.46, "#e0a060"), (0.5, "#1a0f18"), (0.54, "#6a4a8a"), (0.75, "#c8b8e8")]:
        els.new(pos).color = linear(col)
    nt.links.new(fac, ramp.inputs["Fac"])
    e = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(ramp.outputs["Color"], e.inputs["Color"])
    nt.links.new(e.outputs[0], out.inputs[0])
    return m


def collection(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c


def put(obj, coll, mat=None):
    for c in obj.users_collection:
        c.objects.unlink(obj)
    coll.objects.link(obj)
    if mat:
        obj.data.materials.append(mat)
    return obj


def sky(glow):
    """A plane far back, banded from the horizon's orange up to night, in steps like a print."""
    if TREAT == "faceted":
        return triangle_sky(glow)
    m, nt, out = nodes("sky")
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT" if TREAT == "flat" else "LINEAR"
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = SKY[0][0], linear(SKY[0][1])
    els[1].position, els[1].color = SKY[1][0], linear(SKY[1][1])
    for pos, col in SKY[2:]:
        els.new(pos).color = linear(col)
    e = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs["Y"], ramp.inputs["Fac"])
    # The marks thicken toward the top of the sky: shade falls from 1 at the horizon.
    shade = math_node(nt, "SUBTRACT", 1.0, math_node(nt, "MULTIPLY", sep.outputs["Y"], 2.2))
    if TREAT == "ink":
        h = screen_pattern(nt, "hatch", 0.0, 90)
        width = math_node(nt, "MINIMUM", math_node(nt, "MULTIPLY", math_node(nt, "SUBTRACT", 0.7, shade), 0.35), 0.3)
        colour = ink_over(nt, ramp.outputs["Color"], math_node(nt, "LESS_THAN", h, width))
    elif TREAT == "print":
        colour = shade_marks(nt, ramp.outputs["Color"], math_node(nt, "ADD", shade, 0.35))
    else:
        colour = ramp.outputs["Color"]
    nt.links.new(colour, e.inputs["Color"])
    nt.links.new(e.outputs[0], out.inputs[0])
    top = 28.0
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, FAR + 3, (HORIZON + top) / 2), rotation=(math.pi / 2, 0, 0))
    o = bpy.context.object
    o.scale = (30, top - HORIZON, 1)
    put(o, glow, m)


def sun(glow, ink):
    """Blake's disc, going down behind the mesas, its ring and its rays fanning up."""
    c = Vector((0, FAR, HORIZON + 0.4))
    bpy.ops.mesh.primitive_circle_add(vertices=14 if TREAT == "faceted" else 96, radius=2.4, fill_type="NGON", location=c, rotation=(math.pi / 2, 0, 0))
    put(bpy.context.object, ink, emission("sun", SUN, 2.2))
    bpy.ops.mesh.primitive_torus_add(major_radius=2.75, minor_radius=0.28, location=c + Vector((0, 0.05, 0)), rotation=(math.pi / 2, 0, 0), major_segments=14 if TREAT == "faceted" else 96, minor_segments=4 if TREAT == "faceted" else 12)
    put(bpy.context.object, ink, emission("ring", RING, 1.3))
    rays = emission("rays", RING, 0.25 if TREAT == "painted" else 0.7)
    for i in range(23):
        a = math.pi / 2 + (i - 11) * 0.12
        tip = Vector((math.cos(a), 0, math.sin(a))) * 16
        side = Vector((-math.sin(a), 0, math.cos(a))) * 0.07
        base = c + Vector((0, 0.4, 0))
        mesh = bpy.data.meshes.new(f"ray{i}")
        mesh.from_pydata([base + side, base - side, base + tip], [], [(0, 1, 2)])
        o = bpy.data.objects.new(f"ray{i}", mesh)
        mesh.materials.append(rays)
        glow.objects.link(o)


def stars(glow):
    """The field of small stars, then the Dragon: its stars and the lines that join them."""
    rnd = random.Random(1)
    small = emission("star", "#fff4dc", 3.0)
    for _ in range(140):
        x, z = rnd.uniform(-7, 7), rnd.uniform(HORIZON + 4.5, 12)
        bpy.ops.mesh.primitive_ico_sphere_add(radius=rnd.uniform(0.018, 0.045), subdivisions=1, location=(x, FAR + 1, z))
        put(bpy.context.object, glow, small)
    line = emission("dragon-line", "#9fd8ff", 1.6)
    points = [p for _, ps in DRAGON for p in ps]
    for (x, z) in points:
        col = BRIGHT.get((x, z), "#fff1c8")
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16 if (x, z) in BRIGHT else 0.1, location=(x, FAR - 0.5, z), segments=16, ring_count=8)
        put(bpy.context.object, glow, emission(f"s{x}{z}", col, 6.0))
    for a, b in zip(points, points[1:]):
        a3, b3 = Vector((a[0], FAR - 0.6, a[1])), Vector((b[0], FAR - 0.6, b[1]))
        d = b3 - a3
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.025, depth=d.length, location=(a3 + b3) / 2)
        o = bpy.context.object
        o.rotation_mode = "QUATERNION"
        o.rotation_quaternion = d.to_track_quat("Z", "Y")
        put(o, glow, line)


def clouds(ink):
    """Blake's heaped clouds low on either side of the sun, lit on the edge toward it."""
    if TREAT == "painted":
        red, dark = volume("cloud-red", "#e08070", 6.0, 0.6), volume("cloud-dark", "#9a6a90", 8.0, 0.4)
    else:
        red = toon("cloud-red", [(0.0, VIOLET), (0.3, CRIMSON), (0.62, "#e0705a")])
        dark = toon("cloud-dark", [(0.0, DARK), (0.3, VIOLET), (0.62, "#8a4a78")])
    banks = [(-4.2, FAR - 2, HORIZON + 2.6, red, 1.1), (4.4, FAR - 2, HORIZON + 1.8, red, 1.0),
             (-5.4, FAR - 3, HORIZON + 5.0, dark, 1.0), (5.2, FAR - 3, HORIZON + 4.4, dark, 0.9)]
    if TREAT == "faceted":
        # Heaps of low-poly spheres, jittered, each triangle its own shade.
        for k, (bx, by, bz, mat, s) in enumerate(banks):
            for j, (dx, dz, r) in enumerate([(0, 0, 1.0), (1.0, 0.3, 0.8), (-1.0, 0.2, 0.85), (0.5, -0.45, 0.7), (-0.6, -0.4, 0.65), (1.7, -0.2, 0.55), (-1.8, -0.3, 0.5)]):
                bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=r * s, location=(bx + dx * s, by, bz + dz * s))
                o = bpy.context.object
                put(o, ink, mat)
                facets(o, 0.12, 0, seed=k * 10 + j)
        return
    # Metaballs, so the heaps melt into one outline instead of showing each ball.
    for k, (bx, by, bz, mat, s) in enumerate(banks):
        mb = bpy.data.metaballs.new(f"cloud{k}")
        mb.resolution = 0.08
        mb.threshold = 0.6
        o = bpy.data.objects.new(f"cloud{k}", mb)
        o.location = (bx, by, bz)
        for dx, dz, r in [(0, 0, 1.0), (1.0, 0.3, 0.8), (-1.0, 0.2, 0.85), (0.5, -0.45, 0.7), (-0.6, -0.4, 0.65), (1.7, -0.2, 0.55), (-1.8, -0.3, 0.5)]:
            e = mb.elements.new()
            e.co = (dx * s, 0, dz * s)
            e.radius = r * s * (1.5 if TREAT == "painted" else 1.1)
        mb.materials.append(mat)
        ink.objects.link(o)


def mesas(ink):
    """Moebius's flat-topped rock. The first still had one dark silhouette; now three ranges step
    back into the dusk haze (the far ones paler and redder), each a block whose top catches the low
    sun, and a near ledge in the bottom corner."""
    if TREAT == "flat":
        rock = toon("rock", [(0.0, "#0d0810"), (0.35, "#2a1630"), (0.7, "#5a2c3c")])
        profile = [(-9, -2.5), (-6.5, -2.5), (-6.2, -1.6), (-4.6, -1.6), (-4.2, -2.6), (-2.6, -2.7), (-2.3, -2.1), (-1.2, -2.1),
                   (-0.9, -2.9), (1.4, -2.9), (1.7, -1.3), (3.6, -1.3), (3.9, -2.4), (5.4, -2.4), (5.7, -0.9), (7.2, -0.9), (7.5, -2.2), (9, -2.2)]
        for depth, dy, lift in [(0.0, 4.0, 0.0), (1.0, 0.0, -1.3)]:
            verts = [(x * (1 + 0.1 * depth), dy, z + lift) for x, z in profile] + [(9 * (1 + 0.1 * depth), dy, -12), (-9 * (1 + 0.1 * depth), dy, -12)]
            mesh = bpy.data.meshes.new(f"mesa{depth}")
            mesh.from_pydata(verts, [], [list(range(len(verts)))])
            o = bpy.data.objects.new(f"mesa{depth}", mesh)
            mesh.materials.append(rock)
            ink.objects.link(o)
            mod = o.modifiers.new("solid", "SOLIDIFY")
            mod.thickness = 0.4
        return
    # A desert floor to the horizon, then mesas: wide, flat-topped, cliffs over sloped flanks,
    # spaced out in depth, the far ones paler and redder in the haze.
    GROUND = HORIZON - 1.2
    floor = toon("floor", [(0.0, "#0c0710"), (0.3, "#2a1428"), (0.62, "#6a2c34")], rim="#a04038")
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, GROUND))
    o = bpy.context.object
    o.scale = (80, 60, 1)
    put(o, ink, floor)
    if TREAT == "faceted":
        o.scale = (80, 60, 1)
        bpy.ops.object.transform_apply(scale=True)
        facets(o, 0.5, 5, seed=1)
    if TREAT == "painted":
        rough(o, 0.35, 6)
        # Ground fog in the valleys, lit from behind by the low sun.
        bpy.ops.mesh.primitive_cube_add(location=(0, 3, GROUND + 0.6))
        fog = bpy.context.object
        fog.scale = (30, 20, 1.2)
        put(fog, ink, volume("fog", "#f0a078", 0.12, 0.5, noisy=False))
    # (x centre, y, width, height, shadow, mid, lit top)
    mesas_at = [(-5.5, 9.0, 5.5, 1.9, "#6a2c40", "#9a4048", "#e8844c"),
                (5.8, 7.5, 4.0, 2.6, "#5a2438", "#8a3844", "#e07a4a"),
                (2.2, 3.0, 3.2, 1.3, "#2a1430", "#4a2238", "#c85a44"),
                (-6.0, -1.0, 4.5, 2.2, "#120a16", "#2a1630", "#9a4040")]
    for k, (cx, y, w, h, shadow, mid, lit) in enumerate(mesas_at):
        mat = toon(f"rock{k}", [(0.0, shadow), (0.3, mid), (0.62, lit)], rim=lit)
        top, cliff, flank = GROUND + h, GROUND + h * 0.45, w * 0.22
        x0, x1 = cx - w / 2, cx + w / 2
        front = [(x0, GROUND), (x0 + flank, cliff), (x0 + flank + 0.15, top), (x1 - flank - 0.25, top), (x1 - flank, cliff), (x1, GROUND)]
        d = 1.2 + 0.3 * k
        verts = [(x, y - d / 2, z) for x, z in front] + [(x, y + d / 2, z) for x, z in front]
        n = len(front)
        faces = [list(range(n)), list(range(n, 2 * n))[::-1]] + [[i + 1, i, n + i, n + i + 1] for i in range(n - 1)]
        mesh = bpy.data.meshes.new(f"mesa{k}")
        mesh.from_pydata(verts, [], faces)
        mesh.validate()
        o = bpy.data.objects.new(f"mesa{k}", mesh)
        mesh.materials.append(mat)
        ink.objects.link(o)
        if TREAT == "painted":
            rough(o, 0.18, 5)
        if TREAT == "faceted":
            facets(o, 0.35, 2, seed=k + 2)


def facets(o, strength=0.3, levels=2, seed=0):
    """Low-poly rock: subdivide a little, jitter the vertices, triangulate; flat shading then gives
    each triangle its own colour."""
    rnd = random.Random(seed)
    sub = o.modifiers.new("subdivide", "SUBSURF")
    sub.subdivision_type = "SIMPLE"
    sub.levels = sub.render_levels = levels
    tex = bpy.data.textures.new(f"{o.name}-facets", "CLOUDS")
    tex.noise_scale = 0.8
    d = o.modifiers.new("jitter", "DISPLACE")
    d.texture = tex
    d.strength = strength
    d.texture_coords = "GLOBAL"
    tex.noise_basis = rnd.choice(["BLENDER_ORIGINAL", "ORIGINAL_PERLIN", "IMPROVED_PERLIN"])
    o.modifiers.new("triangles", "TRIANGULATE")


def triangle_sky(glow):
    """The sky as a field of triangles, each one flat colour picked from the dusk ramp at its
    centre's height, a little jittered, like low-poly vector backdrops."""
    rnd = random.Random(3)
    top, cols, rows = 28.0, 18, 30
    w, h = 30.0, top - HORIZON
    verts = []
    for j in range(rows + 1):
        for i in range(cols + 1):
            jx = rnd.uniform(-0.35, 0.35) if 0 < i < cols else 0
            jz = rnd.uniform(-0.35, 0.35) if 0 < j < rows else 0
            verts.append(((i / cols - 0.5) * w + jx * w / cols, FAR + 3, HORIZON + (j / rows) * h + jz * h / rows))
    faces = []
    for j in range(rows):
        for i in range(cols):
            a, b = j * (cols + 1) + i, j * (cols + 1) + i + 1
            c, d = a + cols + 1, b + cols + 1
            faces += [(a, b, d), (a, d, c)] if (i + j) % 2 else [(a, b, c), (b, d, c)]
    mesh = bpy.data.meshes.new("sky")
    mesh.from_pydata(verts, [], faces)
    col = mesh.color_attributes.new("dusk", "FLOAT_COLOR", "CORNER")

    def at(y):
        for (p0, c0), (p1, c1) in zip(SKY, SKY[1:]):
            if y <= p1:
                t = (y - p0) / (p1 - p0)
                a, b = linear(c0), linear(c1)
                return tuple(a[k] + (b[k] - a[k]) * t for k in range(3)) + (1,)
        return linear(SKY[-1][1])
    for poly in mesh.polygons:
        y = (poly.center.z - HORIZON) / h
        c = at(min(1, max(0, y + rnd.uniform(-0.015, 0.015))))
        shade = rnd.uniform(0.9, 1.1)
        for li in poly.loop_indices:
            col.data[li].color = (c[0] * shade, c[1] * shade, c[2] * shade, 1)
    m, nt, out = nodes("sky")
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.attribute_name = "dusk"
    e = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(attr.outputs["Color"], e.inputs["Color"])
    nt.links.new(e.outputs[0], out.inputs[0])
    mesh.materials.append(m)
    o = bpy.data.objects.new("sky", mesh)
    glow.objects.link(o)


def rough(o, strength, levels):
    """Weathered rock: subdivide, then push the surface in and out with a clouds texture."""
    sub = o.modifiers.new("subdivide", "SUBSURF")
    sub.subdivision_type = "SIMPLE"
    sub.levels = sub.render_levels = levels
    tex = bpy.data.textures.new(f"{o.name}-rock", "CLOUDS")
    tex.noise_scale = 0.6
    tex.noise_depth = 4
    d = o.modifiers.new("weather", "DISPLACE")
    d.texture = tex
    d.strength = strength
    d.texture_coords = "GLOBAL"


def rod(coll, a, b, radius, mat):
    a, b = Vector(a), Vector(b)
    d = b - a
    bpy.ops.mesh.primitive_cone_add(vertices=6 if TREAT == "faceted" else 24, radius1=radius, radius2=radius * 0.3, depth=d.length, location=(a + b) / 2)
    o = bpy.context.object
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = d.to_track_quat("-Z", "Y")
    if TREAT != "faceted":
        bpy.ops.object.shade_smooth()
    put(o, coll, mat)


def dividers(ink):
    """Blake's dividers, held from above the frame, their points set on the horizon."""
    if TREAT == "painted":
        bone, nt, out = nodes("gold")
        b = nt.nodes.new("ShaderNodeBsdfPrincipled")
        b.inputs["Base Color"].default_value = linear("#d0a050")
        b.inputs["Metallic"].default_value = 1.0
        b.inputs["Roughness"].default_value = 0.3
        nt.links.new(b.outputs[0], out.inputs[0])
    elif TREAT in ("airbrush", "print"):
        bone = chrome("bone")
    else:
        bone = toon("bone", [(0.0, "#a8987a"), (0.25, "#d8c8a4"), (0.55, BONE)])
    # The flat still held them in the sky's plane; now the hinge leans out toward the camera.
    hinge = (0.0, 3.0, 9.6) if TREAT == "flat" else (0.4, -4.0, 8.4)
    rod(ink, hinge, (-3.4, 5.0, HORIZON + 0.6), 0.14 if TREAT == "flat" else 0.24, bone)
    rod(ink, hinge, (3.4, 5.0, HORIZON + 0.6), 0.14 if TREAT == "flat" else 0.24, bone)
    if TREAT == "faceted":
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.34, subdivisions=1, location=hinge)
    else:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.3, location=hinge)
        bpy.ops.object.shade_smooth()
    put(bpy.context.object, ink, bone)


def main():
    global TREAT
    args = parse()
    TREAT = args.treatment
    scene = bpy.context.scene
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o)
    world = bpy.data.worlds.new("dark")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = linear(DARK)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 1
    scene.world = world

    glow, ink = collection("glow"), collection("ink")
    sky(glow)
    sun(glow, ink)
    stars(glow)
    clouds(ink)
    mesas(ink)
    dividers(ink)

    # The light is the low sun behind, a little above, so edges toward it catch it.
    light = bpy.data.lights.new("sunlight", "SUN")
    light.energy = 4
    if TREAT == "painted":
        light.energy, light.color = 6, linear("#ffb070")[:3]
    lo = bpy.data.objects.new("sunlight", light)
    lo.rotation_euler = (math.radians(-60), 0, 0)
    scene.collection.objects.link(lo)
    fill = bpy.data.lights.new("fill", "SUN")
    fill.energy = 1.2
    if TREAT == "painted":
        fill.energy, fill.color = 1.0, linear("#4a9aa8")[:3]
    fo = bpy.data.objects.new("fill", fill)
    fo.rotation_euler = (math.radians(60), 0, math.radians(20))
    scene.collection.objects.link(fo)

    cam = bpy.data.cameras.new("camera")
    cam.lens = 30
    cam.sensor_fit = "VERTICAL"
    cam.sensor_height = 36
    co = bpy.data.objects.new("camera", cam)
    co.location = (0, -16, 0.6)
    co.rotation_euler = (math.radians(97), 0, 0)
    scene.collection.objects.link(co)
    scene.camera = co

    # Ink: Freestyle outlines on the drawn things only (clouds, rock, sun, dividers), not the sky.
    scene.render.use_freestyle = TREAT not in ("painted", "faceted")
    scene.render.line_thickness_mode = "ABSOLUTE"
    scene.render.line_thickness = (2.0 if args.preview else 3.0) * (0.6 if TREAT == "airbrush" else 1.3 if TREAT == "ink" else 1.0)
    ls = scene.view_layers[0].freestyle_settings.linesets[0]
    ls.select_by_collection = True
    ls.collection = ink
    ls.linestyle.color = INK
    if TREAT == "cassaday":
        # A brush line: thin at the ends, heavier on the flats of a stroke, a little unsteady.
        style = ls.linestyle
        style.thickness = 3.0
        taper = style.thickness_modifiers.new("taper", "ALONG_STROKE")
        taper.mapping = "CURVE"
        curve = taper.curve.curves[0]
        curve.points[0].location = (0, 0.35)
        curve.points[1].location = (1, 0.35)
        curve.points.new(0.3, 1.0)
        curve.points.new(0.7, 1.0)
        cal = style.thickness_modifiers.new("brush", "CALLIGRAPHY")
        cal.thickness_min, cal.thickness_max, cal.orientation = 0.6, 1.6, 60
        cal.blend = "MULTIPLY"
        noise = style.thickness_modifiers.new("hand", "NOISE")
        noise.amplitude, noise.period = 0.8, 40
        wobble = style.geometry_modifiers.new("wobble", "PERLIN_NOISE_1D")
        wobble.amplitude, wobble.frequency = 0.6, 8

    bloom(scene)
    if TREAT == "painted":
        # The oil-paint finish: bloom, then the anisotropic Kuwahara filter, which smears the
        # render into flat strokes that follow its edges.
        tree = scene.compositing_node_group
        glare = [n for n in tree.nodes if n.bl_idname == "CompositorNodeGlare"][0]
        glare.inputs["Threshold"].default_value = 0.8
        glare.inputs["Strength"].default_value = 0.9
        glare.inputs["Size"].default_value = 0.8
        out = [n for n in tree.nodes if n.bl_idname == "NodeGroupOutput"][0]
        kuw = tree.nodes.new("CompositorNodeKuwahara")
        kuw.inputs["Size"].default_value = 5 if args.preview else 9
        kuw.inputs["Sharpness"].default_value = 0.6
        tree.links.new(glare.outputs["Image"], kuw.inputs["Image"])
        tree.links.new(kuw.outputs["Image"], out.inputs[0])
        scene.eevee.use_volumetric_shadows = True
        scene.eevee.volumetric_tile_size = "4"
        scene.eevee.volumetric_end = 60
    if TREAT == "airbrush":
        glare = [n for n in scene.compositing_node_group.nodes if n.bl_idname == "CompositorNodeGlare"][0]
        glare.inputs["Threshold"].default_value = 0.7
        glare.inputs["Strength"].default_value = 0.8
        glare.inputs["Size"].default_value = 0.7
    scene.render.engine = "BLENDER_EEVEE"
    scene.eevee.taa_render_samples = 16 if args.preview else 64
    scene.render.resolution_x, scene.render.resolution_y = (540, 960) if args.preview else (1080, 1920)
    scene.view_settings.view_transform = "Standard"
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
