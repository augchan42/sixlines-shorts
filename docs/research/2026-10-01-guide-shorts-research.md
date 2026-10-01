# Guide shorts: research for the guide-shorts skill

2026-10-01. The user: "maybe find a skill for designing cinematic shorts or educational/documentary
shorts, or create a new one for the hitchhikers guide style of shorts, do a websearch for
research". These notes back `.claude/skills/guide-shorts/SKILL.md`. The earlier search on the BBC
graphics is in docs/notes/2026-09-30-guide-wangbi-shots.md ("What made the BBC Guide sequences
work").

## Existing skills checked

Searched ~/.claude/skills, ~/.claude/plugins (SKILL.md files mentioning shorts, cinematic,
documentary, explainer, storyboard, Remotion) and this repo's .claude/ (none existed).

| Skill | What it does | Fits? |
|---|---|---|
| document-to-narration (~/.claude/skills) | Essay to narrated scenes with TTS and word timings (Deno, whisper-cpp) | Overlaps voice.mjs + guide-props.mjs, which we already have; no writing or visual guidance |
| inkstone:video-to-shorts | Cuts vertical clips from a long talking-head video | No: we make shorts from scratch |
| youtube-clipper | Clips and subtitles YouTube videos | No |
| inkstone:motion-craft | Web animation against a design blueprint | No: web UI, not video |
| remotion-to-hyperframes, lottie (dan-skills plugin) | Converting Remotion projects, Lottie files | No |
| inkstone:create-explanation | Bilingual explanations of classical verses | Partly: source notes, not scripts |

None covers writing and building a narrated explainer short, so a project skill was written.

## 1. The Hitchhiker's Guide entries as a form

### The 1981 BBC television graphics (Rod Lord, Pearce Studios)

- Hand-made cel animation that imitated computer graphics; it won a BAFTA, a D&AD Silver and a
  London Film Festival award
  ([Wikipedia, TV series](https://en.wikipedia.org/wiki/The_Hitchhiker%27s_Guide_to_the_Galaxy_(TV_series))).
- Technique: black Rotring outlines on cel, photographically reversed onto back-lit lith film,
  coloured with gels, "a much cleaner and more vivid result"; all text in Letraset; wipes with a
  "bright incoming leading edge" for an electronic feel
  ([Rod Lord interview](https://douglasadams.eu/interview-with-rod-lord/)).
- Drawn to the voice: the voice track was marked word by word on the mag film ("marking the start
  and end of words or phrases in chinagraph pencil"), broken down onto dope sheets, then the team
  would "block in the main items needed to support the voice" (same interview). This is what our
  `marks` do: each picture event keys on a spoken word.
- Busyness and in-jokes came from brainstorms; Adams's own gag for the Money sequence was a row of
  zeros where "every now and again one of the zeros can blow a raspberry" (same interview). One
  small gag per sequence, not a stream of them.
- About 45 minutes made by six people in about three months (same interview).

### Peter Jones, the voice of the Book

- Cast after a three-month search for "a Peter Jonesy sort of voice"; in the end they hired Jones
  ([Wikipedia, radio series](https://en.wikipedia.org/wiki/The_Hitchhiker's_Guide_to_the_Galaxy_(radio_series)),
  [Peter Jones](https://en.wikipedia.org/wiki/Peter_Jones_(actor))).
- His register: smooth, matter-of-fact, avuncular; the jokes are never pointed at. The humour comes
  from a calm voice reading absurd or deflating content. Our voice direction ("plain, even pace;
  short pauses; no wonder or reverence, no emphasis announcing the jokes") follows this.

### The 2005 film (Shynola; Stephen Fry)

- Shynola (Chris Harding, Richard Kenworthy, Jason Groves, Gideon Baws) made the Guide sequences
  ([Wikipedia, Shynola](https://en.wikipedia.org/wiki/Shynola),
  [Art of the Title](https://www.artofthetitle.com/studio/shynola/),
  [Guide animation reel](https://player.vimeo.com/video/252716940?h=a5746b9a71)).
- Stephen Fry narrated; the animation was "a more minimalist, abstract style" than the TV
  series' ([Wikipedia, fictional Guide](https://en.wikipedia.org/wiki/The_Hitchhiker%27s_Guide_to_the_Galaxy_(fictional))):
  flat, icon-like figures, close to public-information signage (from the reel; a web search
  summary of reviews such as [Moria](https://moriareviews.com/sciencefiction/hitchhikers-guide-to-the-galaxy-film-2005.htm)
  credited them with visually interpreting the entries' words; not checked line by line).
- Takeaway: both versions draw what the words say, literally and a beat behind or on the word; the
  wit is in the literalness.

### Adams's Guide-entry prose

Examples ([Wikipedia, fictional Guide](https://en.wikipedia.org/wiki/The_Hitchhiker%27s_Guide_to_the_Galaxy_(fictional))):
"Space is big. Really big." / on getting a lift from a Vogon: "forget it." / on love (film):
"Avoid, if at all possible." The Guide is "definitively inaccurate" where it is inaccurate.

Patterns ([eNotes](https://www.enotes.com/topics/douglas-adams),
[hg2g literary style](https://hg2g.weebly.com/literary-style.html),
[iwl.me](https://iwl.me/writer/Douglas_Adams)):

1. Deadpan: an absurd or deflating fact stated as flatly as a dictionary would.
2. The reference-book frame: the text talks as an entry, with headings, ratings and advice.
3. The turn at the end of a sentence: a long setup, then a short twist ("led on for a lengthy
   sentence only to provide a small twist at the end").
4. The aside: a short clause that undercuts the sentence it sits in.
5. The precise number: "three times", "sixty-four", "1701". A real, checkable number is funnier and
   more trustworthy than "many".
6. The reveal or reversal last: the entry ends on its sharpest line (our "Recommended for / Not
   recommended for" footer does this job).

## 2. What makes short educational videos work on vertical platforms

### Hook and retention

- The keep-or-swipe decision happens around the first second; the first frame has to show
  something and the first sentence has to say what this is
  ([tubeanalytics](https://www.tubeanalytics.net/blog/youtube-shorts-retention-guide),
  [prepublish](https://prepublish.ai/guides/youtube-shorts-retention),
  [vidIQ](https://vidiq.com/blog/post/viral-video-hooks-youtube-shorts/)). These are industry blog
  figures, not peer-reviewed; the claim "an immediate hook keeps ~19% more viewers" is from
  [adshortsai](https://adshortsai.com/en/low-retention-on-youtube-shorts/) and is unverified.
- A new visual beat every 2-3 s (a cut, a label, a move) keeps attention (same sources). In our
  kit, drawing-on, labels and typing already supply beats; that is why Astra cut camera moves
  from seven to four on the Wang Bi short.
- 3Blue1Brown's SoME criteria: clarity (jargon explained, empathy for newcomers), motivation (why
  care, within the first 30 s; on a short, within the first line), novelty, memorability
  ([SoME1 results](https://www.3blue1brown.com/blog/some1-results/),
  [SoME1](https://www.3blue1brown.com/blog/some1/)). Sanderson: topic choice matters more than
  production; every movement on screen should have a purpose
  ([Dropbox profile](https://blog.dropbox.com/topics/work-culture/grant-sanderson-channels-his-passion-for-math-into-marvelously-i)).

### One idea, and what to leave out

- Mayer's multimedia principles
  ([Devlin Peck summary](https://www.devlinpeck.com/content/mayers-principles-of-multimedia-learning)):
  coherence (leave out extraneous material, including decorative jokes and animation); signaling
  (cue what matters: our amber, our labels); segmenting (one chunk at a time: one line per page);
  temporal contiguity (words and the matching picture at the same moment: our marks); redundancy
  (narration plus identical full on-screen text can overload learners).
- Tension with redundancy: most social video is watched muted. "As much as 85 percent" of Facebook
  video views were silent in 2016 ([Digiday](https://digiday.com/media/silent-world-facebook-video/));
  Instagram Stories are more often watched with sound
  ([Rev roundup](https://www.rev.com/blog/ultimate-roundup-closed-captions-statistics)). So the
  typed narration stays, but it is the Guide's own screen text (part of the look, as the BBC's
  Letraset was), and labels add information rather than repeating the narration.
- Vox (Joss Fong, black-hole video): hold the payoff until the viewer understands why it matters;
  plain conversational voiceover ("writing can be really awkward and cheesy sometimes in video");
  end sections on a summary line; keep music from competing with the voice
  ([The Open Notebook](https://www.theopennotebook.com/2020/01/07/videogram-how-a-vox-video-explains-the-science-behind-the-first-photo-of-a-black-hole/)).
- Kurzgesagt: primary sources first, then many rewrites, then fact-checking by 2-3 people and 1-3
  outside experts, about 100 hours of checking per video
  ([Kurzgesagt on Medium](https://medium.com/@Kurzgesagt/how-research-and-factchecking-work-at-kurzgesagt-f5b239188255)).
  Our equivalent: a `sources` field per short and the Astra round.

### Narration speed

- Voiceover norms: 120-150 wpm; e-learning 120-140; explainers 140-160
  ([Kim Handysides](https://kimhandysidesvoiceover.com/2022/08/16/timing-in-elearning-videos/),
  [Bread n Beyond](https://breadnbeyond.com/explainer-video/how-many-words-does-a-60-seconds-explainer-video-needs/)).
- In 6.9 million edX sessions, speaking rates ranged 48-254 wpm (mean 156) and viewers engaged more
  with faster speakers; shorter videos were more engaging; Khan-style drawing held attention
  ([Guo, Kim & Rubin 2014](https://dl.acm.org/doi/10.1145/2556325.2566239)).
- Our Guide shorts, measured from the voice takes (series/renders/voice/*.json):

| Short | Lines | Words | Speech | wpm | Total |
|---|---|---|---|---|---|
| guide-wangbi | 9 | 92 | 43.9 s | 126 | 54.5 s |
| guide-64 | 7 | 77 | 41.3 s | 112 | 50.4 s |
| guide-cords | 7 | 81 | 41.1 s | 118 | 50.3 s |
| guide-leibniz | 7 | 80 | 42.9 s | 112 | 52.0 s |
| guide-trigrams | 7 | 81 | 55.7 s | 87 | 64.8 s |

  The designed voice reads slower than the 2.3 words a second the scripts were written for
  (138 wpm): about 115 wpm. A dry reader is meant to be unhurried, but the trigrams short's lists
  (eight qualities, eight animals) pushed it past a minute. Budget 75-85 words for about 50 s.

## What this means for our Guide shorts

1. Keep the first page drawing within the first second; the first line names the subject
   ("The I-Ching. ...") and the second line gives the reason to keep watching.
2. One idea per entry, with one fact a newcomer can repeat.
3. Deadpan voice; the jokes sit in precise numbers, labels and the footer, never announced.
4. Draw what the words say, on the word (marks), as Rod Lord did from the dope sheets.
5. Labels and small print add facts; they do not repeat the narration.
6. 7-9 lines, 75-85 words, about 50 s; lists slow the voice down.
7. Check facts against primary sources and hedge legend ("by tradition", "attributed to").
