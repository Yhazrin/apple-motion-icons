# Writing a recipe

## Template

```js
MotionIcon.define('upload', {
  labels: {busy: '正在上传', done: '已上传', fail: '上传失败'},   // only used by hud()
  svg: `<g data-part="arrow"><path d="M60 74V20"/><path d="M40 38L60 18L80 38"/></g>
<path data-part="tray" d="M22 78V92a10 10 0 0 0 10 10H88a10 10 0 0 0 10 -10V78"/>`,
  state: {ay: 0, aOpacity: 1, tray: 1},          // every animated value at its default
  poses: {idle: {}, paused: {ay: -6}},           // first pose is the initial one
  // periodic: {rot: 360},                       // values that wrap (rotation)
  render(s, p, {aroundXY, clamp01}) {            // pure: state → attributes
    p.arrow.setAttribute('transform', `translate(0 ${s.ay})`);
    p.arrow.setAttribute('opacity', clamp01(s.aOpacity));
    p.tray.setAttribute('transform', aroundXY(1 + (1 - s.tray) * 0.4, s.tray, 60, 102));
  },
  actions: {
    tap: {label: '点按', run: c => c.nudge('ay', -8)},
    uploading: {label: '上传中', loop: true, run(c) {
      c.claim('ay');                              // the loop owns ay now
      c.loop(t => { c.s.ay = c.goal('ay') - 7 * c.util.wave(t, 1.1); });
    }},
    progress: {label: '进度', drive(c, v) { c.to('ay', -20 * v, 'track'); }},
    pause: {label: '暂停', pose: 'paused', from: 'idle', async run(c) {
      c.squash('tray', 0.92);
      await c.wait(200);
    }},
    resume: {label: '继续', pose: 'idle', from: 'paused', async run(c) {
      c.to('ay', 0, 'pop', -60);
      await c.wait(200);
    }},
    send: {label: '上传', async run(c) {
      c.to('ay', 4, 'snap');                      // anticipation
      await c.wait(90);
      c.squash('tray', 0.88);
      c.to('ay', -40, {stiffness: 160, damping: 16});
      c.to('aOpacity', 0, {stiffness: 300, damping: 30});
      await c.wait(220);
      c.set({ay: 14, aOpacity: 0});               // while invisible: re-enter from below
    }},
    fail: {label: '失败', async run(c) {
      c.error();
      c.to('ay', 6, 'pop', 120);                  // falls back into the tray
      await c.shake();
      await c.wait(c.timing.holdFail);
    }}
  },
  toggle: ['pause', 'resume'],                    // optional: two actions with poses
  task: {busy: 'uploading', success: ['send', 'confirm'], fail: 'fail'}   // optional
});
```

When `run` returns, the engine springs every value back to the current pose
(`settle`). So a run only has to play the interesting part; it never has to
walk everything home itself.

## Action fields

| field | meaning |
|---|---|
| `run(c, arg)` | the motion; `async`, awaited by `play()` |
| `pose` | pose the action leads to; set when it starts, so `settle` lands there |
| `from` | the pose the action naturally starts from (used by the frame check) |
| `loop: true` | keeps running after `run` returns, until `stop()` or another action |
| `exit` | loop only: action `stop()` plays instead of a plain settle (`spin → finish`) |
| `drive(c, v)` | continuous input instead of `run`; called on every `drive(name, v)` |
| `label`, `initial` | gallery button text; initial slider value for drives |

## Context `c`

| member | meaning |
|---|---|
| `c.s` | live state (shared keys + recipe keys) |
| `c.parts` | `{name: element}` for every `[data-part]` |
| `c.pose`, `c.goal(key)` | current pose and its value for a key — use for pose-aware actions |
| `c.setPose(p)`, `c.setGoal(key, v)` | change pose; change the current pose's value (drives) |
| `c.to(key, target, preset?, velocity?)` | spring; resolves `true` when settled, `false` if superseded |
| `c.set({key: value})` | jump instantly (only while the part is invisible or for resets) |
| `c.nudge(key, delta, ms?)` | push away from the pose value, spring back |
| `c.squash(key, amount?, home?)` | `impact` in, `rebound` out |
| `c.loop(fn(t, dt))`, `c.claim(...keys)` | per-frame callback; claim keys first so no spring fights it |
| `c.setVelocity(key, v)`, `c.vel` | per-key velocity |
| `c.wait(ms)`, `c.alive()` | timer; false once a newer action, stop or reset started |
| `c.press()`, `c.confirm()`, `c.check()`, `c.shake()`, `c.error()` | engine pieces: pop, ring + check (+ hold), check only, damped shake, red tint |
| `c.timing`, `c.framed`, `c.mem`, `c.util`, `c.arg` | timing tokens, frame option, scratch object, helpers, argument of `play` |

