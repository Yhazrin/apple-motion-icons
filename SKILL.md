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

1. For the complete current library, use the single-file build
   (`node scripts/build.mjs` → `dist/motion-icons.js` / `.mjs`, which also
   registers `<motion-icon>`), or copy the seven runtime files in order:
   `motion-icons.js`, `motion-icons-recipes.js`, `motion-icons-learning.js`,
   `motion-icons-catalog.js`, `motion-icons-refinements.js`,
   `motion-icons-semantics.js`, `motion-icons-signature.js`. The last three
   carry the colour, occlusion and Apple spring rules. Put project recipes after
   them; `MotionIcon.define` still routes them through the contract.
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
3. **Apple damping, not decoration.** Arrivals are critically damped
   (`smooth`) or nearly so (`snappy`). One action may carry *one* emphasis with
   `bouncy` (ζ .72, ≈ 4 % overshoot). Only free parts (clapper, tag) swing; only
   errors shake. Opacity, colour, strokes and pose changes never overshoot. The
   contract layer raises any inline spring below ζ 0.7; do not fight it.
4. **Squash on contact, about the contact point.** `aroundXY(1 + (1-k)*.4, k,
   cx, contactY)`, k ≈ .86–.92 with `quick`, then back with `bouncy`. Attached
   parts move with it. This is the SF bounce; the shared `bounce` effect does it.
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
10. **Errors are the subject refusing.** Show a blocked door, stuck paper or
    dimmed signal, with semantic error colour. Choose one refusal movement; do
    not automatically add a second whole-icon shake. A dedicated error subject
    may use a cross; other subjects keep their own identity.
11. **Calm loops.** ≤ 1.4 Hz for waiting (bob, breathe, ripple), up to
    ~2.2 Hz only for literal activity (ringing, sound). Small amplitude.
12. **Stay readable, use semantic colour.** Neutral ink describes the object;
    colour describes a meaningful state. Blue for an enabled connection, green
    for charging/verified/allowed, amber for saved favourites/warnings, red for
    recording/low battery/errors. Do not withhold colour when it makes the state
    easier to understand. Keep the rest neutral; no decorative rainbow or glow.
13. **Exact rest, reduced motion.** After every action the icon springs back to
    exactly its pose values (the engine does this). With
    `prefers-reduced-motion` springs jump and loops do not run.

### Springs (only springs; no CSS transitions or fixed easing for motion)

Values after `motion-icons-signature.js` (the engine file keeps its original
numbers; the contract retunes them at load). SwiftUI equivalents in brackets.

| preset | ζ | use |
|---|---|---|
| `smooth` | 1.0 | state changes, morphs, colour, strokes [`.smooth`, response .42 s] |
| `snappy` | .86 | direct response: taps, slides, hands that jump [`.snappy`, .3 s] |
| `bouncy` | .72 | the single emphasis of an action [`.bouncy`, .4 s] |
| `quick` → `bouncy` | 1.0 → .72 | compress-in, then release (SF bounce) |
| `glide` | 1.0 | long travel, large rotations, returning to the nearest equivalent angle |
| `snap` | .82 | mechanical contact |
| `pop` | .72 | legacy emphasis (now the same overshoot as `bouncy`) |
| `impact` → `rebound` | .86 → .72 | legacy squash pair |
| `gentle` / `slow` | .86 / .85 | morphs, rotations |
| `settle` | .88 | return to the pose (engine) |
| `swing` | .30 | free pendulums only: bell clapper, hanging tag |
| `track` | 1.0 | following a finger, slider or progress value |
| `draw` / `fade` / `exit` | .85 / .87 / 1.0 | strokes, opacity, leaving |
| `shake` | .38 | errors only |

Custom springs: `MotionIcon.apple.spring(response, dampingFraction)`.

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

Keep unless the user agrees otherwise: the `SPRINGS` presets and the ζ 0.7
floor of the Apple contract, 480 Hz
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


## Restrained motion refinement layer

Load `assets/motion-icons-refinements.js` after engine, built-ins,
learning and catalog. It registers updated product recipes under the same 87
names; it is not an engine fork. The upstream engine and built-in source stay
byte-identical. Standalone integrations must copy this fifth runtime asset too, then `motion-icons-semantics.js` and `motion-icons-signature.js`.
The Vord host and gallery load it automatically.

