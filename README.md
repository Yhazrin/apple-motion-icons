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

```html
<script src="assets/motion-icons.js"></script>
<script src="assets/motion-icons-recipes.js"></script>
<script src="assets/motion-icons-learning.js"></script>
<script src="assets/motion-icons-catalog.js"></script>
<div id="word-receipt" aria-hidden="true"></div>
<script>
  const receipt = MotionIcon.create(document.querySelector('#word-receipt'),
    'lexicon', {size: 28, pose: 'empty'});
  // Trigger this after your actual storage operation succeeds:
  receipt.play('save');
</script>
```

Colour inherits `currentColor`. Use a semantic button and a native/text label;
the icon supplies motion rather than replacing controls.

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
