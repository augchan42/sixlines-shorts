import unittest

import add_sections


def fits(bpm, drops):
    return [[] for _ in drops]


def section(track, problems=fits):
    return add_sections.section(track, problems)


def track(energy, bpm=120.0, first=0.1):
    bar = 240 / bpm
    return {"bpm": bpm, "firstBeat": first, "barSeconds": bar, "energy": energy, "duration": first + len(energy) * bar}


class SectionTest(unittest.TestCase):
    def test_starts_six_bars_before_the_biggest_rise(self):
        s = section(track([3] * 10 + [9] * 30))
        self.assertEqual(s, {"start": 0.1 + 4 * 2.0, "firstBeat": 0.0, "drop": 12.0})

    def test_starts_at_the_top_when_the_rise_is_early(self):
        s = section(track([3] * 4 + [9] * 30))
        self.assertEqual(s, {"start": 0.0, "firstBeat": 0.1, "drop": 8.1})

    def test_skips_a_rise_too_near_the_end_for_the_rest_of_the_short(self):
        # 44 beats at 120 bpm is 11 bars; the bigger rise at bar 30 has only 4 bars after it.
        s = section(track([3] * 10 + [8] * 16 + [1] * 4 + [9] * 4))
        self.assertEqual(s["drop"], 12.0)


    def test_skips_a_rise_whose_short_the_plan_refuses(self):
        refuse_12 = lambda bpm, drops: [["too long"] if d == 12.0 else [] for d in drops]
        s = section(track([3] * 10 + [9] * 4 + [6] * 30), refuse_12)
        self.assertNotEqual(s["drop"], 12.0)

    def test_asks_the_plan_in_node(self):
        self.assertEqual(add_sections.plan_problems(90, [10.862, 8.05]), [["40.00 s long"], []])


if __name__ == "__main__":
    unittest.main()
