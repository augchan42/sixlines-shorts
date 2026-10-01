// The timeline short's pictures, one or two per date, from Wikimedia Commons (public domain
// unless noted), hung above the dates in blender/timeline.py. The user, 2026-10-01: "maybe you
// can use some images from the internet to represent each era somehow, maybe some people, and
// of course the famous joachim bouvet i-ching diagram for 1701 (above the year numerals)".
//
//   node scripts/timeline-images.mjs     # writes public/local/timeline/<name>.jpg
//
// The files are not committed; the URLs and Commons's sha1s are their provenance. A file Commons
// serves as a thumbnail (the originals are too big) has no sha1 to check. `crop` is ImageMagick
// geometry on the downloaded file, `credit` what a caption must say for a licence that asks.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PLATE } from "./leibniz-plate.mjs";

const root = path.resolve(import.meta.dirname, "..");
const C = "https://upload.wikimedia.org/wikipedia/commons";
export const IMAGES = [
  { name: "fuxi", page: 1, title: "Ma Lin, Fu Xi (Song dynasty), National Palace Museum, Taipei", url: `${C}/thumb/d/db/Ma-Lin-Fuxi-and-turtle.jpg/1280px-Ma-Lin-Fuxi-and-turtle.jpg`, crop: "1150x1790+70+930", licence: "public domain" },
  { name: "king-wen", page: 2, title: "King Wen of Zhou, Portraits of Famous Men (Southern Song?), National Palace Museum", url: `${C}/1/13/Portraits_of_Famous_Men_-_King_Wen_of_Zhou.jpg`, sha1: "040398b0329df4067923065ab5abc2f07f784c37", crop: "2400x2500+100+1350", licence: "public domain" },
  { name: "shao-yong", page: 3, title: "Shao Yong, Portraits of Famous Men, National Palace Museum", url: `${C}/5/5e/Portraits_of_Famous_Men_-_Shao_Yong.jpg`, sha1: "571a7ab3c5f6cfeb048a61527dd461155d824c91", crop: "2400x2450+100+1350", licence: "public domain" },
  { name: "bouvet", page: 4, title: "The diagram Bouvet sent Leibniz, 1701 (Leibniz Bibliothek Hannover)", url: PLATE.url, sha1: PLATE.sha1, licence: "public domain" },
  { name: "wilhelm", page: 5, title: "Richard Wilhelm, Bundesarchiv Bild 146-2006-0022", url: `${C}/c/c2/Bundesarchiv_Bild_146-2006-0022%2C_Richard_Wilhelm.jpg`, sha1: "5ff97cc07a3f8e9fc1985931724cb6323175e749", licence: "CC BY-SA 3.0 de", credit: "Richard Wilhelm: Bundesarchiv, Bild 146-2006-0022, CC BY-SA 3.0 de" },
  { name: "jung", page: 5, title: "Carl Jung", url: `${C}/6/65/Carl-Jung-mod.jpg`, sha1: "df3cd8a7ac3ae66fbbc1cb3dbbf1e79ab1659cdb", licence: "public domain" },
  { name: "dick", page: 6, title: "Philip K. Dick in the early 1960s, photo by Arthur Knight", url: `${C}/2/2c/Philip_K_Dick_in_early_1960s_%28photo_by_Arthur_Knight%29_02_%28cropped%29.jpg`, sha1: "fe68617f2d51382d5594144cd54b74fd7da2f1a7", licence: "public domain" },
  { name: "turing", page: 2, title: "Alan Turing aged 16 (1928-29), possibly by Arthur Reginald Chaffin", url: `${C}/a/a1/Alan_Turing_Aged_16.jpg`, sha1: "b7af1fbf2563cb09a4309c4b62bbda362eca6b8d", licence: "public domain" },
  { name: "weizenbaum", page: 0, title: "Joseph Weizenbaum, 1982 (Rochester Institute of Technology, News & Events)", url: `${C}/f/fd/Weizenbaum_1982.jpg`, sha1: "7ff9a095cb58b5feba4ee114596ed5360a8a76ef", licence: "public domain" },
  { name: "eliza", page: 0, title: "A conversation with ELIZA (the DOCTOR script)", url: `${C}/7/79/ELIZA_conversation.png`, sha1: "9f494db4f284196d90d82081807b67d88b3f6b3b", licence: "public domain" },
  // Supplied by the user, 2026-10-01 ("for voight-kampff use a still from the bladerunner movie"):
  // Holden at the Voight-Kampff machine, Blade Runner (1982). Kept in public/local/timeline-src;
  // sha1 a5095939506ff7d2a30d38536416604f3b70c69d (900x600 webp).
  { name: "voight-kampff", page: 0, title: "Blade Runner (1982), Holden at the Voight-Kampff machine", file: "public/local/timeline-src/voight-kampff.webp", crop: "480x600+290+0", licence: "film still, Warner Bros.", credit: "Blade Runner (1982), Warner Bros." },
  // Supplied by the user, 2026-10-01, for AI: the "Shoggoth with smiley face" meme, labelled
  // Unsupervised Learning / Supervised Fine-tuning / RLHF. Usually credited to @TetraspaceWest
  // (2022); the labelled version's author is not checked. sha1 83835ea83b74eacac8d0042f0da3b42c085d74fd.
  { name: "shoggoth", page: 0, title: "Shoggoth with smiley face (the RLHF meme)", file: "public/local/timeline-src/shoggoth.webp", crop: "1000x758+110+0", licence: "meme, author unchecked", credit: "Shoggoth with smiley face, after @TetraspaceWest" },
  // 8-Bit Oracle's reading screen (8bitoracle-brand public/img-demo), for the paths shorts on its account.
  { name: "8bo", page: 0, title: "8-Bit Oracle, the reading screen", file: "../8bitoracle-brand/public/img-demo/reading.png", crop: "1440x1800+0+0", licence: "ours" },
  // Ours: the app's reading screen (public/local/tour, from the store listing).
  { name: "app", page: 7, title: "Six Lines, the reading screen", file: "public/local/tour/03_Reading.png", licence: "ours" },
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = path.join(root, "public/local/timeline");
  mkdirSync(dir, { recursive: true });
  for (const im of IMAGES) {
    const raw = path.join(dir, `${im.name}-raw.jpg`);
    if (im.file) execFileSync("cp", [path.join(root, im.file), raw]);
    else if (!existsSync(raw) || process.argv.includes("--force")) {
      const res = await fetch(im.url, { headers: { "User-Agent": "sixlines-shorts (https://sixlines.day)" } });
      if (!res.ok) throw new Error(`${res.status} ${im.url}`);
      const body = Buffer.from(await res.arrayBuffer());
      const hash = createHash("sha1").update(body).digest("hex");
      if (im.sha1 && hash !== im.sha1) throw new Error(`${im.name} sha1 ${hash}, expected ${im.sha1}`);
      writeFileSync(raw, body);
    }
    // Cropped and at most 1024 px tall: enough for a picture a third of the window high.
    const out = path.join(dir, `${im.name}.jpg`);
    execFileSync("magick", [raw, ...(im.crop ? ["-crop", im.crop, "+repage"] : []), "-resize", "1024x1024>", "-quality", "90", out]);
    console.log(`wrote ${path.relative(root, out)}`);
  }
}
