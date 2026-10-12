# Catalog motion vocabulary

These 60 subjects are implemented. Load `motion-icons.js`, `motion-icons-recipes.js`, `motion-icons-learning.js`, then `assets/motion-icons-catalog.js`. Register only through `MotionIcon.define()`. The engine and the 13 built-in recipes stay unchanged.

Semantic boundaries: `search` is a magnifying glass and is not `lookup` (page plus lens). `sync` is two opposing arrows and is not `refresh`. `loading` is a capsule in a track and is not `refresh`. `check` draws its own stroke and is not `plus` or the engine overlay. `star` is not `heart`. `folder` hinges a lid and is not `book`. `cellular` uses bars, not wifi arcs. `face-id` and `fingerprint` draw a contour or ridges; playing them is not a biometric result. `passcode` fills dots and shows success only while `verify` is playing.

| Subject | Poses | Actions | Loops | Drives |
| --- | --- | --- | --- | --- |
| `wifi` | connected, weak, off | tap, search, connect, disconnect, reconnect, loseSignal | searching | signal |
| `bluetooth` | on, off, connected | tap, enable, disable, pair, connect, disconnect | pairing | — |
| `cloud` | idle, synced, offline | tap, upload, download, sync, complete, disconnect | syncing | — |
| `sync` | idle, synced, conflict | tap, start, complete, conflict, retry | syncing | — task syncing/complete/conflict |
| `upload` | idle, paused, completed | tap, start, pause, resume, cancel, complete, fail | uploading | progress task uploading/complete/fail |
| `battery` | normal, low, charging, full | tap, charge, discharge, full, lowBattery | charging | level |
| `power` | off, on | tap, press, powerOn, powerOff, restart | — | — |
| `search` | idle, found, empty | tap, start, found, empty, reset | searching | — |
| `link` | linked, broken | tap, connect, disconnect, reconnect, copyLink | — | — |
| `check` | checked, empty | tap, draw, confirm, undo, reset | — | — |
| `warning` | idle, active | tap, alert, acknowledge, dismiss | — | — |
| `error` | idle, active | tap, appear, reject, dismiss, retry | — | — |
| `loading` | idle, loading | tap, start, finish, cancel | loading | — |
| `hourglass` | ready, running, finished | tap, start, flip, finish, reset | running | progress |
| `clock` | idle, running, paused | tap, start, pause, resume, reset | running | progress |
| `fingerprint` | idle, scanning, recognised | tap, scan, accept, reject, reset | scanning | — task scanning/accept/reject |
| `face-id` | idle, scanning, recognised | tap, scan, recognise, reject, reset | scanning | — |
| `folder` | closed, open | tap, open, close, insert, remove | — | — |
| `copy` | idle, copied | tap, copy, duplicate, copied, reset | — | — |
| `bookmark` | off, on | tap, press, save, unsave | — | — |
| `cellular` | full, weak, off | tap, connect, weaken, disconnect | — | strength |
| `hotspot` | on, off, connected | tap, enable, connectDevice, disconnect | — | — |
| `usb` | idle, in, ready | tap, plug, recognise, eject | — | — |
| `server` | online, busy, offline | tap, online, offline, restart | busy | — |
| `brightness` | bright, dim | tap, brighten, dim | — | level |
| `storage` | normal, loaded, full, empty | tap, fill, clear, full | — | level |
| `printer` | idle, done, jammed | tap, print, complete, jam | printing | — task printing/complete/jam |
| `archive` | closed, open | tap, open, archive, restore, close | — | — |
| `clipboard` | idle, clear | tap, copy, paste, clear | — | — |
| `filter` | idle, applied | tap, apply, adjust, clear | — | — |
| `sort` | ascending, descending, mixed | tap, ascending, descending, reorder | — | — |
| `star` | off, on | tap, favourite, unfavourite, highlight | — | — |
| `mail` | idle, open, sent | tap, receive, open, send, archive | — | — |
| `phone` | idle, answered | tap, ring, answer, hangup, reject | ringing | — |
| `video-call` | idle, off | tap, join, leave, cameraOff, cameraOn | — | — |
| `share` | idle, open | tap, open, share, copyLink, close | — | — |
| `qr-scan` | idle, found, rejected | tap, scan, detected, rejected | scanning | — task scanning/detected/rejected |
| `wallet` | closed, open | tap, open, close, insertCard, takeCard | — | — |
| `cart` | idle | tap, add, remove, checkout | — | — |
| `calendar` | idle, marked | tap, next, previous, addEvent, removeEvent | — | — |
| `receipt` | idle | tap, print, tear, jam | — | — |
| `gift` | closed, open | tap, shake, open, close | — | — |
| `shield` | idle, verified, alerted | tap, protect, alert, verified | — | — |
| `key` | idle, in, open | tap, insert, turn, unlock | — | — |
| `passcode` | empty, entered, verified | tap, input, verify, reject, clear | — | — |
| `two-factor` | idle, shown, expired | tap, request, verify, expire | — | — |
| `permission` | idle, granted | tap, request, grant, deny, revoke | — | — |
| `secure-connection` | secured, open, lost | tap, establish, secure, lost | — | — |
| `camera` | idle | tap, shutter, focus, switchCamera | — | — |
| `screen-recording` | idle, recording, paused | tap, start, pause, resume, stop | recording | — |
| `ai-thinking` | idle, paused | tap, think, pause, finish | — | — |
| `ai-browsing` | idle | tap, navigate, inspect, return | — | — |
| `ai-reading` | idle, done | tap, read, scan, complete | — | — |
| `ai-writing` | idle, writing | tap, write, revise, finish | — | — |
| `ai-coding` | idle, failed | tap, type, execute, debug, repair | — | — |
| `ai-tool-call` | idle | tap, connect, invoke, return, fail | — | — |
| `ai-agent` | idle, active | tap, activate, stop | work | — |
| `ai-handoff` | idle, sent | tap, prepare, transfer, acknowledge | — | — |
| `ai-generating` | idle, draft, generated | tap, generate, refine, finish | — | — |
| `ai-queue` | idle, queued, claimed, processed, empty | tap, enqueue, claim, process, drain | — | — |

