# Media strategy: Six Lines shorts on Instagram, TikTok, YouTube and X

2026-09-30. The user: "we need to have some kind of media strategy. Do a web search for best
practices. And knowing that we'll be using Buffer and we have three accounts. And we might actually
cross-post to X as well." This sits above posting-plan.md (what goes out which week) and
engagement-style.md (voice and replies). Sources are at the end.

## Goal

People who meet a short should understand one hexagram as a situation, and some of them should come
to sixlines.day. Growth follows from people watching to the end, saving and sending. We judge posts
by early retention, completion, saves, shares, follows and profile visits per reach, with views
kept as context (YouTube counts a view on every start or replay; there, read "engaged views" and
"stayed to watch").

## Who it is for

English-speaking people weighing an ordinary situation: leading, waiting, a conflict, a hard start.
The terminal look stops them; the explanation has to give them a reason to stay.

## What the research says, and what we do about it

These are mostly observed associations in Buffer's data, not proven effects, and none is a
platform rule unless it says so.

| Finding | What we do |
| --- | --- |
| Buffer (100K+ users, 26 weeks): accounts that posted in 20+ of the 26 weeks had much more engagement per post than sporadic ones. Established accounts and better content may explain part of it. | Never skip a week. Keep two weeks of posts the founder has approved (not just rendered) in the queue. |
| Buffer's frequency guide: 3 to 5 posts a week on Instagram and TikTok, 1 to 3 Shorts a week on YouTube. YouTube says there is no minimum cadence. | Three a week on each for six weeks. From week 7, a fourth (three series shorts and one feature) if the approved queue stays ahead and replies get answered. Five only after another four weeks, if the fourth brought people without straining approval. |
| TikTok says interactions, including watching and skipping, matter most; it publishes no ranked list. | The hook types in within the first second, as now. Our shorts are 30-35 s; keep them there. |
| Instagram ranks sends (shares by DM) highly, and demotes other people's content and other apps' watermarks. The April 2026 policy is about accounts that mostly post "someone else's content". | Upload the clean share.mp4 to each platform (Buffer does this). Never re-post a file downloaded from TikTok or YouTube, which carries their watermark. Our own original file on three platforms is not what the policy targets. |
| YouTube Shorts keep getting views for months, and the Shorts feed shows channels people don't follow. YouTube matches search on metadata. | A searchable title, written when the post is approved: `I Ching Hexagram 2: 坤 Kūn — The Receptive`. |
| Replying to comments goes with more engagement per post (Buffer, ~2M posts): Instagram +21%, X +8%. | Reply within a day, per engagement-style.md. |
| X shows posts with an outside link in the body to fewer people (figures vary by source; no dependable number). | Upload the video to X; put sixlines.day in the first reply (scripts/social/queue-video.mjs `replies`). Fewer people will see the link there, so measure site visits. |

## The accounts

| Where | Account | Tool | Why |
| --- | --- | --- | --- |
| Instagram, TikTok, YouTube | Six Lines | Buffer, free plan | The free plan covers exactly 3 channels and 10 scheduled posts per channel. At 3 a week that is a three-week queue. |
| X | @sixlinesapp (Premium) | Typefully set 310894 | Already connected with Threads and Bluesky, and owned by sixlines-site (ADRs 024, 027, 028, 045). A trial of 8 to 12 shorts; continue if it brings conversations, follows or site visits for little work. |
| X | @8bitoracle (~600 followers) | Typefully set 310318 | Introduce Six Lines once, then repost or quote about one short a week: binary, structure and computing pieces, or a judgment short with text that says why this audience would care. |
| X, LinkedIn, Bluesky | the founder | Typefully set 309387 | Their own notes on the work, when they want. |

Adding X to Buffer would be a fourth channel and needs the paid plan ($5-6 a channel a month, so
about $20-24 for four). Typefully already reaches X, so we don't need it. Typefully's free plan has
10 publishing drafts a month per set and refuses video over 10 MB, so X gets two shorts a week at
720p (scripts/social/queue-video.mjs). Two a week uses 8 to 10 of the 10 drafts, so the daily
hexagram and other scheduled posts on that set need counting against the same quota.

