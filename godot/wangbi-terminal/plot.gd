# godot/wangbi-terminal/plot.gd
# The hexagram as a wireframe, as the lesson's readout plots it (Readout.tsx boxEdges): each line
# a box 6.2 x 0.5 x 0.45, seen from 16 units, turned `turn` radians about the vertical.
class_name Plot
extends Node2D

const LINE_W := 6.2
const LINE_H := 0.5
const GAP := 0.3
const TRIGRAM_GAP := 0.9
const YIN_GAP := 0.7
const DEPTH := 0.45
const DIST := 16.0
const GREEN := Color("#7dff8a")
const AMBER := Color("#ffb347")
const TAP_PAD := 18.0  # px added around a line's outline, so a thin line is easy to tap

@export var scale_px := 120.0
var lines: Array = [1, 1, 1, 1, 1, 1]:
	set(v):
		lines = v
		queue_redraw()
var amber: Array = []:
	set(v):
		amber = v
		queue_redraw()
var turn := 0.0:
	set(v):
		turn = v
		queue_redraw()
# A small tilt about the horizontal axis, from a vertical drag (main.gd); 0 outside a drag.
var tilt := 0.0:
	set(v):
		tilt = v
		queue_redraw()
var outlines := {}  # line number -> Array of PackedVector2Array, in local px, as last drawn

static func line_z(i: int) -> float:
	var total := 6 * LINE_H + 4 * GAP + TRIGRAM_GAP
	return -total / 2 + LINE_H / 2 + i * (LINE_H + GAP) + (TRIGRAM_GAP - GAP if i >= 3 else 0.0)

func slabs() -> Array:
	var out := []
	for i in 6:
		var z := line_z(i)
		if int(lines[i]) == 1:
			out.append([i, -LINE_W / 2, LINE_W / 2, z])
		else:
			var w := (LINE_W - YIN_GAP) / 2
			out.append([i, -LINE_W / 2, -LINE_W / 2 + w, z])
			out.append([i, LINE_W / 2 - w, LINE_W / 2, z])
	return out

func project(p: Vector3) -> Vector2:
	var rx := p.x * cos(turn) - p.y * sin(turn)
	var ry0 := p.x * sin(turn) + p.y * cos(turn)
	# tilt turns the same point a little further, about the horizontal (x) axis.
	var ry := ry0 * cos(tilt) - p.z * sin(tilt)
	var rz := ry0 * sin(tilt) + p.z * cos(tilt)
	var k := DIST / (DIST + ry)
	return Vector2(rx * k, -rz * k) * scale_px

func _draw() -> void:
	outlines.clear()
	for s in slabs():
		var n: int = s[0] + 1
		var colour := AMBER if n in amber else GREEN
		var c := PackedVector2Array()
		for x in [s[1], s[2]]:
			for y in [-DEPTH / 2, DEPTH / 2]:
				for z in [s[3] - LINE_H / 2, s[3] + LINE_H / 2]:
					c.append(project(Vector3(x, y, z)))
		# Corner index is x*4 + y*2 + z; the 12 edges join corners that differ in one bit.
		for a in 8:
			for b in [1, 2, 4]:
				if a & b == 0:
					draw_line(c[a], c[a | b], colour, 2.0, true)
		var hull := Geometry2D.convex_hull(c)
		var padded: Array = Geometry2D.offset_polygon(hull, TAP_PAD)
		outlines[n] = outlines.get(n, []) + (padded if padded.size() else [hull])

func line_at(global_point: Vector2) -> int:
	var p := to_local(global_point)
	for n in outlines:
		for poly in outlines[n]:
			if Geometry2D.is_point_in_polygon(p, poly):
				return n
	return 0
