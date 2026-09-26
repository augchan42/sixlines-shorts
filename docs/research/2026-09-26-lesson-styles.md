# Lesson styles: what we have, and which hexagrams each suits

The user, 2026-09-26, after the two experiments on 21: both are "really great". Where the
lines lend themselves to a picture, act it out as the bite does; otherwise the Nostromo
readout is "interesting and consistent for anything else". Perhaps the readout suits a Wang
Bi reading. The aim of every lesson is to help a viewer remember the lines, the trigrams
and the meaning, telling the story in an engaging, minimalist way.

## The styles

| Style | Code | Status | Suits |
|---|---|---|---|
| **Lines act the picture** | blender/bite.py (21) | liked | Hexagrams whose shape is a picture in the Ten Wings, or where one line or one trigram does something |
| **Readout** | src/scenes/Readout.tsx | liked | Anything; best where the lesson is the structure: one line ruling the rest, lines answering each other, lines in or out of their places |
| **Neon character** | blender/character.py | loved | Hexagrams whose character's parts tell the story (困 a tree boxed in, 需 a figure waiting in rain) |
| **Moon** | blender/moon.py | used on the Mid-Autumn special | Occasions |
| **App screens** (no lesson) | Series.tsx showcase | in use on 35 | Showing the app itself |
| **Judgment page** | Library screen | in use on 9, unproven | Showing the app's text |
| **Painting** | Art tab | in use | Hexagrams with a strong painting |
| **2D trigrams** | src/scenes/Trigrams.tsx | in use on 6 | Superseded by the readout, which names the trigrams and more |
| Lake, neon signs, words on bars | blender/trigram.py | ruled out: "cheesy" | |
| Searchlight (Blender and 2D) | blender/searchlight.py, src/fx/Searchlight.tsx | ruled out | |
| House collapse | blender/collapse.py | "okay, nothing great" | |
| Trigrams part, camera turns | blender/focus.py | the plain build was preferred | |

## The readout and Wang Bi

We have no Wang Bi text: our commentary (sixlines-content, commentary/en) gives each
hexagram's Judgment, Image and lines, transliterated and explained. His reading is
structural, though, and a readout can show structure:

- **One rules the many.** In his Outline (Zhouyi lüeli, "Ming tuan"), where one line differs
  from the other five, that one line rules the hexagram. The readout marks it.
- **Places.** Odd places (1, 3, 5) are yang's, even places yin's; a line is in or out of its
  place. The readout can log each: `L1 YANG · ODD · IN PLACE`.
- **The centre.** Lines 2 and 5 are the centres of their trigrams.
- **Answering lines.** 1 answers 4, 2 answers 5, 3 answers 6, when one is yin and the other
  yang. The readout can draw the link.

For hexagrams without a single odd line, the ruler needs a source before we put it on
screen: Li Guangdi's Zhouyi zhezhong (1715) names the rulers of all 64.

## My pick for each hexagram

### Lines act the picture (15)

| # | Hexagram | Lines (bottom first) | What the lines do |
|---|---|---|---|
| 7 | The Army | 010000 | The yin lines fall in behind the one yang, the general in the second place |
| 11 | Peace | 111000 | Heaven below rises, earth above sinks; they meet and pass through each other |
| 12 | Standstill | 000111 | Heaven above rises, earth below sinks; they drift apart |
| 15 | Modesty | 001000 | The one yang, the mountain, lowers itself under the earth |
| 21 | Biting Through | 100101 | Done: the jaws bite the fourth line into yin, leaving 27 |
| 24 | Return | 100000 | One yang comes back in at the bottom |
| 27 | Nourishment | 100001 | The open mouth closes slowly: what goes in, what comes out |
| 28 | Greatness in Excess | 011110 | The ridgepole: four heavy yang, and the weak end lines bow under them |
| 29 | The Abyss | 010010 | Each yang sinks into the yin round it, twice |
| 30 | Clinging Fire | 101101 | Yang outside, yin inside, twice: the flame's hollow centre glows |
| 43 | Breakthrough | 111110 | Five yang rise and push the last yin off the top |
| 44 | Coming to Meet | 011111 | One yin slips in under five yang |
| 51 | The Arousing | 100100 | The yang at the bottom of each trigram jolts up (the lines move, the camera does not) |
| 61 | Inner Truth | 110011 | The empty centre opens |
| 62 | Preponderance of the Small | 001100 | A bird: the yin halves are wings; it glides down, not up, as its Judgment says |

### Neon character (14, as now)

5, 8, 18, 19, 23, 32, 36, 42, 47, 48, 50, 56, 58, 63.

### Readout (the other 35)

1, 2, 3, 4, 6, 9, 10, 13, 14, 16, 17, 20, 22, 25, 26, 31, 33, 34, 35, 37, 38, 39, 40, 41, 45, 46, 49, 52, 53, 54, 55, 57, 59, 60, 64.

The strongest readouts, where Wang Bi's reading is the lesson:

- **9, 10, 13, 14, 16**: one line differs from the other five, and rules them.
- **64** (010101): every line is out of its place, yet each answers its partner. It is 63 turned inside out.
- **1, 2**: all yang, all yin. The readout shows six lines in and out of place, and no ruler.

About 35 of the shorts now have no lesson and show the app's screens instead. Keep some of
them for the app's pitch; which ones is the user's call.

## Sources

- Wang Bi, Zhouyi lüeli ("General Remarks on the Changes of the Zhou"), "Ming tuan": the one rules the many. In English: Richard John Lynn, The Classic of Changes: A New Translation of the I Ching as Interpreted by Wang Bi (Columbia University Press, 1994).
- Tuan Zhuan (Commentary on the Judgments) on 21: "There is something between the corners of the mouth."
- Shuo Gua (Discussion of the Trigrams), chapter 7: what each trigram does (as src/scenes/Readout.tsx).
- Li Guangdi, Zhouyi zhezhong (1715): the rulers of all 64.