Updated authoring rules take precedence over the older overshoot examples above:
- One meaningful contact/release accent per one-shot. Mechanical hinges use
  `gentle`/`snap`; free pendulums may use `swing`.
- Opacity and stroke progress use `fade`/`draw`. Never animate them with `pop`.
- Do not finish a semantic action with whole-icon compression.
- A tap previews one subject-specific mechanism. Keep it shorter than a full
  action; do not apply a common shrink to every subject.
- Squash is area-preserving and anchored at the local contact. Default to flat
  motion: path changes, translation and ordinary 2D rotation. Use a perspective
  flip only when seeing a real opposite face matters (pay card or turning book
  page). Copying, connecting, recording, switching a camera and changing an AI
  state do not justify turning the subject edge-on.
- Distinguish visual quality from deterministic rest checks. Passing the frame
  checker does not establish an amplitude floor or a library-wide overshoot rate.

The four local geometry tools and action-by-action changes are documented in
[reference/refinements.md](reference/refinements.md). The prior audit remains in
`review/motion-audit.json` as a baseline, not evidence for the new recipes.

## Semantic colour, foreground and background

Choose a colour-bearing part at the vocabulary stage, not after drawing motion.
Every recipe must answer: what changes colour, what state does it express, and
what shape/position/label still explains that state without colour?

- An enabled Bluetooth rune is blue; connected also has a dot. An off rune uses
  a neutral slash. A saved star/bookmark is filled and coloured; unsaved is an outline.
- Charging is green **with** a lightning bolt; low battery is red **with** a short
  level. Keep the battery outline neutral. Cut space out of the level behind the
  bolt instead of merging two same-coloured shapes.
- Use `--mi-connected`, `--mi-success`, `--mi-favourite`, `--mi-warning`,
  `--mi-recording`, plus the existing `--mi-error`, `--mi-heart`, `--mi-badge`.
  The refinement palette adapts to system appearance or `html[data-theme]`.
  Host themes may override these variables. Use `data-mi-color="mono"` for an
  explicitly monochrome integration; forced-colours uses inherited system ink.
- Colour is derived from animated state in `render`, so pose changes, scrubbing,
  interruptions, direct `setPose` and reduced motion all remain consistent.
  Do not colour only in an action callback. Error tint takes precedence.
- Decide back-to-front order before authoring the SVG. An inserted letter/card
  sits behind the front pocket; the front wall hides the inserted portion. A
  foreground page hides rear page strokes. Question-cover and answer text must
  not be simultaneously legible through each other.
- On transparent hosts, use real masks/clips, never white rectangles pretending
  to be occlusion. Keep stationary clips outside moving groups. Mask geometry
  must follow the **final** foreground transform, not an earlier render pass.
- Mask/clip IDs must be unique per instance and per captured frame. Separate
  SVG images must never borrow another icon's or another sample's live defs.
- Inspect one representative crossing/insert and the meaningful coloured poses
  at the intended size. Rest checks alone cannot establish correct layering.

## One-click review export

Use **导出审阅 ZIP** in the live gallery. It samples all 87 subjects and their public semantic actions, regardless
of the current filter/search, using the same virtual 120 Hz clock as the frame
board. The export keeps the chosen light/dark appearance. Generation runs in an
isolated hidden frame; it does not mutate the user's visible icon selection.

The ZIP contains:
- `sheets/`: each PNG combines up to 10 complete action sequences.
- `sequences/001/`, etc.: a separate PNG per sequence, grouped 10 per directory.
- `manifest.json`: action names, actual frame times, final rest result, appearance
  and published release identity when available.
- `README.txt`: sharing guidance and sampling limits.

These are labelled key-frame images (one-shot samples at 0, 50, 120, 200, 300,
450, 650 and 900 ms; loops/drives have their own labels). They are not every
rendered frame or a new overshoot audit. Paint is frozen from computed styles
at capture time; clips and masks are copied into each independent SVG image.
The browser rasterises PNGs and writes a standard ZIP locally, with no upload,
third-party renderer or dependency/CDN. Copy `scripts/export-review.js` together
with `scripts/capture-frames.js` when distributing the gallery.

