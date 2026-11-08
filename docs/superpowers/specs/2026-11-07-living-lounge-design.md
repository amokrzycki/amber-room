# Phase 4.1: Living Lounge vertical slice

Status: owner approved through the design decision page on 2026-11-07. Direction A, Cozy Idle Lounge, is already selected. Independent builder check found no important open questions. This document narrows implementation; it does not reopen the economy review. No commit, push, publication, or Phase 4.2 work is authorized.

## Intent and boundaries

Make the lounge's development legible and worth looking at, through nine existing purchases and one reversible rug choice. Preserve the illustrated burgundy-and-brass private arcade, room composition, typography, separate machine view, existing controls, and minimal management. Visual satisfaction and personalization value require owner feedback; automated checks cannot establish them.

Do not change catalog prices, purchase limits, rates, income accounting, slot RNG, payouts, RTP, or production save semantics. Do not import Opening Hours or add economic furnishing effects, currencies, prestige, extra playable machines, or a cosmetic catalog. Do not redesign the lounge or repair unrelated design documentation drift.

## Current evidence

- `src/view/SalonScene.ts` draws a full-stage room image, separate bar/machine images, procedural furnishings, and a fixed right-hand HTML shop. The stage is 1600×900, fitted to the viewport.
- A bar at level zero is a translucent ghost. Level one makes it opaque; subsequent levels add small circles and mint rectangles rather than substantial changes to the bar.
- Each extra-machine purchase adds one cabinet in a fixed foreground position. Unpurchased positions have faint placeholders. This already provides visible progression.
- Furnishings add a low foreground rug, two plants, then wall signage. These are real changes, but the rug is drawn after cabinets and the art treatment varies.
- Successful purchases rebuild the whole room and report only “A little more yours.” Levels are visible in the shop; completed income upgrades lose their specific benefit description.
- `src/runtime.ts` constructs the shared `SaveOwner`. `src/game/save.ts` validates v1 saves, protects damaged originals, and handles unavailable storage. Existing exports contain only production progress.
- Inspected the actual 1440×900 lounge and all three source art assets. Baseline capture: `.openchamber/screenshots/phase41-incumbent-lounge-2026-11-07T19-17-38-347.jpg`. This browser profile contains existing progress and is not a clean-save fixture; do not alter it for testing.
- Catalog: bar 500/1,000/2,000, +12/hour per level; machines 750/1,500/3,000, +20/hour per level; furnishings 300/900/1,800, no income. All limits are three. Use the catalog as source of truth.

## Approaches

1. **Separate prototype entry, shared scenes, isolated state (recommended builder choice).** Reuse gameplay, purchase and save validation code. Select a prototype runtime before scene initialization, provide a storage adapter that maps all save accesses to prototype-only keys, and enable prototype visuals/UI only from that entry. Keep production defaults and output unchanged. This needs a small explicit seam but avoids duplicating gameplay.
2. **Copy the game into the prototype.** Strong file separation, but duplicates scene, controls, and persistence behavior. Reject because bug fixes and regressions would drift.
3. **Production visuals plus a separate rug preference.** Smaller immediate diff, but puts an unvalidated slice in the production path. Reject because the request requires isolation.

Owner approval of this document approves approach 1. Preserve damaged-save protection and visible storage warnings in the adapter; never redirect a failed prototype load to production storage.

## Playable slice

Serve a clearly labeled development-only entry, proposed `/prototypes/living-lounge.html`, using the current Phaser application and actual slot scene. Production `/` and its standalone build retain current behavior. The existing Opening Hours prototype remains separate and unused.

Keep controls and composition recognizable: bar on the left; personal machine in the center; extra machines in their foreground row; furnishings at floor, side and back-wall positions; shop on the right. Prototype labeling and acceleration controls must not cover room rewards or shrink functional text below existing laptop compensation.

### Visible progression

Every level must have a persistent silhouette, material, or object change, not merely brighter pixels or a label.

