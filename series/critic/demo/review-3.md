# Demo walkthrough in Simplified and Traditional Chinese: third review

Reviewed: `series/demo/walkthrough-zh-hans.json` and `walkthrough-zh-hant.json`, the renders
`out/demo/walkthrough-zh-hans/share.mp4` and `walkthrough-zh-hant/share.mp4` (50.2 s each), frames
every 0.5 s through the app shots and every 0.6 s through the character shot, full-size crops of
the reading, Wang Bi and proof frames, and the note takes `take15-zh-hans-note` and
`take17-zh-hant-note`. The caption wording is settled and was judged only for script and
legibility.

## Scores

| # | Decision | Score | Reason |
|---|---|---|---|
| 1 | Captions don't cover the drawing or the key app text | 9 | The character never reaches the captions, even at its largest (about 20.5-21.5 s). 则此解读有误 and 則此解讀有誤 are fully visible. The top four lines of Wang Bi's text show in both cuts, and so does the note. In the Simplified proof shot the caption box starts just below 此解读有误, which is tight but doesn't cover it. |
| 2 | Each app shot shows what its caption says | 8 (Simplified), 6 (Traditional) | The question, reading, Wang Bi and proof shots match their captions in both cuts. In the Traditional note shot the saved note shows only in the last 0.35 s. In both cuts the note is already typed when the shot starts. |
| 3 | Script consistency | 9 | The captions, question, reading, Wang Bi, proof section, note, date line (最后更新于现在 / 最後更新於1秒前) and hexagram card (整治积弊 / 整治積弊, 蛊 / 蠱) all match their cut. Known app issues, not scored: "Work on the Decayed", the English translation under Wang Bi, and the English "Gua" in the Gua 问卦 / Gua 問卦 title. |
| 4 | No banned words, no Journal list | 10 | None of 预测/預測, 占卜, 算命 or 神諭 appears in any sampled frame. Both note takes start inside the reading, so the Journal list never appears. |
| 5 | Pacing and timing | 8 (Simplified), 6 (Traditional) | The proof shot holds for 4.4 s in both cuts, and the whip cuts land on the beats. In the Simplified cut the saved note shows from about 39.3 s, so it is on screen for about 1.4 s. The Traditional cut reaches the saved note only at about 40.35 s, just before the end card. |

## Fix for the scores below 8

**Traditional, shot 7 (beats 50-56, take17), field `from`: 17.0 -> 18.5.** Keep `rate` 1.5.

In take 17 the note is finished at 16 s, and Save is tapped at about 22 s. The saved note shows
from about 22.3 s until the take scrolls back up at about 27 s. With `from` 17.0, the shot covers
take 17.0-23.5, and the saved note shows only from about 40.35 s. With `from` 18.5, the shot covers
18.5-25.0 and the saved note shows from about 38.9 s, which gives it about 1.8 s. The shot still
ends before the scroll at 27 s. This skips 1.5 s of an idle keyboard, and no typing is lost,
because the typing had already finished.

This raises decision 2 to 8 and decision 5 to 8 for the Traditional cut.

## Optional, not needed

- Neither cut shows the note being typed. The caption only says 记下结果 / 記下結果, so this is fine.
  If you want the text to appear on screen, change the Simplified shot 7 (take15) to `from` 4.5 and
  `rate` 1.75. Typing (take 5-6 s) then shows at about 36.6-37.2 s, and the saved note shows from
  about 39.7 s, for about 1 s. The Traditional take can't do this: it has 6 idle seconds between the
  typing and the save, so the shot would need a cut in the middle.
- In the Traditional cut the full-width 。 and ， sit centered in the character cell with a gap
  before them (是一幅畫 。). This is normal in Traditional typesetting and does not hurt legibility.
  The glow makes dense glyphs (讀, 寫, 蟲) a little soft at phone size, but at full size they read
  clearly.

## Applied

- walkthrough-zh-hant.json shot 7 `from` 17.0 → 18.5. Re-rendered; the saved note shows from about 38.9 s to the end card.
- The optional Simplified change (show the typing) was not applied.
