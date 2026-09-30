# Posting plan: Instagram, TikTok, YouTube Shorts (from 2026-10-05)

The user, 2026-09-30: "take an inventory of what we have, then come up with a posting strategy ... for
any tough bits or judgement bits feel free to confer with astra". Inventory and first draft:
docs/notes/2026-09-30-posting-strategy-draft.md. Astra's review (gpt-6.1-sol):
docs/research/2026-09-30-codex-posting-strategy.md. Voice and rules: engagement-style.md.

## The rhythm

- Three posts a week on each of Instagram, TikTok and YouTube, through Buffer, in the slots Buffer set
  (Asia/Tokyo): TikTok Mon, Sat, Sun; Instagram Tue, Wed, Thu; YouTube Thu, Fri, Sat.
- The same three videos go to all three channels in the same week. The founder approves each video
  once, with its three post previews.
- Two of the three are from the 64 shorts; the third is a feature (a lesson, a special, a character
  or structure short).
- Launch with the strongest shorts, not hexagram 1: Kun first (the founder's favourite), then clear
  situations in their King Wen pairs. After the first month, the rest in King Wen order.

## First four weeks

Every file exists. Captions are the short's own series/renders/NN.txt (or specials/<name>.txt).

| Week | Slot | Video |
| --- | --- | --- |
| 1 (Oct 5) | 1 | 2 Kun, The Receptive (out/series/02-kun) |
| 1 | 2 | 1 Qian, The Creative (out/series/01-qian) |
| 1 | 3 | Wang Bi teaser, 73 s (out/explainers/wangbi-teaser); on YouTube, the readout key instead (below) |
| 2 (Oct 12) | 1 | 23 Bo, Splitting Apart (the founder: "love the music on this") |
| 2 | 2 | 3 Zhun, Difficulty at the Beginning |
| 2 | 3 | Readout key, 42 s (out/explainers/readout-key) |
| 3 (Oct 19) | 1 | 5 Xu, Waiting |
| 3 | 2 | 6 Song, Conflict |
| 3 | 3 | Character 需 (out/specials/character-5), the same hexagram as slot 1 drawn in neon |
| 4 (Oct 26) | 1 | 8 Bi, Holding Together |
| 4 | 2 | 10 Lü, Treading |
| 4 | 3 | Readout 14, Great Possession (out/specials/readout-14) |

24 Fu (Return) is held for the winter solstice, 2026-12-21: in the old calendar Return is the
hexagram of the solstice month, the light coming back. Post the short and character 復 that week.

## Before the first post

1. **Hosting.** Buffer's API takes a video by public URL only ("there's no upload endpoint"); Buffer
   fetches it when the post goes out. Set up 2026-09-30: R2 bucket `sixlines-media` (APAC), served at
   https://media.sixlines.day (the sixlines.day zone moved to Cloudflare DNS the same day). Upload with
   the R2 S3 keys in ~/projects/local/.env (rclone, provider Cloudflare); one unguessable name per
   file, kept until Buffer reports the post sent, then deleted.
2. **YouTube title:** searchable, written when the post is approved:
   `I Ching Hexagram 2: 坤 Kūn — The Receptive` (media-strategy.md).
3. **isAiGenerated.** The videos are drawn with code and the copy is edited by the founder, but
   YouTube also asks for the label on AI-generated music, and coming from Pixabay doesn't settle
   that. Check each track's Pixabay page (and its licence certificate) for an AI-generated mark; set
   false only for tracks that have none.
4. **Profile text** on all three: "I Ching situations and how to judge them. Read through Wang Bi and
   the Ten Wings." and sixlines.day in the profile link (YouTube Shorts descriptions don't link).
5. **Pin** the Wang Bi teaser, the readout key and Kun on Instagram and TikTok. On YouTube, use the
   channel's Home tab sections.

## Music and YouTube

18 of our 23 Pixabay tracks are "Content ID registered". Over 60 s an active claim blocks a Short,
and a claim on a shorter one isn't limited to the ad money either: the claimant's policy can block
it too (Astra, docs/research/2026-09-30-codex-media-strategy-bookend.md). Going up as a regular video
doesn't remove the claim. So check each YouTube post's copyright status after it goes out, clear
claims through Pixabay with the licence certificate, and hold the long pieces (the Wang Bi teaser
and the Leibniz lesson use pick13, registered) until the first shorts show how pick13's claims
behave.

## Warm-up

grokbot starts warming the three accounts now (engagement-style.md). Astra doubts a silent week
does much; the founder asked for it, so it runs alongside setting up and approving the first batch,
and posting starts when that batch is ready, planned for Oct 5.

## After four weeks

Compare, within each platform, average view duration, completion, saves and shares, and follows per
post. Decide on several posts, not one: which kind of feature holds people, and whether the series
keeps King Wen order.

## What we have, and what to make

At two series shorts a week, the 64 last 32 weeks. The feature slot has about 20 finished posts:
the specials (characters 5, 18, 42, 47, 58; readouts 14, 21; bite 21, bird 62, horse 2, collapse
23, judgment 10; the trigram styles of 60 count as one), the Wang Bi teaser, the readout key, the
Leibniz lesson, and Six Bits and the cube once approved. That covers about 20 weeks.

To fill the rest, cheapest first:
- The 15 neon character clips without a special yet (3, 8, 10, 13, 19, 23, 24, 27, 32, 36, 40, 50,
  52, 56, 63) as full character specials. The founder loves these, and the clips exist.
- The six remaining structure shorts (pairs, splits, count, octagons, codons, timeline).
- Excerpts from the Wang Bi lesson, one master line each.
