import { qian } from "./qian";

// Hexagram 1 cut to Glowline, "Syncopation Heaven" (The Line, 2019). Local only until
// Glowline agrees to its use: the file sits in gitignored public/local/.
//
// Measured with librosa: 110.0 BPM, and beats at 0.56s + n × 60/110 in the file, where
// the onsets cluster across the track. The drop lands on file beat 27 (15.29s), after
// the bass drops out on beats 23–24. The short's beat 0 is file beat 13 (7.65s), so the
// drop hits on short beat 14, "BUT THIS…", and the bass dropout falls under the third
// rival.
const FILE_FIRST_BEAT = 0.56;
const BPM = 110;
const SHORT_BEAT_0 = FILE_FIRST_BEAT + (13 * 60) / BPM;
const LEAD = 0.3;

export const qianGlowline = {
  ...qian,
  bpm: BPM,
  firstBeat: LEAD,
  music: "local/syncopation-heaven.mp3",
  musicStart: SHORT_BEAT_0 - LEAD,
};
