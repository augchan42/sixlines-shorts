# godot/wangbi-terminal/tests/metrics.gd
# Prints the terminal's text layout (label positions, wrapped heights, line counts, character
# counts) for 7 and 36, so the plain web page (web/terminal/) can be checked against it.
#   Godot --headless --path godot/wangbi-terminal -s res://tests/metrics.gd
extends SceneTree

func _init() -> void:
	var main: Control = load("res://main.tscn").instantiate()
	root.add_child(main)
	await process_frame
	await process_frame
	for n in [7, 36]:
		main.show_lines(Reading.lines_of(main.data, n))
		await process_frame
		print("== %d" % n)
		for name in ["title", "log_label", "trigrams", "wangbi", "legend", "prompt", "sound_toggle"]:
			var l: Label = main.get(name)
			print("%s pos=%s min=%s lines=%d chars=%d textlen=%d" % [name, l.position, l.get_combined_minimum_size(), l.get_line_count(), l.get_total_character_count(), l.text.length()])
		print("title rect=%s sound rect=%s" % [main.title.get_global_rect(), main.sound_toggle.get_global_rect()])
		print("line_spacing=%d" % main.log_label.get_theme_constant("line_spacing"))
	quit(0)
