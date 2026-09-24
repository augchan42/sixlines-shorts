import unittest

import numpy as np

from analyse import SR, analyse


def clicks(bpm, first, seconds, bass_from=None):
    """A click on every beat; a 60 Hz bass note under each beat from bass_from seconds."""
    x = np.zeros(int(seconds * SR), dtype=np.float32)
    t = np.arange(int(0.05 * SR)) / SR
    click = (np.exp(-t * 80) * np.sin(2 * np.pi * 2000 * t)).astype(np.float32)
    beat = 60 / bpm
    bass = (0.8 * np.sin(2 * np.pi * 60 * np.arange(int(beat * SR)) / SR)).astype(np.float32)
    at = first
    while at + beat < seconds:
        i = int(at * SR)
        x[i : i + len(click)] += click
        if bass_from is not None and at >= bass_from:
            x[i : i + len(bass)] += bass
        at += beat
    return x


class AnalyseTest(unittest.TestCase):
    def test_finds_tempo_and_first_beat(self):
        # First beats within one beat of the start: a click at 0.5 s at 120 BPM would read as 0.
        for bpm, first in ((100, 0.3), (120, 0.25), (132, 0.1)):
            r = analyse(clicks(bpm, first, 40))
            self.assertAlmostEqual(r["bpm"], bpm, delta=0.5, msg=f"{bpm} BPM")
            self.assertAlmostEqual(r["firstBeat"], first, delta=0.03, msg=f"{bpm} BPM")

    def test_finds_where_the_bass_comes_in(self):
        # 120 BPM from 0.25 s: bar 4 starts at 8.25 s.
        r = analyse(clicks(120, 0.25, 40, bass_from=8.25))
        self.assertEqual([d["bar"] for d in r["bassIn"]], [4])
        self.assertAlmostEqual(r["bassIn"][0]["time"], 8.25, delta=0.05)


if __name__ == "__main__":
    unittest.main()
