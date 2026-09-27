# Measuring sound for the flight look

2026-09-27. The user heard the flight test's generated background (air, buzz, console chirps) and
said "Those chirps are very annoying." They asked for free command-line tools to measure sound, and
for a web search mapping those measures to the sounds they want: the Nostromo, a computer room,
Blade Runner and Vangelis, Brian Eno.

I can't hear. These measures stand in for listening: they flag what is likely to annoy before
the user has to hear it. They don't make a sound good, so the user still judges by ear, and
real recordings stay the source (see memory: real-sound-recordings).

## The tool

`scripts/sound-check FILE... [--start S] [--dur D] [--phone] [--png DIR]` runs
`tools/audio/sound_check.py` in its own uv environment (Python 3.12, librosa, MoSQITo). It prints
one JSON line per file:

| Measure | What it tells | Source |
|---|---|---|
| lufs, lra | loudness, loudness range | ffmpeg ebur128 |
| bands | share of energy <250 Hz, 250 Hz–2 kHz, 2–6 kHz, >6 kHz | STFT |
| centroid_hz | how bright | librosa |
| onsets_per_s | attacks a second | librosa |
| blips_per_min | short tones over 1 kHz: an onset whose loudest peak stands 20 dB over its ±600 Hz neighbourhood | ours |
| sharpness_acum | how shrill (DIN 45692) | MoSQITo |
| roughness_asper | harsh fast beating, 15–300 Hz modulation (Daniel & Weber) | MoSQITo |
| fluct_hz, level_swing | strongest slow swell of the level, and how much the level moves | ours |
| tnr_db | how far a steady tone stands out of the noise (ECMA 418-1) | MoSQITo |

`--phone` cuts everything under 250 Hz first, since a phone speaker can't play it. `--png` writes
a spectrogram I can look at. The psychoacoustic measures are taken at a fixed 70 dB SPL so that
files compare by the shape of their sound, not their level.

## What the research says

- **Annoyance follows a few measures.** Studies of drone and product noise find annoyance goes
  down as loudness, sharpness, tonality and roughness or fluctuation strength go down.
  Fluctuation strength peaks at a 4 Hz swell (its unit, the vacil, is defined there); roughness
  covers faster modulation, above about 15–30 Hz.
- **Calm soundscapes have little tonality.** A study of protected natural areas split its
  soundscapes into an eventful zone with high tonality and a calm zone with low tonality. Human
  sounds with tones in them disturbed the calm.
- **Darker noise is heard as warmer.** Pink noise has less hiss than white; brown noise is
  warmer again. (Claims that these relax people have little evidence behind them.)
- **The Nostromo: machinery, few beeps.** Jimmy Shields did the sound. The computers were
  built from old relays, printers and scanners, with some beeps from a Yamaha CS synthesiser.
  The engines' hum carries the opening. Fans have turned his ship sounds into hours of ambience,
  which says the bed can run long without tiring. (Background in
  docs/research/2026-09-27-nostromo-screens.md.)
- **Blade Runner: a large dark reverb.** Vangelis played a Yamaha CS-80 and put almost
  everything through a Lexicon 224 reverb. The main sound is two detuned saws through a resonant
  low-pass filter, with a slow attack and a long release; he opened the filter by pressing harder
  on the keys. The film adds rain, city noise and machines. The Esper's sounds came from a
  feedback loop that kept clipping.
- **Eno, Music for Airports: long, slow cycles.** Loops of single notes or sung tones, each a
  different length (about 23½, 25⅞ and 29 15⁄16 seconds in one piece), drift in and out of phase
  and never repeat the same way. Tape slowed to half speed an octave down, smeared by echo. He
  set the loops running and left them.

## Targets for a background bed

Measured on plain noises for scale (70 dB SPL): brown noise 1.46 acum, pink 2.02, white 2.64.

| Measure | Target | Why |
|---|---|---|
| bands with `--phone` | most energy 250 Hz–2 kHz | a phone plays only this; our first hum was all below it and the user heard "no sound at all" |
| sharpness_acum | ≤ 1.6 | darker than pink noise |
| blips_per_min | 0 in the bed; a few, quiet, only when the picture calls for them | the chirps the user disliked; Nostromo beeps were few |
| roughness_asper | < 0.1 | plain noise measures about 0.03 |
| fluct_hz | swells slower than 0.5 Hz, or a level_swing under 0.1 | a 2–8 Hz swell is heard as flutter; Eno's cycles run 20–30 s |
| tnr_db | 0, or one deliberate low tone | calm soundscapes are low in tonality |

Printers, relays and teletypes are meant to be busy (roughness 4–5 asper, many onsets), so they
stay short, quiet and tied to something on screen.

## Our sounds now

| File | Sharpness | Roughness | Blips/min | Note |
|---|---|---|---|---|
| bed.wav | 1.39 (1.62 on a phone) | 0.17 | 27 (36 on a phone) | the chirps: fewer lows on a phone make them stand out more; the 120 Hz buzz makes it rough |
| hum.wav | 0.28 | 0.06 | 0 | all under 250 Hz: silent on a phone |
| printer.wav | 2.30 | 4.28 | 0 | busy by design |
| teletype.wav | 1.52 | 5.50 | 3 | busy by design |
| lesson music (pick13) | 1.52 | 0.04 | 3 | level_swing 0.92: it moves a lot, as music does |

So the bed fails on chirps and roughness. The next bed should be a real recording (a server or
control room, a ship's ambience) that passes the targets, with no generated chirps.

## Sources

- Frontiers in Acoustics, "Human response to eVTOL drone sound": https://www.frontiersin.org/journals/acoustics/articles/10.3389/facou.2025.1624669/full
- Drone acoustic analysis for predicting psychoacoustic annoyance: https://arxiv.org/html/2410.22208v1
- University of Salford, roughness and fluctuation strength: https://acoustics.salford.ac.uk/psychoacoustics/sound-quality-making-products-sound-better/an-introduction-to-sound-quality-testing/roughness-fluctuation-strength/
- MetricGate, fluctuation strength (vacil): https://metricgate.com/docs/fluctuation-strength-vacil/
- Scientific Reports, "Human sounds and associated tonality disrupting perceived soundscapes": https://www.nature.com/articles/s41598-025-08524-y
- bioRxiv, "Pupil-linked arousal does not differ between white, pink and brown noises": https://www.biorxiv.org/content/10.1101/2025.06.11.659177.full.pdf
- Alien Explorations, "Two robots chatting": http://alienexplorations.blogspot.com/1979/09/two-robots-chatting.html
- Reverb Machine, Vangelis' Blade Runner synth sounds: https://reverbmachine.com/blog/vangelis-blade-runner-synth-sounds/
- Reverb Machine, "Tears in Rain": https://reverbmachine.com/blog/vangelis-tears-in-rain-blade-runner/
- Open Culture, the sounds of Blade Runner: https://www.openculture.com/2017/05/the-sounds-of-blade-runner.html
- Reverb Machine, deconstructing Music for Airports: https://reverbmachine.com/blog/deconstructing-brian-eno-music-for-airports/
- Open Culture, the tape loops of Music for Airports: https://www.openculture.com/2019/07/deconstructing-brian-enos-music-for-airports.html
