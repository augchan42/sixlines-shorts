**Build the modern-character panel first. Keep the reading primary, make the controls explicit, and hold older forms until their conversion is corrected.** No files changed. Recommendations ranked by importance:

1. **Explain the name without treating its shape as proof of the reading.**

   Show the complete Chinese name, pinyin and existing English title, followed by two short sentences: what the character depicts, then why that helps someone consider this hexagram. Keep the second sentence explicitly interpretive. Reuse the identity fields behind [reading.js:39](/Users/auchan/projects/sixlines-site/terminal/reading.js:39).

   Don’t require an “early picture” explanation for every name. Your [research.md:8](/Users/auchan/projects/sixlines-shorts/series/critic/characters/research.md:8) counts 25 disputed and 16 “folk” readings. Where components primarily indicate sound, say so; don’t invent a scene.

   Suggested structure: **井 Jǐng — THE WELL**, then “The early form is commonly read as a well’s frame.” Separately: “For this hexagram, consider how a shared resource is maintained.” Wang Bi’s master-line explanation stays in the reading; no stroke-to-line correspondence should be implied.

2. **Use a right-hand companion panel on desktop and explicit tabs on phones.**

   On wide screens, centre the combined terminal-and-panel layout. Put a roughly 320–400 CSS-pixel panel to the terminal’s right, separated by 24–40 pixels, with its drawing aligned near the plot. Don’t stretch the existing 1080×1920 design or fill both side margins. The current letterboxing is calculated in [main.js:414](/Users/auchan/projects/sixlines-site/terminal/main.js:414).

   On phones, retain the title and interactive hexagram above a lower region with **READING / CHARACTER** controls; default to READING. Let that region scroll when necessary instead of shrinking its text. The existing lower content begins at [main.js:136](/Users/auchan/projects/sixlines-site/terminal/main.js:136).

   Move number entry to a visible **GO TO** button. Tapping the name can additionally open CHARACTER, but should not be its only discoverable control. The name currently opens the pad at [main.js:330](/Users/auchan/projects/sixlines-site/terminal/main.js:330); update the touch legend too.

   Use real HTML buttons and text beside the canvas: keyboard focus, screen-reader access and approximately 44-pixel touch targets. The current [index.html:13](/Users/auchan/projects/sixlines-site/terminal/index.html:13) disables scrolling and provides only a canvas label.

   Below the drawing: pinyin, English, one explanatory sentence. Show the form label and approximate period only when viewing an older form. Two-character names always retain both characters, side by side.

3. **Match the outline tubes, with restrained glow and finite animation.**

   Blender traces each stroke’s **perimeter**, using hollow tubes: [character.py:147](/Users/auchan/projects/sixlines-shorts/blender/character.py:147). Drawing medians alone would produce thin handwriting and lose the characteristic doubled edges.

   Use the original outline paths, flattened once into polylines with cumulative lengths for progressive tracing. Preserve corners and holes. Render three passes: a faint broad halo, a narrow green tube, then a finer pale-green core. Start around 2 CSS pixels for the tube at a 250-pixel character size; judge dense characters at actual phone size.

   Use terminal green `#7dff8a`, already defined at [main.js:8](/Users/auchan/projects/sixlines-site/terminal/main.js:8). Keep amber for the selected line and cyan for the prompt.

   Cache completed strokes and their glow in a small offscreen canvas. Recompute only the active stroke; cap panel DPR at 2 and render its halo at reduced resolution. Avoid full-screen blur. These choices follow [MDN’s canvas optimisation guidance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas). The existing terminal already redraws continuously at [main.js:460](/Users/auchan/projects/sixlines-site/terminal/main.js:460); don’t add repeated blur work there.

   Aim for 3–5 seconds per complete name, weighted by outline length, then hold indefinitely. No loop or new sound. Reduced-motion mode shows the completed drawing immediately.

4. **Load small, self-hosted character files after the terminal appears.**

   The current 64 names contain **71 distinct characters; 24 exist locally and 47 are missing**. Exact missing glyph identifiers:

   ```text
   乾 坤 蒙 訟 師 小 畜 泰 否 大 有 謙 豫 隨 觀 噬 嗑 賁 无 妄
   過 坎 離 咸 遯 壯 晉 夷 睽 蹇 損 夬 姤 萃 升 震 漸 歸 妹
   豐 巽 渙 節 中 孚 濟 未
   ```

   Fetch these during asset preparation through the existing endpoint in [character.mjs:27](/Users/auchan/projects/sixlines-shorts/scripts/character.mjs:27), pinning an exact package version. Validate every response and preserve the terminal’s exact spelling, including its character variants.

   Ship ordered outlines, bounds, source/version and licence metadata per character. Keep explanation and pronunciation in a separate curated manifest. Medians are unnecessary for perimeter tracing.

   Measured across the 24 relevant local files: outlines alone average **2.16 KB raw / 1.00 KB gzip**, ranging **0.26–2.13 KB gzip**. Extrapolating gives roughly **71 KB compressed for all 71**, excluding metadata and older forms; this is an estimate.

   Fetch only the visible name, cache by character, and keep it outside the startup dependency at [main.js:472](/Users/auchan/projects/sixlines-site/terminal/main.js:472). Failed loading should leave the name and reading usable.

5. **Correct older forms before exposing them.**

   Locally, older forms cover five relevant characters: Well, Oppression, Family’s first character, Revolution and Cauldron; Horse is an additional sample.

   The converter extracts path strings but ignores SVG transforms at [ancient-forms.mjs:228](/Users/auchan/projects/sixlines-shorts/scripts/ancient-forms.mjs:228). Several sources contain vertical flips—for example [鼎-bone.svg:10](/Users/auchan/projects/sixlines-shorts/public/local/ancient/鼎-bone.svg:10)—and nested transformations. Flatten those transforms and compare every converted form against its source before shipping.

   Its generated “medians” are contour vertices, not historical writing paths. Reveal older outlines together or crossfade; don’t claim stroke order.

   Offer **EARLIER FORM** manually, without an automatic historical slideshow. Replace unsupported exact dates such as “221 BC” in [井.json:23](/Users/auchan/projects/sixlines-shorts/series/forms/井.json:23) with source-supported periods.

6. **Include licences, and keep changes tied to current state.**

   Credit “Make Me a Hanzi / Hanzi Writer Data; outlines derived from Arphic fonts.” Graphics use the [Arphic Public License](https://raw.githubusercontent.com/chanind/hanzi-writer-data/master/ARPHICPL.TXT): distribute its unchanged text, retain notices, document how and when each transformed file changed, and make derived data available under that licence. Independent application code remains separate.

   Put a **Sources & licences** link beneath the panel. Include Commons file links, contributors and Richard Sears where applicable. The [checked Well file](https://commons.wikimedia.org/wiki/File:%E4%BA%95-oracle.svg) declares public-domain status; verify each remaining file individually. The [Sears agreement](https://commons.wikimedia.org/wiki/Commons:Ancient_Chinese_characters/Richard_Sears_Agreement) also records an acknowledgement request.

   Update panel identity through [showLines():170](/Users/auchan/projects/sixlines-site/terminal/main.js:170). Cancel stale fetches and animations on another flip; begin drawing after a brief settling interval. Preserve the selected phone tab. Cut automatic history playback, component colours, decorative signs and additional sound.