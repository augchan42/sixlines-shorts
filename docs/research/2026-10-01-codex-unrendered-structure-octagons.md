VERDICT: render.

WHY: A newcomer can keep two things: opposite trigrams differ in every line; Later Heaven connects positions with seasons.
Blender adds little here. Adapt the Remotion drawing in `src/scenes/Diagram.tsx`; its existing ring has 64 hexagrams, so it needs an eight-trigram layout.
Use one large octagon for teaching, two stacked octagons only for comparison.

Both arrangements: **south top, west right, north bottom, east left**. Clockwise from top, the checked orders are:

| Position | Earlier Heaven | Later Heaven |
|---|---|---|
| S — top | Heaven | Fire |
| SW — upper right | Wind | Earth |
| W — right | Water | Lake |
| NW — lower right | Mountain | Heaven |
| N — bottom | Earth | Water |
| NE — lower left | Thunder | Mountain |
| E — left | Fire | Thunder |
| SE — upper left | Lake | Wind |

[Diagram reference](https://www.nationsonline.org/oneworld/Chinese_Customs/bagua.htm).

Keep every trigram upright, bottom line lowest. Black background, thin green octagon, green bars with restrained glow. Fixed overhead view; no camera rotation.

1. **Page 1:** One large Earlier Heaven octagon. Heaven’s three solid bars appear bottom to top over 1.2 seconds; the other seven patterns fade in together. No labels or amber.
2. **Page 2:** Two stacked octagons, Earlier above Later. English arrangement titles; attribution stays in the agreed terminal copy. Static, all green.
3. **Page 3:** Earlier Heaven fills the window. Heaven and Earth turn amber together, with `天 HEAVEN` and `地 EARTH` beside them. One thin amber diameter connects them. Hold; then highlight Lake/Mountain, Fire/Water, Thunder/Wind together for two seconds to establish that all four pairs qualify.
4. **Page 4:** Replace the eight-way morph with **one tracked move**. Other seven patterns fade out over 0.6 seconds. Amber Thunder travels from lower left to left along the octagon’s 45° perimeter arc over two seconds, cubic ease-in-out; its bars never change or rotate. The seven Later Heaven patterns fade in over 0.6 seconds. Show `雷 THUNDER`, `EAST / SPRING`; other cardinal labels remain dim green: south/summer, west/autumn, north/winter. [Traditional commentary supports east/spring](https://zh.wikisource.org/zh-hant/周易正義/09.05).
5. **Page 5:** Two stacked octagons again. Earlier: Heaven/Earth amber. Later: Thunder amber beside east/spring. Hold without movement.

No permanent Chinese labels on all eight; label only the teaching examples. No blue needed.

SMOKE TEST: **One 16-second sample spanning pages 3–4**, from a proposed eight-trigram mode in `Diagram.tsx`, inside `Lesson.tsx`, using `structure-octagons.json`.

- **0–2 s:** Page 3 query types; Earlier Heaven visible.
- **2–5 s:** Answer types; Heaven/Earth turn amber, bilingual labels and diameter appear.
- **5–7 s:** Hold the pair.
- **7–9 s:** Page 4 query types; pair highlight clears.
- **9–9.6 s:** Other seven patterns fade out; Thunder becomes amber.
- **9.6–11.6 s:** Thunder follows the perimeter arc.
- **11.6–12.2 s:** Later Heaven’s remaining patterns fade in.
- **12.2–16 s:** Hold Thunder beside east/spring as the answer finishes.

Fixed camera. Use the agreed 100 bpm track quietly, with typing and low hum; no movement sound. **Viewing question:** “Can you see the three-line difference, then follow Thunder to east/spring, at phone size?”

RISKS: Eight simultaneous moving trigrams would obscure the lesson; omit that morph.
Glow must leave broken-line gaps clearly open.
Two arrangements can look crowded; use the stacked comparison only on pages 2 and 5.