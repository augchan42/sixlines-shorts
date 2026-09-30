# Media strategy: Six Lines shorts on Instagram, TikTok, YouTube and X

2026-09-30. The user: "we need to have some kind of media strategy. Do a web search for best
practices. And knowing that we'll be using Buffer and we have three accounts. And we might actually
cross-post to X as well." This sits above posting-plan.md (what goes out which week) and
engagement-style.md (voice and replies). Sources are at the end.

## Goal

People who meet a short should understand one hexagram as a situation, and some of them should come
to sixlines.day. Growth follows from people watching to the end, saving and sending. We judge posts
by completion, saves, shares and follows, not by views (YouTube counts a view on every start or
replay, so its view counts are inflated).

## What the research says, and what we do about it

| Finding | What we do |
| --- | --- |
| Consistency matters more than volume. Buffer (100K+ users, 26 weeks): accounts that posted in 20+ of the 26 weeks got about 450% more engagement per post than sporadic ones. | Never skip a week. The queue is always two weeks ahead, so a busy week doesn't break the run. |
| 3 to 5 posts a week is the sweet spot on Instagram and TikTok; going from 1 to 2-5 a week gives the biggest lift per post. A few Shorts a month is enough on YouTube. | Three a week on each, as planned. Move to four or five once the feature slot has the supply (the character specials). |
| TikTok ranks mostly on watch time and completion, then rewatches, shares and saves. The first 1-3 seconds decide it. | The hook types in within the first second, as now. Our shorts are 30-35 s; keep them there. |
| Instagram ranks sends (shares by DM) highly, and demotes other people's content and other apps' watermarks. The April 2026 policy is about accounts that mostly post "someone else's content". | Upload the clean share.mp4 to each platform (Buffer does this). Never re-post a file downloaded from TikTok or YouTube, which carries their watermark. Our own original file on three platforms is not what the policy targets. |
| YouTube Shorts keep getting views for months, and the Shorts feed shows channels people don't follow. Search helps. | Give YouTube a searchable title. Option: `坤 Kūn, The Receptive · I Ching hexagram 2` instead of the caption's first line alone. |
| Replying to comments goes with more engagement per post (Buffer, ~2M posts): Instagram +21%, X +8%. | Reply within a day, per engagement-style.md. |
| Native video on X does best; posts with a link in the body get 30-50% less reach, near zero for non-Premium accounts. | Upload the video to X; put sixlines.day in the first reply, not the post. |

## The accounts

| Where | Account | Tool | Why |
| --- | --- | --- | --- |
| Instagram, TikTok, YouTube | Six Lines | Buffer, free plan | The free plan covers exactly 3 channels and 10 scheduled posts per channel. At 3 a week that is a three-week queue. |
| X | @sixlinesapp (Premium) | Typefully set 310894 | Already connected with Threads and Bluesky, and owned by sixlines-site (ADRs 024, 027, 028, 045). Premium allows long video and softens the link penalty. |
| X | @8bitoracle (~600 followers) | Typefully set 310318 | Repost or quote the shorts that fit its story (binary, Leibniz, Shannon, the cube), not every short. |
| X, LinkedIn, Bluesky | the founder | Typefully set 309387 | Their own notes on the work, when they want. |

Adding X to Buffer would be a fourth channel and needs the paid plan ($5-6 a channel a month, so
about $20-24 for four). Typefully already reaches X, so we don't need it. Typefully's free plan has
10 publishing drafts a month per set and refuses video over 10 MB, so X gets two shorts a week at
720p (scripts/social/queue-video.mjs).

## The week

Instagram, TikTok and YouTube keep the posting plan's slots (Asia/Tokyo): TikTok Mon, Sat, Sun;
Instagram Tue, Wed, Thu; YouTube Thu, Fri, Sat. X gets the week's two series shorts a day after
their first platform, with its own text (ADR-027: no identical same-time fan-out). One Typefully
draft to X, Threads and Bluesky counts once against the quota.

Per platform:
- **TikTok:** the caption and a few plain hashtags (#iching #yijing and the hexagram's English name).
- **Instagram:** the caption; share the Reel to Stories on the day it posts. Pin the three from the
  posting plan.
- **YouTube:** the searchable title above; the caption as description.
- **X:** one or two sentences written for X, the video, and sixlines.day in the first reply.

## Checking it

After four weeks (as in posting-plan.md), per platform: average watch time and completion, saves,
shares or sends, follows per post. Then decide the cadence (stay at three or go to five), whether X
earns its time, and which feature kind holds people. After the Buffer free plan's 10-post queue, if
we want more than three weeks queued, that is the point to pay for Essentials.

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

Some blog posts say Instagram penalises creators who post their own video on TikTok too. Instagram's
own statement (PetaPixel's report of Mosseri) is about accounts that mostly post other people's
content; we found no primary source for the stronger claim.
