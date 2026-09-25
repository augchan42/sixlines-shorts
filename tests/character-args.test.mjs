import assert from "node:assert/strict";
import test from "node:test";
import { characterFlags } from "../scripts/character-args.mjs";

test("turns a character's settings into character.py's options", () => {
  assert.deepEqual(characterFlags({ walls: [0, 1, 6], stand: true, wallStep: 0.8, camera: "high" }), [
    "--walls", "0,1,6", "--stand", "--wall-step", "0.8", "--camera", "high",
  ]);
});

test("leaves out a false switch and joins a pool's position", () => {
  assert.deepEqual(characterFlags({ glassWalls: false, pool: [470, 472] }), ["--pool", "470,472"]);
});

test("reads every character in series/characters.json", async () => {
  const { readFileSync } = await import("node:fs");
  const { characters } = JSON.parse(readFileSync(new URL("../series/characters.json", import.meta.url), "utf8"));
  const known = /^--(order|walls|spill|stand|grow|moon|phases|drop|drop-step|rain|lie-step|lift|lean|last-water|last|stagger|wall-step|wall-height|glass-walls|pool|camera|zoom|edge|water)$/;
  for (const c of characters) {
    for (const f of characterFlags(c.args).filter((f) => f.startsWith("--"))) assert.match(f, known, `${c.char}: ${f}`);
  }
});
