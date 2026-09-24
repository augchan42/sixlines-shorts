"""Measures tempo, first beat and energy per bar for the candidate tracks, to choose
sections of them for the shorts.

  python3 music/analyse.py public/local/music/*.mp3 > music/analysis.json

The tracks stay local (public/local is not committed); analysis.json records each file's
SHA-256, its source and licence from LICENCES.tsv beside it, and the git commit of this
script, so each figure can be traced to the audio and code that produced it.
"""

import csv
import hashlib
import json
import os
import subprocess
import sys

import numpy as np
from scipy.signal import butter, sosfilt, stft

SR = 22050
HOP = 256


def load(path):
    """Decodes any audio file to mono float32 at SR with ffmpeg."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def onsets(x):
    """Spectral flux (positive change in log magnitude), normalised; one value per HOP samples."""
    _, _, z = stft(x, SR, nperseg=1024, noverlap=1024 - HOP)
    flux = np.maximum(0, np.diff(np.log1p(np.abs(z)), axis=1)).sum(0)
    return (flux - flux.mean()) / (flux.std() + 1e-9)


def tempo(flux):
    """The BPM from 80 to 160 whose beat, 2-beat and bar lags correlate best with the flux."""
    rate = SR / HOP
    ac = np.correlate(flux, flux, "full")[len(flux) - 1 :]
    lags = np.arange(len(ac))

    def score(bpm):
        return sum(np.interp(60 * rate / bpm * k, lags, ac) for k in (1, 2, 4))

    return max(np.arange(80, 160.01, 0.1), key=score)


def grid(flux, bpm):
    """The best-scoring beat grid at this tempo: (onset strength summed on it, offset in frames)."""
    period = 60 * SR / HOP / bpm
    offsets = np.arange(0, period, 0.25)
    sums = [flux[np.round(np.arange(p, len(flux) - 1, period)).astype(int)].sum() for p in offsets]
    i = int(np.argmax(sums))
    return sums[i], offsets[i]


def refine(flux, bpm):
    """Autocorrelation lands within about 0.5 BPM, which drifts a beat over a long track; the
    tempo within 1 BPM whose grid lines up best over the whole track is exact to 0.01."""
    return max(np.arange(bpm - 1, bpm + 1.001, 0.01), key=lambda b: grid(flux, b)[0])


def first_beat(flux, bpm):
    """Seconds to the first beat of the grid, within one beat of the start. The flux value at
    frame i measures the change between STFT frames i and i+1, centred at sample (i + 1) * HOP."""
    return (grid(flux, bpm)[1] + 1) * HOP / SR % (60 / bpm)


def rms(x, t0, t1):
    seg = x[int(t0 * SR) : int(t1 * SR)]
    return float(np.sqrt(np.mean(seg**2))) if len(seg) else 0.0


def analyse(x):
    flux = onsets(x)
    bpm = round(float(refine(flux, tempo(flux))), 2)
    first = float(first_beat(flux, bpm))
    bar = 4 * 60 / bpm
    bars = int((len(x) / SR - first) / bar)
    bass = sosfilt(butter(4, 150, "low", fs=SR, output="sos"), x)
    starts = [first + i * bar for i in range(bars)]
    level = np.array([rms(x, t, t + bar) for t in starts])
    low = np.array([rms(bass, t, t + bar) for t in starts])
    top = low.max() or 1.0
    at = lambda i: {"bar": i, "time": round(starts[i], 2)}
    return {
        "bpm": bpm,
        "firstBeat": round(first, 3),
        "duration": round(len(x) / SR, 2),
        "barSeconds": round(bar, 3),
        # Per bar, 0–8, relative to the track's loudest bar.
        "energy": [int(8 * v / (level.max() or 1.0)) for v in level],
        "bass": [int(8 * v / top) for v in low],
        # The bass returning after a bar without it: a drop. The bass leaving: a breakdown.
        "bassIn": [at(i) for i in range(1, bars) if low[i] > 0.6 * top and low[i - 1] < 0.35 * top],
        "bassOut": [at(i) for i in range(1, bars) if low[i] < 0.3 * top and low[i - 1] > 0.6 * top],
    }


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def licences(folder):
    """file -> (title, licence, source URL), from LICENCES.tsv beside the tracks."""
    path = os.path.join(folder, "LICENCES.tsv")
    if not os.path.exists(path):
        return {}
    with open(path, newline="") as f:
        return {row[0]: row[1:4] for row in csv.reader(f, delimiter="\t") if row}


def revision():
    """The last commit that touched this script, and whether the working copy differs from it."""
    here = os.path.dirname(os.path.abspath(__file__))
    git = lambda *a: subprocess.run(["git", *a], cwd=here, capture_output=True, text=True).stdout.strip()
    commit = git("log", "-1", "--format=%H", "--", "analyse.py")
    dirty = bool(git("status", "--porcelain", "--", "analyse.py"))
    return {"commit": commit or None, "modified": dirty}


def main(paths):
    tracks = []
    for path in paths:
        meta = licences(os.path.dirname(path)).get(os.path.basename(path), ["", "", ""])
        tracks.append({
            "file": os.path.basename(path),
            "sha256": sha256(path),
            "title": meta[0],
            "licence": meta[1],
            "source": meta[2],
            **analyse(load(path)),
        })
    out = {"analyser": {"script": "music/analyse.py", **revision(), "sampleRate": SR, "hop": HOP}, "tracks": tracks}
    json.dump(out, sys.stdout, indent=1)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main(sys.argv[1:])
