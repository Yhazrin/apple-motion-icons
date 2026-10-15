# Continuous morphing: preserve the journey

Use this guidance for small physical-object and line-icon transformations, not as
a demand that every UI transition must deform. Opacity remains useful for secondary
feedback, semantic color emphasis, and genuine arrival/departure.

## Construction contract

1. **Identity:** name which part each stroke represents before and after the change.
   One shape family should connect the two; do not swap completed pictures midway.
2. **Geometry carries the story:** slide, unfold, flex, trim or expose a stroke.
   Keep its opacity constant when the part is meant to remain physically present.
3. **Shared constraints:** calculate endpoints and controls from the same anchors.
   At a line/curve join, the incoming and outgoing tangents must be parallel and
   point the same way (G1). Match curvature when perceptually useful, but do not
   claim a quadratic fillet is curvature-continuous with its straight segments.
4. **No creases by accident:** examine 25/50/75% as well as both endpoints. Look for
   diagonal tail segments, reversed controls, cusps, self-intersections, and short
   segments swallowed by round caps. Reserve an actual crease for an intentional fold.
5. **One reversible coordinate:** use the existing spring for progress. Spatial
   lead/follow profiles may share that coordinate, so pointer leave retraces the
   same geometry without waiting for an earlier timeline to finish.
6. **Real layering:** a silhouette mask covers the rear object in the same coordinate
   space. Use the final animated silhouette, including its stroke footprint, and
   unique IDs per instance. Paper should work on a checkerboard, not only on white.
7. **Coherent rest:** preserve optical weight, bounds and the approved end states.
   Reduced motion should show the correct end state, not leave an in-between shape.

This is a focused review aid for the affected transition, not a requirement to run
an all-library audit or a test suite for every small visual change.

## Add: why the old middle wrinkled

The old formula interpolated its last endpoint's Y separately from the curve's
exit Y. At 50%, the curve exited horizontally at `(48,45)`, but the next line ran
to `(52,31)`: the two vectors had cross product `-42`, so the join kinked.

For progress `t` in `[0,1]`, construct one rounded elbow instead:

```js
const x = 60 - 30*t;
const y = 32 - 2*t;
const r = 6*t;
const d = `M${x} ${60-16*t}`
  + `L${x} ${y+r}`
  + `Q${x} ${y} ${x+r} ${y}`
  + `L${60-16*t} ${y}`;
```

The first line and curve enter vertically; the curve and last line exit
horizontally. Their tangent cross products stay zero, without changing the open
four-corner silhouette. Rotate this one arm through 0/90/180/270 degrees. The
center plus grows by stroke length; no hover opacity handoff is needed. Explicit
success feedback may still reveal the checkmark with opacity.

## Library: a persistent object, not a dissolve

- The rounded closed cover keeps its planar top/bottom and corner radii.
- The cover leads; the inner leaf follows through a reversible spatial profile.
- A tucked rear leaf emerges from behind the final foreground-cover mask.
- The binding moves into the gutter instead of fading away.
- The bookmark retracts through a cover-shaped clip.
- A page edge flexes about fixed endpoints when turning; no page cross-fade.

## Use the actual recipes, not a second drawing

```js
const add = MotionIcon.create(addHost, 'plus', {pose:'idle', size:48});
const book = MotionIcon.create(bookHost, 'book', {pose:'idle', size:48});
add.play('peek'); // hold open; on pointer leave use setPose('idle')
book.play('peek');
// Optional interactive inspection: both expose the same progress drive.
add.drive('unfold', 0.5);
book.drive('unfold', 0.5);
```

The [runnable example](../examples/continuous-morph.html) reuses the production
renderer and offers a shared slider plus quarter-progress snapshots. It does not
ship an alternative easing engine, a private animation clock, or substitute SVGs.
