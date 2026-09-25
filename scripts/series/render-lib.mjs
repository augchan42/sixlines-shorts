// Pure helpers for the series scripts (series-clips, series-screens, series).
import { planOf } from "../../src/lib/seriesPlan.ts";

export const parseNumbers = (arg) => {
  if (arg === "all") return "all";
  const ns = String(arg ?? "").split(",").map(Number);
  if (!ns.length || ns.some((n) => !Number.isInteger(n) || n < 1 || n > 64)) {
    throw new Error(`hexagrams must be 1 to 64, a comma-separated list, or "all" (got ${arg})`);
  }
  return ns;
};

export const clipJobs = (propsList, exists) => {
  const seen = new Set();
  const jobs = [];
  for (const p of propsList) {
    const plan = planOf(p);
    const lines = p.hexagram.lines.join("");
    const wanted = [
      { kind: "hexagram", clip: p.hexagramClip, lines, bpm: p.bpm, beats: plan.hexagramBeats },
      { kind: "endcard", clip: p.endcard.clip, lines, bpm: p.bpm, beats: plan.credit - plan.cta, mode: p.endcard.mode },
    ];
    for (const job of wanted) {
      if (seen.has(job.clip) || exists(job.clip)) continue;
      seen.add(job.clip);
      jobs.push(job);
    }
  }
  return jobs;
};

// scripts/capture_gallery.sh in sixlines-ios writes gallery/<appearance>/<snapshot>.png.
// `ios` is the sixlines-ios checkout. The Today and Library captures go to their own
// gallery-today/ and gallery-library/, since capture_gallery.sh clears its output folder and
// they are captured in separate runs.
export const screenFiles = (n, ios) => [
  { from: `${ios}/gallery/matrix/reading-matrix-${n}-${n}.png`, to: `public/assets/screens/${n}/reading.png` },
  { from: `${ios}/gallery/matrix/yilin-matrix-${n}-${n}.png`, to: `public/assets/screens/${n}/verse.png` },
  { from: `${ios}/gallery-today/matrix/today-matrix-${n}.png`, to: `public/assets/screens/${n}/today.png` },
  { from: `${ios}/gallery-library/matrix/library-art-matrix-${n}.png`, to: `public/assets/screens/${n}/painting.png` },
  { from: `${ios}/gallery-library/matrix/library-study-matrix-${n}.png`, to: `public/assets/screens/${n}/text.png` },
  // The same two pages scrolled so the painting or the Judgment fills the screen; the shorts use these.
  { from: `${ios}/gallery-library-scrolled/matrix/library-art-matrix-${n}.png`, to: `public/assets/screens/${n}/painting-scrolled.png` },
  { from: `${ios}/gallery-library-scrolled/matrix/library-study-matrix-${n}.png`, to: `public/assets/screens/${n}/text-scrolled.png` },
];

export const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");

// Video kbps for a two-pass encode that lands near 23 MB with 128k audio, capped at 8000.
export const shareBitrate = (seconds) => Math.min(8000, Math.floor((23e6 * 8) / 1000 / seconds) - 128);

// Everything the render needs that is missing or not the recorded file, each with the
// command that makes it. Paths are under public/.
export const missingAssets = (props, row, { exists, sha256 }) => {
  const n = props.hexagram.number;
  const problems = [];
  const need = (file, fix) => {
    if (!exists(file)) problems.push(`${file} is missing. Run: ${fix}`);
  };
  need(props.music, "copy the track into public/local/music/ (see music/sections.json)");
  if (exists(props.music) && row.music.sha256 && sha256(props.music) !== row.music.sha256) {
    problems.push(`${props.music} is not the analysed file (sha256 differs from music/sections.json)`);
  }
  if (!row.music.certificate) {
    problems.push(`${row.music.file} has no licence certificate in music/sections.json. Download it signed in from ${row.music.source}`);
  } else {
    const cert = `local/music/certificates/${row.music.certificate.file}`;
    need(cert, "download the Pixabay licence certificate (music/sections.json)");
    if (exists(cert) && sha256(cert) !== row.music.certificate.sha256) problems.push(`${cert} is not the recorded certificate`);
  }
  need(props.hexagramClip, `npm run series:clips -- ${n}`);
  need(props.endcard.clip, `npm run series:clips -- ${n}`);
  for (const s of props.screens) need(s.src, "npm run series:screens");
  if (props.lesson?.screen) need(props.lesson.screen.src, "npm run series:screens");
  for (const p of props.plates) need(p, `npm run assets -- --hexagram ${n}`);
  return problems;
};

export const renderAll = async (numbers, renderOne) => {
  const done = [];
  const failures = [];
  for (const n of numbers) {
    try {
      await renderOne(n);
      done.push(n);
    } catch (e) {
      failures.push({ n, message: e.message });
    }
  }
  return { done, failures };
};

// Where an earlier render of a short is kept before a new one replaces it: under versions/,
// named by its manifest's render time and the commit it was rendered from.
export const versionDir = (series, name, manifest) =>
  `${series}/versions/${name}/${manifest.rendered.replace(/\.\d+Z$/, "Z").replaceAll(":", "-")}-${manifest.commit.slice(0, 7)}`;
