# Phase 3.3 closure · technical verification

2026-11-05. Owner-directed UX corrections only. **Owner aesthetic acceptance is not asserted.**

## Implemented scope

- The winning-line count is a compact button in the existing RETURNED header. Ordinary gameplay has no result overlay. Opening Win details uses the existing native modal shell with an independent 5×3 diagram and a bounded scrolling line list.
- The dialog reads the saved outcome: original line numbering, actual symbol identities (including WILD), paying counts and exact payouts. Selection changes only its diagram. Pointer, arrows and Home/End select; Tab/Shift+Tab wrap; Escape/Close restores trigger focus. The full line path, paying-cell dots, selected-row underline and explicit row description provide information independent of hue.
- The main result thread changes from mint to warm brass. Feathered plates remain behind symbol art. No symbol outline was added, so WILD keeps its own single asset border. Fruit, WILD substitution, overlapping wins, five WILDs and long multi-line results are covered by captures/tests.
- The lower pair of enamel screws was removed. Upper/nameplate fasteners remain. SPIN position/footprint, Marcellus + Source Sans 3 and the HUD structure remain unchanged.
- During an active unskipped celebration, first SPIN dismisses only; it never calls `requestSpin`. A subsequent distinct activation can wager after the existing 350ms re-arm interval. The shared dismissal path also protects Escape/canvas dismissals. Held key repeats and keyboard-generated click echoes remain suppressed. Settlement remains the single pre-animation save transaction.

Production reach: `SlotScene.ts`, `resultDetails.ts`, `winMarks.ts`, `cabinet.ts`, `style.css`; the existing dialog shell and assets are reused. Production `src/game`, `main.ts`, `runtime.ts`, RNG, payout evaluation, save schema and economy constants are unchanged. README, DESIGN, decisions, playtest instructions and dependent browser selectors/expectations were updated. The isolated P1 lab is documented separately in `../phase40-opening-hours.md`.

## Regression evidence

- `npm run check` and `npm run typecheck`: pass.
- `npm test`: **63 tests / 17 files pass**, including exhaustive reel enumeration, session/gameplay, saves, businesses, existing long-term balance tests, P1 accounting invariants and the new 180-day progression model.
- `npm run build`: pass. `node scripts/check-offline.mjs`: standalone file pass, 22 embedded image/audio assets, no external references or developer controls.
- `node scripts/browser-phase33.mjs`: **247 checks pass**, all four supported desktop sizes (1280×800, 1366×768, 1600×900, 1920×1080). Includes first celebration activation without a wager, rapid pointer echoes, held/released Space, distinct next spin, unchanged SPIN rectangle, all dialog states, saved symbols/line payouts, keyboard selection, focus containment/restoration, viewport fit, reload/navigation preservation, zero page errors and no network requests.
- `node scripts/browser-phase32.mjs`: **57 checks pass**. Shared navigation, loaded fonts and Georgia fallback, tabular figures, warm brass pixels between WILD tiles, no mint painted over WILD, pass-through machine hit testing, unchanged machine marks after dialog selection, focus restoration, no errors/network.
- `node scripts/browser-save-business.mjs`: pass. Eight-hour offline cap, all nine purchases and persistence, round cost, export/import, atomic invalid import, damaged-original protection through a spin and recovery, storage-denied play in memory.
- `node scripts/browser-acceptance.mjs`: pass. Standalone offline gameplay, selectable lines/bets, predetermined result classes, exact pre-animation settlement, held-key behavior, repeated scene/audio lifecycle, settings persistence. Audio probe after repeated transitions: one context, zero active voices.
- `node scripts/browser-idle.mjs`: pass. Hidden close does not checkpoint another absence; returning after 24 hours credits eight hours once.
- `node scripts/browser-idle-baseline.mjs` and `node scripts/browser-opening-hours.mjs`: pass; controlled delivery/reload baseline and isolated prototype accounting/copy/reset namespace protection. See Phase 4 report for assumptions.
- `node scripts/browser-phase31.mjs`: **16/16 scenarios pass** on the final rerun. Covers deliberate SPIN/SKIP/dismissal gestures, held keys and click echoes, two-frame skip settlement, 30 random-timing spins with exact-once settlement, stable HUD across result classes and four viewports, long-result scrolling, count interruptions, reload during a committed spin, navigation, responsive scaling, reduced motion, keyboard semantics and no console/network errors.

The celebration-wager regression was first run against the prior standalone build and failed because the first SPIN advanced `nextSpinId`. The updated UI suite then passed after the fix. Its first dialog pass also exposed a Tab-to-body focus gap; explicit boundary wrapping fixed it.

Historical tests expecting an immediate new wager during a celebration were revised to assert dismissal, unchanged wallet/spin ID and a subsequent distinct wager. The older SKIP latency check claimed "two frames" but asserted a fixed 100ms wall-clock limit; under concurrent headless load it reported 125ms. It now measures the stated two-frame condition directly. This is state-transition evidence, not hardware FPS acceptance. Test contexts close in `finally` so failures cannot leave active games consuming resources.

The required Impeccable detector ran once. It reported advisory palette/type/radius drift against the older sidecar, including incumbent values and the intentional warm-brass/selected-wine additions documented in DESIGN.md. Those advisories are not aesthetic approval. No general art-direction changes or sidecar regeneration were performed.

## Before/after captures

All captures use the actual browser game and deterministic stop fixtures, not mockups. The reference outcome for the comparison is `[9,6,0,0,0]`, five lines at one token; both main captures end with the same balance/outcome. Before captures used the untouched Phase 3.2 build before rebuilding this change; after captures use the new standalone build.

- [Before: overlapping result](../evidence/phase33/before-overlap.png)
- [Before: popover obscuring the reel row](../evidence/phase33/before-popover-overlap.png)
- [After: unobstructed overlapping result](../evidence/phase33/after-overlap.png)
- [After: independent result dialog](../evidence/phase33/dialog-overlap.png)
- [After: ordinary fruit](../evidence/phase33/after-fruit.png)
- [After: WILD substitution](../evidence/phase33/after-wild.png)
- [After: long multi-line dialog](../evidence/phase33/dialog-busy.png)
- [Interactive comparison and progression chart](../evidence/phase40/summary.html)

Raw UI assertions: `docs/evidence/phase33/browser-tests.json`; font/pixel/navigation assertions: `docs/evidence/phase32/phase32-tests.json`. Evidence files are generated under the repository's existing gitignored `docs/evidence/` tree; archive them explicitly if they need to accompany a future commit.

## Limits

Headless Chromium/SwiftShader, not owner hardware. No screen-reader listening, speaker/headphone listening, natural 48-hour background scheduling, cross-browser conformance or hardware FPS measurement. Supported desktop sizes were checked; this phase does not claim mobile support. No commit, push or publication. P1 remains isolated and its integration recommendation is REVISE; production's visible-tab accounting advantage remains documented, not silently changed.
