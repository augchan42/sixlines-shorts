# godot/wangbi-terminal/tests/run.gd
# Headless checks of reading.gd against the lesson's own examples:  npm run test:godot
extends SceneTree

var failed := 0

func check(ok: bool, what: String) -> void:
	if ok:
		print("ok   ", what)
	else:
		failed += 1
		printerr("FAIL ", what)

func _init() -> void:
	var data := Reading.load_data()
	var army := [0, 1, 0, 0, 0, 0]  # 7 師
	check(data.size() == 64, "64 hexagrams load")
	check(Reading.key(army) == "010000" and data["010000"].number == 7, "7 is keyed by its lines")
	check(Reading.lines_of(data, 7) == army and Reading.lines_of(data, 65) == [], "number to lines")
	# 辯位: 1 and 6 have no fixed yin/yang place; 2 and 4 are yin places; 3 and 5 yang places.
	check(Reading.place(army, 1) == "NO FIXED PLACE" and Reading.place(army, 6) == "NO FIXED PLACE", "1 and 6")
	check(Reading.place(army, 2) == "NOT CORRECT", "7 L2 is yang in a yin place")
	check(Reading.place(army, 4) == "CORRECT", "7 L4 is yin in a yin place")
	check(Reading.place(army, 5) == "NOT CORRECT", "7 L5 is yin in a yang place")
	check(Reading.is_centre(2) and Reading.is_centre(5) and not Reading.is_centre(3), "centres are 2 and 5")
	check(Reading.partner(1) == 4 and Reading.partner(5) == 2 and Reading.partner(6) == 3, "partners")
	check(Reading.answers(army, 2) and Reading.answers(army, 5), "7: L2 answers L5")
	check(not Reading.answers(army, 1), "7: L1 and L4, both yin, do not answer")
	check(Reading.log_row(army, 2) == "L2  YANG  NOT CORRECT  CENTRE  ANSWERS L5", "7 L2 row")
	check(Reading.log_row(army, 1) == "L1  YIN   NO FIXED PLACE", "7 L1 row")
	check(Reading.title(data["010000"]) == "7  師 SHĪ  THE ARMY", "7 title")
	check(Reading.master_lines(data["010000"]) == [2], "7: master L2")
	check(Reading.master_lines(data["101001"]) == [5], "22: master L5")
	check(Reading.master_lines(data["110111"]) == [3], "10: master L3")
	check(Reading.trigram_rows(data["010000"]) == ["UPPER  坤 EARTH, YIELDING", "LOWER  坎 WATER, SINKING"], "7 trigrams")
	# Review Focus 2: flips in a row read as the final lines; an interrupted turn ends square.
	var l := Reading.flip(Reading.flip(Reading.flip(army, 2), 2), 5)
	check(army == [0, 1, 0, 0, 0, 0], "flip leaves its input alone")
	check(Reading.key(l) == "010010", "three flips give the final lines")
	check(is_equal_approx(Reading.turn_target(0.0), TAU) and is_equal_approx(Reading.turn_target(TAU * 1.4), TAU * 2), "turns end square")
	# Review Focus 3: several masters, and none.
	var two := {"masters": [{"line": 2, "zh": "甲之主", "en": "A"}, {"line": 5, "zh": "乙之主", "en": "B"}]}
	check(Reading.master_lines(two) == [2, 5], "two masters, both amber")
	check(Reading.wangbi_rows(two) == ["L2  甲之主  A", "L5  乙之主  B"], "a row for each master")
	check(Reading.wangbi_rows({"masters": []}) == [Reading.NO_MASTER] and Reading.master_lines({"masters": []}) == [], "no master: the sentence and no amber")
	quit(1 if failed else 0)
