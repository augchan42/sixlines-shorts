import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { SFX, makeSfx } from "../scripts/sfx.mjs";

const dir = mkdtempSync(path.join(tmpdir(), "sfx-"));
const seconds = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }));

test("every sound the lesson and the terminal use has a recipe", () => {
  for (const k of ["teletype", "tick", "bed", "beacon", "beacon-level", "sweep", "chatter", "warble", "winddown", "hum", "relay", "printer"]) assert.ok(Array.isArray(SFX[k]), k);
});

test("the teletype train is the lesson's own, unchanged", () => {
  assert.deepEqual(SFX.teletype, ["-f", "lavfi", "-i", "aevalsrc=0.3*sin(2*PI*1900*t)*exp(-mod(t\\,0.04)*350):s=44100:d=20"]);
});

test("the terminal's tick is one click of the same sound", () => {
  const f = path.join(dir, "tick.ogg");
  makeSfx("tick", f);
  assert.ok(seconds(f) < 0.1);
});

test("makeSfx writes a file into new folders and refuses an unknown name", () => {
  const f = path.join(dir, "a", "relay.wav");
  makeSfx("relay", f);
  assert.ok(statSync(f).size > 1000);
  assert.throws(() => makeSfx("nope", f), /nope/);
});