- **Bar 0:** empty bar location, no ghost reward. **Bar 1:** the existing stocked bar art. **Bar 2:** add a coherent pair of substantial burgundy upholstered bar stools with brass feet in front of the bar. **Bar 3:** add a matching visible back-bar display extending above the bar with stocked shelves. Match existing perspective and warm lighting; do not turn it into a second full bar or obscure introductory copy.
- **Extra machines 0–3:** retain one added cabinet per level and fixed positions. Improve grounding and floor layering if needed; do not invent differently earning cabinet types. Keep the personal playable machine distinct and accessible.
- **Furnishings 0:** clear floor and undecorated relevant wall. **Furnishings 1:** a substantial perspective-correct woven rug, visibly below cabinets and clear of the wallet. **Furnishings 2:** matching planted brass planters framing the lounge without covering controls. **Furnishings 3:** an engraved rectangular brass room nameplate centered above the personal machine, using the existing display typeface, without diamond ornaments.

Reuse room, bar and machine images. Author only missing details. Prefer static cached drawing in the established cabinet-painter pattern over added per-frame work. Any generated/sourced raster requires provenance; do not introduce an art dependency. Builder may adjust scale and placement to remove overlap while preserving incumbent composition. If these additions cannot fit convincingly, report the constraint rather than quietly substituting tiny decorative marks.

### Rug personalization

Two named appearances only: **Claret weave** (burgundy with muted brass border) and **Moss weave** (deep moss-green with the same warm border and woven structure). Color and border contrast must be clearly distinguishable in the actual room at laptop size. Neither changes income, slot odds, prices, or limits.

Unlock rug styling with the existing first furnishing purchase. Default to Claret weave. Add a compact “Style rug” action using existing control treatment. Preview in the actual unobscured room, with keyboard-operable choices and explicit Apply/Cancel. A nonmodal inline chooser is preferable to a full-screen dialog because the floor must stay visible. Escape, navigation, and closing the chooser cancel the preview. Only Apply persists a choice. Reopening allows free switching, including after all furnishing purchases. Reload restores the last confirmed appearance, never an unconfirmed preview. Switching style must not change or reset any other progress.

### Purchase feedback

Commit the real purchase before presenting its reward. Update only the affected room group where practical. Use a brief local opacity reveal, no bounce, global flash, or particles; interrupt and settle prior feedback on another purchase, scene shutdown, preference change, or hidden page. Duration target: 240ms, easing out. Final appearance stays fully visible without animation. Both OS reduced-motion and in-game reduced-motion bypass motion; zero effects intensity also suppresses decorative motion. Do not animate the whole room.

Use the existing status region to name the purchased result, new level and existing benefit, for example “Bar 2/3 · upholstered stools added · +12 tokens/hour; bar total +24/hour.” Furnishings explicitly say cosmetic only. Retain specific accumulated benefits at maximum level and identify the next visible reward before purchase. Avoid duplicate announcements from every income tick. Keep current insufficient-funds and max-level handling.

## Persistence and accelerated playtest

Use only namespaced prototype storage, proposed `amber-room:prototype:living-lounge:v1` for a validated v1 game save and a separate `amber-room:prototype:living-lounge:appearance:v1` for a versioned validated rug preference. Production `fruit-salon:v1` must never be read, created, changed, or imported automatically by the prototype. Prototype settings export/import must be labeled as prototype progress; appearance may have its own clearly documented persistence boundary rather than silently becoming production-v1 data.

Start the isolated slice at level zero with a clearly labeled accelerated test wallet of 20,000 tokens. This exceeds the unchanged 11,750-token purchase total and permits real gameplay. It is a fixture, not a new economic rule. Provide an explicit confirmed “Reset playtest” action affecting only the two prototype keys; it restores all levels to zero, test wallet and default rug. Preserve damaged originals until explicit reset or valid import, and show failures instead of claiming persistence succeeded. Test unavailable storage, malformed appearance, damaged progress and canceled previews. Do not provide any write-back to production.

