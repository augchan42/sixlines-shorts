# godot/wangbi-terminal/main.gd
extends Control

const GREEN := Color("#7dff8a")
const DIM := Color(0.49, 1.0, 0.54, 0.45)
const CYAN := Color("#5ee7ff")
const PROMPT := "TAP A LINE TO CHANGE IT"

var data := Reading.load_data()
var lines: Array = [0, 1, 0, 0, 0, 0]
var plot := Plot.new()
var title := Label.new()
var log_label := Label.new()
var trigrams := Label.new()
var wangbi := Label.new()
var prompt := Label.new()
var sound_toggle := Label.new()

func font() -> Font:
	var pixel := load("res://fonts/PixelOperator-Bold.ttf") as FontFile
	pixel.fallbacks = [load("res://fonts/NotoSansTC-subset.ttf")]
	return pixel

func label(l: Label, pos: Vector2, size: int, colour: Color) -> void:
	l.position = pos
	l.size = Vector2(960, 0)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	l.add_theme_font_override("font", font())
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", colour)
	l.add_theme_constant_override("outline_size", 6)
	l.add_theme_color_override("font_outline_color", Color(colour, 0.35))
	add_child(l)

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	var frame := ReferenceRect.new()
	frame.border_color = GREEN
	frame.border_width = 4
	frame.editor_only = false
	frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	frame.position = Vector2(40, 40)
	frame.size = Vector2(1000, 1840)
	add_child(frame)
	label(title, Vector2(60, 70), 44, GREEN)
	plot.position = Vector2(540, 560)
	add_child(plot)
	label(log_label, Vector2(60, 960), 34, GREEN)
	label(trigrams, Vector2(60, 1250), 34, DIM)
	label(wangbi, Vector2(60, 1380), 34, GREEN)
	label(prompt, Vector2(60, 1770), 38, CYAN)
	label(sound_toggle, Vector2(760, 1770), 30, DIM)
	sound_toggle.size = Vector2(260, 0)
	sound_toggle.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	sound_toggle.text = "SOUND OFF"
	var scan := ColorRect.new()
	scan.set_anchors_preset(Control.PRESET_FULL_RECT)
	scan.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var m := ShaderMaterial.new()
	m.shader = load("res://scanlines.gdshader")
	scan.material = m
	add_child(scan)
	# Temporary: --lines <key> picks the hexagram to show, e.g. for stills and recordings.
	var args := OS.get_cmdline_user_args()
	var i := args.find("--lines")
	if i != -1 and i + 1 < args.size():
		var key := args[i + 1]
		var picked := []
		for c in range(key.length()):
			picked.append(int(key[c]))
		lines = picked
	show_lines(lines)

func show_lines(l: Array) -> void:
	lines = l
	var e: Dictionary = data[Reading.key(l)]
	title.text = Reading.title(e)
	var rows := []
	for n in range(6, 0, -1):
		rows.append(Reading.log_row(l, n))
	log_label.text = "\n".join(rows)
	trigrams.text = "\n".join(Reading.trigram_rows(e))
	wangbi.text = "WANG BI\n" + "\n".join(Reading.wangbi_rows(e))
	plot.lines = l
	plot.amber = Reading.master_lines(e)
	prompt.text = PROMPT
