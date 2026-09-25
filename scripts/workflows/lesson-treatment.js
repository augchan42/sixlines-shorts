export const meta = {
  name: 'lesson-treatment',
  description: 'Score each hexagram\'s choice between its current lesson and its character drawing; redo every choice under 8 until it passes or rounds run out',
  phases: [
    { title: 'Critique', detail: 'two critics score every open choice 1-10; the average is kept' },
    { title: 'Redo', detail: 'one agent redoes every choice under 8 from both critics\' feedback' },
  ],
}

// Reads series/critic/lessons/treatment-input.json: for each hexagram with a character drawing
// (series/characters.json), its current lesson, the drawing's story and sentence, a strip of
// the clip, and the decision to judge. Returns every round's scores and the final decisions;
// the caller writes them to series/critic/lessons/treatment.json.
const ROOT = '/Users/auchan/projects/sixlines-shorts'
const INPUT = `${ROOT}/series/critic/lessons/treatment-input.json`
const ROUNDS = 3
const PASS = 8

const DECISION = {
  type: 'object',
  properties: {
    number: { type: 'integer' },
    choice: { type: 'string', enum: ['keep', 'character'] },
    text: { type: 'string', description: 'the sentence on screen, one or two screen lines separated by \\n' },
    why: { type: 'string', description: 'one or two sentences' },
  },
  required: ['number', 'choice', 'text', 'why'],
}
const SCORES = {
  type: 'object',
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          number: { type: 'integer' },
          score: { type: 'integer', minimum: 1, maximum: 10 },
          feedback: { type: 'string', description: 'what is wrong, and what would score higher' },
        },
        required: ['number', 'score', 'feedback'],
      },
    },
  },
  required: ['scores'],
}
const REDO = { type: 'object', properties: { decisions: { type: 'array', items: DECISION } }, required: ['decisions'] }

const SETTING = `Sixty-Four Records is a series of 64 vertical shorts, one per I Ching hexagram, for people who have never read the I Ching. Each short shows the hexagram, a few lines of copy, then a LESSON: one sentence of 3 to 7 words, typed on screen. There are two kinds of lesson for the hexagrams in ${INPUT}:
- keep: the current lesson (a line, the Judgment, the Image, or a painting), a sentence typed over falling code.
- character: a neon 3D drawing of the hexagram's Chinese character, animated to act out its meaning (the "story"), then the sentence typed under it. The strip file shows 8 frames of the clip, left to right; Read it to see what the viewer sees.
Each hexagram's entry has "current", "character" and "decision" (choice, text, why). A character choice may use the drawing's sentence or a new sentence that names what the drawing shows. The author likes the character lessons and chose the character for 42 益 ("Let your gain / spill over").
What makes a good choice: a newcomer understands who does what at first sight; it teaches the hexagram's intent (line images are flavour); it is fun to watch; the sentence is plain, literal and short (no mannered prose); it is true to the text. A weak drawing should not win over a strong sentence, and a clear drawing should not lose to a sentence that needs history to follow.`

const LENSES = [
  'You watch it as a newcomer on a phone: would you get it, and is it fun?',
  'You know the I Ching well: is the choice true to the hexagram, and is the sentence plain and accurate?',
]

const critique = (open, round) =>
  parallel(LENSES.map((lens, i) => () =>
    agent(`${SETTING}\n\nRead ${INPUT} and the strip of each hexagram listed below. ${lens}\nScore each DECISION 1-10 (8 or more: you would ship it as is). Judge the decision against the other option too: a 10 means neither option nor another sentence would do better.\n\nDecisions to score:\n${JSON.stringify(open, null, 1)}`,
      { label: `critic ${i + 1}, round ${round}`, phase: 'Critique', schema: SCORES })))

// With args {candidates: PATH} (series/critic/lessons/treatment-candidates.json), only score each
// hexagram's candidates, so the best can be kept; rounds 1-3 are in treatment.json.
const PICKS = {
  type: 'object',
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          number: { type: 'integer' },
          candidate: { type: 'integer', description: 'index in that hexagram\'s list, from 0' },
          score: { type: 'integer', minimum: 1, maximum: 10 },
          feedback: { type: 'string' },
        },
        required: ['number', 'candidate', 'score', 'feedback'],
      },
    },
  },
  required: ['scores'],
}
if (args?.candidates) {
  phase('Critique')
  const results = (await parallel(LENSES.map((lens, i) => () =>
    agent(`${SETTING}\n\nRead ${INPUT}, ${ROOT}/series/critic/lessons/treatment.json (the earlier rounds and their feedback) and ${args.candidates}, and the strips of the hexagrams in the candidates file. ${lens}\nFor each hexagram in the candidates file, score EVERY candidate 1-10 (8 or more: you would ship it as is). Each candidate is [choice, text]; "keep" means the current lesson, typed over falling code, with no drawing.`,
      { label: `critic ${i + 1}, candidates`, phase: 'Critique', schema: PICKS })))).filter(Boolean)
  const by = {}
  for (const r of results) for (const s of r.scores) (by[`${s.number}:${s.candidate}`] ??= []).push(s)
  return Object.entries(by).map(([k, ss]) => ({
    number: +k.split(':')[0], candidate: +k.split(':')[1],
    score: ss.reduce((a, s) => a + s.score, 0) / ss.length, feedback: ss.map((s) => s.feedback),
  }))
}

let open = null
const rounds = []
const final = {}
for (let round = 1; round <= ROUNDS; round++) {
  if (!open) open = 'ALL'
  const list = open === 'ALL' ? 'every entry\'s "decision" in the input file' : open
  const results = (await critique(list, round)).filter(Boolean)
  const by = {}
  for (const r of results) for (const s of r.scores) (by[s.number] ??= []).push(s)
  const scored = Object.entries(by).map(([n, ss]) => ({
    number: +n,
    score: ss.reduce((a, s) => a + s.score, 0) / ss.length,
    feedback: ss.map((s) => s.feedback),
    decision: open === 'ALL' ? null : open.find((d) => d.number === +n),
  }))
  rounds.push({ round, scored })
  for (const s of scored) final[s.number] = s
  const low = scored.filter((s) => s.score < PASS)
  log(`round ${round}: ${scored.length} scored, ${low.length} under ${PASS}`)
  if (!low.length || round === ROUNDS) break
  phase('Redo')
  const redo = await agent(`${SETTING}\n\nRead ${INPUT} and the strips of these hexagrams. Each decision below scored under ${PASS}; the critics' feedback is attached. Write a better decision for each: switch the choice, or keep it with a better sentence (3 to 7 words, at most two screen lines of about 18 characters). "keep" means the current lesson's text unchanged.\n\n${JSON.stringify(low, null, 1)}`,
    { label: `redo round ${round}`, phase: 'Redo', schema: REDO })
  if (!redo) break
  open = redo.decisions
}
return { rounds, final: Object.values(final) }
