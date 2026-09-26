"""Estimates each track's key and whether it is major or minor, as a first guide to its mood
(minor keys tend to sound darker) and its brightness (spectral centroid), over the whole track and over each section the series
uses. The user found 47's track too joyous for Oppression (2026-09-26) and asked for
something more ominous; the ear decides, this only narrows the listening.

Krumhansl-Kessler key profiles against a chromagram from an STFT; writes music/mode.json.

  python3 music/mode.py
"""

import json
import os
import sys

import numpy as np
from scipy.signal import stft

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from analyse import SR, load as decode  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUSIC = os.path.join(ROOT, "public/local/music")
NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def chroma(y):
    f, _, z = stft(y, fs=SR, nperseg=8192, noverlap=6144)
    power = np.abs(z) ** 2
    keep = (f > 55) & (f < 2000)
    pitch = np.round(12 * np.log2(f[keep] / 440.0)).astype(int) % 12  # 0 = A
    c = np.zeros(12)
    np.add.at(c, pitch, np.sqrt(power[keep]).sum(axis=1))
    return np.roll(c, -3)  # 0 = C


def brightness(y):
    """The mean spectral centroid in Hz: higher sounds brighter."""
    f, _, z = stft(y, fs=SR, nperseg=4096, noverlap=2048)
    mag = np.abs(z)
    return int(round(float((f[:, None] * mag).sum() / max(mag.sum(), 1e-9))))


def key(c):
    """(name, mode, margin): the best-correlating key, and how far minor beats major (+) or loses (-)."""
    best = {}
    for mode, profile in (("major", MAJOR), ("minor", MINOR)):
        scores = [np.corrcoef(c, np.roll(profile, k))[0, 1] for k in range(12)]
        k = int(np.argmax(scores))
        best[mode] = (scores[k], k)
    mode = "minor" if best["minor"][0] > best["major"][0] else "major"
    return f"{NAMES[best[mode][1]]} {mode}", round(best["minor"][0] - best["major"][0], 3)


def main():
    analysis = json.load(open(os.path.join(ROOT, "music/analysis.json")))["tracks"]
    sections = json.load(open(os.path.join(ROOT, "music/sections.json")))["sections"]
    out = []
    for t in analysis:
        path = os.path.join(MUSIC, t["file"])
        if not os.path.exists(path):
            continue
        y = decode(path)
        whole, margin = key(chroma(y))
        parts = []
        for s in sections:
            if s["file"] != t["file"]:
                continue
            a = int(s["start"] * SR)
            k, m = key(chroma(y[a : a + int(36 * SR)]))
            parts.append({"trigram": s["trigram"], "start": s["start"], "key": k, "minorMargin": m, "centroid": brightness(y[a : a + int(36 * SR)])})
        out.append({"file": t["file"], "bpm": t["bpm"], "key": whole, "minorMargin": margin, "sections": parts})
        print(f"{t['file'][:44]:44} {t['bpm']:7} {whole:10} {margin:+.3f}", *(f"[{p['start']}: {p['key']} {p['minorMargin']:+.3f} {p['centroid']} Hz]" for p in parts))
    json.dump({"script": "music/mode.py", "tracks": out}, open(os.path.join(ROOT, "music/mode.json"), "w"), indent=1)


if __name__ == "__main__":
    main()
