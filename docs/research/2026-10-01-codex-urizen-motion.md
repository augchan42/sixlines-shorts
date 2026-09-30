The main problem is the handover. At `b4`, the captions turn blue, but Urizen stays in the same shot. **B gives the clearest change: Urizen speaks, then the Guide presents him as an entry.**

Keep the narrator’s view still after that transition. More activity throughout would compete with the explanation.

1. Ranking Claude’s ideas

| Rank | Idea | What it fixes | Cost | Main risk |
|---|---|---|---|---|
| **1** | **B — framed Guide entry** | Clearly separates the two voices and gives the hexagram room. The scale change also suits the dry humour. | Remotion layout and masking. To avoid two simultaneous moves, stop the baked camera push during the Guide section; that requires a revised Blender pass. | A small panel makes Urizen incidental. Keep his face large enough to read. |
| **2** | **A — specimen view** | Strong change from someone addressing us to someone being examined. Closest to the Guide’s visual language. | One matching Blender outline pass for beats 4–6, plus SVG leaders. | Full mesh edges would make the streaming hair and beard very busy. Use selected contours. Cross-fade; omit the flicker. |
| **3** | **C — different camera** | Adds depth and gives the narrator a distinct viewpoint. | A new camera pass for the narrator section. | An orbit alone may still feel like the same talking-head shot. Profile could hide the mouth and make the eyeless face harder to read. |
| **4** | **E — climbing dragon** | Gives “keep climbing” a visible action and connects it to the hexagram. | SVG dragon and path animation; no Blender render. | A ladder suggests six levels of achievement. That could obscure the point about judgment and knowing when to stop. |
| **5** | **F — reaction** | Makes Urizen present during the explanation. | Head-turn controls, brow deformation, and a new render. More work than a camera change. | Looking back on the narrator’s “withdraw” suggests he has understood. His final “Withdraw?” works better if he has not. |
| **6** | **D — rising out of frame** | Makes excessive ascent visible. | Camera/framing changes and a render. | The crown enters the caption area. Holding an awkward crop through the explanation may look accidental. Also, tilting down does not by itself guarantee that framing. |

2. Better variants

**A simpler specimen drawing:** replace the shaded head with a few thick neon contours—crown, brow, nose, beard—with a faint flat fill. Leave out the internal triangulation. This would resemble the Guide drawings more closely than a wireframe, though it needs a carefully selected Blender outline pass.

**A diagram of the actual problem:** beside the hexagram, one green arrow advances upward and stops at the amber top line. At `quote`, its label becomes `ADVANCE ONLY`. No fall, collision, or punishment. This makes the commentary visible without introducing a dragon character. It is cheap SVG work, but I would reserve it for a version where the head leaves the screen entirely.

**Use fewer specimen labels:** `HAIR: WINDSWEPT` describes something already obvious. `DIRECTION: UP` duplicates the climbing line. One leader labelled `OCCUPATION: MEASURING` establishes the Guide’s tone and connects directly to Urizen’s claim.

3. Recommended combination and timing

**B, simplified, plus one leader label from A.** Keep the shaded head. Use one eased reduction into a Guide entry, then cut back for “Withdraw?” No wireframe, orbit, dragon, or reaction.

Frames below are the Remotion marks at 30 fps.

| Beat / marks | Plan |
|---|---|
| **1 — `b1=30` to `e1=157` · 1.00–5.23 s** | Full-screen Urizen, ivory captions, wind and jaw movement. Keep the slow push. Retain the existing subject label. |
| **2 — `b2=175` to `e2=355` · 5.83–11.83 s** | Continue the same move. Let “Neither do I” establish his insistence without another illustration. |
| **3 — `b3=373` to `e3=570` · 12.43–19.00 s** | Continue the push through “keep climbing.” Hold through the following gap. |
| **4 — `b4=597` · 19.90 s** | As the Guide starts, ease the head video into a green-framed portrait card at middle-left over about **40 frames**, finishing at `637` / 21.23 s. Keep the face readable and the captions fixed. Hold the head camera during the Guide section; retain the wind. |
| **4 — `hexagram=643`, `top=669` · 21.43, 22.30 s** | Once the card has settled, draw the six lines at lower right. Light the top line amber on `top`. No further movement on “went too high” or “regret”; the marked position supplies the explanation. |
| **5 — `b5=833`, `quote=929` · 27.77, 30.97 s** | Hold the composition. Reveal 知進而不知退 and its English at `quote`. Give the viewer time to read alongside the narration. |
| **6 — `b6=1029` to `e6=1144` · 34.30–38.13 s** | On “makes rules” (`1094` / 36.47 s), draw one short green leader from the card to `OCCUPATION: MEASURING`. Move the existing occupation label here rather than repeat it. Hold through the pause. |
| **7 — `withdraw=b7=1177` · 39.23 s** | **Cut back to the full-screen shaded head**, removing the card and Guide diagrams. Ivory “Withdraw?” He has the screen to himself again. No rapid panel enlargement. |
| **`e7+1=1209` · 40.30 s; `close=1232` · 41.07 s** | Extinguish the sun outline when the word ends, as the Blender code currently does. Hold the darkened face until the ivory close. End at 43.8 s. |

This needs the Remotion card transition and leader, plus a camera revision for the existing head render. It gives the short two distinct views while preserving the settled narration.

RECOMMENDATION: B’s framed Guide entry, with one measuring label from A, then a cut back to full-screen Urizen for “Withdraw?”