export const meta = {
  name: 'painting-alternatives',
  description: 'Find public-domain paintings for 46 hexagrams; a blind critic scores each 1-10 and sends anything under 8 back, up to 3 rounds',
  phases: [
    { title: 'Retrieve', detail: 'propose and download a public-domain painting per hexagram from Wikimedia Commons' },
    { title: 'Critique', detail: 'score each painting 1-10 against the hexagram and the short copy; feedback under 8' },
  ],
}

const ROOT = '/Users/auchan/projects/sixlines-shorts'
const INPUT = `${ROOT}/series/critic/paintings/alternatives-input.json`
const OUT = `${ROOT}/out/paintings-candidates`
const ROUNDS = 3
const PASS = 8

const PICKS = {
  type: 'object',
  properties: {
    picks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          number: { type: 'integer' },
          title: { type: 'string' },
          artist: { type: 'string' },
          artistDied: { type: 'integer' },
          year: { type: 'string' },
          commons: { type: 'string', description: 'Commons file title, File:...' },
          page: { type: 'string' },
          licence: { type: 'string', description: 'LicenseShortName from the Commons API' },
          width: { type: 'integer', description: 'original width in px' },
          height: { type: 'integer' },
          file: { type: 'string', description: 'absolute path of the downloaded 1280px copy' },
          note: { type: 'string', description: 'one sentence: why it fits' },
        },
        required: ['number', 'title', 'artist', 'artistDied', 'year', 'commons', 'page', 'licence', 'width', 'height', 'file', 'note'],
      },
    },
  },
  required: ['picks'],
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
          lands: { type: 'integer', minimum: 1, maximum: 5 },
          fitsCopy: { type: 'integer', minimum: 1, maximum: 5 },
          recognised: { type: 'integer', minimum: 1, maximum: 5 },
          risk: { type: 'string' },
          feedback: { type: 'string', description: 'under 8: what is missing and what kind of image would work; 8 or more: one sentence on why it works' },
        },
        required: ['number', 'score', 'lands', 'fitsCopy', 'recognised', 'risk', 'feedback'],
      },
    },
  },
  required: ['scores'],
}

const retrievePrompt = (todo, round, b) => `You find public-domain paintings to pair with I-Ching hexagrams for short vertical videos (Instagram Reels) that teach the I-Ching.

Read ${INPUT}. For each hexagram it has the name, the book's Image line, the short's own copy (hook, two meaning lines, question) and the app's current painting with a blind rating of why it doesn't work. "approvedTitles" are paintings already used elsewhere in the series: don't propose them.

In the video the painting appears full-frame for about 4 seconds on the music's drop, panning across if it is wide, with the artist and year, then one plain sentence. A scrolling viewer who has never heard of the hexagram must get the link within a second or two of seeing it, and it should sit well with the short's copy. Famous paintings are better, but a clear link matters more than fame. East Asian works (Chinese, Japanese, Korean) are welcome where they fit.

Find one painting for each of these hexagrams: ${todo.map((h) => h.number).join(', ')}.
${todo.some((h) => h.tried.length) ? `\nEarlier attempts and a critic's feedback (don't propose these again):\n${todo.filter((h) => h.tried.length).map((h) => `- ${h.number}: tried ${h.tried.join('; ')}. Feedback on the last: ${h.feedback}`).join('\n')}\n` : ''}
Rules:
- Public domain only: the artist died before 1926, and Wikimedia Commons marks the file public domain. Check with the Commons API, e.g.
  curl -s -A "sixlines-shorts/1.0 (https://github.com/augchan42/sixlines-shorts)" "https://commons.wikimedia.org/w/api.php?action=query&titles=File:NAME&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=1280&format=json"
  and use extmetadata.LicenseShortName, which must say public domain. Use the Commons search API (list=search, srnamespace=6) to find files.
- The original must be at least 1500 px on its long side, a photo of the whole painting, not a detail, a frame, or a gallery view.
- No gore, sexual content or nudity, racial caricature, or scenes that make a political or religious statement that could read as the app's own view.
- Download the 1280 px thumbnail (thumburl, without its query string, with the same User-Agent) to ${OUT}/<number>-r${round}.jpg (mkdir -p ${OUT}), then open it with the Read tool to check it is the painting you meant.
- Don't write anywhere else.

Return one pick per hexagram.`

