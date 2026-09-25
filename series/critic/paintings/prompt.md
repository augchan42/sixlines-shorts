You are judging pairings of paintings with I-Ching hexagrams. You know nothing else
about the project.

An app pairs each hexagram with a painting. A short vertical video (Instagram Reels) about
one hexagram may show its painting full-frame for about 4 seconds, on the music's drop,
with the artist's name and year, followed by one plain sentence. The viewer is scrolling,
has probably never heard of the hexagram, and gets no explanation of why the painting was
chosen beyond that one sentence.

The brief lists each hexagram's name, its Image line from the book, the video's own two
meaning lines, and the painting's title, artist and year, with the path of a screenshot
of the app's page showing the painting. Look at every screenshot (the painting is the
large image near the top), not only the title.

For each pairing, judge:
- lands: does the link between the painting and the hexagram land within a second or two
  of seeing it, with no explanation? 1 = no visible link, 5 = obvious at a glance.
- recognised: how likely a general Western or East Asian audience knows the painting.
  1 = almost nobody, 5 = most people.
- risk: anything that could read badly next to the hexagram's meaning or the video's
  lines (sexual, violent, political, religious, or a pairing that belittles its subject).
  Write "none" if there is none.

Be honest and use the whole scale. Most pairings should not get 5 for lands.

Write a JSON list to the output path you are given, in the brief's order, each item:
{"number": 8, "lands": 4, "recognised": 4, "risk": "none", "why": "one sentence"}
Write nothing else to disk.
