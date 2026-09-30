// The Leibniz lesson's guqin: one plucked note from xserra's "Guqin-1.wav" (Freesound 161908,
// CC BY 4.0: credit "Guqin: xserra, Freesound, CC BY 4.0"), notes played by a student in a
// Beijing guqin shop, 23 May 2012. The user downloads the source (Freesound needs a login) to
// public/local/sfx/sources/; it is not committed, and its sha256 is its provenance. The user
// chose xserra's recording, 2026-09-30: "of the guqin sounds i like the xserra one the most".
//
//   node scripts/guqin-note.mjs          # writes public/local/sfx/guqin-{a,b,c}.wav, the candidates
//
// Each candidate starts at a clean onset in the source, is cut from low rumble below 200 Hz (the
// phone band starts about 250 Hz) and fades out over its last second.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
export const GUQIN = {
  page: "https://freesound.org/people/xserra/sounds/161908/",
  licence: "https://creativecommons.org/licenses/by/4.0/",
  credit: "Guqin: xserra, Freesound, CC BY 4.0",
  source: "local/sfx/sources/161908__xserra__guqin-1.wav",
  sha256: "c8eb71cb7715c71206cd713b5c4c5b075534d41f385a182b8dd4db0f0c5bfd1a",
  // Onsets found by energy jumps; a D near 292 Hz, then two takes of a G near 390 Hz that ring ~3 s.
  notes: { a: { at: 8.45, secs: 2.3 }, b: { at: 51.8, secs: 3.0 }, c: { at: 61.85, secs: 3.1 } },
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const src = path.join(root, "public", GUQIN.source);
  const hash = createHash("sha256").update(readFileSync(src)).digest("hex");
  if (hash !== GUQIN.sha256) throw new Error(`guqin sha256 ${hash}, expected ${GUQIN.sha256}`);
  for (const [k, { at, secs }] of Object.entries(GUQIN.notes)) {
    const out = path.join(root, "public", `local/sfx/guqin-${k}.wav`);
    // The onsets are found in 50 ms steps, so start 60 ms early to keep the whole attack.
    const from = Math.max(0, at - 0.06);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(from), "-t", String(secs), "-i", src, "-af", `highpass=f=200,afade=t=in:d=0.005,afade=t=out:st=${secs - 1}:d=1`, "-ar", "48000", "-ac", "2", out]);
    console.log(`wrote ${path.relative(root, out)} (${secs} s from ${at} s)`);
  }
}