## Object attachment and event semantics

The catalog uses restrained press feedback (6% compression), reserving larger travel
for the object's own action. `usb` is a physical plug moving into its port; its
status light belongs to the port. `key` turns around its inserted shaft, projected
in depth, rather than swinging the shaft out of the keyhole. Shield stamps move
with the shield. Browser content zooms and clips within the window.

`ai-thinking` trims each connection to the current node boundary, including during
motion; connections never float away from their nodes. `ai-handoff` passes a small
task document between two people, while `ai-tool-call` moves a packet on a cable.
`ai-queue` places incoming work in a separate slot, moves the first item into the
processor, then advances the remaining items; `drain` rests empty instead of
silently recreating the queue. Use its declared poses to retain real queue state.

## Directional work, formation and repair

- `printer`: paper feeds downward from the input tray, then exits downward from
  the output slot. The two paper regions have separate clips within the live
  area. `print` and `complete` retain the `done` sheet; `jam` retains a folded,
  partly ejected sheet in `jammed`. The waiting loop fades the completed page
  before a fresh page begins, rather than pulling the same sheet backward.
- `filter`: three distinct particles enter a funnel; the middle matching
  particle emerges and rejected particles remain subdued in the funnel.
  `adjust` moves a knob on a visible rail and changes the funnel aperture.
- `ai-reading`: a left-margin reading head advances through three rows. Each
  read row draws independently; `read`, `scan` and `complete` retain `done`,
  distinguished by a small footer stroke. `scan` has shorter row dwell times.
- `ai-generating`: a quiet template holds four separately drawn components.
  `generate` and `finish` form them in order and retain `generated`; `refine`
  only redraws one component. Calling `generate` on existing content first
  retracts its strokes smoothly, with no instant spread reset.
- `ai-coding`: `failed` is a visibly broken right bracket, without a floating
  dot over the caret. Set this pose when a real operation fails. `debug`
  repairs that break and now ends in `idle`; the additive `repair` action
  has the same repair behavior. Existing `type` and `execute` names remain;
  executing from `failed` refuses without pretending that repair succeeded.
