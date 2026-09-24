import unittest

from layout import LINE_GAP, LINE_H, LINE_W, TRIGRAM_GAP, YIN_GAP, frame_count, land_frame, line_z, slabs


class LayoutTest(unittest.TestCase):
    def test_yang_lines_are_one_full_width_slab(self):
        s = slabs("111111")
        self.assertEqual(len(s), 6)
        self.assertTrue(all(w == LINE_W and x == 0 for _, x, _, w in s))

    def test_yin_lines_are_two_slabs_with_the_gap(self):
        s = slabs("000000")
        self.assertEqual(len(s), 12)
        (_, xl, _, wl), (_, xr, _, wr) = s[0], s[1]
        self.assertAlmostEqual((xr - wr / 2) - (xl + wl / 2), YIN_GAP)
        self.assertAlmostEqual((xr + wr / 2) - (xl - wl / 2), LINE_W)

    def test_mixed_lines_keep_their_order(self):
        s = slabs("101010")
        self.assertEqual([line for line, *_ in s], [0, 1, 1, 2, 3, 3, 4, 5, 5])

    def test_gaps_follow_the_og_image(self):
        self.assertAlmostEqual((line_z(1) - LINE_H / 2) - (line_z(0) + LINE_H / 2), LINE_GAP)
        self.assertAlmostEqual((line_z(3) - LINE_H / 2) - (line_z(2) + LINE_H / 2), TRIGRAM_GAP)

    def test_hexagram_is_centred(self):
        self.assertAlmostEqual(line_z(0), -line_z(5))

    def test_lines_land_on_half_beats(self):
        self.assertEqual([land_frame(i, 110) for i in range(6)], [0, 8, 16, 25, 33, 41])

    def test_frame_count_matches_clips_ts(self):
        self.assertEqual(frame_count(4, 110), 67)


if __name__ == "__main__":
    unittest.main()
