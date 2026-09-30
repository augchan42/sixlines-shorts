// The Leibniz lesson's plate: the scan of the diagram Bouvet sent Leibniz in 1701 (Leibniz
// Bibliothek Hannover, LBr 105, Bl. 27), from Wikimedia Commons, public domain, 1313x1262.
//
//   node scripts/leibniz-plate.mjs     # writes public/local/leibniz/plate.jpg
//
// The file is not committed; the URL and Commons's sha1 are its provenance.
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
export const PLATE = {
  page: "https://commons.wikimedia.org/wiki/File:Diagram_of_I_Ching_hexagrams_owned_by_Gottfried_Wilhelm_Leibniz,_1701.jpg",
  url: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Diagram_of_I_Ching_hexagrams_owned_by_Gottfried_Wilhelm_Leibniz%2C_1701.jpg",
  sha1: "d5ecb7901ce4d5aa563780892ab6ab52453d2c73",
  size: [1313, 1262],
  file: "local/leibniz/plate.jpg",
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const res = await fetch(PLATE.url, { headers: { "User-Agent": "sixlines-shorts (https://sixlines.day)" } });
  if (!res.ok) throw new Error(`${res.status} ${PLATE.url}`);
  const body = Buffer.from(await res.arrayBuffer());
  const hash = createHash("sha1").update(body).digest("hex");
  if (hash !== PLATE.sha1) throw new Error(`plate sha1 ${hash}, expected ${PLATE.sha1}`);
  const out = path.join(root, "public", PLATE.file);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, body);
  console.log(`wrote ${path.relative(root, out)} (${body.length} bytes)`);
}