`c.to`, `c.set` and friends do nothing once the action is stale, so a late
callback cannot disturb the next action. Still `return` early after an
`await` if what follows only makes sense for this action.

Shared keys owned by the engine (do not reuse the names): `shake, pop,
glyphOpacity, glyphScale, ring, check, morph, spin, breath, leg`.

## Rules that prevent the usual bugs

- **Loops claim their keys** (`c.claim('rot')`) before writing `c.s.rot`
  every frame. Otherwise a spring left over from the previous action pulls
  against the loop.
- **Exits re-enter while invisible.** Fade out, then `c.set` the part to the
  opposite side (or scale .6) at opacity 0; the settle brings it in.
- **Pose-aware, not hard-coded.** Use `c.goal('lift')`, `c.pose`. A tap in the
  open pose of a lid starts from the open angle.
- **Rest must be exact.** Only the pose values are rest values. Do not leave a
  key at "almost" with `set`; let the settle spring it home.
- **Clamp what can overshoot visually.** Opacity through `clamp01`; a fill
  inside an outline `Math.min(1, s.fill)`; `lerpPath` with `t` clamped to
  about −.1…1.1.
- **Round caps show a dot at zero length**: hide a drawn stroke while its
  progress is ≈ 0 (`opacity = clamp01(p * 8)`).
- **Wrapping rotation goes in `periodic`.** The engine removes whole periods
  before settling, so a spinner never unwinds extra turns.
- **No `stroke-width`, no CSS transitions** in recipes. Pose colours go in the
  recipe `css` field: `.mi--name[data-pose="on"]{color:…}`. To beat the base
  `[data-fill]` rule, use `.mi--name svg [data-part="x"]{fill:…}`.

## Geometry helpers (`c.util` / `MotionIcon.util`)

- `around(k, cx, cy)`, `aroundXY(kx, ky, cx, cy)`: scale about a pivot. Put
  the pivot on the contact point (bottom edge for drops, hinge for lids).
- Hinges: `rotate(deg hx hy)`; order transforms `translate(…) rotate(…)` so the
  hinge travels with the part.
- `arc(cx, cy, r, fromDeg, toDeg)`, `polar(cx, cy, r, deg)`: wave arcs, rays.
- `lerpPath(a, b, t)`: morph two paths with the same command list
  (play ↔ pause, menu → back arrow).
- Drawing a stroke on: `stroke-dasharray: L·p  L+1` (see `dash()` in the
  built-in recipes).
- `wave(t, hz, phase)`: smooth 0..1 pulse for loops.
- `framePath(t)`: Face ID brackets → rounded square → circle.

## Amplitude and timing cheat sheet

| motion | amount | spring |
|---|---|---|
| tap push | 4–8 units, 4–6° | `snap`, back with `pop` after 90–110 ms |
| press pop | scale .88 | `impact` → `rebound` |
| emphasis squash | .8–.9 | `impact`, release `pop` with velocity 3 |
| pendulum | velocity 140–320 °/s | `swing` (≈ ±9–20°) |
| knock / bump | 6–10 units, twice 200 ms apart | `impact` → `rebound` |
| flip | scaleX 1 → −1 | `{stiffness: 300, damping: 24}` |
| busy bob / nudge | 3–7 units at 0.9–1.4 Hz | loop with `wave` / `sin` |
| busy spin | ramp to 300–450 °/s | loop + `setVelocity` |
| drop into container | 14–26 units | `{stiffness: 700, damping: 34}` |
| launch out | 40–70 units, fade before 40 | `{stiffness: 160, damping: 16}` + fast fade |
| slam / click | — | `{stiffness: 900, damping: 30}` or `snap` |
| blink | scaleY → .06 in 80 ms | `{stiffness: 1400, damping: 50}`, open with `pop` |
| stagger | 60–120 ms | `c.wait` |
