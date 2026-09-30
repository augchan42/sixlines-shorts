**A. Best first.** Start the series **2, 1, 23, 24, 5, 6, 8, 10**: Kun is the founder’s favourite, and these give newcomers clear situations while keeping useful pairs together. Keep the hexagram numbers; amend the King Wen posting-order rule in `engagement-style.md`.

**B. Two series posts plus one feature each week.** Keep three posts per channel; the feature shows another way to read the book without requiring new production.

**C. Same video on all three platforms in the same week.** Use each channel’s existing Buffer slots and approve the video once, with its three post previews; staggering adds work without an established audience to justify it.

**D. Pin the Wang Bi teaser first, the readout key second, and Kun third on Instagram and TikTok.** No new intro is needed yet: the teaser explains the method, the key explains the screen, and Kun demonstrates the shorts; on YouTube, use the channel Home tab’s trailer and sections instead of assuming identical pinning. [YouTube channel layout](https://support.google.com/youtube/answer/3219384?hl=en)

**E. Use the existing 73-second Wang Bi teaser across all three; publish the 228-second lesson later as a regular YouTube video through Studio.** The 167-second Leibniz lesson fits Shorts; full Wang Bi also fits Buffer’s Instagram and TikTok length limits, but need not enter the first month. [Buffer video limits](https://support.buffer.com/en-us/articles/sharing-videos-through-buffer-LOe2p2rnAI), [YouTube Shorts limits](https://support.google.com/youtube/answer/15424877?hl=en)

**F. Recommend `isAiGenerated: false` for the described videos.**

- **YouTube:** disclosure is required for realistic AI-generated or meaningfully AI-altered content; it explicitly exempts script help, caption creation and non-realistic animation. It also lists AI-generated music as requiring disclosure, so a licence alone does not settle the music’s origin. [YouTube policy](https://support.google.com/youtube/answer/14328491?hl=en)
- **TikTok:** disclosure is required for realistic AI-generated images, audio or video; it encourages labels for fully generated or substantially AI-edited material more broadly. Code-rendered graphics and founder-edited copy do not clearly meet that mandatory threshold. [TikTok policy](https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content?authuser=0)
- **Uncertainty:** TikTok does not explicitly address AI-drafted, human-edited on-screen teaching text. Buffer documents the disclosure flag but does not fully explain its platform mapping; check the first published results rather than treating it as a record of every use of AI.

**G. Make nothing new for the first four weeks.** Next use `character-18`, `character-47`, `bird-62` and `judgment-3d-10`; after those, favour short, complete excerpts from Wang Bi over commissioning all six unfinished structure videos.

The draft’s errors and omissions, most important first:

1. **Week 0 delays learning without evidence.** The draft gives no support for the claim that a silent week of watching and liking prevents bot classification; start once the first approved batch is ready.
2. **It treats render status as posting approval.** Review the exact exported video, caption and platform previews for each selected post; reviewing all of 27–64 is unnecessary before launch.
3. **The character inventory includes source clips.** For example, `out/characters/5-需.mp4` is 7.6 seconds and silent; `out/specials/character-5/share.mp4` is a complete 31-second post with audio. Count complete, distinct posts separately from clips, variants and smoke tests.
4. **Long Shorts have a music risk beyond permission.** Any active Content ID claim blocks a YouTube Short longer than one minute, even while a licensed-use dispute is being resolved; check the teaser and Leibniz before release. [YouTube rule](https://support.google.com/youtube/answer/15424877?hl=en)
5. **There is no decision point after launch.** After four weeks, compare viewing duration, completion, saves/shares and follows within each platform; use several posts, not one result, to choose the next batch.
6. **Titles and covers are overstated as missing production.** YouTube can use the caption’s first line; Buffer’s TikTok title field is for photos. Choose existing frames for Instagram/TikTok; Buffer does not support custom YouTube Shorts thumbnails. [Title fields](https://developers.buffer.com/types/TikTokPostMetadataInput.html), [YouTube support](https://support.buffer.com/en-us/articles/using-youtube-shorts-with-buffer-Jl8iR6jIck)
7. **The profile needs a plain explanation and usable site link.** Use “I Ching situations and how to judge them. Read through Wang Bi and the Ten Wings.” YouTube Shorts description links are not clickable; add sixlines.day to the channel profile. [YouTube links](https://support.google.com/youtube/answer/13748639?hl=en)

For gaps **1–6**:

| Gap | Blocks the first post? |
|---|---|
| **1. Hosting** | **Yes for the API route.** Host only the selected exports first; Buffer’s upload UI is an alternative. |
| **2. Titles** | **YouTube only.** Use the selected caption’s first line now; no 64-title project needed. |
| **3. Long lessons** | **No.** Start with the existing shorts. |
| **4. New intro** | **No.** Use the teaser and profile text. |
| **5. Covers** | **No.** Choose existing frames; new cover artwork can wait. |
| **6. AI flag** | **Resolve before submission.** Use false on the stated facts, subject to the music qualification above. |

First four weeks: each row goes to **all three channels**, in that channel’s corresponding Buffer slot. Every video below exists; founder approval still applies. Preserve the supplied captions, including `series/renders/01.txt`, `23.txt` and the actual special-caption path, `series/renders/specials/readout-14.txt`.

| Week | Slot | Video |
|---|---:|---|
| 1 | 1 | `out/series/02-kun/share.mp4` — The Receptive |
| 1 | 2 | `out/series/01-qian/share.mp4` — The Creative |
| 1 | 3 | `out/explainers/wangbi-teaser/share.mp4` |
| 2 | 1 | `out/series/23-bo/share.mp4` — Splitting Apart |
| 2 | 2 | `out/series/24-fu/share.mp4` — Return |
| 2 | 3 | `out/explainers/readout-key/share.mp4` |
| 3 | 1 | `out/series/05-xu/share.mp4` — Waiting |
| 3 | 2 | `out/series/06-song/share.mp4` — Conflict |
| 3 | 3 | `out/specials/character-5/share.mp4` |
| 4 | 1 | `out/series/08-bi/share.mp4` — Holding Together |
| 4 | 2 | `out/series/10-lu/share.mp4` — Treading |
| 4 | 3 | `out/specials/readout-14/share.mp4` — Great Possession |