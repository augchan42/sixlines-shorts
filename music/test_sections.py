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

    def test_shortens_the_lead_in_when_six_bars_make_the_short_too_long(self):
        refuse_12 = lambda bpm, drops: [["too long"] if d == 12.0 else [] for d in drops]
        s = section(track([3] * 10 + [9] * 30), refuse_12)
        self.assertEqual(s, {"start": 0.1 + 5 * 2.0, "firstBeat": 0.0, "drop": 10.0})

    def test_another_part_starts_away_from_the_parts_taken(self):
        t = track([3] * 10 + [9] * 10 + [2] * 10 + [8] * 30)
        first = section(t)
        second = add_sections.section(t, fits, taken=[first["start"]])
        self.assertGreaterEqual(abs(second["start"] - first["start"]), add_sections.SPREAD)

    def test_a_section_near_a_chosen_start_takes_the_rise_nearest_it(self):
        # The user approved the part from 30 s by ear; the bigger rise at bar 10 starts at 8.1 s.
        t = track([3] * 10 + [9] * 5 + [2] * 5 + [7] * 30)
        s = add_sections.section(t, fits, near=30.0)
        self.assertEqual(s["start"], 0.1 + 14 * 2.0)

    def test_asks_the_plan_in_node(self):
        self.assertEqual(add_sections.plan_problems(90, [10.862, 8.05]), [["40.00 s long"], []])


if __name__ == "__main__":
    unittest.main()


class ArgTest(unittest.TestCase):
    def test_a_section_can_be_kept_for_named_hexagrams(self):
        self.assertEqual(add_sections.parse_arg("pick13:kun"), ("pick13", "kun", None, None))
        self.assertEqual(add_sections.parse_arg("pick22:dui:47,49"), ("pick22", "dui", [47, 49], None))

    def test_a_section_can_start_near_a_chosen_second(self):
        self.assertEqual(add_sections.parse_arg("pick11:kan:3@0"), ("pick11", "kan", [3], 0.0))
        self.assertEqual(add_sections.parse_arg("pick22:dui:28@136"), ("pick22", "dui", [28], 136.0))
