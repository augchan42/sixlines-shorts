# What Blender can do with six lines

An inventory of Blender's basic tools, each read against our one subject: six lines, whole
(yang) or broken (yin), stacked into a hexagram. It is for choosing what to try next, not a plan.

The benchmark is the hexagram build (blender/hexagram.py). The user, 2026-09-26: the plain
build with its camera moves is the best we have, "because we're not really doing too much",
and after the quiet trigram test on 60 (blender/focus.py), "still the original stuff that we
had was the best".

Verdicts:
- **in use**: the build already does it.
- **quiet**: adds little and stays in the build's look; worth a test.
- **busy**: more motion or more things on screen; only with a clear reason.
- **ruled out**: the user has turned it down, or it is a literal picture of the meaning
  (see the memories no-literal-effects and calm-motion).

## What the build already uses

- Obsidian slabs with glowing edges (a Principled BSDF body, an emission edge strip).
- Each line rises into place on a half-beat, its edge flaring and settling (keyframed location and emission strength).
- A camera on a Track To constraint: low and close on line 1, it cranes up, orbits 25° to square-on and pushes in.
- Depth of field at f/0.1 on the target, so the glyph-rain plane behind goes soft.
- One area light straight down, a black world, the compositor's Bloom glare, Eevee with ray tracing.

## Camera

| Technique | What it would do to the lines | Verdict |
|---|---|---|
| Keyframed move on a Track To target (crane, orbit, push-in) | What the build does | in use |
| Easing through the Graph Editor (Bezier handles, ease in and out) | Moves that start and settle more softly or more sharply | in use (defaults); quiet to tune |
| Depth of field on a target | Rain goes soft behind the lines | in use |
| Rack focus (keyframe the focus target) | Sharpness moves from one line or trigram to another | quiet; tried on 60 as focus.py, and the build was preferred |
| Dolly zoom (move in while widening the lens) | The lines stay the same size while the rain behind stretches away | quiet but noticeable; one move, once |
| Lens change (focal length) | Flatter, more graphic lines at long lenses; deeper at wide ones | quiet |
| Orthographic camera | Lines as flat as the app's drawing, no perspective | quiet; loses the depth that makes the build |
| Follow Path camera (camera on a curve) | Smoother arcs than keyframed points | quiet; a way to do moves, not a look |
| Camera shake, handheld noise | | ruled out over hexagrams and trigrams |

## Moving the lines themselves

