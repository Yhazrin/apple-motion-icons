# Learning and capture motion vocabulary

The collection is additive: load `motion-icons.js`, `motion-icons-recipes.js`,
then `motion-icons-learning.js`. The 13 original recipes and their runtime are
unchanged; this file adds 12 subjects.

| Subject | Object | Rest poses | One-shot actions | Ongoing / driven |
| --- | --- | --- | --- | --- |
| lookup | Page and attached magnifying lens | idle | tap, found, empty, fail | searching |
| lexicon | Word card sliding into a book | empty, saved | tap, save, reopen, fail | saving |
| daylight | Sun outline morphing into a crescent | idle, selected, night, nightSelected | tap, peek, select, selectNight, toNight, toDay | — |
| cards | A staggered word-card deck | idle, selected | tap, peek, select, remember, revisit | preparing |
| book | Closed cover unfolding around its spine | idle (closed), open, selected (open) | tap, peek, select, close, turn | — |
| capture | Folded paper with an attached plus | idle, selected | tap, peek, select, insert | — |
| conversation | Two bubbles with answering dots | idle, selected | tap, peek, select, reply | thinking |
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
`setPose` on the existing instance; the crescent and sun share one continuous
outline. The gallery also exposes `toNight` / `toDay` as replayable transitions.
Never recreate the host or flash the day pose during a dark-mode selection.

Book rests closed until hover, keyboard focus or selection opens it. Pointer
leave restores its navigation pose; selected books remain open. `close` explicitly
returns to the closed cover, and `turn` keeps the page attached to its spine.

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
