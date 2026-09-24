# Pick the two plates behind each short's meaning lines

Each short in this series (one per I-Ching hexagram) shows two meaning lines, about 2 s each,
typed over a full-screen woodcut-style plate. Each hexagram has 64 plates, keyed N-k. Pick
two for each hexagram you are given: the first for meaning 1, the second for meaning 2.

For each hexagram N:
- Its lines are in series/copy-draft.json under "N": meaning[0].text and meaning[1].text
  ("\n" is a line break). The hook and question there tell you the short's idea.
- Its plates are on two contact sheets, out/plates/N-a.png and out/plates/N-b.png, each
  plate labelled with its key. Plate N-N is not on them and can't be used.

What makes a good pick:
- A viewer gets it at a glance, in 2 s, behind text: a clear subject (a person, an animal,
  a single scene), not a crowded one.
- It shows what the line says, or the situation the line is about. Literal is good.
- The two plates differ from each other.

Examples from shorts already made:
- 1, "The Creative / says: begin." → 1-11, a rider setting off down a road. "No conditions. /
  Just mean it." → 1-27, a figure walking through a gate into light.
- 29, "keep moving" → 29-31, a figure walking into a storm; "like water" → 29-60, rushing water.
- 52, stillness → 52-12, a figure sitting still by a wall; 52-1, a figure sitting in a clearing.

Write the output path you are given as a JSON list, one item per hexagram, in the order
given: {"number": 3, "plates": ["3-17", "3-40"], "why": ["what 3-17 shows and why", "what 3-40 shows and why"]}.
Read only series/copy-draft.json, this file and the sheets of your hexagrams. Write nothing
else to disk.
