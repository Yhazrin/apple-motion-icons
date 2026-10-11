---
name: apple-motion-icons
description: Design and implement Apple-style animated SVG icons of any kind (pay, refresh, enter/login, download, send, delete, like, menu, bell, play/pause, volume, eye, lock, …). Each icon gets its own motion vocabulary — poses, one-shot actions, loops and finger/progress-driven motion — built on spring physics at the display refresh rate with SF-Symbols-like strokes. Use when the user wants animated, rounded, high-frame-rate, "Apple-like" or "Face ID-like" icons, icon micro-interactions for any product action, or wants to turn a static icon into a motion icon. Success/fail confirmation and the frosted Face ID panel are optional adapters, not the goal.
---

# Apple-style motion icons

A dependency-free engine (`assets/motion-icons.js`) plus a library of icon
recipes (`assets/motion-icons-recipes.js`). The engine owns springs, timing,
stroke weight, cancellation and the return to rest; a recipe describes one
subject: its glyph, the states it can rest in and everything that can happen
to it. New icons are new recipes, never engine forks.

## The core idea: design the subject's vocabulary, not a status

An icon is a small physical object. Before drawing any motion, list what that
object *does* in the product. Every action the user names gets its own motion
that follows from the object's physics; nothing is forced into
"loading → success / fail".

| part of the vocabulary | what it is | examples |
|---|---|---|
| **pose** | a stable state the icon rests in, shown until something changes it | heart off / on, lock unlocked / locked, menu / close / back, bell normal / unread / muted |
| **action** | a one-shot journey, either within a pose or from one pose to another | bell rings, card flips, trash swallows a file, arrow knocks on a door, plane is sent and a new one glides in |
| **loop** | ongoing activity until stopped, optionally exiting through an action | refresh spins and coasts out, heart beats, speaker sounds, bell keeps ringing |
| **drive** | follows a continuous input 0..1 (finger, slider, progress) | pull-to-refresh winds the arc, volume level fills the waves, download bar fills |
| task adapter (optional) | maps an async request onto the icon's own actions | `pay: busy → waiting, success → approve, fail → decline` |

Ask, for each icon:
1. What is the subject and which part of it carries the meaning? (the arrow,
   the lid, the shackle, the card)
2. Which states can it be in? → poses.
3. Which verbs happen to it in this product, including odd ones (undo, cancel,
   knock, peek, flip, snooze, skip)? → actions. Each verb answers "what would
   this object physically do?".
4. Is there anything that lasts? → loops. Anything the user scrubs? → drives.
5. Only then: does an async request need success/failure feedback? → `task`.

[reference/vocabulary.md](reference/vocabulary.md) lists full vocabularies for
~50 common icons. Use it to diverge, not to copy one row.

