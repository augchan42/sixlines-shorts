export const meta = {
  name: 'lesson-candidates',
  description: 'For the lessons still under 8 after two loops, write 5 different candidates each and score every one with two independent critics',
  phases: [
    { title: 'Draft', detail: '5 candidates per hexagram, informed by every earlier draft and its feedback' },
    { title: 'Critique', detail: 'two critics score every candidate; the average is kept' },
  ],
}

// Run 3 of the lessons (runs 1 and 2: lesson-drafts.js, lesson-redo.js). args is {numbers}:
// the hexagrams still under 8. Reads out/lessons/run3-tried.json (every earlier draft of
// them, with score and feedback). Choosing among the candidates, so the neighbours' kinds
// stay varied, is done afterwards with scripts/lesson-check.mjs.
const ROOT = '/Users/auchan/projects/sixlines-shorts'
const INPUT = `${ROOT}/series/critic/lessons/input.json`
const OUT = `${ROOT}/out/lessons`
const ROUNDS = 5
const PASS = 8

const LESSON = {
  type: 'object',
  properties: {
    number: { type: 'integer' },
    kind: { type: 'string', enum: ['lines', 'judgment', 'line', 'painting'] },
    line: { type: 'integer', description: 'for kind line: which line, 1 (bottom) to 6' },
    text: { type: 'string', description: 'the sentence, one or two screen lines separated by \\n' },
    source: { type: 'string', description: 'where in the input it comes from, e.g. commentary/en/20.json#lines[3].synthesis' },
    why: { type: 'string', description: 'one sentence: what the viewer learns' },
  },
  required: ['number', 'kind', 'text', 'source', 'why'],
}
const DRAFTS = { type: 'object', properties: { lessons: { type: 'array', items: LESSON } }, required: ['lessons'] }
const SCORES = {
  type: 'object',
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          number: { type: 'integer' },
          score: { type: 'integer' },
          true: { type: 'boolean', description: 'the cited text really says this' },
          feedback: { type: 'string' },
        },
        required: ['number', 'score', 'true', 'feedback'],
      },
    },
  },
  required: ['scores'],
}

const CONTEXT = `Six Lines makes 64 vertical shorts (Instagram Reels), one per I-Ching hexagram, meant to be watched back to back. Each short: a hook, a 3D build of the hexagram, two meaning lines, a question, then on the music's drop a LESSON, then an end card. The lesson teaches one thing about the hexagram that the book actually says, in about 10 seconds: a picture for ~5 s, then one plain sentence typed on screen for ~5 s. One video, one takeaway; the visual carries most of it.

The four kinds of lesson, and what the picture is:
- lines: the hexagram splits into its two trigrams, labelled (e.g. EARTH 地 over WATER 水). The sentence says what the two images together mean, from the Image text.
- judgment: the app's page showing the Judgment text. The sentence gives the Judgment's point.
- line: the hexagram with one line lit, labelled LINE N. The sentence gives that line's point. The line texts are often the most surprising, specific material.
- painting: a public-domain painting full-frame with its artist and year. Only where the input offers one (its "painting" field); use sparingly, only where the link lands at a glance.

Lessons the author approved (the standard):
- 7 The Army, lines: "Unseen water\\nunder the earth."
- 10 Treading, judgment: "The tiger's tail:\\nit does not bite."
- 20 Contemplation, line 4: "Look like a guest,\\nnot an inspector." (the author's favourite: concrete, a little funny, true to the line)
- 8 Holding Together, painting (Renoir's Luncheon of the Boating Party): "Friends at lunch,\\nholding together."
A lesson the author rejected as too cryptic: "Its shape:\\na watchtower."

Rules (the checker enforces the mechanical ones):
- 3 to 7 words; one or two screen lines separated by \\n; each screen line at most 18 characters including spaces and punctuation.
- Plain words, the way a person talks. No mannered prose, no metaphors the book doesn't use, no "should", no exclamation marks, no fortune-telling words (fortune, predict, magic, horoscope), write I-Ching with the hyphen.
- True to the text: it must come from that hexagram's Judgment, Image, or a line text or the app's commentary on it (the "synthesis" fields). Cite it in source.
- Don't repeat the short's own hook, meaning or question (in the input's "copy"); the lesson comes after the question and should add something.
- Variety: never three neighbouring hexagrams with the same kind. Across the series aim for roughly: line 40%, judgment 25%, lines 25%, painting 10%.`

