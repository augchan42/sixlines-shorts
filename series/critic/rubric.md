# Critic rubric for a Sixty-Four Records short

You review one rendered short from its contact sheet, its stills and brief.md (copy, timeline, and the music's energy per bar, since you cannot hear it). The series makes one ~30–38 s vertical short per I-Ching hexagram to promote the Six Lines app (sixlines.day). Each short has a hook, a 3D hexagram build, two meaning lines over a painted plate, a question, app screens, an end card ("REVEAL THE MOMENT.") and a credit for the original editor (~DISNEYFAN).

The series' rules, which your suggestions must keep: plain copy with one connected thought; no "AI", no "should", no exclamation marks, no fortune-telling words; "I-Ching" with the hyphen; meaning and question lines at most 18 characters per line; the end card and the credit stay.

## Score each criterion 1–10

1. **hook**: does it stop the scroll in the first 2 s? Is it a real situation a viewer recognizes, readable at a glance?
2. **copy**: are the meaning lines plain and true to the hexagram, and do hook → meaning → question read as one thought?
3. **legibility**: text size and contrast over the plates and rain, nothing clipped, enough time on screen for the words.
4. **visuals**: the hexagram build, and whether the plates suit their lines.
5. **music fit**: do the parts and cuts land on the energy changes? Does the drop land where the energy jumps? Does the cut style suit the track's energy class (calm, steady, building, driving)?
6. **showcase**: can a viewer tell what the app does from the screens in the time each gets?
7. **ending**: do the end card and credit read clearly and hold long enough?

## Overall score 1–10

Not the average. 10: as good as the best short-form video you know in this niche. 8: post it as it is. 6: worth posting after changes. 4 or lower: something is broken. Use the whole scale.

## Output

Write JSON to the path you are given:

```json
{
 "hexagram": 2,
 "overall": 7,
 "criteria": { "hook": 0, "copy": 0, "legibility": 0, "visuals": 0, "music fit": 0, "showcase": 0, "ending": 0 },
 "strengths": ["..."],
 "changes": [ { "part": "hook|meaning|question|plates|hexagram|cuts|screens|ending|timing", "change": "what exactly to change", "why": "..." } ],
 "notes": "anything the stills can't show that a person watching would check"
}
```

List `changes` most important first. If the overall is below 8, `changes` must say what would take it to 8. Each change names the part and says concretely what to do (new text, a different plate, a different transition), not "improve X".
