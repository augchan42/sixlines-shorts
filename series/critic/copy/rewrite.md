# Rewrite the copy of the shorts rated 5 and 6

Rewrite these 23 entries in series/copy-draft.json: 3, 8, 10, 13, 14, 17, 18, 19, 22, 23,
24, 27, 31, 34, 35, 37, 41, 42, 45, 50, 54, 59, 62. Change nothing else in the repo.

Each is one short vertical video about an I-Ching hexagram, made to promote an I-Ching app.
How a short plays, about 30 s:
1. Hook: large text, about 2 s. It must stop someone scrolling: a real situation a viewer
   is in, put as a question.
2. A 3D hexagram builds, with its name.
3. Meaning 1 and meaning 2, about 2 s each, over an old woodcut plate. "\n" is a line break.
4. Question: put to the viewer, about 2 s. It should make them think of their own life.
5. The app's screens, then an end card.
The caption is the post text under the video.

Inputs:
- The hexagram's commentary: ../sixlines-content/content/commentary/en/N.json. The copy must
  be true to it. Every part carries a source: "commentary/en/N.json#<field path>" for the
  part of the commentary it comes from, or "written" (the question usually is).
- The approved copy of 8 other shorts, as examples of the voice: series/copy.json. Meaning 1
  there names the hexagram ("The Creative\nsays: begin."); keep that pattern, but the line
  after "says:" must say something, not repeat the name.
- A blind rater's notes on the current versions: series/critic/copy/ratings.json
  ("weakest" is the main complaint). Fix what it names.

Rules:
- Hook, meaning, question and caption make one idea. The meaning lines must make sense
  without the caption: no image or story the viewer has not been told.
- Plain words. Say the literal thing. No clichés, puns, greeting-card lines, or slogans.
- Word counts: hook 3–7, each meaning 3–6, question 1–6, caption 8–35. Meaning and question
  lines at most 18 characters each (split with "\n").
- Caption: 1–2 sentences. It can carry the commentary's image that the video leaves out.
- No "should", no exclamation marks, no fortune-telling words, "I-Ching" with the hyphen.
- Run `node scripts/copy-check.mjs` until it prints no problems.

When done, reply with only: the numbers changed, and the check's last line.
