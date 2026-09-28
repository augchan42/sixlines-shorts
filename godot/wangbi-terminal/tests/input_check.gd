# godot/wangbi-terminal/tests/input_check.gd
# A windowed check of input handling that the headless tests (run.gd) can't reach: Plot's
# line_at hit-testing needs a real canvas to draw to before it has outlines to test against.
# Instantiates main.tscn, waits two frames, then drives it with real InputEvents the way a
# finger or a keyboard would. Run with: npm run test:godot-input (opens a window briefly, then
# quits itself with an exit code).
extends Node

var failed := 0
var main: Control

func check(ok: bool, what: String) -> void:
	if ok:
		print("ok   ", what)
	else:
		failed += 1
		printerr("FAIL ", what)

# A point that lands inside line n's outline whether it's drawn yin (two slabs, a gap in the
# middle) or yang (one slab, full width): a quarter of the way in from the left edge, using the
# same projection Plot itself draws with, so it tracks the turn as it animates.
func point_for(line_n: int) -> Vector2:
	var i := line_n - 1
	var local: Vector2 = main.plot.project(Vector3(-1.55, 0.0, Plot.line_z(i)))
	return main.plot.to_global(local)

func click(at: Vector2) -> void:
	var down := InputEventMouseButton.new()
	down.button_index = MOUSE_BUTTON_LEFT
	down.pressed = true
	down.position = at
	down.global_position = at
	Input.parse_input_event(down)
	await get_tree().process_frame
	var up := down.duplicate()
	up.pressed = false
	Input.parse_input_event(up)
	await get_tree().process_frame

func key(code: Key) -> void:
	var down := InputEventKey.new()
	down.keycode = code
	down.pressed = true
	Input.parse_input_event(down)
	await get_tree().process_frame
	var up := InputEventKey.new()
	up.keycode = code
	up.pressed = false
	Input.parse_input_event(up)
	await get_tree().process_frame

func type_number(n: int) -> void:
	for c in str(n):
		await key(KEY_0 + int(c) as Key)

func _ready() -> void:
	main = preload("res://main.tscn").instantiate()
	add_child(main)
	await get_tree().process_frame
	await get_tree().process_frame

	# Tapping each line flips it. Each tap lands while the previous tap's 6-second turn tween
	# is still running, so this also covers a tap mid-turn hitting the right line, not a
	# neighbour.
	for n in range(1, 7):
		var before: Array = main.lines.duplicate()
		await click(point_for(n))
		var after: Array = main.lines
		var changed := []
		for i in 6:
			if int(before[i]) != int(after[i]):
				changed.append(i + 1)
		check(changed == [n], "tap on L%d flips only L%d (changed: %s)" % [n, n, str(changed)])

	# Jump to a known hexagram (7) before the fast-tap check, so it starts from a known line.
	await key(KEY_G)
	await type_number(7)
	await key(KEY_ENTER)
	check(Reading.key(main.lines) == "010000", "G 7 Enter goes to 7")

	# Five fast taps on 7's L2 end with L2 yin, i.e. 2 坤 ("000000"). "Fast": one frame between
	# taps, no time for the turn to move far.
	for i in 5:
		await click(point_for(2))
	check(Reading.key(main.lines) == "000000", "five taps on 7's L2 end on 2 坤")
	check(main.typed < 3.0, "typing restarted after the last flip")

	# G 2 2 Enter goes to 22, and only L5 is amber.
	await key(KEY_G)
	await type_number(22)
	await key(KEY_ENTER)
	check(Reading.key(main.lines) == "101001", "G 2 2 Enter goes to 22")
	check(main.plot.amber == [5], "only L5 is amber on 22 (amber: %s)" % str(main.plot.amber))

	# G 9 9 Enter does nothing (no hexagram 99).
	var before_99: Array = main.lines.duplicate()
	await key(KEY_G)
	await type_number(99)
	await key(KEY_ENTER)
	check(main.lines == before_99, "G 9 9 Enter does nothing")

	# S, and a tap on SOUND, toggle the bed.
	var bed_before: bool = main.bed_on
	await key(KEY_S)
	check(main.bed_on == (not bed_before), "S toggles the bed")
	await click(main.sound_toggle.get_global_rect().get_center())
	check(main.bed_on == bed_before, "a tap on SOUND toggles the bed back")

	print("---")
	print("%d failed" % failed)
	get_tree().quit(1 if failed else 0)
