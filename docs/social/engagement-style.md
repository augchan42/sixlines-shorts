# Six Lines: Social Engagement Style

Sep 30, 2026 · @Augustin

## Who we are

Six Lines reads the I Ching as a book for judgment: each hexagram is a situation, each line a position in it, and the question is what a sound person does there. We post to help people think, not to tell them what will happen.

The reading we follow is Wang Bi's (third century) and the Ten Wings: grasp the meaning, then let go of the image. The images (a boar's tusks, a well, a cart) are there to carry an idea about conduct. We explain that idea, and we treat the image as its vehicle.

What we are not:

- Not fortune-telling. We never promise outcomes or say what the future holds.
- Not mystical or spiritual wellness. No energy, manifesting, or signs from the universe.
- Not anti-history. Divination is how the book was used for centuries, and we say so plainly when we talk about history.

| Account | What it is for | Where it posts |
| --- | --- | --- |
| Six Lines ([sixlines.day](https://sixlines.day)) | The 64 shorts, terminal lessons, the daily hexagram | Instagram, TikTok, YouTube Shorts via Buffer; Threads, X, LinkedIn via Typefully set 310894 |
| 8-Bit Oracle ([8bitoracle.ai](https://8bitoracle.ai)) | The app and its retro-computing story: binary, Leibniz, Shannon, tech-noir | Typefully set 310318 |
| The founder's personal account | The person behind both, their notes on the work | Typefully set 309387 |

The brand name 8-Bit Oracle stays as it is. Everything else follows the voice rules below.

## Voice

Write plainly and briefly, the way a good teacher talks to one person. If a literal phrase exists, use it.

- **Short.** Captions are one or two sentences. Replies are one to three.
- **Plain words.** No mannered prose, no "journey", "unlock", "dive into", "resonate", "sacred", "ancient wisdom".
- **Give the reason, not just the image.** Say what the line means for conduct and why, as Wang Bi or the Small Image does. Example: "A gelded boar keeps its tusks: the force is held, not lost."
- **No promised outcomes.** Never "this will bring success". Say what a situation asks of you.
- **Assume a newcomer.** Say who does what and what the hexagram is about before any jargon. Explain a term the first time it appears.
- **Trust the audience.** Don't over-explain, don't add emoji, don't beg for engagement ("smash that like").
- **English beside any Chinese.** Always: 既濟 After Completion, 坤 Kun (The Receptive). Many readers don't read Chinese.
- **The personal note is the founder's.** Posts may have a first-person note; an agent leaves a clear placeholder and never writes it.

### Banned words

Never in our own copy, in any language: oracle, divination, fortune, prediction, mystical, magical; 預測/预测, 占卜, 算命, 神諭.

Exceptions: the brand name 8-Bit Oracle; history ("for centuries the book was used for divination"); text visible inside an app screen.

### History

State only what sources support, and name the source or date. Say "attributed to" or "by tradition" where the attribution is legend (Fu Xi, King Wen). Say "shared structure, not borrowing" where a link is thematic (Shannon, DNA codons). Don't overstate: Leibniz wrote up binary in 1679, before he saw the diagram in 1703.

## Look

The look is a 1980s ship's computer (the MU/TH/UR terminal in *Alien*) crossed with Blade Runner's neon: a green phosphor screen reading a 3,000-year-old book as data.

| Element | Rule |
| --- | --- |
| Frame and text | Phosphor green on near-black; pixel font; scan lines |
| Amber | Only the thing to look at: the line that matters, the highlighted hexagram |
| Cyan | The prompt, where the viewer is asked something |
| Blue | Rarely, only to explain a point |
| Motion | Calm: slow camera moves, a searchlight, typed text. No shake, punch or sway over hexagrams |
| 3D | Obsidian slabs with glowing edges, neon wireframes, glyph rain |
| Sound | Real recorded machine sounds (relays, teletype), synthwave at 120 bpm or slower, matched to the hexagram's mood |

Formats that exist, in the order people tend to like them:

1. **The 64 shorts** (30 to 35 s): hook, the hexagram built in 3D, two meaning cards, a question, a lesson, the end card "REVEAL THE MOMENT".
2. **Terminal lessons** (1 to 3 min): a query typed, an answer typed, a drawing beside it (the Wang Bi lesson, the Leibniz diagram, Six Bits on Shannon).
3. **Character lessons**: one Chinese character drawn in neon, then held while a sentence types.
4. **Stills**: a frame from any of the above, with one line of text.

Don't box or hide app screens, don't add effects for their own sake, and don't re-render for small polish.

## What to post

Each post does one of three things: shows a hexagram's situation, teaches how to read one (Wang Bi's way), or explains the structure (bits, pairs, the cube). Every post ends by pointing to sixlines.day, where the reader can try it on their own question.

| Account | Posts | Rhythm |
| --- | --- | --- |
| Six Lines (@sixlinesapp) | The 64 shorts in King Wen order; terminal lessons; structure shorts; the daily hexagram (already tweeted by the site's cron) | Three shorts a week on Instagram, TikTok and YouTube Shorts, through Buffer, in the slots Buffer set for each channel (Asia/Tokyo); now and then one of them a lesson or structure short, pinned |
| 8-Bit Oracle | The app and the method as code and logic, matter of fact; reposts of Six Lines shorts that show app screens | About two hours after Six Lines on the same piece; two or three a week |
| Personal (X, LinkedIn) | The founder's own notes on building it | The day after a lesson; an agent drafts, never posts |

Typefully's default slot is 16:00 UTC. Effort splits about 70% replies, 30% posts (sixlines-site docs/social-posts/growth-playbook.md).

A short's post:

- **Text:** scripts/series/caption.mjs already writes it to series/renders/NN.txt (Instagram) and NN.linkedin.txt: `N · 漢字 Pinyin · Name`, the note, the short's caption from series/copy.json, "Reveal the moment. sixlines.day", the hashtags. Use those files as they are.
- **Note:** `[your note]` is the founder's. The agent never fills it; if it's still there, the post isn't ready.
- **Hashtags:** #iching #bookofchanges #synthwave #sixlines on Instagram, TikTok and YouTube Shorts (YouTube also takes #shorts); #iching and the short's own tags on LinkedIn. No more.
- **Video:** Typefully's plan caps video at 10 MB, so X and Threads get the 720x1280 re-encode (scripts/social/queue-video.mjs).

The terminal lessons and structure shorts go out as a thread or carousel on X and Threads: the video first, then one post per page's answer in plain text.

What does well, from what the founder has said: the neon character lessons, the Wang Bi lesson, and music that suits the hexagram (Kun is the favourite). Post those first when choosing between two.

## Replies and comments

Answer the way the terminal answers: short, plain, the reason given, no flattery.

- **A question about a hexagram or line:** answer with the image and the reason behind it (the Small Image or Wang Bi), in one to three sentences. Point to sixlines.day for the rest.
- **"What will happen to me?"** Don't predict. Say what the hexagram asks the person to weigh: "It doesn't say what will happen. It asks whether now is the time to push or to wait."
- **A correction on history or translation:** check it. If it's right, thank them and say so plainly. If it's wrong, give the source.
- **Praise:** a short thanks. No emoji strings.
- **Hostility or bait:** don't reply.
- **Health, money, legal or crisis questions:** don't read the hexagram for them. Say the book is for thinking a choice through, not a substitute for a doctor, adviser or lawyer, and leave it there.

Examples:

| Comment | Reply |
| --- | --- |
| What does the top line of Qian mean? | The dragon has gone too high and will regret it. Wang Bi: at the top there's no one left to lead, so pushing on only isolates you. |
| Is this fortune telling? | No. It's read the way Wang Bi read it, as a book of situations and how to judge them. |
| 坤 is my favourite. | Kun 坤 (the Receptive). Most readers come to it last and stay longest. |

Never use the banned words in a reply, even when the commenter does. If someone asks about the name 8-Bit Oracle, say it's the app's name; the method is judgment.

**Replying to other people's posts** (the 70%), from sixlines-site docs/social-posts/engagement-kit.md and voice/voice-profile.md:

- 3 to 5 replies a day, on posts about judgment, decisions, Jung, Stoicism, mental models, Chinese classics.
- No links in a cold reply. Add something the thread didn't have: an image or a line from the book, with its source.
- The book speaks, not the founder: shared observations ("Most readers arrive expecting..."), no autobiography, no "I think that's remarkable".
- Lead with a plain claim, then the reason. At most one metaphor. No hype words, no "That's not X, it's Y", no "a thread 🧵", no questions asked only to farm replies.
- Stay out of horoscope, manifestation and "the universe" threads.

## Rules for an AI agent

An agent carrying this out works as a drafter. The founder approves every post.

**Tools**

- Typefully, through its API, for X, Threads, LinkedIn and Bluesky. Social sets: 310894 Six Lines, 310318 8-Bit Oracle, 309387 personal.
- Buffer, for Instagram, TikTok and YouTube Shorts. Three posts a week per channel. The founder approves a batch of posts; Buffer then publishes them in its queue slots. Its API is GraphQL at api.buffer.com (the old REST API refuses the key). Buffer takes video by public URL, not upload, so the full 1080x1920 share.mp4 (yuv420p, faststart, under 25 MB) goes to our own storage first.
- The keys are in sixlines-site/.env, 8bitoracle-next/.env.local and augustinchan.dev/.env.local (Typefully) and sixlines-shorts/.env (BUFFER\_API\_KEY). Load them from the file; never print, log, paste or commit them.
- A browser, for grokbot only: warming up the accounts, finding posts to reply to, and liking and viewing posts (below).

**Browser (grokbot)**

grokbot may drive a browser the founder has already signed in to the Six Lines accounts: X and Threads (@sixlinesapp), Instagram, TikTok and YouTube (Shorts).

**Warm-up.** A new account that only posts by schedule looks like a bot to Instagram, TikTok and YouTube. Before Buffer starts posting, and a little every day after, grokbot uses each account as a person would: scrolls the feed, watches Shorts and Reels on the topics below to the end, likes a few, follows a few accounts that post on them. Sessions of 10 to 20 minutes, once or twice a day, at different times. The first week is only this; posting starts after it.

On every platform it may:

- **Search, scroll and view.** Look for recent posts on the reply topics: judgment and decisions, the I Ching and Chinese classics, Jung, Stoicism, mental models, calligraphy, synthwave and retro computing. Watching and reading is fine.
- **Like.** Like a post it would be glad to have Six Lines seen beside: thoughtful, on topic, not bait. At most 30 likes a day per account, spread through the day, never several in a minute.
- **Follow, while warming up.** At most 5 follows a day per account, of accounts that post on those topics. No follow-for-follow, no mass following, no unfollowing to churn.
- **Queue replies.** For posts worth a reply, write a draft in the voice of the Replies section and add it to a list for the founder: platform, post URL, author, one line on why, the draft. The founder sends it, or tells grokbot to.

It must not:

- Post, reply, comment, quote, repost, duet, stitch or send messages without the founder's yes for that one action. Posting on Instagram, TikTok and YouTube goes through Buffer, not the browser.
- Like or follow horoscope, tarot, manifestation, "the universe", political, medical-advice or engagement-bait posts and accounts, or the accounts' own posts.
- Enter a password, change settings or the profile, or click through to sites off the platform.
- Keep going after a warning, a captcha, a login check or a rate limit. It stops and tells the founder.

**Always**

- Save posts as drafts (Typefully drafts; Buffer posts with saveToDraft). Never schedule or publish without the founder's yes for that post.
- Take the text from series/renders/NN.txt and NN.linkedin.txt as written. Leave `[your note]` for the founder.
- Before saving a draft, check it for the banned words: oracle, divination, fortune, prediction, mystical, magical, 預測, 预测, 占卜, 算命, 神諭. The only exception is the name 8-Bit Oracle.
- Put English beside any Chinese.
- Write the domain as sixlines.day. The older sixlines-site docs (docs/social-posts/, including divination/) use sixlines.online and banned words; take formats from them, never copy.
- On the site and in long posts, write "I-Ching" and BC/AD, as sixlines-site's CLAUDE.md says; the shorts' own text is used as it is.
- Keep a log of each draft: date, account, file, text, Typefully draft id or Buffer post id.

**Never**

- Sign in to any account, or create one. (grokbot uses the browser the founder signed in.)
- Reply to comments or send messages on its own. Draft replies for the founder to send. Views, likes and warm-up follows by grokbot, within the limits above, are the only actions taken without asking.
- Invent history, quotes or sources. If a fact isn't in the repo's research notes, leave it out.
- Promise an outcome, read a hexagram for a person's health, money or legal trouble, or say what will happen.
- Use the founder's email or personal details anywhere.
