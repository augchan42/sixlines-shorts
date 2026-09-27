"""Measure a sound the way a listener would judge it, since Claude can't hear it.

    uv run --project tools/audio python tools/audio/sound_check.py FILE [FILE ...]
        [--start S] [--dur D] [--phone] [--png DIR]

For each file (or its --start/--dur stretch), prints one JSON line:

- lufs, lra: loudness (EBU R128, from ffmpeg) and loudness range.
- bands: share of energy under 250 Hz (lost on a phone), 250 Hz-2 kHz, 2-6 kHz, over 6 kHz.
- centroid_hz: the spectrum's centre of mass; brighter above ~2 kHz.
- flatness: 0 = pure tones, 1 = white noise.
- onsets_per_s: attacks a second (clicks, typing, chirps).
- blips: short tonal events over 1 kHz, the kind of chirp the user found "very annoying"
  (2026-09-27), and blips_per_min.
- sharpness_acum (DIN 45692): how shrill; the main driver of annoyance with loudness.
- roughness_asper (Daniel & Weber): harsh fast beating (15-300 Hz modulation).
- tnr_db, prominent_tones_hz (ECMA 418-1): how far steady tones stand out of the noise, and
  which tones are prominent. Calm soundscapes measure low in tonality.
- fluct_hz: the strongest slow swell of the level (0.3-20 Hz); a slow breath reads calm,
  4 Hz reads as a flutter. level_swing is how much the level moves (std / mean of the RMS);
  under ~0.1 the level is steady and fluct_hz means little.

--phone first cuts under 250 Hz, as a phone speaker does. --png writes a spectrogram
(ffmpeg showspectrumpic) to DIR, which Claude can look at.

The psychoacoustic metrics are MoSQITo's, run on a 70 dB SPL calibration so that files
compare by the shape of their sound, not their level.
"""

import argparse
import json
import re
import subprocess
from pathlib import Path

import librosa
import numpy as np
from mosqito.sq_metrics import roughness_dw, sharpness_din_st, tnr_ecma_st

SR = 48000


def ebu(path, start, dur, phone):
    af = ("highpass=f=250," if phone else "") + "ebur128"
    cmd = ["ffmpeg", "-nostdin", "-hide_banner", "-ss", str(start)] + (["-t", str(dur)] if dur else []) + ["-i", path, "-vn", "-af", af, "-f", "null", "-"]
    err = subprocess.run(cmd, capture_output=True, text=True).stderr
    summary = err[err.rfind("Summary:"):]
    i = re.search(r"I:\s+(-?[\d.]+) LUFS", summary)
    lra = re.search(r"LRA:\s+([\d.]+) LU", summary)
    return (float(i.group(1)) if i else None, float(lra.group(1)) if lra else None)