const criticPrompt = (lessons) => `You are judging short lessons for a series of vertical videos about the I-Ching. You did not write them.

${CONTEXT}

Read ${INPUT} for each hexagram's texts and the short's own copy. For each lesson below, check the cited text really says it, then score it 1 to 10:
- true to the text (false = score at most 4)
- lands: a viewer who has never heard of the hexagram learns one real thing in two seconds of reading
- plain: sounds like a person talking, no mannered or cryptic phrasing
- adds to the short: does not repeat its hook, meaning or question, and ends it well
- fits its kind's picture (the trigrams, the Judgment page, the lit line, the painting)
- would you rewatch or send it to a friend: concrete, a little surprising or funny beats abstract

8 means you would be glad to post it; the approved examples above are 8-9. Use the whole scale. For anything under 8, say concretely what is wrong and what would be better (another line of the hexagram, another kind, a plainer phrasing), so the writer can redo it.

Lessons:
${JSON.stringify(lessons, null, 1)}`


const TRIED = `${OUT}/run3-tried.json`
const SERIES = `${ROOT}/series/critic/lessons/run2-lessons.json`
const LOW = args.numbers

const writePrompt = `${CONTEXT}

Read ${INPUT}. The current 64 lessons are in ${SERIES}. These hexagrams have never reached 8 after two loops: ${LOW.join(', ')}. Every earlier draft of them, with its score and the critic's feedback, is in ${TRIED}. Read that first: do not resubmit a text already tried, and notice what the critic kept asking for.

For each of ${LOW.join(', ')}, write 5 different candidates. Make them really different: other lines of the hexagram, other kinds, not rewordings of one idea. Use the critic's own suggestions where it made them. At least one candidate per hexagram must not be a line lesson, so a mix of kinds is possible (neighbours in ${SERIES} fix what is allowed: no three neighbouring hexagrams with the same kind).

Write them to ${OUT}/run3-candidates.json as {"lessons": [...]} and run from ${ROOT}:
  node scripts/lesson-check.mjs ${OUT}/run3-candidates.json
Ignore "third in a row" there (the file holds 5 per hexagram); fix every other problem. Write nothing else to disk. Return all the candidates.`

phase('Draft')
const got = await agent(writePrompt, { label: `candidates for ${LOW.length}`, phase: 'Draft', schema: DRAFTS, agentType: 'general-purpose' })
if (!got) return { error: 'writer failed' }
const candidates = got.lessons.map((l, i) => ({ ...l, id: i + 1 }))
log(`${candidates.length} candidates`)

// Two critics who never see each other's scores; the average cuts the noise of one
// critic scoring the same text 6 one round and 7 the next.
phase('Critique')
const crits = await parallel([1, 2].map((k) => () => agent(`${criticPrompt(candidates.map(({ id, ...l }) => ({ ...l, number: l.number, id })))}

Several lessons share a hexagram number; each has its own "id". Score every one, and return in "number" the lesson's id, not its hexagram number.`, { label: `critic ${k}`, phase: 'Critique', schema: SCORES, agentType: 'general-purpose' })))
const scored = candidates.map((c) => {
  const s = crits.filter(Boolean).map((cr) => cr.scores.find((x) => x.number === c.id)).filter(Boolean)
  return { ...c, scores: s.map((x) => x.score), score: s.length ? s.reduce((a, x) => a + x.score, 0) / s.length : 0, true: s.every((x) => x.true), feedback: s.map((x) => x.feedback) }
})
for (const n of LOW) {
  const best = scored.filter((c) => c.number === n).sort((a, b) => b.score - a.score)[0]
  log(`${n}: best ${best ? best.score : '-'}`)
}
return { candidates: scored }
