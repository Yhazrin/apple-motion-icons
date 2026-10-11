# Learning and capture motion vocabulary

The collection is additive: load `motion-icons.js`, `motion-icons-recipes.js`,
then `motion-icons-learning.js`. The 13 original recipes and their runtime are
unchanged; this file adds 12 subjects.

| Subject | Object | Rest poses | One-shot actions | Ongoing / driven |
| --- | --- | --- | --- | --- |
| lookup | Page and attached magnifying lens | idle | tap, found, empty, fail | searching |
| lexicon | Word card sliding into a book | empty, saved | tap, save, reopen, fail | saving |
| daylight | Sun with attached rays | idle, selected | tap, peek, select | — |
| cards | A staggered word-card deck | idle, selected | tap, peek, select, remember, revisit | preparing |
| book | Open book, page hinged at its spine | idle, selected | tap, peek, select, turn | — |
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
button.addEventListener('pointerenter', () => icon.play('peek'));
button.addEventListener('pointerleave', () => icon.stop());
button.addEventListener('click', () => icon.play('select'));
// When another section becomes active:
icon.setPose('idle');
```

Keep the selected pose when the pointer leaves. Keyboard activation must trigger
the same selection change, and the button owns focus and `aria-current`.

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
