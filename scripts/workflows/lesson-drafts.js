export const meta = {
  name: 'lesson-drafts',
  description: 'Draft a lesson for each of the 64 shorts; a blind critic scores each 1-10 and sends anything under 8 back, looping up to 5 rounds',
  phases: [
    { title: 'Draft', detail: 'write each hexagram\'s lesson from its texts; the checker must pass' },
    { title: 'Critique', detail: 'score each lesson 1-10; feedback for anything under 8' },
  ],
}

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

const draftPrompt = (numbers, current, redo, round, b) => `${CONTEXT}

Read ${INPUT}. Write lessons for hexagrams ${numbers.join(', ')}.
${round === 1 ? '' : `This is round ${round}. Keep these accepted lessons as they are (they fix the neighbours' kinds):
${JSON.stringify(current.filter((l) => !redo.some((r) => r.number === l.number)), null, 1)}

Redo only these, using the critic's feedback:
${redo.map((r) => `- ${r.number} (was ${r.kind}${r.line ? ' line ' + r.line : ''}: "${r.text}", scored ${r.score}): ${r.feedback}`).join('\n')}
`}
Write the full set for ${numbers.join(', ')} (accepted ones unchanged) to ${OUT}/batch${b + 1}-r${round}.json as {"lessons": [...]}, then run from ${ROOT}:
  node scripts/lesson-check.mjs ${OUT}/batch${b + 1}-r${round}.json
Fix anything it reports and run it again until it prints "no problems" (a "third in a row" at the edge of your range, with hexagrams outside it, cannot happen since it only sees your file). Write nothing else to disk. Return the lessons.`

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

const all = Array.from({ length: 64 }, (_, i) => i + 1)
const batches = [0, 1, 2, 3].map((b) => all.slice(b * 16, b * 16 + 16))

const runBatch = async (numbers, b) => {
  let current = []
  let redo = []
  const history = []
  for (let round = 1; round <= ROUNDS; round++) {
    if (round > 1 && !redo.length) break
    const got = await agent(draftPrompt(numbers, current, redo, round, b), { label: `draft b${b + 1} r${round}`, phase: 'Draft', schema: DRAFTS, agentType: 'general-purpose' })
    if (!got) { log(`batch ${b + 1} round ${round}: draft failed`); break }
    const fresh = got.lessons.filter((l) => numbers.includes(l.number) && (round === 1 || redo.some((r) => r.number === l.number)))
    const crit = await agent(criticPrompt(fresh), { label: `critic b${b + 1} r${round} (${fresh.length})`, phase: 'Critique', schema: SCORES, agentType: 'general-purpose' })
    if (!crit) { log(`batch ${b + 1} round ${round}: critique failed`); break }
    const scored = fresh.map((l) => ({ ...l, ...(crit.scores.find((s) => s.number === l.number) ?? { score: 0, true: false, feedback: 'not scored' }), round }))
    history.push(...scored)
    // Keep the best attempt per hexagram.
    for (const s of scored) {
      const i = current.findIndex((c) => c.number === s.number)
      if (i < 0) current.push(s)
      else if (s.score >= current[i].score) current[i] = s
    }
    redo = scored.filter((s) => s.score < PASS)
    log(`batch ${b + 1} round ${round}: ${scored.length - redo.length} of ${scored.length} scored ${PASS}+`)
  }
  const low = current.filter((c) => c.score < PASS)
  if (low.length) log(`batch ${b + 1}: ${low.map((c) => c.number).join(', ')} still under ${PASS} after ${ROUNDS} rounds; best attempt kept`)
  return { lessons: current, history }
}

const out = (await parallel(batches.map((nums, b) => () => runBatch(nums, b)))).filter(Boolean)
return { lessons: out.flatMap((o) => o.lessons).sort((a, b) => a.number - b.number), history: out.flatMap((o) => o.history) }
