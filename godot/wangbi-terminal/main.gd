# godot/wangbi-terminal/main.gd
extends Control

const GREEN := Color("#7dff8a")
const DIM := Color(0.49, 1.0, 0.54, 0.45)
const CYAN := Color("#5ee7ff")
const PROMPT := "TAP A LINE TO CHANGE IT"
const LEGEND := "1-6  FLIP A LINE        S  SOUND ON/OFF\nG, NUMBER, ENTER  GO TO A HEXAGRAM"
const LOG_TOP := 960.0
const ROW_GAP := 45.0  # about one row tall at the 34 px body size, between stacked blocks

var data := Reading.load_data()
var lines: Array = [0, 1, 0, 0, 0, 0]
var plot := Plot.new()
var title := Label.new()
var log_label := Label.new()
var trigrams := Label.new()
var wangbi := Label.new()
var prompt := Label.new()
var legend := Label.new()  # the keys; hidden on touchscreens and in recordings
var sound_toggle := Label.new()

func font() -> Font:
	var pixel := load("res://fonts/PixelOperator-Bold.ttf") as FontFile
	pixel.fallbacks = [load("res://fonts/NotoSansTC-subset.ttf")]
	return pixel

func label(l: Label, pos: Vector2, size: int, colour: Color) -> void:
	l.position = pos
	l.size = Vector2(960, 0)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.visible_characters_behavior = TextServer.VC_CHARS_AFTER_SHAPING
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
	label(log_label, Vector2(60, LOG_TOP), 34, GREEN)
	label(trigrams, Vector2(60, 1250), 34, DIM)
	label(wangbi, Vector2(60, 1380), 34, GREEN)
	label(legend, Vector2(60, 1665), 28, DIM)
	legend.text = LEGEND
	label(prompt, Vector2(60, 1770), 38, CYAN)
	label(sound_toggle, Vector2(760, 1770), 30, DIM)
	sound_toggle.size = Vector2(260, 0)
	sound_toggle.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	sound_toggle.text = "SOUND ON" if sound_on else "SOUND OFF"
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
	# Keys mean nothing on a phone, and recordings for shorts stay as clean as before.
	legend.visible = not DisplayServer.is_touchscreen_available() and not ("--record" in args)
	show_lines(lines)
	play("sweep")
	# The first hexagram's own master line(s) count as newly amber too (set_lines' rule), but
	# not in --record mode: record() immediately shows its own fixed starting hexagram and runs
	# its own scripted warbles, so playing one here would double up.
	if not ("--record" in args) and not Reading.master_lines(data[Reading.key(lines)]).is_empty():
		play("warble")
	set_sound(sound_on)  # on by default: web starts this only after START, so audio is already unlocked
	if "--record" in args:
		typing_speed = 60.0  # record mode only; the web terminal keeps 25 characters a second
		record()

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
	# Stack each block below the real (wrapped) height of the one above it, so a longer WANG BI
	# row never overlaps the trigrams, and a longer log or trigrams block never overlaps what
	# follows it.
	trigrams.position.y = log_label.position.y + log_label.get_combined_minimum_size().y + ROW_GAP
	wangbi.position.y = trigrams.position.y + trigrams.get_combined_minimum_size().y + ROW_GAP

# Input, typing, the turn and sound. Every change goes through set_lines, so what shows is
# always the reading of the lines as they are now (Review Focus 2).
signal reading_typed

# Linear volumes, set on each player's volume_db with linear_to_db(): tick, sweep, warble and
# winddown are the Wang Bi lesson's own mix (series/explainers/wangbi-lesson.json "mix"); relay
# and bed are not in that mix (they're the terminal's own) but keep the same shape.
const MIX := {
	"tick": 0.8,
	"sweep": 0.7,
	"warble": 0.5,
	"winddown": 0.6,
	"relay": 1.0,
	"bed": 0.5,
}

var sounds := {}
var typed := 0.0
var typing_speed := 25.0  # characters a second, as the lesson types
var tween: Tween
var entering := ""  # digits typed after G; "" when not entering a number
var entry := false
var sound_on := true  # sound starts on, bed playing; SOUND/S mutes/unmutes the whole Master bus

