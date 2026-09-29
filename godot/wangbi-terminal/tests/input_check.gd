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
	check("1-6" in main.legend.text and "G, NUMBER, ENTER" in main.legend.text and "S " in main.legend.text, "the legend names 1-6, G entry and S")
	check(main.legend.position.y + main.legend.get_combined_minimum_size().y < main.prompt.position.y, "the legend sits above the prompt")

	# 36 has the longest WANG BI row (two lines when wrapped); the legend must still clear it.
	main.set_lines(Reading.lines_of(main.data, 36))
	await get_tree().process_frame
	var shown: int = main.wangbi.visible_characters
	main.wangbi.visible_characters = main.wangbi.get_total_character_count()
	var wangbi_bottom: float = main.wangbi.position.y + main.wangbi.get_combined_minimum_size().y
	main.wangbi.visible_characters = shown
	check(wangbi_bottom < main.legend.position.y, "36's WANG BI block ends above the legend (%s < %s)" % [wangbi_bottom, main.legend.position.y])

	print("---")
	print("%d failed" % failed)
	get_tree().quit(1 if failed else 0)
