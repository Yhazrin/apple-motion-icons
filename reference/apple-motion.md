# Apple motion contract and signature redraws

`assets/motion-icons-signature.js` is the seventh runtime layer. It does three
things without touching the engine bytes: holds every spring to Apple damping,
adds SF Symbols-style effects to every subject, and redraws 16 subjects that did
not read at rest.

## Why a contract

The engine's original presets were tuned for cartoon emphasis: `pop` ζ .39
(≈ 26 % overshoot), `rebound` ζ .34, `swing` ζ .19, `shake` ζ .25. Layered over
87 subjects this made overshoot the default texture, which reads as cheap next
to system icons. SwiftUI's springs are specified as *response* and *damping
fraction*; system motion stays at or near critical damping and reserves bounce
for a single, meaningful moment.

Conversion used throughout: `stiffness = (2π / response)²`, `damping = 2 ζ √stiffness`
(mass 1). Overshoot of a step: ζ 1 → 0 %, .86 → ≈ 0.6 %, .72 → ≈ 4 %, .3 → ≈ 37 %.

| SwiftUI | preset | response | ζ |
|---|---|---|---|
| `.smooth` | `smooth` | 0.42 s | 1.0 |
| `.snappy` | `snappy` | 0.30 s | 0.86 |
| `.bouncy` | `bouncy` | 0.40 s | 0.72 |
| — (compress-in) | `quick` | 0.16 s | 1.0 |
| — (long travel) | `glide` | 0.55 s | 1.0 |

Retuned legacy presets (stiffness unchanged): `snap` .82, `pop` .72, `impact`
.86, `rebound` .72, `settle` .88, `swing` .30, `shake` .38.

### The governor

Every action's `run` and `drive` receive a context whose `to()` checks inline
spring objects. Below ζ 0.7 the damping is raised to exactly 0.7 and the
request is counted in `MotionIcon.apple.audit = {floor, clamped, subjects}`.
Named presets pass unchanged; `swing` and `shake` stay below the floor on
purpose (free pendulums and refusals, the same latitude SF Symbols gives
wiggle). The frame checker header shows `收敛 N 次低阻尼请求`.

Rules the governor cannot enforce:

- One emphasis per action. Choose the moment (the drop lands, the token is
  received) and use `bouncy` there; use `smooth` / `snappy` everywhere else.
- Opacity, colour, stroke drawing and pose morphs never use a bouncy spring.
- Liveliness comes from causality and continuity — inertia when a hand stops,
  sand that keeps flowing, work passed from one agent to another — not from
  extra oscillation.

## Symbol effects

Every glyph is wrapped in `<g data-part="mi-fx">`. Subjects that do not define a
verb of the same name receive:

| effect | motion | SF Symbols analogue |
|---|---|---|
| `bounce` | squash to .86 at the baseline with `quick`, release with `bouncy` | `.bounce` |
| `wiggle` | rotate 8°, −6°, 3° (`snappy`, 95 ms apart), rest with `smooth` | `.wiggle` |
| `breathe` | loop, scale 1 ± 5 % at 0.5 Hz | `.breathe` |

They are marked `effect: true`; the gallery shows them in a separate
"符号效果" row. Reserved state keys: `fxX`, `fxY`, `fxRot`, `fxScale`,
`fxSquash`. Catalog subjects use `bounce` as their `tap`.

## Redrawn subjects

Poses and verbs below are read from the runtime. `a → b` means the action is
meant to start in `a` and rests in `b`.

| subject | glyph | poses | verbs |
|---|---|---|---|
| `clock` | dial, hour hand at 4 o'clock, minute hand at 12, elapsed arc | idle, running, paused | `start` / `resume` (loops; hand accelerates, then sweeps), `running`, `pause` (coasts 4° and freezes, keeps the angle), `reset` (nearest equivalent angle with `glide`), `progress` drive |
| `hourglass` | caps, curved glass, sand volumes sampled from the bulb, dashed stream | ready, running, finished | `start`, `running` loop, `progress` drive, `finish`, `flip` (turns 180°; symmetric glass makes the swap seamless), `reset` |
| `filter` | clean funnel; three items appear only while filtering | idle, applied | `apply` (items drop, two caught at the rim, one passes, funnel fills), `adjust` (neck tightens), `clear` |
| `sort` | arrow and three ranked bars | ascending, descending, mixed | `ascending`, `descending` (arrow turns over, bars re-rank 60 ms apart), `reorder` |
| `receipt` | serrated paper with lines | idle, torn | `print`, `tear` (lower strip rotates away and falls), `jam` |
| `key` | bow, shaft, teeth; tip hidden inside the lock slot | idle, in, open | `insert`, `turn` (trial turn), `unlock` (half turn, slot opens green) |
| `usb` | USB-A plug with two shell holes; shell slides under the port lip | idle, in, ready | `plug`, `recognise` (port LED draws on), `eject` (released upward) |
| `two-factor` | phone, three code dots | idle, shown, verified, expired | `request`, `verify`, `expire` (strike through, phone stays) |
| `secure-connection` | turning globe, lock badge with knockout gap | secured, open, lost | `establish`, `secure` (shackle closes), `lost` (globe dims, slash) |
| `screen-recording` | display on stand, record dot morphing to pause bars | idle, recording, paused | `start`, `recording` loop, `pause`, `resume`, `stop` |
| `ai-generating` | large and small four-point sparkles | idle, draft, generated, refined | `generate`, `refine`, `finish`, `generating` loop |
| `ai-tool-call` | open-end wrench at 45°, hex nut in the jaw | idle, connected, sent, returned, blocked | `connect`, `invoke` (turns the nut, request dots), `return` (check), `fail` (stuck, warning mark) |
| `ai-handoff` | agent A, chevron, agent B; token travels on an arc | idle, sent, acknowledged | `prepare`, `transfer` (B yields slightly on receipt), `acknowledge` |
| `ai-writing` | three lines with a caret on the line being written | idle, writing | `write` (lines 150 ms apart), `revise`, `finish` → idle, `typing` loop |
| `ai-queue` | three task capsules above a tray | idle, queued, claimed, processed, empty | `enqueue`, `claim` (front task drops into the tray), `process`, `drain` |
| `ai-agent` | person with a sparkle | idle, active | `activate` (sparkle fills blue), `work` loop, `stop` |

Learning subjects used by Vord (`lookup`, `lexicon`, `recall`, `memory`,
`sentence`, `milestone`, navigation and `sync`) were not redrawn; they only
receive the contract and the shared effects.

## Writing a recipe under the contract

```js
const {spring} = MotionIcon.apple;
MotionIcon.define('my-subject', {
  // ...
  actions: {
    arrive: {label: '到达', async run(c) {
      c.to('y', 0, 'snappy');                 // direct response
      await c.wait(120);
      c.to('k', 1, 'bouncy');                 // the one emphasis
      c.to('tint', 1, 'smooth');              // colour never bounces
      await c.wait(260);
    }},
    drift: {label: '漂移', async run(c) {
      c.to('x', 20, spring(0.6, 0.9));         // SwiftUI values
      await c.wait(400);
    }}
  }
});
```

Recipes defined after the signature layer are finalised automatically: they
get the effect wrapper, the effects and the governor.