Document future migration separately: no migration happens in Phase 4.1. A production proposal would need an approved appearance schema, validated default, backup/import behavior, and atomic migration tests. Accelerated balances and prototype progress are never candidates for automatic promotion.

## Verification and evidence

Track execution in the implementation plan after approval. Required checks:

- Existing unit suite, typecheck, lint/format checks, build/offline checks, and gameplay, UI, purchase and persistence Playwright regressions. Preserve all current production tests; do not weaken assertions to accommodate prototype behavior.
- New tests for every purchase, unchanged costs/rates/limits, reversible free rug choices, preview cancellation, reload/navigation, prototype-only writes, byte-for-byte production sentinel preservation, damaged/unavailable storage, reduced motion and interrupted feedback.
- Capture clean level zero and each of three levels for each category, both confirmed rugs, and reload/navigation, with controlled prototype fixtures. Include a cumulative all-upgrades view and capture key mixed states to expose overlap.
- Verify and open all captures at 1600×900, 1440×900 and 1366×768; include a 1280×720 lower-bound laptop check. Compare each level at matching viewport and scene state. No mobile redesign is in scope.
- Inspect actual pixels for meaningful reward size, perspective, grounding, occlusion, text readability, floor layering and coherent art. Test success is not aesthetic acceptance.
- Record reproducible browser frame-time observations during idle, repeated purchases, previews and repeated navigation, and identify software versus hardware rendering. Do not claim hardware 60 FPS, listening acceptance or universal performance from a synthetic run.

Deliver screenshot paths, exact command outcomes, tested browser/viewports, performance limitations, migration proposal and a concise owner playtest report. Keep generated evidence separate from historical evidence.

## Owner playtest: 10–15 minutes

1. **2 minutes:** inspect a clean lounge without reading the level labels. Explain what looks unfinished.
2. **4 minutes:** buy all three bar levels and all three machine levels in chosen order. After each purchase, identify what changed and whether it feels worth owning. Play a few real spins and return to the lounge.
3. **3 minutes:** buy furnishing levels. Preview both rugs, cancel once, confirm one, then freely reverse it. Describe the preference, if any; no preferred answer.
4. **2 minutes:** reload and navigate to/from the machine. Identify the retained changes without prompting.
5. **1–4 minutes:** ask which upgrade was least noticeable, whether the room feels personally different, and when buying started feeling repetitive. Record actual words and disagreements; do not extrapolate retention or enjoyment metrics.

**KEEP for further exploration:** owner can identify every visual reward without relying on level labels; understands cosmetic versus income benefits; can preview/cancel/switch rugs unaided; confirms room development is satisfying enough to continue exploring; no isolation or persistence defects remain. This is owner evidence, not population validation.

**REVISE:** technically safe slice, but any reward is missed, changes feel incoherent, rug preference lacks value, feedback is confusing, or purchasing feels repetitive. Name the specific failed reward/interaction and revise only that hypothesis.

**REJECT a mechanic:** owner finds a cosmetic choice or purchase category adds no worthwhile environmental value even after seeing it correctly, or it demands management contrary to Cozy Idle Lounge. Persistence/isolation failure blocks playtesting and integration regardless of preference.

Phase 4.2 recommendation must separate verified implementation evidence from owner feedback still pending. With no completed owner playtest, recommend holding integration and running this protocol, not asserting KEEP or starting Phase 4.2.

## Known limits and builder discretion

- Accelerated progression tests visible rewards and comprehension, not waiting cadence, long-term economy or retention.
- Two rugs test only one personalization decision. There is no cosmetic market, rug inventory or additional furnishing category.
- Existing finite progression, local clock trust and slot balance remain unchanged.
- Missing specialized game skills cannot be treated as loaded guidance. Follow the available Impeccable, animation and test workflows and actual Phaser/project APIs.
- Builder owns exact geometry, draw ordering, static art implementation, fixture plumbing and tests within these constraints. No new package or broad architecture rewrite is expected.