## The week

Instagram, TikTok and YouTube keep the posting plan's slots (Asia/Tokyo): TikTok Mon, Sat, Sun;
Instagram Tue, Wed, Thu; YouTube Thu, Fri, Sat. X gets the week's two series shorts a day after
their first platform, with its own text (ADR-027: no identical same-time fan-out). One Typefully
draft to X, Threads and Bluesky counts once against the quota.

Per platform:
- **TikTok:** the caption and a few plain hashtags (#iching #yijing and the hexagram's English name).
  TikTok only allows a website link in the profile at 1,000 followers or with a business account;
  until then, don't write "link in profile" there.
- **Instagram:** the caption; share the Reel to Stories on the day it posts. Pin the three from the
  posting plan.
- **YouTube:** the searchable title above; the caption as description.
- **Profile links:** one per platform, each with its own tracking parameters, so site visits can be
  told apart.
- **X:** one or two sentences written for X, the video, and sixlines.day in the first reply.

## Approval

Buffer's free plan has one user and no approval step. The founder approves the exact file, caption,
and each platform's text (the X reply too); only then is it scheduled. Buffer's 10 scheduled posts
per channel hold two weeks at five a week, and slots reopen as posts go out; paying buys a deeper
queue, it isn't needed to keep posting.

## The ivory bookend test

The first six series shorts get the Goudy-on-ivory close (the app icon). Three also open on the
ivory card with the hook (2 Kun, 3 Zhun, 5 Xu); three open on the terminal as rendered (1 Qian,
23 Bo, 6 Song), one of each kind per posting slot. Each short uses the same version on all three
platforms. Compare the two opens on early retention, at the same age (seven days), with completion
and follows as support. Six posts can show a large problem (several ivory opens losing people at
the flicker), not a small advantage. If the ivory opens clearly lose, drop the open card; if the
results are mixed, keep the close and open on the terminal. The other 58 wait for this.

## Checking it

After four weeks (as in posting-plan.md), per platform: early retention and completion, saves,
shares or sends, follows and profile visits per reach, and site visits by profile link. Then decide
the cadence, whether X earns its time, and which feature kind holds people.

## Sources

- Buffer, How to grow on social media in 2026: https://buffer.com/resources/creator-growth-playbook/
- Buffer, How often to post on social media in 2026: https://buffer.com/resources/social-media-frequency-guide/
- Buffer, Best time to post on Instagram (9.6M posts): https://buffer.com/resources/when-is-the-best-time-to-post-on-instagram/
- PetaPixel, New Instagram policies target reposted content (2026-04-30): https://petapixel.com/2026/04/30/new-instagram-policies-target-reposted-content/
- Metricool, YouTube Shorts algorithm: https://metricool.com/youtube-shorts-algorithm/
- Gyre, YouTube Shorts view count update: https://gyre.pro/blog/youtube-shorts-view-count-update-impact-strategy-what-to-do-next
- Eclincher, How to grow on TikTok in 2026: https://www.eclincher.com/articles/how-to-grow-on-tiktok-in-2026-tactics-that-actually-work
- Sprout Social, How the Twitter algorithm works in 2026: https://sproutsocial.com/insights/twitter-algorithm/
- Blotato, Buffer pricing 2026: https://www.blotato.com/blog/buffer-pricing

Astra's review: docs/research/2026-09-30-codex-media-strategy-bookend.md. Also:
- TikTok, How TikTok recommends content: https://support.tiktok.com/en/using-tiktok/exploring-videos/how-tiktok-recommends-content
- YouTube, Shorts discovery and cadence: https://support.google.com/youtube/answer/11914225
- YouTube, Engaged views and stayed to watch: https://support.google.com/youtube/answer/9313698
- Meta, Helping creators find new audiences (2024): https://about.fb.com/ltam/news/2024/05/ayudando-a-los-creadores-a-encontrar-nuevas-audiencias/

Some blog posts say Instagram penalises creators who post their own video on TikTok too. Instagram's
own statement (PetaPixel's report of Mosseri) is about accounts that mostly post other people's
content; we found no primary source for the stronger claim.
