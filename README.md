# apple-motion-icons

Apple-inspired SVG motion icons with spring physics and a vocabulary for each
object. A Codex / Cursor skill and a dependency-free browser library.

**[Live gallery →](https://skills.yhazrin.xyz/motion-icons/)** — play every icon action, search by use, change size and appearance. The gallery follows the public `main` branch; published changes are checked about every five minutes.

**87 subjects:** 13 general-purpose icons, 14 learning, capture and navigation
icons, and 60 catalog icons (system, status, files, communication, security and
AI). Hover, selection, lookup, card insertion, recall, page-turning, writing and
scene binding have their own movements. Motion stops when the object is at rest.

![Workflow examples](examples/workflows-preview.jpg)

## Use the skill

Clone this repository as `apple-motion-icons` into your agent's skill directory:

```sh
git clone https://github.com/Yhazrin/apple-motion-icons.git ~/.codex/skills/apple-motion-icons
# For Cursor, use ~/.cursor/skills/apple-motion-icons instead.
```

If the directory already exists, update or back it up before cloning. Ask your
agent to use `$apple-motion-icons` to implement the interaction you need.

## Use the library

One file, no dependencies. `npm run build` (or `npm pack`) writes
`dist/motion-icons.js` (classic script / CommonJS) and `dist/motion-icons.mjs`
(ES module); both contain all seven runtime layers and the `<motion-icon>` element.

```html
<script src="dist/motion-icons.js"></script>

<button type="button" aria-label="通知">
  <motion-icon name="bell" size="22" action="ring"></motion-icon>
</button>
<motion-icon name="heart" action="toggle" label="喜欢"></motion-icon>
<motion-icon name="refresh" trigger="hover" action="spin"></motion-icon>
```

```js
import MotionIcon from 'apple-motion-icons';      // undefined during SSR; use on the client

const receipt = MotionIcon.create(document.querySelector('#word-receipt'),
  'lexicon', {size: 28, pose: 'empty'});
// Trigger this after your actual storage operation succeeds:
receipt.play('save');
```

`<motion-icon>` attributes: `name`, `size`, `pose`, `weight`, `trigger`
(`tap` default, `hover`, `none`), `action` (verb to play; `toggle` uses the
recipe's pair; default is the `bounce` effect) and `label` (accessible name; the
icon is decorative without it). It renders in light DOM, follows page `color`
and destroys its instance when removed. Types ship in `types/motion-icons.d.ts`.

Without a build step, load the layers in this order:
`motion-icons.js`, `motion-icons-recipes.js`, `motion-icons-learning.js`,
`motion-icons-catalog.js`, `motion-icons-refinements.js`,
`motion-icons-semantics.js`, `motion-icons-signature.js`, then optionally
`motion-icon-element.js`.

Colour inherits `currentColor`. Use a semantic button and a native/text label;
the icon supplies motion rather than replacing controls.

## Apple motion contract

Springs follow SwiftUI's model (response, damping fraction), not decorative
bounce. `motion-icons-signature.js` holds the whole library to it:

- Named presets are retuned to ζ ≥ 0.72; new `smooth` (ζ 1), `snappy` (.86),
  `bouncy` (.72), `quick` and `glide` mirror SwiftUI's `.smooth / .snappy / .bouncy`.
- Any inline spring a recipe requests below ζ 0.7 is raised to 0.7 and counted in
  `MotionIcon.apple.audit` (the frame checker prints the count).
- `swing` (ζ .3, free pendulums such as a bell clapper) and `shake` (ζ .38, errors
  only) are the two deliberate exceptions, as in SF Symbols' wiggle.
- At most one emphasis per action; state changes, colour and strokes never bounce.

`MotionIcon.apple.spring(response, dampingFraction)` converts SwiftUI values for
your own recipes. Every subject also gets SF Symbols-style **bounce**, **wiggle**
and **breathe** effects unless it defines its own verb with that name. See
[reference/apple-motion.md](reference/apple-motion.md).

## Explore examples

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

- `http://127.0.0.1:8080/assets/gallery.html` — all poses, verbs, loops and drives.
- `http://127.0.0.1:8080/examples/workflows.html` — navigation, cancellable lookup,
  capture, generated sentence/scene feedback and driven progress with local fixtures.
- `http://127.0.0.1:8080/assets/gallery.html?frames` — deterministic 120 Hz key-frame
  sheet, exact-rest/pose/error checks; no package dependencies or build step.
- [Native SwiftUI adapter](examples/MotionIconView.swift) — transparent, decorative
  WKWebViews, native focus/accessibility, lifecycle cleanup and event replay.
- [Learning vocabulary](reference/learning.md) — the 14 added subjects and their verbs.
- [Catalog vocabulary](reference/catalog.md) — the 60 catalog subjects and their verbs.
- [Recipe authoring](reference/authoring.md) — extension rules and spring choices.

The runtime retains its 480 Hz spring integration, display-refresh rendering,
run-token cancellation, optical stroke weight and reduced-motion support.
Add new subjects in a recipe file; do not fork the animator for a new icon.

## Maintain the collection

[Publishing and maintenance](docs/MAINTENANCE.md) covers the source-of-truth rules,
static deployment, version checks, adding subjects and rollback.
[Cursor maintenance prompt](docs/CURSOR_PROMPT.md) is ready to paste into an agent.
Recipe changes become gallery cards automatically; declare a subject’s catalogue
label and actual product usage before publishing.

## Catalog refinement

The catalog uses quieter press feedback and object-specific travel. Plug/port
contact, inserted-key rotation, attached shield marks, connected thinking nodes,
clipped browser content, forward paper feed, filter particles, line-by-line
reading, bracket repair, task handoff, staggered generation and persistent queue
states are described in [the catalog vocabulary](reference/catalog.md).

The existing frame checker reports **496 checks passed** for this revision. This
checks numerical state and rest; visual review remains a separate design judgment.
The engine and 13 original recipes remain byte-for-byte unchanged.


### Restrained motion recipes

The gallery now loads `assets/motion-icons-refinements.js` last. It gives all 87
subjects quieter, component-specific motions while preserving the engine and
upstream recipe hashes. Copy this asset when embedding the full collection.
See [refinement notes](reference/refinements.md) and the preserved
[baseline plan](review/improvement-plan.md). Frame checks establish rest and pose
correctness; they do not replace judging the motion at actual icon sizes.

### Colour and review delivery

Connected Bluetooth/Wi-Fi, charging/low battery and saved favourites now carry
semantic colour alongside distinct geometry. Most subjects stay planar; inserted
paper and stacked cards have true transparent occlusion. See the authoring rules
in [SKILL.md](SKILL.md#semantic-colour-foreground-and-background).

On the [gallery](https://skills.yhazrin.xyz/motion-icons/), click **导出审阅 ZIP**
to download all action sequences as PNGs, with 10 sequences per overview sheet
and 10 separate images per folder. The package includes labels, timestamps and
a manifest. Export is local to the browser and follows the selected theme.

### Semantic quality pass

Load `assets/motion-icons-semantics.js` sixth, before the signature layer. It
redraws ambiguous subjects and preserves business outcomes: loaded cart, matched
code, torn receipt and generated object. See [the changed contracts](reference/semantics.md).
Internal tap/press feedback remains callable but is omitted from main gallery
controls and default ZIP; use `gallery.html?feedback=1` to include it.

### Signature redraws

`assets/motion-icons-signature.js` loads seventh, after semantics. Besides the
contract above, it redraws 16 subjects that were hard to recognise at rest:
`clock`, `hourglass`, `filter`, `sort`, `receipt`, `key`, `usb`, `two-factor`,
`secure-connection`, `screen-recording`, `ai-generating`, `ai-tool-call`,
`ai-handoff`, `ai-writing`, `ai-queue` and `ai-agent`. Existing verb and pose
names are kept. Two loops are new (`ai-generating.generating`, `ai-writing.typing`),
and `ai-writing.finish` now rests at `idle` instead of `writing`.
