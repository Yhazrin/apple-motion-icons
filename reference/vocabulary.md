# Motion vocabularies for common icons

For each icon: the part that carries the meaning, its poses, and the actions,
loops and drives a product typically needs, each with the physical motion.
Units are viewBox units (icon = 120). "≈ built-in" names the recipe whose code
is closest. Pick the verbs your product actually uses and add your own; any
verb not listed still gets designed from the same question: what would this
object physically do?

## Payments and commerce

**Card / pay** — part: card, contactless waves. Poses: front, back. ≈ `pay`
- tap: nudges 6 toward the reader, tilt −4°
- contactless: moves to the reader, waves ripple out one by one (70 ms stagger)
- flip: scaleX 1 → −1 through edge-on, lifts 5 while turning, back shows stripe
- insert: slides down 18 into a slot line, slot squashes .9
- approve: taps reader, waves flash then fade, ring + check
- decline: waves dim to .25, card pulls back −6, red shake
- loop waiting: waves ripple at 1.4 Hz, card bobs 1.5

**Wallet** — part: flap, card. Poses: closed, open. ≈ `delete` lid + `download`
- open / close: flap hinges 30° about its fold, close with a slam
- add card: card drops into the pocket, wallet squash .9
- take out: card rises 20 with `pop`, fades, a new one is not needed

**Cart** — part: basket, wheels, item. Poses: empty, filled (badge). ≈ `download` + `bell` badge
- add: item drops in, basket squash .9, cart rolls 6 right and back, badge pops
- remove: item pops out up 14 and fades, badge shrinks
- checkout: cart rolls out right 40 with fade, a new cart rolls in from the left
- loop: wheels spin (dash rotation) while loading

**Gift** — part: lid, ribbon. Poses: closed, opened. ≈ `lock` + `heart` burst
- shake (anticipation): wobbles ±6° twice
- open: lid pops up 14 with tilt 10°, sparkle burst, pose opened
- loop: breathes 3 % at 1 Hz

**Receipt / invoice** — part: paper. ≈ `send`
- print: paper feeds down 18 in two steps (stagger 120 ms), tears off
- jam (error): stops after 6, red shake

**QR / scan** — part: corner brackets, scan line. ≈ `util.framePath`
- loop scanning: line sweeps top ↔ bottom at 1 Hz, brackets breathe
- found: brackets pinch to a rounded square, then check
- not found: line freezes, red shake

## Network and sync

**Refresh** — part: arc + arrowhead. ≈ `refresh`
- tap: −24° anticipation, one full turn
- drive pull: arc grows from 12 % to 83 %, winds −100° → 0, head appears at 75 %
- loop spin: ramps to 420 °/s, arc breathes; exit finish coasts to a whole turn
- complete: coast, arc closes into a ring, check only
- error: snaps back −30°, red shake

**Sync (two arrows)** — as refresh with `periodic {rot: 180}`; conflict: both
arrows bump into each other (−10° / +10°) and shake.

**Wi-Fi / signal** — part: arcs. Poses: off, weak, full. ≈ `volume` waves
- drive strength: arcs light up from the inside out (`level * 3 - i`)
- connect: arcs ripple outward then hold full
- lose signal: outer arcs fade one by one from the outside in
- loop searching: arcs pulse inside → outside at 1.2 Hz

**Upload** — part: arrow, tray. ≈ `download` mirrored, `send`
- tap: arrow up −8; loop: bob; drive progress: arrow rises, bar fills
- send: anticipation down 4, launches up 40 with fade, re-enters from below
- cancel: arrow drops back into the tray, bar drains

**Download** — ≈ `download`: drop 22 into the tray with squash, bar fills on
progress, cancel pops the arrow up and fades it, a new arrow falls in.

**Share** — part: arrow + box. ≈ `send` + `download` tray
- share: arrow launches out of the box, box squash .9
- copied link: arrow loops back into a chain-link morph (lerpPath), pop

**Send / paper plane** — ≈ `send`
- send: anticipation, flies 70 diagonally, fades; a new plane glides in
- undo: the plane flies back from where it went, wobbles −12° → 0
- schedule: plane tilts up 10° and hovers, a small clock badge pops
- loop hover: bobs 3, rolls 2°; fail: nose-dives 14°, red shake

**Mail** — part: flap, letter. Poses: closed, unread (badge). ≈ `delete` + `bell`
- receive: letter drops in from above, flap closes with a slam, badge pops
- open: flap hinges up 160° about the fold, letter rises 10
- archive: envelope drops 20 into a box line, squash

**Link** — part: two halves. Poses: linked, broken.
- link: halves slide together and overlap with `snap`, pop
- unlink: halves spring apart 10 and tilt ±12°

## Navigation and session

**Enter / sign in** — part: arrow, door. ≈ `enter`
- knock: arrow bumps the door twice, door squashes .92
- enter: door opens (scaleX .55 about its hinge), arrow passes 34 and fades,
  door slams, next arrow slides in
- denied: hits the closed door, bounces back with velocity, red shake
- loop waiting: arrow nudges 6 toward the door at 1.2 Hz

**Sign out** — mirrored enter: the arrow leaves through the open door to the
right; "are you sure" = the arrow peeks out 8 and returns.

**Open external ↗** — arrow moves 10 diagonally out of the box corner, box
squash; returning = arrow slides back in.

**Chevron / next / back** — tap: 4 in its direction; hold: repeated nudges
at 2 Hz; disabled: bump 2 and stop with `impact`.

**Home** — roof presses down 4 (squash about the base) on tap; return-home:
roof drops in from −14 with squash.