| Technique | What it would do | Verdict |
|---|---|---|
| Keyframed location, rotation, scale | Lines rise, part, turn | in use (rise) |
| Stagger (the same move offset line by line) | A wave through the six lines, bottom to top | in use (landing order); quiet for other moves |
| Overshoot and settle (Back easing, F-curve modifiers) | A line lands, dips a little, settles | quiet |
| Emission strength keyed per line | One line brightens while the others dim: a changing line, or the ruler of the hexagram | quiet; the least we could add |
| Emission colour keyed per line | A line turns amber (the end card's colour) | quiet; used in collapse.py |
| Drivers (one value drives another) | E.g. edge glow follows the camera distance | quiet; plumbing, not a look |
| A yin line opening or closing (its two halves slide) | Yang becomes yin or back: the change itself | quiet if slow; it is what a changing line means |
| Rigid body physics (falling, collapsing) | The 23 house collapse | busy; the user found it "okay… nothing great" |
| Cloth, soft body | Lines sag or drape | ruled out (literal) |
| Particles, force fields | Lines break into dust, pulled or blown | busy |

## Modifiers (change a slab's shape without editing it)

| Modifier | What it would do | Verdict |
|---|---|---|
| Bevel | Rounded edges that catch the light | quiet; small change to the slab |
| Solidify | Thickness, or an outline shell | quiet |
| Wireframe | A slab drawn only as its edges | quiet; a different look from obsidian |
| Array | Copies of a line or the hexagram in a row or into depth (a tunnel of hexagrams) | busy |
| Build | Faces appear one by one: a line draws itself | quiet if slow |
| Boolean | Cut one shape by another: the gap in a yin line cut out of a yang slab | quiet; a way to show yang turning yin |
| Screw, Simple Deform (bend, twist, taper) | Lines curl or twist | busy; drifts from the app's straight lines |
| Wave, Displace | A ripple through a line | ruled out (it read as water) |
| Explode | Line breaks into flying pieces | busy |
| Remesh, Decimate | Low-poly or blocky slabs | busy; a new style |
| Mirror | Symmetric halves: the yin halves kept equal | a way to build, not a look |

## Geometry Nodes (procedural building)

| Technique | What it would do | Verdict |
|---|---|---|
| Instance on points | All 64 hexagrams laid out as a grid or ring from the lines data | busy; for an overview short, not a lesson |
| Curve to mesh | Lines drawn along a path, as the neon characters are | quiet; the character look already does this |
| Per-instance attributes (colour, offset) | Each line its own delay or brightness from data | a way to build, not a look |
| Mesh to volume | Lines as glowing smoke | busy |
| Distribute points on faces | Dust or sparks on the slabs | busy |

## Materials

| Technique | What it would do | Verdict |
|---|---|---|
| Emission | The glowing edges | in use |
| Glossy dark body (obsidian) | Slabs that reflect the rain | in use |
| Fresnel or Layer Weight | Edges of the faces glow more at grazing angles | quiet |
| Glass, refraction | Clear slabs; weak in Eevee | busy |
| Animated textures (noise, gradient) | Light moving along a slab | busy |

## Light and world

| Technique | What it would do | Verdict |
|---|---|---|
| Area light from above | The build's key light | in use |
| Rim or back light | Thin bright outlines on the slabs' far edges | quiet |
| Light linking (a light that lights only some objects) | Light only the stressed line or trigram | quiet |
| Spot light moving across the surface | The searchlight | ruled out |
| Volumetric haze, light shafts | Visible beams through smoke | ruled out with the searchlight |
| HDRI world | Real-world reflections in the glass | busy; breaks the black |

## Compositor (after the render)

| Node | What it would do | Verdict |
|---|---|---|
| Glare: Bloom | Soft glow round the edges | in use |
| Glare: Streaks, Fog Glow | Lens streaks, heavy glow | busy (streaks were part of the searchlight) |
| Lens Distortion, chromatic aberration | Coloured fringes at the frame edge | quiet |
| Vignette (Ellipse Mask and Blur) | Darker corners | quiet |
| Film grain (noise) | Texture over the frame | quiet |

## Render settings

| Setting | What it would do | Verdict |
|---|---|---|
| Motion blur | Rising lines and camera moves smear slightly, like film | quiet; costs render time |
| Eevee vs Cycles | Cycles gives true glass and light bounce at many times the render time | Eevee stays |

## The quietest additions, if we add anything

These keep the build as it is and change one thing:

1. **One line brightens.** Key one slab's emission up and the others down after the build lands: the ruler or a changing line. No new objects.
2. **A line changes.** A yang slab parts into yin (or yin closes into yang) slowly, by moving its halves or with a Boolean. It shows what "change" means in the Book of Changes.
3. **A dolly zoom** in place of the push-in: the hexagram holds its size while the rain behind stretches away.
4. **Motion blur** on the existing build.
5. **A rim light**, so the slabs' outlines show against the rain.

## Sources

- Blender Studio, Motion Graphics course and techniques reference: https://studio.blender.org/training/motion-graphics/
- Blender Studio, Basic Camera Movement & Cinematography: https://studio.blender.org/training/motion-graphics/58e2218b88ac8f053af9d642/
- Blender Manual, Cameras: https://docs.blender.org/manual/en/latest/render/cameras.html
- Blender Manual, Modifiers: https://docs.blender.org/manual/en/2.80/modeling/modifiers/index.html
- Brandon3D, All 54 Blender Modifiers Explained: https://brandon3d.com/modifiers/
- Ryosuke, Using Geometry Nodes for Motion Graphics: https://whoisryosuke.com/blog/2025/geometry-nodes-for-motion-graphics/
- Dolly zoom in Blender: https://yelzkizi.org/how-do-i-create-a-dolly-zoom-effect-in-blender/
- Blender Manual, Graph Editor F-curves: https://docs.blender.org/manual/en/2.93/editors/graph_editor/fcurves/introduction.html
- Overshoot as an animation principle: https://www.vdodna.com/blog/overshoot-the-missing-animation-principle/
- Blender Manual, EEVEE light settings: https://docs.blender.org/manual/en/latest/render/eevee/light_settings.html
- Blender Studio, Lighting & Rendering Theory (Fundamentals 4.5): https://studio.blender.org/training/blender-fundamentals-45-lts/blender_4-5_lts_lighting-rendering-theory-cycles/