const criticPrompt = (todo, picks) => `You judge paintings paired with I-Ching hexagrams for short vertical videos (Instagram Reels) that teach the I-Ching. You know nothing else about the project, and you are not told why each painting was chosen.

Read ${INPUT} for each hexagram's name, the book's Image line and the short's own copy (hook, two meaning lines, question). Ignore its "current" field.

In the video the painting appears full-frame (1080×1920, panning across if it is wide) for about 4 seconds on the music's drop, with the artist and year, then one plain sentence. The viewer is scrolling and has probably never heard of the hexagram.

Look at each image with the Read tool:
${picks.map((p) => `- ${p.number}: ${p.file} — "${p.title}", ${p.artist}, ${p.year}`).join('\n')}

Score each 1 to 10 overall, from:
- lands (1-5): does the link to the hexagram land within a second or two, with no explanation?
- fitsCopy (1-5): does it sit well with the short's hook, meaning and question, so one plain sentence could tie it to them?
- recognised (1-5): how likely a general audience knows it.
- risk: anything that could read badly next to the hexagram (sexual, violent, political, religious, caricature, or belittling its subject), or "none". A real risk caps the score at 5.
- Also judge how it will look full-frame and panning: a muddy, tiny-detail or badly cropped image scores lower.

8 means you'd be glad to post it. Use the whole scale; don't give everything 7 or 8. For anything under 8, say concretely what is missing and what kind of image would land better, so someone can look again.`

const all = args
const batches = [0, 1, 2, 3].map((b) => all.filter((_, i) => i % 4 === b))

const runBatch = async (numbers, b) => {
  let todo = numbers.map((n) => ({ number: n, tried: [], feedback: null }))
  const results = {}
  const history = []
  for (let round = 1; round <= ROUNDS && todo.length; round++) {
    const got = await agent(retrievePrompt(todo, round, b), { label: `retrieve b${b + 1} r${round} (${todo.length})`, phase: 'Retrieve', schema: PICKS, agentType: 'general-purpose' })
    if (!got) { log(`batch ${b + 1} round ${round}: retrieval failed`); break }
    const picks = got.picks.filter((p) => todo.some((h) => h.number === p.number))
    const crit = await agent(criticPrompt(todo, picks), { label: `critic b${b + 1} r${round} (${picks.length})`, phase: 'Critique', schema: SCORES, agentType: 'general-purpose' })
    if (!crit) { log(`batch ${b + 1} round ${round}: critique failed`); break }
    const next = []
    for (const h of todo) {
      const p = picks.find((x) => x.number === h.number)
      const s = crit.scores.find((x) => x.number === h.number)
      if (!p || !s) { next.push(h); continue }
      history.push({ round, ...p, critique: s })
      if (!results[h.number] || s.score > results[h.number].critique.score) results[h.number] = { round, ...p, critique: s }
      if (s.score < PASS) next.push({ ...h, tried: [...h.tried, `${p.title} (${p.artist}), scored ${s.score}`], feedback: s.feedback })
    }
    log(`batch ${b + 1} round ${round}: ${todo.length - next.length} of ${todo.length} scored ${PASS}+`)
    todo = next
  }
  if (todo.length) log(`batch ${b + 1}: ${todo.map((h) => h.number).join(', ')} still under ${PASS} after ${ROUNDS} rounds; best attempt kept`)
  return { results, history }
}

const out = (await parallel(batches.map((nums, b) => () => runBatch(nums, b)))).filter(Boolean)
const best = Object.assign({}, ...out.map((o) => o.results))
return { best, history: out.flatMap((o) => o.history) }