def spectrogram(path, start, dur, out):
    cmd = ["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(start)] + (["-t", str(dur)] if dur else []) + ["-i", path, "-lavfi", "showspectrumpic=s=1024x512:legend=1:scale=log:fscale=log", str(out)]
    subprocess.run(cmd, check=True)


def measure(path, start=0.0, dur=None, phone=False):
    y, _ = librosa.load(path, sr=SR, mono=True, offset=start, duration=dur)
    if phone:
        spec = np.fft.rfft(y)
        f = np.fft.rfftfreq(len(y), 1 / SR)
        spec[f < 250] = 0
        y = np.fft.irfft(spec, len(y)).astype(np.float32)
    lufs, lra = ebu(path, start, dur, phone)

    S = np.abs(librosa.stft(y, n_fft=4096, hop_length=1024)) ** 2
    freqs = librosa.fft_frequencies(sr=SR, n_fft=4096)
    total = S.sum() + 1e-20
    bands = {k: round(float(S[(freqs >= lo) & (freqs < hi)].sum() / total), 3) for k, (lo, hi) in {"<250": (0, 250), "250-2k": (250, 2000), "2k-6k": (2000, 6000), ">6k": (6000, SR)}.items()}
    centroid = float(np.median(librosa.feature.spectral_centroid(S=S, sr=SR)))
    flat_frames = librosa.feature.spectral_flatness(S=S)[0]
    flatness = float(np.median(flat_frames))

    seconds = len(y) / SR
    onsets = librosa.onset.onset_detect(y=y, sr=SR, hop_length=512, units="time", backtrack=False)
    # A blip: an onset whose next 60 ms has its loudest peak over 1 kHz standing 20 dB or more
    # above the median within 600 Hz of it (a tone, not a burst of noise).
    blips = 0
    for t in onsets:
        a = int(t * SR)
        seg = y[a : a + int(0.06 * SR)]
        if len(seg) < 1024:
            continue
        sp = np.abs(np.fft.rfft(seg * np.hanning(len(seg))))
        fr = np.fft.rfftfreq(len(seg), 1 / SR)
        band = (fr >= 500) & (fr <= 10000)
        k = np.argmax(np.where(band, sp, 0))
        near = np.abs(fr - fr[k]) <= 600
        if fr[k] > 1000 and sp[k] > 10 * np.median(sp[near]):
            blips += 1

    # Slow swells of the level: the strongest modulation of the envelope, 0.3-20 Hz.
    env = librosa.feature.rms(y=y, frame_length=2048, hop_length=480)[0]
    depth = float(env.std() / (env.mean() + 1e-12))
    env = env - env.mean()
    em = np.abs(np.fft.rfft(env * np.hanning(len(env))))
    ef = np.fft.rfftfreq(len(env), 480 / SR)
    band = (ef >= 0.3) & (ef <= 20)
    fluct = float(ef[band][np.argmax(em[band])]) if band.any() and len(env) > 64 else None

    # Psychoacoustics on at most 6 s from the middle, calibrated to 70 dB SPL RMS.
    mid = y if len(y) <= 6 * SR else y[(len(y) - 6 * SR) // 2 : (len(y) + 6 * SR) // 2]
    if len(mid) < SR:  # a click or a relay: pad to 1 s so the metrics have a spectrum to work on
        mid = np.pad(mid, (0, SR - len(mid)))
    rms = np.sqrt(np.mean(mid**2)) + 1e-12
    pa = mid / rms * (2e-5 * 10 ** (70 / 20))
    sharp = float(sharpness_din_st(pa, SR))
    r, _, _, _ = roughness_dw(pa, SR, overlap=0)
    rough = float(np.median(r))
    t_tnr, _, promi, tone_f = tnr_ecma_st(pa, SR, prominence=True)
    tones = sorted(round(float(f)) for f, pr in zip(np.atleast_1d(tone_f), np.atleast_1d(promi)) if pr)

    return {
        "file": str(path),
        "start": start,
        "seconds": round(seconds, 2),
        "phone": phone,
        "lufs": lufs,
        "lra": lra,
        "bands": bands,
        "centroid_hz": round(centroid),
        "flatness": round(flatness, 3),
        "onsets_per_s": round(len(onsets) / seconds, 2),
        "blips": blips,
        "blips_per_min": round(blips / seconds * 60, 1),
        "sharpness_acum": round(sharp, 2),
        "roughness_asper": round(rough, 3),
        "fluct_hz": round(fluct, 2) if fluct else None,
        "level_swing": round(depth, 2),
        "tnr_db": round(float(t_tnr), 1),
        "prominent_tones_hz": tones,
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--dur", type=float, default=None)
    ap.add_argument("--phone", action="store_true")
    ap.add_argument("--png", default=None)
    a = ap.parse_args()
    for f in a.files:
        print(json.dumps(measure(f, a.start, a.dur, a.phone)))
        if a.png:
            Path(a.png).mkdir(parents=True, exist_ok=True)
            spectrogram(f, a.start, a.dur, Path(a.png) / f"{Path(f).stem}-{a.start:g}.png")
