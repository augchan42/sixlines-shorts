You are Astra, reviewing a planned short for Six Lines, an I Ching app. Item: structure-octagons, "Structure: heaven before and after" (stage: drafted).

What it is: a vertical terminal-style short (header SIX LINES // READY FOR INQUIRY; each page types a query after ">" then an answer; a drawing or Blender clip plays in the window below, 980x1160). Copy is agreed with you already (series/explainers/structure-octagons.json; your review docs/research/2026-10-01-codex-structure-octagons.md). The planned visual, from docs/superpowers/specs/2026-09-30-structure-shorts-design.md section 5: "two octagons of glowing trigrams; the trigrams move from one arrangement to the other". No Blender scene exists yet. Every page's "show" is empty.

For comparison, the structure shorts already rendered with Blender in the window: the cube (blender/hypercube.py, scripts/hypercube.mjs, series/explainers/structure-cube.json) and the timeline (blender/timeline.py, a corridor of dates with a slow searchlight; commit 2285524). Remotion wireframes live in src/scenes/Diagram.tsx (a ring already exists there); the terminal template is src/templates/Lesson.tsx. HUD colours: frame and lines green, amber for the line to look at, cyan the prompt, blue only to explain a point. Blender style the user likes: faceted low-poly on black, minimal neon lines.

Questions:
1. Is this short worth rendering? Does it teach something a newcomer can see and keep (Earlier Heaven: facing pairs differ in all three lines; Later Heaven: directions and seasons)?
2. Review the planned visual treatment. Propose the scene concretely, page by page: what is in the window on each of the 5 pages, which trigram sits where in each octagon (check the standard Earlier Heaven and Later Heaven orders and orientation: south at top in the traditional diagrams), what moves and how (the morph between arrangements: paths, timing, easing), what turns amber, whether the Chinese names with English appear on the trigrams, camera. Say whether Blender earns its place here or whether the existing Remotion ring/wireframe would do the job better.
3. If render: the first smoke test.

The user's constraints (all apply):
- Plain copy, no mannered prose; when a literal phrase is available, use it.
- Banned words in our own copy: oracle, divination, fortune, prediction, mystical, magical; in Chinese 預測/预测, 占卜, 算命, 神諭. (History, quotes and app-screen glosses are fine.)
- Calm motion: no punch, shake or sway over hexagrams, trigrams or lessons. Slow camera moves only.
- Music at most 120 bpm, matched to the mood; one track per short.
- English beside any Chinese shown on screen; the user does not read Chinese.
- No AI-generated images.
- Six Lines (sixlines.day) is for honing judgment: a Confucian / Wang Bi / Ten Wings reading of the I Ching, not telling the future.
- The user once called literal effects "cheesy" (a spotlight and a searchlight over trigram tests). Since 2026-09-29 the user trusts our judgment on literal visuals unless you object, so object if you see the risk.
- Less is more: the plain hexagram build with its camera moves is the benchmark; add as little as possible.
- The user can't judge an item that was never rendered; the point of this review is to decide whether each item earns a render.
- Smoke tests: one sample, under 20 s, which the user views before any batch.

Read-only in the repo sixlines-shorts. Do not render or write anything. Be direct and short.

Answer in this form:
VERDICT: render, drop, or park.
WHY: two to four lines.
SMOKE TEST (if render): exactly what the one sample is (which page or moment, length under 20 s, what is on screen second by second, camera, sound/music, which script or file it would come from), and what question the user should answer when viewing it.
RISKS: up to three lines.
