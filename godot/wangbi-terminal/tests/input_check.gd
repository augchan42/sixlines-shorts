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

func type_number_kp(n: int) -> void:
	for c in str(n):
		await key(KEY_KP_0 + int(c) as Key)

func press(at: Vector2) -> void:
	var down := InputEventMouseButton.new()
	down.button_index = MOUSE_BUTTON_LEFT
	down.pressed = true
	down.position = at
	down.global_position = at
	Input.parse_input_event(down)
	await get_tree().process_frame

func move(at: Vector2) -> void:
	var m := InputEventMouseMotion.new()
	m.position = at
	m.global_position = at
	m.button_mask = MOUSE_BUTTON_MASK_LEFT
	Input.parse_input_event(m)
	await get_tree().process_frame

func release(at: Vector2) -> void:
	var up := InputEventMouseButton.new()
	up.button_index = MOUSE_BUTTON_LEFT
	up.pressed = false
	up.position = at
	up.global_position = at
	Input.parse_input_event(up)
	await get_tree().process_frame

func _ready() -> void:
	main = preload("res://main.tscn").instantiate()
	add_child(main)
	await get_tree().process_frame
	await get_tree().process_frame

	# The first hexagram (7, whose master is L2) plays its warble once on arrival, the same
	# "newly amber" rule set_lines uses, but only once, not in --record mode.
	check(main.sounds.has("warble"), "the warble plays once for the starting hexagram's master line")

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

	# G-entry also takes keypad digits.
	await key(KEY_G)
	await type_number_kp(9)
	await key(KEY_ENTER)
	check(Reading.key(main.lines) == "111011", "G, keypad 9, Enter goes to 9")

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

	# G, then a tap on a line, leaves entry mode: a following key flips that line rather than
	# being read as a digit for GO TO.
	await key(KEY_G)
	await click(point_for(1))
	check(not main.entry, "a tap on a line during G ends entry mode")
	var before_3: Array = main.lines.duplicate()
	await key(KEY_3)
	var after_3: Array = main.lines
	var changed_3 := []
	for i in 6:
		if int(before_3[i]) != int(after_3[i]):
			changed_3.append(i + 1)
	check(changed_3 == [3], "G, tap a line, then key 3 flips line 3 (changed: %s)" % str(changed_3))

	# An interrupted set_lines lays trigrams a full row below the log's FULL-TEXT height, not
	# wherever the previous reading's typing had gotten to (Review Focus, round 1): the typed
	# labels keep visible_characters_behavior = VC_CHARS_AFTER_SHAPING so layout always shapes
	# the whole string, regardless of how many characters are actually shown.
	await key(KEY_G)
	await type_number(7)
	await key(KEY_ENTER)
	for i in 3:
		await get_tree().process_frame  # partway into 7's typing, not all of it
	main.set_lines(Reading.flip(main.lines, 2))  # a new, differently-sized reading, mid-type
	var actual_gap: float = main.trigrams.position.y - main.log_label.position.y
	var total: int = main.log_label.get_total_character_count()
	main.log_label.visible_characters = total
	var expected_gap: float = main.log_label.get_combined_minimum_size().y + main.ROW_GAP
	main.log_label.visible_characters = 0
	check(is_equal_approx(actual_gap, expected_gap), "trigrams sits a full row below the log's full-text height after an interrupted set_lines (actual: %s expected: %s)" % [actual_gap, expected_gap])

	# Sound is on by default (turned on in _ready, since web only reaches _ready after START has
	# already unlocked audio); S, and a tap on SOUND, mute and unmute the whole Master bus, not
	# just the bed.
	var master_bus := AudioServer.get_bus_index("Master")
	var sound_before: bool = main.sound_on
	check(sound_before, "sound starts on")
	check(not AudioServer.is_bus_mute(master_bus), "the Master bus starts unmuted")
	check(main.sound_toggle.text == "SOUND ON", "SOUND ON shows while sound is on")
	await key(KEY_S)
	check(main.sound_on == (not sound_before), "S toggles sound")
	check(AudioServer.is_bus_mute(master_bus) == sound_before, "S mutes the Master bus")
	await click(main.sound_toggle.get_global_rect().get_center())
	check(main.sound_on == sound_before, "a tap on SOUND toggles sound back")
	check(not AudioServer.is_bus_mute(master_bus), "a tap on SOUND unmutes the Master bus again")

	# The key legend: shown on a keyboard device (this window has no touchscreen), dim, above the
	# prompt and clear of the WANG BI block.
	check(main.legend.visible, "the key legend shows without a touchscreen")
	check("1-6" in main.legend.text and "G, NUMBER, ENTER" in main.legend.text and "S " in main.legend.text and "DRAG" in main.legend.text, "the legend names 1-6, G entry, S and drag")
	check(main.legend.text.split("\n").size() <= 2, "the legend is at most two lines")
	check(main.legend.position.y + main.legend.get_combined_minimum_size().y < main.prompt.position.y, "the legend sits above the prompt")

	# 36 has the longest WANG BI row (two lines when wrapped); the legend must still clear it.
	main.set_lines(Reading.lines_of(main.data, 36))
	await get_tree().process_frame
	var shown: int = main.wangbi.visible_characters
	main.wangbi.visible_characters = main.wangbi.get_total_character_count()
	var wangbi_bottom: float = main.wangbi.position.y + main.wangbi.get_combined_minimum_size().y
	main.wangbi.visible_characters = shown
	check(wangbi_bottom < main.legend.position.y, "36's WANG BI block ends above the legend (%s < %s)" % [wangbi_bottom, main.legend.position.y])

	# Feature 1: a tap on the title opens the number pad, the same state as G entry.
	await click(main.title.get_global_rect().get_center())
	check(main.entry and main.pad_open, "a tap on the title opens the pad")
	check(main.prompt.text == "GO TO: _", "the pad shows the same GO TO: prompt as G entry")

	# While the pad is open, a line tap does nothing to the lines, and (being outside the pad)
	# cancels it, same as Esc.
	var before_pad_tap: Array = main.lines.duplicate()
	await click(point_for(1))
	check(main.lines == before_pad_tap, "a line tap does nothing while the pad is open")
	check(not main.pad_open and not main.entry, "a tap outside the pad (a line) cancels it")

	# Tapping 3, then 6, then GO goes to 36, and DEL removes the last digit.
	await click(main.title.get_global_rect().get_center())
	await click(main.pad_cell_point("3"))
	check(main.entering == "3" and main.prompt.text == "GO TO: 3_", "the pad's 3 types a digit")
	await click(main.pad_cell_point("6"))
	check(main.entering == "36" and main.prompt.text == "GO TO: 36_", "the pad's 6 makes GO TO: 36_")
	await click(main.pad_cell_point("DEL"))
	check(main.entering == "3", "DEL removes the last digit")
	await click(main.pad_cell_point("6"))
	await click(main.pad_cell_point("GO"))
	check(Reading.key(main.lines) == Reading.key(Reading.lines_of(main.data, 36)), "the pad's GO goes to 36")
	check(not main.pad_open and not main.entry, "GO closes the pad")

	# GO with nothing entered does nothing (quiet exit), same as bare Enter in G entry.
	await click(main.title.get_global_rect().get_center())
	var before_empty_go: Array = main.lines.duplicate()
	await click(main.pad_cell_point("GO"))
	check(main.lines == before_empty_go, "the pad's GO with nothing entered does nothing")
	check(not main.pad_open, "GO with nothing entered still closes the pad")

	# Typing digits by keyboard works while the pad is open, and Esc cancels it.
	await click(main.title.get_global_rect().get_center())
	await key(KEY_3)
	check(main.entering == "3" and main.pad_open, "typing a digit by keyboard works while the pad is open")
	await key(KEY_ESCAPE)
	check(not main.entry and not main.pad_open, "Esc cancels the pad")

	# G opens entry by keyboard without opening the pad.
	await key(KEY_G)
	check(main.entry and not main.pad_open, "G opens entry without the pad")
	await key(KEY_ESCAPE)

	# Feature 2: dragging the plot turns it, never flips a line, and settles back square.
	var turn_before_drag: float = main.plot.turn
	var line3_before_drag: Array = main.lines.duplicate()
	var drag_start_point := point_for(3)
	await press(drag_start_point)
	await move(drag_start_point + Vector2(50, 0))
	check(main.drag_moved, "a 50 px move counts as a drag, not a tap")
	check(not is_equal_approx(main.plot.turn, turn_before_drag), "dragging turns the plot")
	var turn_mid_drag: float = main.plot.turn
	await release(drag_start_point + Vector2(50, 0))
	check(main.lines == line3_before_drag, "a drag never flips the line under the press")
	check(not main.drag_active, "drag ends on release")
	await get_tree().create_timer(1.4).timeout  # the settle tween (1.2 s) finishes
	check(is_equal_approx(main.plot.turn, Reading.nearest_square(turn_mid_drag)), "the plot turns back square after a drag")
	check(is_equal_approx(main.plot.tilt, 0.0), "tilt settles back to 0 after a drag")

	# A press that moves under the 12 px threshold is a tap: it flips the line, on release.
	var line5_before_tap: Array = main.lines.duplicate()
	var tap_point := point_for(5)
	await press(tap_point)
	await move(tap_point + Vector2(3, 0))
	await release(tap_point + Vector2(3, 0))
	var after_tap: Array = main.lines
	var changed_tap := []
	for i in 6:
		if int(line5_before_tap[i]) != int(after_tap[i]):
			changed_tap.append(i + 1)
	check(changed_tap == [5], "a move under the threshold is still a tap, flipping the line on release (changed: %s)" % str(changed_tap))

	# Dragging kills a running turn tween (the relay's own 6 s turn), and takes turn over
	# directly for the rest of the drag.
	main.set_lines(Reading.flip(main.lines, 1))
	await get_tree().process_frame
	var drag2_point := point_for(2)
	await press(drag2_point)
	await move(drag2_point + Vector2(100, 0))
	var expected_turn: float = clampf(main.drag_start_turn + 100.0 * main.DRAG_TURN_PER_PX, main.drag_start_turn - main.DRAG_TURN_MAX, main.drag_start_turn + main.DRAG_TURN_MAX)
	check(is_equal_approx(main.plot.turn, expected_turn), "dragging kills the running relay tween and drives turn directly")
	await release(drag2_point + Vector2(100, 0))

	# The pad's opaque panel hides the whole reading under it, even 36's two-line WANG BI row,
	# and its cells are big enough for a thumb on a phone (at least 130 game px tall).
	var panel := Rect2(main.pad_bg.position, main.pad_bg.size)
	check(panel.position.x <= main.log_label.position.x and panel.end.x >= main.log_label.position.x + 960.0, "the pad panel spans the reading's width")
	check(panel.position.y <= main.log_label.position.y and panel.end.y >= wangbi_bottom, "the pad panel covers the log down to 36's WANG BI row")
	check(panel.end.y < main.legend.position.y, "the pad panel ends above the legend")
	check(main.pad_cells[0].size.y >= 130.0, "pad cells are at least 130 px tall")

	print("---")
	print("%d failed" % failed)
	get_tree().quit(1 if failed else 0)
