# Learning and capture motion vocabulary

The collection is additive: load `motion-icons.js`, `motion-icons-recipes.js`,
then `motion-icons-learning.js`. The 13 original recipes and their runtime are
unchanged; this file adds 14 subjects.

| Subject | Object | Rest poses | One-shot actions | Ongoing / driven |
| --- | --- | --- | --- | --- |
| lookup | Page and attached magnifying lens | idle | tap, found, empty, fail | searching |
| lexicon | Word card sliding into a book | empty, saved | tap, save, reopen, fail | saving |
| daylight | Sun turning in planar perspective into a crescent | idle, selected, night, nightSelected | tap, peek, select, selectNight, toNight, toDay | — |
| cards | A staggered word-card deck | idle, selected | tap, peek, select, remember, revisit | preparing |
| book | Closed cover unfolding around its spine | idle (closed), open, selected (open) | tap, peek, select, close, turn | — |
| recall | Folded answer card | idle, revealed | tap, reveal, close, next, retry | — |
| milestone | A finished word booklet and attached seal | idle, complete | tap, complete, restart | — |
| capture | A plus that grows when another plus lands on it | idle, selected | tap, peek, select, insert | — |
| conversation | A face with a gaze and an orbiting mote | idle, selected | tap, peek, select, reply | thinking |
| settings | Engraved mechanical dial | idle, selected | tap, peek, select, turn | — |
| sentence | Writing on a lined page | idle, selected | tap, peek, select, reveal, fail | writing; task mapping |
| memory | Landscape inside a bookmarked frame | idle, selected | tap, peek, select, bind, fail | imagining; task mapping |
| pencil | A nib touching down over notes | idle, selected | tap, peek, select, write | — |
| voice | Microphone with a sound arc | idle, selected | tap, peek, select | speaking, level drive |

## Navigation

Use native buttons or semantic HTML buttons as the interaction target. The icon
is decoration, never the label. Navigation has no background activity loop.

```js
const icon = MotionIcon.create(container, 'book', {size: 24, pose: 'idle'});
let selected = false;
button.addEventListener('pointerenter', () => icon.play(selected ? 'tap' : 'peek'));
button.addEventListener('pointerleave', () => icon.setPose(selected ? 'selected' : 'idle'));
button.addEventListener('click', () => { selected = true; icon.play('select'); });
// When another section becomes active:
selected = false; icon.setPose('idle');
```

Keep the selected pose when the pointer leaves. Keyboard activation must trigger
the same selection change, and the button owns focus and `aria-current`.

Daylight follows the effective color scheme: use `night` / `nightSelected` in
dark appearance and `idle` / `selected` in light appearance. Theme changes call
`setPose` on the existing instance so a second change reverses the turn while
it is still moving. The disc turns on a vertical axis in planar perspective:
it foreshortens toward the axis, the near side keeps its drawn size, and only
the far side shortens. The crescent replaces the sun at the edge. Rays leave
with that turn; stars arrive on the moon.
The gallery’s appearance control plays `toNight` / `toDay`
only from an unselected pose, and those actions retarget the phase on the first
frame. A selected Today icon keeps `selected` or `nightSelected`. Never recreate
the host or flash the day pose during a dark-mode selection.

Book rests closed until hover, keyboard focus or selection opens it. `peek`,
`select` and `close` move the cover on the first frame; the tilt is only
follow-through, so leaving and re-entering reverses the hinge instead of
finishing the previous anticipation. Pointer leave restores the navigation pose;
selected books remain open. `turn` keeps the page attached to its spine.

## Async actions

A lookup starts `searching`; only an actual result starts `found`, absence starts
`empty`, and an actual failure starts `fail`. A confirmed repository write starts
`lexicon.save`. A duplicate record is not another successful write. Cancellation
calls `stop` or `reset`, and stale responses must not change the current icon.

`sentence` and `memory` support `busy`, `success` and `fail`, mapped to their own
verbs. These cosmetic actions must not delay persistence or return from a task.

## Native hosts

`examples/MotionIconView.swift` is a standalone SwiftUI/AppKit adapter, using
`assets/motion-icon-host.html`. Local WKWebView hosts share a process pool and a
nonpersistent data store. They neither receive app data nor perform requests.
Only subject, action, pose, event, size, ink and visibility cross the bridge.

Change an event number to replay the same verb. A cached result should appear in
its rest pose, not replay success on every page visit. Stop/reset hosts when their
pane is disabled, occluded or removed. Keep native status text and accessibility
labels; the host cannot become first responder or intercept clicks.

Use one animated host for a collection's current task or receipt; keep hundreds
of list-row badges as lightweight static native marks.

## Examples and limits

`examples/workflows.html` contains six-section navigation, cancellable lookup and
capture, sentence/scene generation, and a driven download. Definitions, sentences,
scene text and storage in this demo are local fixtures, not network AI or a real
repository. The app should wire the same events to its real services.

The gallery frame sheet covers every declared action, stopped loop, drive and
mapped task. It checks NaN, target pose, exact rest, error reset and completion
within four seconds; visual inspection at 60 px still checks metaphor and bounds.

## Recall and round completion

`recall.reveal` unfolds the answer flap. A confirmed good rating starts `next`;
`retry` keeps a forgotten card in the round. A failed persistence attempt triggers
neither. Event tokens distinguish new ratings without remounting the native host.
`milestone.complete` closes the final page and stamps the booklet, once a round
actually finishes. Starting a fresh round uses `restart`.

The host uses an action’s `from` pose only for an active, animated `playOnMount`.
Reduced motion and reactivation use the stable requested pose, so completed results
do not replay on every visit. See [maintenance](../docs/MAINTENANCE.md) for publishing.
