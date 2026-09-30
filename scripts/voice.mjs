// Narration takes from ElevenLabs for a special with a `narration` list and a `voice`
// (series/specials/<name>.json), one mp3 per beat with the time of every character, so the
// picture can land on the words:
//   node --env-file=.env scripts/voice.mjs series/specials/guide-wangbi.json [--beat 3] [--model eleven_v4]
// Writes out/voice/<name>/NN.mp3 and NN.json (alignment); records text, voice, model, settings and
// hashes in series/renders/voice/<name>.json. The key (ELEVENLABS_API_KEY) is never printed.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const specPath = process.argv[2];
if (!specPath) throw new Error("usage: voice.mjs series/specials/<name>.json [--beat N] [--model ID]");
const arg = (flag) => (process.argv.includes(flag) ? process.argv[process.argv.indexOf(flag) + 1] : undefined);
const key = process.env.ELEVENLABS_API_KEY;
if (!key) throw new Error("ELEVENLABS_API_KEY is not set (node --env-file=.env)");
const spec = JSON.parse(readFileSync(path.resolve(root, specPath), "utf8"));
const name = path.basename(specPath, ".json");
const model = arg("--model") ?? spec.voice.model ?? "eleven_v4";
const settings = spec.voice.settings ?? { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true };
const only = arg("--beat") ? [Number(arg("--beat"))] : spec.narration.map((_, i) => i + 1);

const dir = path.join(root, "out/voice", name);
mkdirSync(dir, { recursive: true });
const recordPath = path.join(root, "series/renders/voice", `${name}.json`);
mkdirSync(path.dirname(recordPath), { recursive: true });
const record = existsSync(recordPath) ? JSON.parse(readFileSync(recordPath, "utf8")) : { beats: {} };

for (const n of only) {
  const beat = spec.narration[n - 1];
  // `say` is the text as spoken (phonetic spellings for Chinese names); `text` is what is shown.
  const text = beat.say ?? beat.text;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${spec.voice.voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: model, voice_settings: settings }),
  });
  if (!res.ok) throw new Error(`beat ${n}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  const audio = Buffer.from(j.audio_base64, "base64");
  const nn = String(n).padStart(2, "0");
  writeFileSync(path.join(dir, `${nn}.mp3`), audio);
  writeFileSync(path.join(dir, `${nn}.json`), JSON.stringify(j.alignment, null, 1));
  const a = j.alignment;
  const seconds = a.character_end_times_seconds.at(-1);
  record.beats[nn] = { text, model, voiceId: spec.voice.voiceId, settings, seconds, sha256: createHash("sha256").update(audio).digest("hex"), made: new Date().toISOString() };
  console.log(`${nn}: ${seconds.toFixed(2)} s, ${text.length} characters`);
}
writeFileSync(recordPath, JSON.stringify(record, null, 1) + "\n");
