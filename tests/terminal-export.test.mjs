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

test("the engine downloads only after START", () => {
  assert.match(cfg, /html\/custom_html_shell="res:\/\/shell.html"/);
  const shell = read("../godot/wangbi-terminal/shell.html");
  const start = shell.indexOf("addEventListener('click'");
  assert.ok(start > 0, "a click handler");
  assert.ok(shell.indexOf("startGame(") > start, "startGame is called inside the click handler, not on load");
});
