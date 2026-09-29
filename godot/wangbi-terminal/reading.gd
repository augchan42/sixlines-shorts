# godot/wangbi-terminal/reading.gd
# The lesson's structural reading of a hexagram, after Wang Bi: places (略例·辯位), answering
# pairs (應, 略例·明卦適變通爻), and the master he names in his notes (hand-checked,
# series/wangbi-masters.json). Lines are bottom-first arrays of 0 (yin) and 1 (yang);
# line numbers run 1-6 from the bottom.
class_name Reading
extends RefCounted

const NO_MASTER := "WANG BI NAMES NO MASTER HERE"

static func load_data() -> Dictionary:
	var f := FileAccess.open("res://data/hexagrams.json", FileAccess.READ)
	return JSON.parse_string(f.get_as_text())

static func key(lines: Array) -> String:
	return "".join(lines.map(func(x): return str(int(x))))

static func lines_of(data: Dictionary, number: int) -> Array:
	for e in data.values():
		if int(e.number) == number:
			return e.lines.map(func(x): return int(x))
	return []

static func flip(lines: Array, n: int) -> Array:
	var out := lines.duplicate()
	out[n - 1] = 1 - int(out[n - 1])
	return out

# 辯位: the first and top lines have no fixed yin or yang place; 3 and 5 are yang places, 2 and 4 yin.
static func place(lines: Array, n: int) -> String:
	if n == 1 or n == 6:
		return "NO FIXED PLACE"
	return "CORRECT" if int(lines[n - 1]) == n % 2 else "NOT CORRECT"

static func is_centre(n: int) -> bool:
	return n == 2 or n == 5

static func partner(n: int) -> int:
	return n + 3 if n <= 3 else n - 3

static func answers(lines: Array, n: int) -> bool:
	return int(lines[n - 1]) != int(lines[partner(n) - 1])

static func log_row(lines: Array, n: int) -> String:
	var parts := ["L%d" % n, "YANG" if int(lines[n - 1]) == 1 else "YIN ", place(lines, n)]
	if is_centre(n):
		parts.append("CENTRE")
	if answers(lines, n):
		parts.append("ANSWERS L%d" % partner(n))
	return "  ".join(parts)

static func title(entry: Dictionary) -> String:
	return "%d  %s %s  %s" % [int(entry.number), entry.zh, String(entry.pinyin).to_upper(), entry.name]

static func trigram_rows(entry: Dictionary) -> Array:
	var out := []
	for side in ["upper", "lower"]:
		var t: Dictionary = entry[side]
		out.append("%s  %s %s, %s" % [side.to_upper(), t.zh, t.name, t.does])
	return out

static func master_lines(entry: Dictionary) -> Array:
	return entry.masters.map(func(m): return int(m.line))

static func wangbi_rows(entry: Dictionary) -> Array:
	var out: Array = entry.masters.map(func(m): return "L%d  %s  %s" % [int(m.line), m.zh, m.en])
	if out.is_empty():
		out.append(NO_MASTER)
	return out

# The next whole turn from any angle, so an interrupted turn still ends square to the viewer.
static func turn_target(turn: float) -> float:
	return (floor(turn / TAU + 1e-6) + 1.0) * TAU

# The nearest whole turn to any angle, forward or back: where a drag settles when released
# (main.gd), unlike turn_target, which always advances (the relay animation's own rule).
static func nearest_square(turn: float) -> float:
	return round(turn / TAU) * TAU
