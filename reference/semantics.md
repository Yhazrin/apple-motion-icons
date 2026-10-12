# Semantic quality pass

This pass responds to the review of the prior batches 030–049. The source report
was based on static key frames; it did not establish interpolation quality or
interrupt correctness. The library remains 87 subjects.

## Redesigned subjects and persistent results

| Subject | Distinct meaning / result |
|---|---|
| phone | Curved handset; ringing signal, raised answer, lowered hangup, separate rejection mark. |
| cart | `loaded` preserves the item; `checkedOut` retains the checkout result after departure. |
| ai-coding | Typing cursor, execution output, located bug and rejoined/repaired code. |
| fingerprint | Irregular nested/branching ridges; visible scanner and matched result. |
| permission | Neutral `requested`; green belongs to `granted`, independent of knob travel. |
| two-factor | `verified` swaps code for a check; `expired` crosses code but preserves the phone. |
| ai-browsing | Page content leaves/enters, target inspection is local, return has a back cue. |
| ai-tool-call | Request card travels to tool; result travels back; blocked request stops at a barrier. |
| face-id | Matching locks the corners and face; failed lock retracts instead of smiling. |
| qr-scan | Recognisable QR cells; matched locked corners and rejected scan differ. |
| clock | Start/resume tick; pause keeps current angles; reset targets zero; progress has its own arc. |
| shield | Interior closes for protection, explicit warning, distinct verified check. |
| ai-generating | Pieces join into an object that persists; refinement adds final detail. |
| folder | Fixed tab/back, front panel unfolds from bottom; paper is masked by the front panel. |
| wallet | Folded clasp and card slot; card stays behind front wall and can remain stored. |
| mail | Back, letter, front, flap and archive slot; received/archive outcomes persist. |
| ai-thinking | Signal propagates along stable nodes; pause freezes signal, finish reaches conclusion. |
| ai-queue | Claim moves a task into work position; process consumes it and advances remaining tasks. |

Other corrections: torn receipt pose, persistent duplicate, incoming/outgoing
clipboard flows, clearer camera focus/switch cues, wider recording pause bars,
passcode check, key latch, handoff acceptance, reading versus scanning, rewriting
an existing line, stable stored archive and mechanical jam/output.

## API and delivery

Load the six runtime assets, ending with `motion-icons-semantics.js`. Existing
public subject/verb names remain callable. New result poses and corrected targets
are intentional: `cart.add` now lands on `loaded`; `permission.request` on
`requested`; `two-factor.verify` on `verified`; `ai-coding.debug` on `located`;
`receipt.tear` on `torn`. Integrations must not force `idle` immediately after
these actions. Only drive the UI state from real product outcomes.

Internal press/tap remains callable, but is not a primary gallery verb. Default
export omits it; `gallery.html?feedback=1` includes API feedback strips as well.
Frame export now freezes paint and isolates each sequence with a fresh instance.
This addresses colour/goal contamination, not the entire live state-chain audit.

## Review boundaries

Keep the original baseline audit unchanged. Do not claim a 21/25 human score or
all static-report suggestions implemented without a human review. The calendar
keeps its planar slide rather than adding a new 3D turn, in accordance with the
user's instruction to keep most business states flat. Bookmark/star and gift
retain the clearer existing mechanisms. Long state chains, blind recognition,
and a complete small-size visual review are not inferred from frame-rest checks.
