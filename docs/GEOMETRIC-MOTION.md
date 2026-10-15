# Navigation and geometric loading

Runtime: `assets/motion-icons-geometric.js`, loaded after signature when present.
This is a recipe layer: engine bytes, original built-ins and the number of public
subjects are unchanged. Existing loader subject names are retained for API users.

## Navigation

| Subject | Rest | Hover / selection |
| --- | --- | --- |
| plus | Plus | Arms unfold into four rounded focus corners; a small plus remains inside |
| book | Flat rounded-rectangle volume | Leaves expand around one gutter; selected hover turns one page |
| settings | Three segmented sliders | Knobs move to a different parameter combination |
| cards | Fixed prompt card | Its interior shutter slides away to reveal a recall symbol; the card does not shake |
| pencil | Nib at the starting point | The nib traces one cubic ink stroke and lifts; ink and tip share the exact curve |

Hover must select `peek`, not generic `tap`. Hold `open` for plus/book and
`adjusting` for unselected settings. Pointer leave returns to idle or selected.
Book-page masking uses the final path, includes the foreground stroke footprint,
and remains transparent in light and dark appearances.

Review / Dictation hover also hold `open`; leaving restores idle or selected.
The old app-local cards/pencil definitions were removed, rather than layered over
with several competing redraws. Two specialist agents authored these mechanisms.

## Waiting vocabulary

| Existing API name | Mechanism | Period |
| --- | --- | --- |
| loading | Sinusoidal capsule shuttle | 1.85 s |
| load-activity | Continuous luminance wave around spokes | 1.55 s |
| load-typing | Three equal dots, phase-shifted lift | 1.7 s |
| load-comet | Breathing arc, constant angular head speed | 1.8 s |
| load-bars | Four centered columns, phase-shifted height | 1.9 s |
| load-infinity | Arc-length-parameterized figure eight | 2.8 s |
| load-tumble | Planar four-tile permutation; no fake wireframe cube | 3.2 s |
| load-matrix | Continuous diagonal intensity wave | 2.2 s |
| load-sphere | Two flat counter-rotating point orbits | 3.4 s |

Loops use the existing display-clock callback. They claim only their phase channel;
a spring controls activation. Idle pages do not keep an independent animation timer.
The loop seam has no reset frame, alpha clipping or derivative jump. The stop
exit decelerates a spring-controlled speed channel and stores the final phase as
the idle goal, so visible orbit heads never rewind to zero. Task adapters route
`busy()` to `loading`, not the engine's generic whole-icon pulse. Generic
explicit effects remain a separate API choice, not the default hover/loading effect.

No public release or native installation is implied by a source change.

## Library: geometry, not opacity

`book.geometryOnly` keeps every rendered stroke opaque throughout opening and
closing. The rounded closed cover retains flat top/bottom edges. The back leaf
starts tucked behind that complete silhouette and unfolds from behind a real
transparent mask; the cover leads and the inner leaf follows one reversible
spring coordinate. The binding becomes the gutter instead of fading away. The
bookmark physically retracts through the cover boundary, clipped by that same
final path. Turning flexes a page-edge curve about its fixed endpoints; it does
not cross-fade a separate page. No other subjects changed in this revision.

## Add: tangent-constrained elbow

The four arms share one rounded-elbow construction. Its adjacent straight edges
remain tangent to the quadratic at every progress value; the horizontal exit Y is
not interpolated independently. The approved idle/open bounds stay the same. The
center plus grows by line length rather than opacity. Both Add and Library expose
`drive('unfold', progress)` for the [shared example](../examples/continuous-morph.html).
See [continuous-morph.md](../reference/continuous-morph.md) for the formula and scope.
