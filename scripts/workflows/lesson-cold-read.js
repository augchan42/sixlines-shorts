export const meta = {
  name: 'lesson-cold-read',
  description: 'Two cold readers say what each lesson means from its sentence and picture only; a judge compares their reading with the book and rewrites the ones that mislead',
  phases: [
    { title: 'Read', detail: 'two readers who have never read the I-Ching, sentence and picture only' },
    { title: 'Judge', detail: 'compare the readings with the source text; rewrite what is misread' },
  ],
}

// After the author found "The tiger's tail: / it does not bite." unclear (it drops that you
// stepped on the tail), every lesson is checked for how a newcomer reads it, not only for
// whether it quotes the book. Reads out/lessons/cold-brief.json (number, name, picture,
// sentence) and, for the judge, series/critic/lessons/best-lessons.json and input.json.

const ROOT = '/Users/auchan/projects/sixlines-shorts'
const BRIEF = `${ROOT}/out/lessons/cold-brief.json`
const LESSONS = `${ROOT}/series/critic/lessons/best-lessons.json`
const INPUT = `${ROOT}/series/critic/lessons/input.json`

const READINGS = {
  type: 'object',
  properties: {
    readings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          number: { type: 'integer' },
          meaning: { type: 'string', description: 'in your own words, what the sentence tells you: who does what, and what follows' },
          clear: { type: 'integer', description: '1 = no idea what it means, 5 = obvious' },
          guessed: { type: 'string', description: 'anything you had to guess: who "it" or "you" is, what a word means; "nothing" if nothing' },
        },
        required: ['number', 'meaning', 'clear', 'guessed'],
      },
    },
  },
  required: ['readings'],
}

const VERDICTS = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          number: { type: 'integer' },
          verdict: { type: 'string', enum: ['clear', 'unclear', 'misread'] },
          why: { type: 'string', description: 'one or two sentences: what the readers got, against what the source says' },
          rewrite: { type: 'string', description: 'for unclear or misread: a clearer sentence, one or two screen lines separated by \\n; empty for clear' },
        },
        required: ['number', 'verdict', 'why', 'rewrite'],
      },
    },
  },
  required: ['verdicts'],
}

const readPrompt = `You have never read the I-Ching and know nothing about it. You are scrolling Instagram Reels. A short video shows a picture for five seconds, then types one sentence over it. You get only the picture's description and the sentence.

Read ${BRIEF}. For each item, say in your own words what the sentence tells you: who does what, and what follows from it. Be honest: if you would not get it, say so, and say what you had to guess. Do not look anything up, and do not read any other file.`

const judgePrompt = (a, b) => `A series of vertical videos teaches one thing per I-Ching hexagram in one sentence typed over a picture. The author found one lesson misleading: "The tiger's tail: / it does not bite." The book says you tread on the tiger's tail and it does not bite you; the sentence dropped the treading, so the point (you can be in a dangerous place and come through by how you carry yourself) was lost. Another the author rejected as too cryptic: "Its shape: / a watchtower."

Two readers who have never read the I-Ching read each sentence with only its picture. Their readings are below. Read ${LESSONS} (each lesson's source and why) and ${INPUT} (the texts). For each lesson, compare the readings with what the source says:
- clear: both readers got the point the source makes.
- unclear: a reader could not tell who does what, or had to guess something that matters.
- misread: a reader took away something the source does not say, or the opposite.

For unclear and misread, write a clearer sentence from the same source, keeping the concrete picture where there is one, and saying who does what. Rules: 3 to 7 words; one or two screen lines separated by \\n; at most 18 characters per screen line, counting spaces and punctuation; plain words; no "should", no exclamation marks. Write your rewrites to ${ROOT}/out/lessons/cold-rewrites.json as {"lessons": [...]} with number, kind, line (as in the lesson), text, source, why, and run from ${ROOT}:
  node scripts/lesson-check.mjs ${ROOT}/out/lessons/cold-rewrites.json
Fix anything it reports. Write nothing else to disk.

Reader A:
${JSON.stringify(a.readings)}

Reader B:
${JSON.stringify(b.readings)}`

phase('Read')
const [a, b] = await parallel([1, 2].map((k) => () => agent(readPrompt, { label: `reader ${k}`, phase: 'Read', schema: READINGS, agentType: 'general-purpose' })))
if (!a || !b) return { error: 'a reader failed' }
phase('Judge')
const j = await agent(judgePrompt(a, b), { label: 'judge', phase: 'Judge', schema: VERDICTS, agentType: 'general-purpose' })
if (!j) return { error: 'judge failed' }
const counts = {}
for (const v of j.verdicts) counts[v.verdict] = (counts[v.verdict] ?? 0) + 1
log(JSON.stringify(counts))
return { readers: [a.readings, b.readings], verdicts: j.verdicts }
