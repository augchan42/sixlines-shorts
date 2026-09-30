The numerical ordering is correct. The copy and build plan need changes.

References below use sections of the [research doc](/Users/auchan/projects/sixlines-shorts/docs/research/2026-09-30-leibniz-diagram.md). Page numbers mean the numbered lesson pages.

**Claims and copy, page by page**

| Page | Support and finding |
|---|---|
| **1** | **Research §1:** 64 hexagrams and dispatch in 1701 are supported. “WENT FROM CHINA TO EUROPE IN 1701” can imply arrival that year, contradicting page 3. Use **“SENT FROM CHINA IN 1701.”** Define a hexagram as a pattern of six lines here or on page 4. |
| **2** | **Research §1:** sender, Peking, and 4 November 1701 are supported. **Well-established history:** Bouvet served at Kangxi’s court and taught him mathematics. The court wording is sound; it does not imply that Kangxi commissioned this diagram. [National Palace Museum](https://theme.npm.edu.tw/EducationofA-ge/en/page_3) |
| **3** | **Research §§1, 3:** receipt on 1 April 1703 and the 1679 binary manuscript are supported. “Written up” correctly avoids claiming publication in 1679. Keep. |
| **4** | **Research §5:** broken = 0, solid = 1, bottom-first reading, and Bi = `000010` = 2 are correct **under Leibniz’s interpretation**. Say whose reading this is. “Bit” is unexplained; use “digit” or define it. Show weights **32, 16, 8, 4, 2, 1 from bottom to top**, with an arrow connecting that direction to the written numeral. |
| **5** | **Research §5:** Kun = 0, Qian = 63, and the right-half count to Gou = 31 are supported. The answer names Qian, but the animation ends at Gou. Label **GOU — 31** at the endpoint and identify Qian as the eventual endpoint of the whole count. |
| **6** | **Correct mathematical inference from §5.** “The right half is full” and “sets” are unclear to a newcomer. Use **“AFTER 31, START AT THE BOTTOM LEFT. / AT 32, THE BOTTOM LINE TURNS SOLID.”** Show `011111 → 100000`: the other five lines also become broken. |
| **7** | **Research §2, qualified:** Commons attributes the handwriting to Leibniz and cites Perkins p. 117, but the research did not inspect Perkins’s page. The numerical range is secure; the hand is less directly verified. Use **“0 TO 63. / ATTRIBUTED TO LEIBNIZ.”** or verify Perkins before keeping the definitive wording. [Commons attribution](https://commons.wikimedia.org/wiki/File:Diagram_of_I_Ching_hexagrams_owned_by_Gottfried_Wilhelm_Leibniz,_1701.jpg) |
| **8** | **Research §§1, 4:** the order is conventionally attributed to Shao Yong, an eleventh-century thinker. The chapter **“WHO DREW IT”** implies authorship of this physical print, which is unsupported. The research says the diagrams appear in later publications, not preserved original writings. Rename the chapter **“THE ORDER”**; preferably say **“ATTRIBUTED TO SHAO YONG.”** |
| **9** | **Research §4:** repeated division and six stages are supported. But “BY HALVING: ONE, TWO, FOUR…” followed by “doubling” on page 10 sounds contradictory. Explain **“EACH PATTERN BRANCHES INTO TWO. / EACH STAGE ADDS A LINE.”** Branching divides possibilities while doubling their count. |
| **10** | **Research §4:** the quotation is correctly attributed to Cheng Hao, not Zhu Xi. **“Friend” is defensible:** Joseph Adler explicitly describes Shao Yong as a friend of the Cheng brothers, PDF p. 5. The recorded personal exchange also supports familiarity. Keep “friend”; avoid making “just” sound like a sneer. [Adler](https://www2.kenyon.edu/Depts/Religion/Fac/Adler/Writings/Lotus%20and%20Zhu%20Xi.pdf), [recorded exchange](https://zh.wikisource.org/wiki/上蔡語錄/卷三) |
| **11** | **Research §5:** same 64 patterns, rows sharing lower trigrams, columns sharing upper trigrams—all supported. “Trigram” has not been defined in this lesson. Add **“A TRIGRAM IS THREE LINES”**, or label upper/lower brackets clearly before highlighting the row and column. |
| **12** | **Research §6 supports the narrower argument, not a verdict about all Chinese mathematics.** Change the question to **“DID LEIBNIZ GET BINARY HERE?”** “HE DID NO SUMS WITH THEM” is too broad: Shao Yong had numerical and computational methods. Say **“SHAO YONG DID NOT USE THESE PATTERNS / AS NUMERALS FOR ARITHMETIC.”** Leibniz already having binary is supported. “Confirmation” describes his belief; it does not establish the diagram’s original meaning. |
| **13** | **Overstatement despite the research’s safe-copy list.** Leibniz wrote **“perhaps”** the most ancient monument of science. Restore **“PERHAPS THE MOST ANCIENT / MONUMENT OF SCIENCE.”** His claim concerned the figures he attributed to ancient Fuxi, not the age of this print. [Leibniz’s text](https://www.laurentbloch.net/MySpip3/L-arithmetique-binaire-par-Leibniz-98) |
| **14** | **Research §7:** Wang Bi’s meaning/image passage is supported. “800 YEARS EARLIER” means earlier than Shao Yong, but follows Leibniz and can be misread. Use **“WANG BI, THIRD CENTURY”** or name Shao Yong as the comparison. It should not sound like Wang Bi commented on this later diagram. |
| **15** | Six lines and 64 possible patterns are established mathematics. “64 situations” is an interpretive slogan, not a claim established by this research. **“SIX LINES. 64 PATTERNS.”** fits this lesson more precisely. |

No banned words occur in the proposed on-screen copy. They do occur in the specification’s explanatory banned-word list, so check rendered text fields rather than the entire Markdown file.

**Ordering: pass, with one historical distinction**

I checked the seven named hexagrams against `series/hexagrams.json`. All match:

| Hexagram | Bottom → top | Value |
|---|---|---:|
| Kun | `000000` | 0 |
| Bo | `000001` | 1 |
| Bi | `000010` | 2 |
| Gou | `011111` | 31 |
| Fu | `100000` | 32 |
| Guai | `111110` | 62 |
| Qian | `111111` | 63 |

The ring placement and traversal agree with research §5: Qian upper left, Gou upper right, Fu lower left, Kun lower right; count upward on the right, restart at the bottom left, then count upward there. Bottom lines face inward.

The square is also consistent: `value = 8 × lower + upper`, Kun top left, Qian bottom right. Its top row **left → right** is:

**坤 剝 比 觀 豫 晉 萃 否**

Write it that way in the build specification to remove the direction ambiguity.

These agree with the Xiantian arrangement **read numerically by Leibniz**. Traditional Chinese numbering starts from Qian and runs the other way; it is not originally a Chinese count from zero. That distinction should appear on screen, ideally page 4 or 12.

Page 9 must split the linear row into two groups of 32 before forming the semicircles. Simply bending one ascending row into a continuous circle produces the wrong traversal.

The research explicitly did not visually check the actual print’s square corners. The design’s “checked against the woodcut” assertion therefore needs separate evidence.

**Build: sound extension, incomplete contract**

Adding diagram rendering to the existing lesson shell is reasonable. These details are missing:

- **Show schema:** existing `draw` is boolean, `fly` is a line index, and `amber` contains line indices. Give the new kinds distinct, nested fields or a discriminator. Specify the missing `bits` mode for page 4, both layers and timing for its fade, and the side-by-side composition for page 12.
- **Data:** [explainer.mjs](/Users/auchan/projects/sixlines-shorts/scripts/explainer.mjs:78) currently loads only hexagrams named by `show.hex` or `show.small`. Diagram pages need all 64, plus an explicit distinction between King Wen identifiers and binary values.
- **Camera:** [Flight.tsx](/Users/auchan/projects/sixlines-shorts/src/scenes/Flight.tsx:23) has a private projection function; its camera targets a single stack and descends to a line. Reuse the projection, but define diagram targets, glyph rotations, and camera continuity separately.
- **Timing:** [Lesson.tsx](/Users/auchan/projects/sixlines-shorts/src/templates/Lesson.tsx:77) derives duration from typing and reading, not animation. Page 5 defaults to about **6.1 seconds**. Specify count start, duration, and endpoint hold; drive counter, amber selection, and camera from the same progress.
- **Compatibility:** chapters currently last **1.5 seconds**, not the proposed two. Add a lesson-specific setting. One Wang Bi still cannot verify camera, timing, and audio compatibility; include its approach and descent pages.
- **Tests:** keep pure geometry helpers outside TSX so the existing Node test setup can import them. Add all-64 uniqueness, traversal direction, inward orientation, square-cell uniqueness, and six-stage tree checks—not just corners.

For the **pages 1 and 5 smoke test**:

- A range selector cannot select only those nonconsecutive pages. Support **`--pages 1,5`**, numbered independently of chapter cards.
- Give the smoke its own output name; disable end card and end-music lead-in.
- Page 5 must initialize its camera and count independently of pages 2–4.
- Define the two page durations to total about 20 seconds. Current defaults total roughly 14 seconds.
- Include the plate in missing-asset checks and manifest hashes.
- Inspect the compressed share file on a phone: whole-plate recognition on page 1; correct direction, readable counter, synchronized amber, and a held `011111 = 31` endpoint on page 5.

**Verdict: CHANGE.** Fix pages **1, 4, 6–9, 11–15** as above; resolve page 5’s endpoint wording. Keep Bouvet’s court description and Cheng Hao’s friendship. Complete the schema, data, camera, timing, and nonconsecutive smoke-selection plan before implementation.