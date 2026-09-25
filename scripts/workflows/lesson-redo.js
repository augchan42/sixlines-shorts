export const meta = {
  name: 'lesson-redo',
  description: 'Redo the lessons under 8 across the whole series at once, so the checker sees every neighbour; a blind critic rescores each; loop until all are 8+ or 6 rounds',
  phases: [
    { title: 'Draft', detail: 'redo the lessons under 8 in the full 64-lesson file; the checker must pass on all 64' },
    { title: 'Critique', detail: 'score the redone lessons 1-10' },
  ],
}

// Run 2 of the lessons (run 1: lesson-drafts.js, series/critic/lessons/result.json). Starts
// from out/lessons/run2-start.json (run 1's lessons with scores and feedback). args is
// {redo, also}: the numbers under 8, and accepted numbers to redo for variety. One writer
// sees the whole series, and its checker-clean file is kept as it is.
const ROOT = '/Users/auchan/projects/sixlines-shorts'
const INPUT = `${ROOT}/series/critic/lessons/input.json`
const OUT = `${ROOT}/out/lessons`
const ROUNDS = 6
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


const START = `${OUT}/run2-start.json`

const draftPrompt = (file, redo, round) => `${CONTEXT}

Read ${INPUT} and the current 64 lessons in ${file}. Most of them are accepted: keep every lesson not listed below exactly as it is.

Redo only these, using the critic's feedback. You may change a lesson's kind (and pick another line) if that makes it better:
${redo.map((r) => r.feedback ? `- ${r.number} (was ${r.kind}${r.line ? ' line ' + r.line : ''}: "${r.text}", scored ${r.score}): ${r.feedback}` : `- ${r.number}: its score and the critic's feedback are in its score and feedback fields in ${file}.${r.variety ? ' ' + r.variety : ''}`).join('\n')}

Write all 64 lessons (the accepted ones unchanged) to ${OUT}/all-r${round}.json as {"lessons": [...]}, keeping only the fields number, kind, line (for kind line), text, source, why. Then run from ${ROOT}:
  node scripts/lesson-check.mjs ${OUT}/all-r${round}.json
It must print "no problems". If a "third in a row" involves only accepted lessons, fix it by changing the kind of one of the lessons you are redoing, if one is next to it; if none is, you may redo one accepted lesson in that run and say which. Write nothing else to disk. Return only the lessons you changed.`

let file = START
// Lessons redone here, by number, with their latest draft; the rest stay as they are in the file.
const current = {}
let redo = [...args.redo.map((number) => ({ number })), ...(args.also ?? []).map((number) => ({ number, variety: 'It scored 8, but it is the third line lesson in a row; change its kind, or a redone neighbour\'s, so no three neighbours share a kind.' }))]
const history = []
for (let round = 1; round <= ROUNDS && redo.length; round++) {
  const got = await agent(draftPrompt(file, redo, round), { label: `draft r${round} (${redo.length})`, phase: 'Draft', schema: DRAFTS, agentType: 'general-purpose' })
  if (!got) { log(`round ${round}: draft failed`); break }
  const crit = await agent(criticPrompt(got.lessons), { label: `critic r${round} (${got.lessons.length})`, phase: 'Critique', schema: SCORES, agentType: 'general-purpose' })
  if (!crit) { log(`round ${round}: critique failed`); break }
  const scored = got.lessons.map((l) => ({ ...l, ...(crit.scores.find((s) => s.number === l.number) ?? { score: 0, true: false, feedback: 'not scored' }), round: `run2-r${round}` }))
  history.push(...scored)
  // The writer's file is checker-clean as a whole, so its lessons are taken as they are:
  // keeping an older, higher-scoring draft could undo a neighbour's change of kind.
  for (const l of scored) current[l.number] = l
  file = `${OUT}/all-r${round}.json`
  redo = scored.filter((s) => s.score < PASS)
  log(`round ${round}: ${scored.length - redo.length} of ${scored.length} scored ${PASS}+`)
}
const low = Object.values(current).filter((c) => c.score < PASS)
if (low.length) log(`still under ${PASS}: ${low.map((c) => c.number).join(', ')}`)
return { lessons: Object.values(current), history, file }
