import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";

// The flight look's machine sounds (docs/research/2026-09-27-nostromo-screens.md), generated:
// a ship's background (bed), a beacon, a relay's click-clack, a printer's chatter.
// The bed follows the Nostromo's landing on LV-426 as measured in
// docs/research/2026-09-27-sound-measures.md: an engine rumble (brown noise, 60-250 Hz)
// swelling every 6 s, its body at 250 Hz-1 kHz turned up so a phone plays it, and a quiet
// whine at 440 Hz. No chirps (the first bed's 1.8-3.15 kHz chirps were "very annoying").
// 30 s, looped. The beacon is the landing's beep: one pitch on a steady 1.65 s pulse, rising
// 1,166 -> 1,300 Hz over 30 s, mixed no louder than the bed. The first hum (hum.wav, 50-150 Hz)
// was lost on phone speakers.
const beep = "min(mod(t\\,1.65)/0.01\\,1)*exp(-max(mod(t\\,1.65)-0.01\\,0)*30)*lt(mod(t\\,1.65)\\,0.15)";
// "cues": true adds four sounds rebuilt after the boot sequence's inventory
// (docs/research/nostromo-boot-inventory.json), each played at its moment by the Lesson:
// sweep (a tone gliding 40 -> 700 Hz, as the view starts), chatter (a relay bank, clicks about
// 15 a second at 200-800 Hz, while the lines plot; in place of the single relay clicks),
// warble (483 and 900 Hz taking turns 8 times a second, as the camera reaches its line) and
// winddown (clicks near 333 Hz slowing and fading, as the answer stops typing).
// "beacon": "level" takes the beacon up to the bed's level, as the landing's beep sits level
// with the engine (the bed measures -31 LUFS on a phone, the first beacon -41; review of
// 2026-09-27, item 2). The first beacon, 10 dB under, stays the default.
export const SFX = {
  bed: [
    "-f", "lavfi", "-i", "anoisesrc=color=brown:amplitude=0.6:d=30:r=44100",
    "-f", "lavfi", "-i", "anoisesrc=color=pink:amplitude=0.35:d=30:r=44100",
    "-f", "lavfi", "-i", "aevalsrc=0.012*sin(2*PI*440*t)+0.004*sin(2*PI*880.7*t):s=44100:d=30",
    "-filter_complex",
    "[0]highpass=f=60,lowpass=f=250,volume='0.75+0.25*sin(2*PI*t/6)':eval=frame[engine];" +
      "[1]highpass=f=250,lowpass=f=1000,volume='0.8+0.2*sin(2*PI*t/6+1)':eval=frame,volume=0.9[body];" +
      "[engine][body][2]amix=inputs=3:normalize=0,afade=t=in:d=0.5",
  ],
  beacon: ["-f", "lavfi", "-i", `aevalsrc=0.05*${beep}*(sin(2*PI*(1166*t+67*t*t/30))+0.2*sin(4*PI*(1166*t+67*t*t/30))):s=44100:d=30`],
  "beacon-level": ["-f", "lavfi", "-i", `aevalsrc=0.16*${beep}*(sin(2*PI*(1166*t+67*t*t/30))+0.2*sin(4*PI*(1166*t+67*t*t/30))):s=44100:d=30`],
  sweep: ["-f", "lavfi", "-i", "aevalsrc=0.35*sin(PI*t)*(sin(2*PI*40*(pow(17.5\\,t)-1)/2.862)+0.3*sin(4*PI*40*(pow(17.5\\,t)-1)/2.862)):s=44100:d=1"],
  chatter: [
    "-f", "lavfi", "-i", "aevalsrc=(random(0)*2-1)*(exp(-mod(t\\,0.067)*140)+0.6*exp(-mod(t+0.03\\,0.109)*160)):s=44100:d=8",
    "-af", "bandpass=f=450:width_type=h:w=600,lowpass=f=1500,lowpass=f=1500,volume=2.6,afade=t=in:d=0.05",
  ],
  warble: [
    "-f", "lavfi", "-i", "aevalsrc=0.12*sin(PI*min(t/1.5\\,1))*(lt(mod(t\\,0.125)\\,0.0625)*(sin(2*PI*483*t)+0.3*sin(2*PI*966*t))+gte(mod(t\\,0.125)\\,0.0625)*(sin(2*PI*900*t)+0.3*sin(2*PI*1800*t))):s=44100:d=1.5",
    "-af", "lowpass=f=2500",
  ],
  winddown: [
    "-f", "lavfi", "-i", "aevalsrc=(random(0)*2-1)*exp(-t*1.3)*exp(-mod(2*log(1+t)\\,0.125)*300):s=44100:d=2.3",
    "-af", "bandpass=f=333:width_type=h:w=300,volume=3",
  ],
  hum: ["-f", "lavfi", "-i", "anoisesrc=color=brown:amplitude=0.5:d=30:r=44100", "-f", "lavfi", "-i", "aevalsrc=0.22*sin(2*PI*50*t)+0.12*sin(2*PI*100*t)+0.04*sin(2*PI*150*t):s=44100:d=30", "-filter_complex", "[0]lowpass=f=180[n];[n][1]amix=inputs=2:normalize=0,afade=t=in:d=0.5,volume=0.8"],
  relay: ["-f", "lavfi", "-i", "aevalsrc=(random(0)*2-1)*(0.9*exp(-t*260)+0.6*gte(t\\,0.035)*exp(-(t-0.035)*300)):s=44100:d=0.15", "-af", "highpass=f=700,lowpass=f=6000"],
  printer: ["-f", "lavfi", "-i", "aevalsrc=(random(0)*2-1)*0.5*exp(-mod(t\\,0.022)*420)*(0.7+0.3*sin(2*PI*2.5*t)):s=44100:d=12", "-af", "bandpass=f=2200:width_type=h:w=1800"],
};

// The teletype tick: a short decaying click, 25 a second (one per typed character), 20 s long.
SFX.teletype = ["-f", "lavfi", "-i", "aevalsrc=0.3*sin(2*PI*1900*t)*exp(-mod(t\\,0.04)*350):s=44100:d=20"];
// One click of it, for the terminal to play once per typed character.
SFX.tick = ["-f", "lavfi", "-i", "aevalsrc=0.3*sin(2*PI*1900*t)*exp(-t*350):s=44100:d=0.04"];

// Writes one sound; the extension picks the format (.wav for Remotion, .ogg for Godot's web build).
export function makeSfx(name, file) {
  if (!SFX[name]) throw new Error(`no sound recipe named ${name}`);
  mkdirSync(path.dirname(file), { recursive: true });
  execFileSync("ffmpeg", ["-v", "error", "-y", ...SFX[name], file], { stdio: ["ignore", "pipe", "pipe"] });
}