## Meaning before motion: current semantic quality pass

Load `assets/motion-icons-semantics.js` **last**. It replaces ambiguous product
recipes and keeps the same 87 registered subjects, spring engine and existing
verb names. It adds result poses where the old vocabulary lost a business result.
See [reference/semantics.md](reference/semantics.md) for the exact changed contracts.

Before tuning a spring, answer these five questions:
1. Can the subject be identified without its name? A handset needs earpiece,
   mouthpiece and a curved grip; a fingerprint needs irregular ridges and loops.
2. What is sent, changed, consumed or produced? Identify the source, path and
   destination. Executing code produces output; a tool call moves a request
   card out and a result card back. A generic spin does not explain either.
3. Are sibling verbs distinct? Separate locate/repair, request/grant, copy/paste
   and join/camera-off. Do not give them the same movement with different labels.
4. What survives at rest? Loaded cart, received letter, torn receipt, verified
   code and generated object need persistent result poses. A temporary preview
   may return home; a completed business action must retain its outcome.
5. Does the transition preserve causality? Put paper behind the pocket front,
   keep a phone outline when its code expires, and freeze a clock at its current
   hand angles on pause. Do not reconstruct completed work when settling.

- `tap`/`press` may remain internal API feedback. Mark them `internal:true`; do
  not invent or display a second product verb just to fill a catalogue. Primary
  gallery controls and the default review ZIP omit internal feedback. Add
  `?feedback=1` to the gallery URL to include it in the ZIP.
- Derive approval colour from an approval state, never from the knob's temporary
  position during a request. Colour supports an outcome; it is not the outcome.
- When an action declares `pose`, the engine applies it **before** `run`. Never
  inspect `c.pose` to infer the prior state inside that run. Use current numeric
  state or explicit `from`. For a paused continuous value use `setGoal` to retain
  the current value; resetting/starting a new operation must clear that override.
- Isolated frame captures use fresh instances per sequence and disable CSS colour
  transitions. This prevents driven goals or an in-flight colour fade from leaking
  into another sequence. Product state continuity still needs a focused live chain;
  isolated capture cannot prove cancellation/retry behavior.

Human visual review may score subject recognition, action meaning, sibling
separation, continuity and final-state correctness (1–5 each). A suggested
review threshold is 21/25 and no dimension below 3; never auto-award these scores
from motion distance, rest checks or a screenshot export. Blind interpretation
and 16/24 px readability are design evidence, not numerical spring tests.

## Apple motion contract and signature layer

Load `assets/motion-icons-signature.js` **seventh**, after semantics (the
single-file build already does). It is the final authority on motion feel:

- Retunes the named presets to Apple damping and adds `smooth`, `snappy`,
  `bouncy`, `quick` and `glide` (table above). Every action's `c.to` passes
  through a governor: an inline spring below ζ 0.7 is raised to 0.7 and counted
  in `MotionIcon.apple.audit` (`clamped`, per-subject `subjects`). The frame
  checker header prints the count; treat a rising count as a review prompt.
- Wraps every glyph in a `data-part="mi-fx"` group and adds SF Symbols-style
  effects to subjects that lack a verb of the same name: `bounce` (squash at the
  baseline, release with `bouncy`), `wiggle` (8°, −6°, 3°, then rest) and
  `breathe` (loop, ±5 % at 0.5 Hz). The effect state keys `fxX, fxY, fxRot,
  fxScale, fxSquash` are reserved. Catalog subjects use `bounce` as their tap.
- Redraws 16 subjects that did not read at rest (see README). Their verb and pose
  names are kept; new loops are `ai-generating.generating` and `ai-writing.typing`.

When authoring under the contract: decide the one moment that deserves
emphasis, use `bouncy` there and `smooth`/`snappy` everywhere else. Express
"liveliness" with causality (a hand that coasts to a stop, sand that keeps
flowing, a token that travels to its receiver), not with extra oscillation.
[reference/apple-motion.md](reference/apple-motion.md) lists the vocabulary of
each redrawn subject and the SwiftUI mapping.
