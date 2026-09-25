// Fetches the paintings the painting lessons open on (series/paintings.json) from Wikimedia
// Commons into public/assets/paintings/N.jpg, 3840 px wide, and records in the same file the
// URL, Commons' licence and the file's SHA-256. The paintings are public domain; the
// licence is checked so a file Commons does not mark public domain is never used.
//
//   node scripts/series-paintings.mjs
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const file = path.join(root, "series/paintings.json");
const paintings = JSON.parse(readFileSync(file, "utf8"));
const out = path.join(root, "public/assets/paintings");
const WIDTH = 3840;
const headers = { "User-Agent": "sixlines-shorts/1.0 (https://github.com/augchan42/sixlines-shorts)" };

mkdirSync(out, { recursive: true });
for (const [n, p] of Object.entries(paintings)) {
  const api = new URL("https://commons.wikimedia.org/w/api.php");
  for (const [k, v] of Object.entries({ action: "query", titles: p.commons, prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: WIDTH, format: "json" }))
    api.searchParams.set(k, String(v));
  const page = Object.values((await (await fetch(api, { headers })).json()).query.pages)[0];
  const info = page.imageinfo?.[0];
  if (!info) throw new Error(`${n}: ${p.commons} not found on Commons`);
  const licence = info.extmetadata.LicenseShortName?.value;
  if (!/public domain/i.test(licence ?? "")) throw new Error(`${n}: Commons gives the licence as ${licence}, not public domain`);
  const url = info.thumburl.split("?")[0];
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(path.join(out, `${n}.jpg`), buf);
  Object.assign(p, { url, page: info.descriptionurl, licence, sha256: createHash("sha256").update(buf).digest("hex") });
  console.log(`wrote public/assets/paintings/${n}.jpg (${p.title}, ${licence})`);
}
writeFileSync(file, `${JSON.stringify(paintings, null, 1)}\n`);
