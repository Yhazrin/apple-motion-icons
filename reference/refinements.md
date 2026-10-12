# Restrained motion recipes

Load order: motion-icons.js → motion-icons-recipes.js → motion-icons-learning.js
→ motion-icons-catalog.js → motion-icons-refinements.js.

The last file supplies editable product versions of the 13 immutable upstream
recipes and per-subject geometry/action refinements. All 87 names, public verbs,
drives, task mappings and stop/cancellation behavior remain compatible. Each
recipe owns geometry; no spring preset or timing engine has changed.

## Four tools

1. Area-preserving squash uses reciprocal scales, at the contact point.
2. Horizontal hinges use cos(angle) and skewX, can cross 90°, and dim the inner face.
3. Vertical turns use cos(angle) and skewY, with attached parts following their
   parent. The camera shows a rear lens location when facing away.
4. Paths keep compatible command sequences; examples include bookmark notches,
   storage ripple, receipt tear, shield bulge, printer curl, Face ID smile, error
   retry, recording dot/pause, reading summary and writing alignment.

These are SVG planar perspective approximations, not a 3D renderer.

## Product mechanisms

- Tap: all 60 catalog subjects preview their own component. Wi-Fi arcs spread;
  plugs slide; clock hands step; paper feeds; sliders move; nodes send a signal.
- Contact: basket, queue slot and stamp react locally; the icon itself does not
  squeeze after completing its main action.
- Learning: cards spread/flip/shuffle, books open/turn, recall flaps hinge,
  sentence pens follow the line, memory frames turn, pencils leave ink.
- Cat: blinking uses damped lids; talking changes only the mouth; surprise
  stretches, shy tilts gently, sad ears droop; happy and pounce own contact squash.
- State: printer jam folds and empty queues retain their established poses.

## Review scope

`review/improvement-plan.md` and `motion-audit.json` describe baseline 6c33151.
They are preserved, not overwritten with estimates. This revision implements
motion cleanup and mechanisms; the rest checker confirms finite render state,
pose completion and exact settling only. Do not cite its pass count as proof that
all 451 actions meet every numerical amplitude/overshoot target. Gentle, small
social expressions and a tap's 30–40% preview need visual judgment.

## Delivery evidence · 2026-10-12

The final existing frame sheet reports **482/482 passing**. Original engine hash
is `03a6f9887b73eabfcc86651ad2238ac744f524b7933f82376e20c73985fbc85f`;
upstream built-in hash is `08da134ab8cb54a2c2d50716196f3ba3c18cf14fd5aeb081bf567da75b4b128c`.
Native Release bundle compilation succeeded. Vord, Codex skill and Cursor skill
copies include the same fifth refinement asset. No new test suite was added.

## Current follow-up: semantic colour and flat composition

The earlier perspective expansion above is superseded wherever it obscures
product meaning. Copy, link, camera, video-call, AI browser/agent/generation,
pencil, memory and milestone now use planar movement. Folder/archive/wallet/gift
open with a simple lift; mail uses a triangular path change. Calendar slides its
page; recall slides and fades its question cover. Cards lift instead of flipping.
Pay front/back and a genuine book-page turn retain their physical meaning.

The refinement layer also adds adaptive semantic colours and per-instance SVG
masks: rear cards are hidden behind front cards; inserted paper is hidden behind
pocket walls; the battery level leaves space for its charging bolt. Screenshot
snapshots receive independent defs IDs so they cannot borrow a live frame's mask.

The live gallery's review ZIP contains full per-action PNG strips and 10-strip
overviews. This replaces manual screenshot assembly; baseline audit JSON remains
the original baseline, not new numerical evidence.
