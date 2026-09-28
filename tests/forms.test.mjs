import assert from "node:assert/strict";
import test from "node:test";
import { formsArgs } from "../scripts/forms.mjs";

const spec = {
  char: "馬",
  bpm: 90,
  forms: [
    { key: "bone", label: "SHANG\nBONE", svg: "https://x/bone.svg" },
    { key: "kaishu", label: "TODAY\nREGULAR", hanzi: true },
  ],
};

test("forms run oldest first, the kaishu from hanzi data, labels with escaped breaks", () => {
  const args = formsArgs(spec, "/r", "/r/out/forms/馬.mp4");
  const at = (flag) => args[args.indexOf(flag) + 1];
  assert.equal(at("--forms"), "/r/public/local/ancient/馬-bone.json,/r/public/local/hanzi/馬.json");
  assert.equal(at("--labels"), "SHANG\\nBONE|TODAY\\nREGULAR");
  assert.equal(at("--bpm"), "90");
  assert.equal(at("--out"), "/r/out/forms/馬.mp4");
});

test("a label may not hold the separator", () => {
  assert.throws(() => formsArgs({ ...spec, forms: [{ key: "a", label: "A|B", svg: "x" }] }, "/r", "/o"), /\|/);
});
