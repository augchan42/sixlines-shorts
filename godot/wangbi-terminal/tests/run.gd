# Headless checks:  npm run test:godot
extends SceneTree

var failed := 0

func check(ok: bool, what: String) -> void:
	if ok:
		print("ok   ", what)
	else:
		failed += 1
		printerr("FAIL ", what)

func _init() -> void:
	check(Reading.version() == "1", "Reading loads")
	quit(1 if failed else 0)