Explore the [live icon gallery](https://skills.yhazrin.xyz/motion-icons/) for visual review; the local
`assets/gallery.html` is the same catalogue and supports `?frames`.

## Quick start

1. Copy `assets/motion-icons.js` and `assets/motion-icons-recipes.js` into the
   project (keep the load order). Put project recipes in a third file.
2. Use it:

```js
const bell = MotionIcon.create(el, 'bell', {size: 24});
bell.play('ring');                 // one-shot action → promise
bell.play('notify');               // action that changes the pose to "unread"
bell.play('ringing'); bell.stop(); // loop, until stopped
refresh.drive('pull', 0.6);        // follow a gesture; then refresh.play('spin')
heart.toggle();                    // like ↔ unlike
icon.tap();                        // press feedback
icon.setPose('muted', {instant: true});

pay.busy(); await request(); pay.success();   // optional task adapter
const hud = MotionIcon.hud('lock');            // optional frosted panel
```

Options: `size` (px or CSS length, default `--mi-size` = 24px), `weight`
(`light | regular | medium | semibold | bold` or a number), `pose` (initial),
`frame` (Face ID brackets), `task` (override the mapping), `timing`,
`autoReset`. Colour comes from CSS `color`; `data-pose` on the element lets CSS
colour a pose. Events on `icon.element`: `mi:action`, `mi:end`, `mi:pose`,
`mi:resolve`, `mi:done`, `mi:rest`.

## Motion principles

These hold for every action of every icon. The engine enforces the mechanics;
the recipe has to follow the rest.

1. **Physical metaphor.** Each action is something the object could really do:
   a pendulum swings, a lid slams, a card flips edge-on, a pupil darts. If you
   cannot say it in three words, the action is not designed yet.
2. **Anticipation for big moves.** 4–6 units (or 4–6°) the other way for
   90–110 ms before launches, drops and spins. Skip it for small taps.
3. **Overshoot and follow-through.** Things arrive with a little extra
   (`pop`, `rebound`) and settle; free parts (clapper, tag, wave) keep moving
   after the main body stops.
4. **Squash on contact, about the contact point.** `aroundXY(1 + (1-k)*.4, k,
   cx, contactY)`, k ≈ .86–.92, then `rebound`. Attached parts move with it.
5. **Secondary motion lags.** A dependent part starts 30–60 ms later or with
   opposite velocity (bell clapper, trailing waves, second menu line).
6. **Never break velocity.** A new target on a moving value inherits its speed.
   Loops that rotate call `setVelocity`, so `finish` coasts into a whole turn.
7. **Stagger, don't synchronise.** Sub-parts 60–120 ms apart.
8. **Exits and re-entries.** Anything that leaves (plane, arrow, file) fades
   out before ~40 units, then re-enters from the opposite side or from scale .6
   while invisible, so the icon is always ready again.
9. **Pose-aware actions.** The same verb looks different in different poses
   (a locked shackle that is denied stays stuck; an unlocked one bounces back
   up). Read `c.pose` / `c.goal(key)` instead of hard-coding rest values.
10. **Errors are the subject refusing.** Bounce off the door, get stuck, nose
    dive, dim the waves — plus the engine's red tint and damped shake. Never
    draw a cross for an error.
11. **Calm loops.** ≤ 1.4 Hz for waiting (bob, breathe, ripple), up to
    ~2.2 Hz only for literal activity (ringing, sound). Small amplitude.
12. **Stay in the box, quiet colour.** Motion within ~10 units of the live
    area. One ink (`currentColor`), red only for errors, one accent only for a
    meaningful pose (liked heart, unread badge). No gradients, glows, shadows.
13. **Exact rest, reduced motion.** After every action the icon springs back to
    exactly its pose values (the engine does this). With
    `prefers-reduced-motion` springs jump and loops do not run.

### Springs (only springs; no CSS transitions or fixed easing for motion)

| preset | ζ | use |
|---|---|---|
| `snap` | .60 | mechanical contact, fast moves with a small rebound |
| `pop` | .39 | emphasis, deliberate overshoot |
| `impact` → `rebound` | .58 → .34 | squash on contact, then spring back |
| `gentle` | .86 | morphs, scale changes |
| `slow` | .85 | large rotations |
| `settle` | .75 | return to the pose (engine) |
| `swing` | .19 | free pendulums: bells, tags, hanging things |
| `track` | 1.0 | following a finger, slider or progress value |
| `draw` / `fade` / `exit` | .85 / .87 / 1.0 | strokes, opacity, leaving |
| `shake` | .25 | errors only |

Timing: taps ≤ 250 ms, most actions 250–600 ms of visible motion, a
confirmation holds 900 ms (700 ms for errors). Task busy states show for at
least 600 ms.

## Visual rules

- 120 × 120 viewBox, centre (60, 60), live area 14–106.
- Strokes only, round caps and joins, inherited width. Never set
  `stroke-width`; the engine keeps on-screen thickness optically constant
  (4.6 % of size, ≥ 1.6 px) and scales by `weight`. Solid dots use `data-fill`;
  filled shapes use `style="fill:currentColor"` (or a pose accent variable).
- Rounded rects (rx ≈ 20 % of the short side), circular arcs, straight
  segments; open chevrons ~16 units per leg.
- Smallest size 16 px; use `weight: 'semibold'` inside text buttons.

## Built-in icons

| icon | poses | actions | loops | drives |
|---|---|---|---|---|
| `lock` | unlocked, locked | lock, unlock, jiggle, deny | — | — |
| `refresh` | — | tap, finish, complete, error | spin (exits via finish) | pull |
| `pay` | front, back | tap, contactless, flip, approve, decline | waiting | — |
| `enter` | — | tap, knock, enter, denied | waiting | — |
| `download` | — | tap, complete, cancel, fail | downloading | progress |
| `send` | — | tap, send, undo, fail | hover | — |
| `delete` | closed, open | tap, open, close, trash, restore, fail | hover | — |
| `heart` | off, on | like, unlike | beat | — |
| `menu` | menu, close, back | toClose, toMenu, toBack | — | — |
| `bell` | normal, unread, muted | tap, ring, notify, read, mute, unmute | ringing | — |
| `play` | paused, playing | play, pause, skip | — | — |
| `volume` | on, muted | tap, mute, unmute | sound | level |
| `eye` | visible, hidden | blink, look, focus, hide, show | — | — |

Every icon also has the generic `press`, `pulse`, `progress`, `confirm` and
`fail`, which a recipe may override.

## Learning, capture and navigation collection

Load `assets/motion-icons-learning.js` after the engine and built-ins for 14
additional subjects: `lookup`, `lexicon`, `daylight`, `cards`, `book`, `plus`,
`conversation`, `settings`, `sentence`, `memory`, `pencil`, `voice`, `recall` and `milestone`.
Use [reference/learning.md](reference/learning.md) to choose verbs and integration
patterns; [examples/workflows.html](examples/workflows.html) demonstrates real
controls with local simulated async operations. Do not put a loading loop on a
navigation icon: play `peek` on hover, `select` on activation, and keep its
`idle` or `selected` pose while resting. `plus` is the exception: hover plays
`tap`, activation plays `add`, and the resting pose stays `idle`. Only `confirm`
morphs the two strokes into a check. Native integrations can start from
[examples/MotionIconView.swift](examples/MotionIconView.swift) and
`assets/motion-icon-host.html`.

## Catalog collection

Load `assets/motion-icons-catalog.js` after `motion-icons-learning.js`. These 60
subjects are implemented and registered only with `MotionIcon.define()`:

`wifi`, `bluetooth`, `cloud`, `sync`, `upload`, `battery`, `power`, `search`,
`link`, `cellular`, `hotspot`, `usb`, `server`, `brightness`, `storage`,
`check`, `warning`, `error`, `loading`, `hourglass`, `clock`, `folder`, `copy`,
`bookmark`, `printer`, `archive`, `clipboard`, `filter`, `sort`, `mail`,
`phone`, `video-call`, `share`, `qr-scan`, `wallet`, `cart`, `calendar`,
`receipt`, `gift`, `star`, `shield`, `key`, `passcode`, `two-factor`,
`permission`, `secure-connection`, `camera`, `screen-recording`, `face-id`,
`fingerprint`, `ai-thinking`, `ai-browsing`, `ai-reading`, `ai-writing`,
`ai-coding`, `ai-tool-call`, `ai-agent`, `ai-handoff`, `ai-generating`,
`ai-queue`.

Poses, actions, loops and drives are listed in
[reference/catalog.md](reference/catalog.md). Keep these boundaries:
`search` is a magnifying glass, not `lookup` (a page with a lens); `sync` is
two opposing arrows, not `refresh`; `loading` is a capsule sliding in a track,
not `refresh`; `check` draws its own stroke and is not `plus` or the engine
overlay; `star` is not `heart`; `folder` hinges a lid and is not `book`.
`face-id` and `fingerprint` are drawings, not a biometric result.

## Workflow for a new icon

1. Write the vocabulary (principle list above, vocabulary.md for ideas). Ask
   the user only if the product's verbs are unclear; otherwise include the
   obvious ones plus one or two that make the object feel alive (peek, wiggle,
   undo).
2. Draw the glyph on the 120 grid; each independently moving piece is its own
   `data-part`.
3. `state`: every animated value at its default; `poses`: overrides per pose;
   wrapping rotations in `periodic`.
4. `render(s, parts, util)`: pure, attributes only, clamps opacity.
5. Write actions / loops / drives from the closest built-in icon, following
   [reference/authoring.md](reference/authoring.md).
6. Optionally map `task` and `toggle`.
7. Open `assets/gallery.html?frames` (served over HTTP) and check the sheet.

## API

- `MotionIcon.create(container, name, options)` →
  `{element, name, pose, mode, action, idle, poses, actions, play(action, arg),
  stop(), drive(action, v), toggle(), tap(), setPose(p, {instant}), busy(),
  progress(p), success(), fail(), reset({instant, pose}), values(), goal(),
  destroy()}`.
- `MotionIcon.hud(name, {labels, pose, task, container, className})` →
  `{element, icon, busy(labels?), progress(p), success(), fail(), dismiss(),
  destroy()}`. Example: unlock HUD = `hud('lock', {pose: 'locked', task:
  {success: ['unlock', 'confirm'], fail: 'deny'}})`.
- `MotionIcon.define(name, recipe)`; `SPRINGS`, `TIMING`, `util`.

## What may change and what may not

Free per project: glyph geometry, the vocabulary (add, rename, drop actions),
amplitudes within the principles, a recipe's own spring choices, size, weight,
colours via CSS variables (`--mi-error`, `--mi-heart`, `--mi-badge`,
`--mi-hud-*`), labels, `timing`.

Keep unless the user agrees otherwise: the `SPRINGS` presets, 480 Hz
sub-stepping and dt clamp, the run-token cancellation (`alive()`), the settle
back to the pose, optical stroke weight, reduced-motion handling. These make
every icon feel like the same family.

## Verification

`gallery.html?frames` runs on a virtual 120 Hz clock
(`scripts/capture-frames.js`), so it is deterministic even in a throttled tab.
For every icon it plays each action (from its `from` pose), each loop (then
`stop()`), each drive (0 → 1, then `stop()`) and the task adapter if mapped,
lays out key frames and checks: no NaN in the DOM, the declared pose is
reached, and the icon comes to rest at exactly its pose values, without the
error colour, within 4 s. The header shows `全部 N 项通过` or the failures;
`window.__motionIconFrames` resolves to the same report. Serve the skill folder
over HTTP (`python3 -m http.server`) because the page loads `../scripts/`.

Also look at the sheet: each action's key frame must read clearly at 60 px,
and nothing may poke far outside the icon box.

## Native macOS integration in Codex

For an existing SwiftUI/AppKit application, keep its native controls, focus and accessibility labels. Host the original engine in a small transparent WKWebView when reusing its recipes; do not translate or fork the spring engine just to match the UI framework. A native bridge sends only the icon name, action, appearance and an event token, never application content or credentials. Stop loops when their host is hidden or removed; do not delay the underlying operation for an animation. Keep status words in native UI.

Copy runtime assets into the application bundle, with project-specific recipes in a third file. Preserve the source engine and built-in recipes byte-for-byte. Extend the gallery with that third file and run its existing frames checker for project recipes as well as built-ins.
