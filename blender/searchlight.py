"""A searchlight as in Blade Runner, for any lesson scene: a xenon spot high above the frame
whose beam shows as a shaft in thin haze, swinging slowly so its pool of light slides across
the surface below, with glare where it catches the glass and neon. (Jordan Cronenweth lit the
film with xenon spots under airships and smoke to show their shafts: theasc.com, "Blade
Runner: Cronenweth's Photography".) The user asked for it in place of the beat punch,
2026-09-26: "panning on the surface, and as it pans on the surface, you see glare".
"""

import math

import bpy

XENON = (0.82, 0.92, 1.0)  # a cold blue-white


def key(obj, path, frame):
    obj.keyframe_insert(path, frame=frame + 1)


def wet():
    """A wet street for the floor rather than black glass: rough enough that the searchlight's
    pool shows on it, glossy enough to glare."""
    m = bpy.data.materials.new("wet")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.03, 0.032, 0.035, 1)
    b.inputs["Roughness"].default_value = 0.32
    return m


def haze(scene, density=0.012):
    """Thin smoke through the whole scene, so the beam shows as a shaft."""
    tree = scene.world.node_tree
    vol = tree.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = density
    vol.inputs["Anisotropy"].default_value = 0.6  # scatters forward, towards a camera the beam faces
    tree.links.new(vol.outputs["Volume"], tree.nodes["World Output"].inputs["Volume"])
    scene.eevee.volumetric_tile_size = "4"
    scene.eevee.volumetric_samples = 96
    scene.eevee.volumetric_end = 80
    scene.eevee.use_volumetric_shadows = True


def searchlight(scene, frames, lamp, sweep, energy=90000, cone=11):
    """A spot at `lamp` (x, y, z) aimed along `sweep`, a list of (clip frame, (x, y, z))
    points on the surface; the aim eases between them."""
    aim = bpy.data.objects.new("searchlight-aim", None)
    scene.collection.objects.link(aim)
    for f, at in sweep:
        aim.location = at
        key(aim, "location", f)
    data = bpy.data.lights.new("searchlight", "SPOT")
    data.energy = energy
    data.color = XENON
    data.spot_size = math.radians(cone)
    data.spot_blend = 0.85
    data.shadow_soft_size = 0.05
    data.volume_factor = 1.0
    o = bpy.data.objects.new("searchlight", data)
    o.location = lamp
    scene.collection.objects.link(o)
    track = o.constraints.new("TRACK_TO")
    track.target, track.track_axis, track.up_axis = aim, "TRACK_NEGATIVE_Z", "UP_Y"
    return o


def streaks(scene, threshold=4.0):
    """A horizontal lens streak on the hottest highlights, after the bloom
    (hexagram.bloom must have made the compositor tree)."""
    tree = scene.compositing_node_group
    out = next(n for n in tree.nodes if n.bl_idname == "NodeGroupOutput")
    last = out.inputs[0].links[0].from_socket
    glare = tree.nodes.new("CompositorNodeGlare")
    glare.inputs["Type"].default_value = "Streaks"
    glare.inputs["Threshold"].default_value = threshold
    glare.inputs["Streaks"].default_value = 2
    glare.inputs["Streaks Angle"].default_value = 0
    glare.inputs["Strength"].default_value = 0.5
    tree.links.new(last, glare.inputs["Image"])
    tree.links.new(glare.outputs["Image"], out.inputs[0])
