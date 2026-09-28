// tests/terminal-export.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const cfg = read("../godot/wangbi-terminal/export_presets.cfg");

test("the web preset packs the data, single-threaded, into build/web", () => {
  assert.match(cfg, /platform="Web"/);
  assert.match(cfg, /include_filter="[^"]*data\/\*\.json/);
  assert.match(cfg, /variant\/thread_support=false/);
  assert.match(cfg, /export_path="build\/web\/index.html"/);
});

const shell = read("../godot/wangbi-terminal/shell.html");

test("the engine downloads only after START", () => {
  assert.match(cfg, /html\/custom_html_shell="res:\/\/shell.html"/);
  const start = shell.indexOf("addEventListener('click'");
  assert.ok(start > 0, "a click handler");
  assert.ok(shell.indexOf("startGame(") > start, "startGame is called inside the click handler, not on load");
});

test("START ignores a second tap", () => {
  const clickAt = shell.indexOf("addEventListener('click'");
  assert.match(shell, /let started = false/, "a started flag");
  assert.match(shell, /if \(started\) return;/, "the handler bails out early on a repeat click");
  assert.match(shell, /started = true;/, "the flag is set before startGame runs");
  assert.match(shell, /go\.disabled = true;/, "the button is disabled before startGame runs");
  const startedAt = shell.indexOf("started = true;", clickAt);
  const startGameAt = shell.indexOf("engine.startGame(", clickAt);
  assert.ok(clickAt < startedAt && startedAt < startGameAt, "started is set, inside the click handler, before startGame() is called");
});

test("START unlocks audio synchronously in the click gesture, before startGame", () => {
  const clickAt = shell.indexOf("addEventListener('click'");
  const startGameAt = shell.indexOf("engine.startGame(", clickAt);
  assert.ok(startGameAt > clickAt, "startGame is called inside the click handler");
  const acAt = shell.indexOf("window.AudioContext || window.webkitAudioContext", clickAt);
  assert.ok(acAt > clickAt && acAt < startGameAt, "an AudioContext class is looked up before startGame");
  const newCtxAt = shell.indexOf("new AC()", clickAt);
  assert.ok(newCtxAt > clickAt && newCtxAt < startGameAt, "a context is constructed synchronously before startGame");
  const resumeAt = shell.indexOf(".resume()", clickAt);
  assert.ok(resumeAt > clickAt && resumeAt < startGameAt, "the context is resumed before startGame");
  const overrideAt = shell.indexOf("window.AudioContext = useExisting", clickAt);
  assert.ok(overrideAt > clickAt && overrideAt < startGameAt, "window.AudioContext is replaced before startGame so the engine reuses this context");
  assert.match(shell, /window\.AudioContext = RealAudioContext/, "the real constructor is restored after startGame settles");
});

test("a startGame() rejection shows a plain error, not [object Object]", () => {
  assert.match(shell, /String\(err\?\.message \?\? err\)/);
});