func sound(name: String) -> AudioStreamPlayer:
	if not sounds.has(name):
		var p := AudioStreamPlayer.new()
		p.stream = load("res://sfx/%s.ogg" % name)
		p.volume_db = linear_to_db(MIX.get(name, 1.0))
		if name == "tick":
			p.max_polyphony = 2  # ticks can overlap at 25 characters a second
		add_child(p)
		sounds[name] = p
	return sounds[name]

func play(name: String) -> void:
	sound(name).play()

func set_lines(l: Array) -> void:
	var before: Array = Reading.master_lines(data[Reading.key(lines)])
	entry = false
	show_lines(l)
	typed = 0.0
	for x in [log_label, trigrams, wangbi]:
		x.visible_characters = 0
	if tween:
		tween.kill()
	tween = create_tween()
	tween.tween_property(plot, "turn", Reading.turn_target(plot.turn), 6.0).set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_IN_OUT)
	play("relay")
	var now: Array = Reading.master_lines(data[Reading.key(l)])
	var newly_amber := false
	for n in now:
		if n not in before:
			newly_amber = true
			break
	if newly_amber:
		play("warble")

func _process(delta: float) -> void:
	var total := 0
	for x in [log_label, trigrams, wangbi]:
		total += x.get_total_character_count()
	if typed >= total:
		return
	var before := int(typed)
	typed = minf(typed + delta * typing_speed, total)
	var left := int(typed)
	for x in [log_label, trigrams, wangbi]:
		x.visible_characters = mini(left, x.get_total_character_count())
		left -= x.visible_characters
	if int(typed) > before:
		play("tick")
	if typed >= total:
		play("winddown")
		reading_typed.emit()

func set_sound(on: bool) -> void:
	sound_on = on
	AudioServer.set_bus_mute(AudioServer.get_bus_index("Master"), not sound_on)
	var p := sound("bed")
	(p.stream as AudioStreamOggVorbis).loop = true
	if not p.playing:
		p.play()  # keeps looping under the mute so it's already playing when SOUND turns back on
	sound_toggle.text = "SOUND ON" if sound_on else "SOUND OFF"

func toggle_sound() -> void:
	set_sound(not sound_on)

func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if sound_toggle.get_global_rect().grow(20).has_point(event.position):
			toggle_sound()
			return
		var n := plot.line_at(event.position)
		if n:
			set_lines(Reading.flip(lines, n))
	elif event is InputEventKey and event.pressed and not event.echo:
		if entry:
			if event.keycode >= KEY_0 and event.keycode <= KEY_9 and entering.length() < 2:
				entering += str(event.keycode - KEY_0)
			elif event.keycode >= KEY_KP_0 and event.keycode <= KEY_KP_9 and entering.length() < 2:
				entering += str(event.keycode - KEY_KP_0)
			elif event.keycode == KEY_ENTER or event.keycode == KEY_KP_ENTER:
				var l := Reading.lines_of(data, int(entering)) if entering != "" else []
				entry = false
				if not l.is_empty():
					set_lines(l)
			elif event.keycode == KEY_ESCAPE:
				entry = false
			prompt.text = ("GO TO: %s_" % entering) if entry else PROMPT
		elif event.keycode == KEY_G:
			entry = true
			entering = ""
			prompt.text = "GO TO: _"
		elif event.keycode == KEY_S:
			toggle_sound()
		elif event.keycode >= KEY_1 and event.keycode <= KEY_6:
			set_lines(Reading.flip(lines, event.keycode - KEY_0))

# Record mode (-- --record): a fixed sequence for shorts, recorded by scripts/terminal-record.mjs.
func record() -> void:
	show_lines([1, 1, 1, 1, 1, 1])
	for n in [1, 3, 4, 5, 6]:
		await get_tree().create_timer(1.0).timeout
		set_lines(Reading.flip(lines, n))
	for step in [0, 2, 2]:
		if step:
			set_lines(Reading.flip(lines, step))
		await reading_typed
		await get_tree().create_timer(3.0).timeout
	get_tree().quit()