**Search** — part: lens, handle. ≈ `refresh` (orbit instead of spin)
- tap: lens tilts −10°
- loop searching: lens orbits a 4-unit circle at 1 Hz
- found: lens zooms 1.15 with `pop`; nothing found: lens shakes ±6°, no red

**Filter / sliders** — part: knobs on lines.
- adjust: knobs slide to new positions with 60 ms stagger
- drive: one knob follows the input, others react ±2 with lag
- reset: knobs return with `snap`

**Menu** — ≈ `menu`: to close (converge then rotate 45°), to back arrow
(lines morph into a chevron and shaft), back to menu (reverse, staggered).

**Close ×** — tap: rotates 90° with `pop`; dismiss: shrinks to .6 and fades
while rotating 45°.

## Content actions

**Delete / trash** — part: lid, can, file. Poses: closed, open. ≈ `delete`
- peek: lid lifts 16°; open / close: hinge 28°, close slams with can squash
- trash: file appears above, lid opens, file falls in and vanishes at the rim,
  lid slams, can squash
- restore: lid opens, file pops back out and floats away, lid shuts
- empty: can shakes ±4° three times, lid bounces −10° on each

**Archive / box** — lid opens, item drops in, lid closes; unarchive: item pops
out with tilt.

**Save / bookmark** — Poses: off, on.
- save: ribbon fills top-down (clip by scaleY about the top), squash .9,
  small drop 4
- unsave: fill drains bottom-up

**Copy** — part: two sheets.
- copy: front sheet slides 6 off the back one and back with `pop`
- duplicate: a third sheet slides out and fades

**Edit / pencil** — loop writing: tip draws a 6-unit squiggle (dash);
done: pencil lifts 6 and the line completes; erase: pencil flips 180° with
`gentle`, line shortens.

**Star / favourite** — Poses: off, on. ≈ `heart`
- favourite: squash .8, fill with `pop`, rotate 8° and back, 5-ray burst
- unfavourite: squash .9, fill drains

**Like / heart** — ≈ `heart`: like (squash, fill, burst), unlike (squash,
fill shrinks), loop beat (lub-dub at 66 bpm).

**Add +** — tap: rotates 90° with `pop`; add: morphs into a check
(`lerpPath`), pop; can't add: rotates 45° toward × and springs back.

**Check / done** — draw with `draw`, pop at the end; undo: undraw from the end.

## Communication and alerts

**Bell / notification** — part: body, clapper, badge. Poses: normal, unread,
muted. ≈ `bell`
- ring: pendulum about the top (`swing`, ≈ ±20°), clapper lags with opposite
  velocity
- notify: ring, badge pops in with velocity; read: badge swells 1.15, exits
- mute: short swing, slash draws across; unmute: slash undraws, light ring
- loop ringing: ±14° at 2.2 Hz with eased start
- snooze: bell tilts 20° and sinks 4 with `gentle`, small "z" fades up

**Message / chat bubble** — loop typing: three dots bounce with 120 ms
stagger; received: bubble pops from .6 at its tail corner; sent: bubble slides
up 8 and settles.

**Phone** — loop ringing: handset wobbles ±10° at 4 Hz in bursts of 0.6 s;
answer: rotates −30° up; hang up: rotates 135° down with `snap`.

**Mic** — Poses: on, muted. loop listening: level bars ripple (or capsule
scales with `track` from an audio level drive); mute: slash draws.

**Camera / screenshot** — shutter: aperture blink (scale .6 → 1 with `impact`
/ `rebound`), flash: glyph opacity dip .5; switch camera: flips scaleX.

## Media and device

**Play / pause** — ≈ `play`: one shape morphs (lerpPath triangle halves ↔
bars) with a squash; skip: slides out 18 and the next slides in; loop
buffering: bars pulse heights with stagger.

**Volume** — ≈ `volume`: drive level lights waves inside → out; mute: waves
collapse into the cone, × pops in; unmute restores the last level; loop sound:
waves ripple outward, cone pulses.

**Eye show / hide** — ≈ `eye`: blink (scaleY .06 in 80 ms), look (pupil
darts ±9), focus (pupil 1.3), hide (half-blink while the slash draws), show.

**Lock / unlock** — ≈ `lock`: lock (shackle drops, body squash), unlock
(shackle springs up past rest), jiggle (lifts 5, tilts, stuck), deny
(pose-aware refusal + red).

**Face ID / fingerprint** — any glyph with `frame: true` for the bracket
breathing and bracket → circle confirm; fingerprint: ridges draw in sequence
(dash) while scanning, complete on success, flash red on failure.

**Power** — press: stem pushes down 4; on: arc draws closed then reopens to
its gap with `pop`; off: arc retracts.

**Battery / charging** — drive level: fill grows from the left with `track`;
charging loop: bolt pulses 1.1 Hz; low: fill blinks red twice.

**Settings gear** — tap: rotates 30° with `pop`; loop working: 90 °/s;
finish: coasts to a whole tooth (`periodic {rot: 360 / teeth}`).

**Location pin** — drop: pin falls 14 with squash .88, ripple ring spreads
under it; locating loop: pin bobs 4, shadow scales with it.

**Clock / timer** — loop running: minute hand turns 360 °/s, hour hand
1/12 of that; reset: hands sweep back to 12 with `gentle`; alarm: same
pendulum as the bell.

**Calendar** — next/prev: page flips (scaleY about the binding) with
`gentle`; add event: dot pops into a day with `pop`.

**Cloud** — upload / download as their arrows inside the cloud; offline:
cloud dims and a slash draws; synced: check pops inside.
