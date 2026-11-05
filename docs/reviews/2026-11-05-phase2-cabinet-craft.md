# Amber Room — Phase 2: Cabinet Craft & Visual Cohesion

## Result and scope

The playable Orchard No. 7 now carries the lounge miniature's burgundy enamel, aged brass bezel, fluted fittings, small fan ornaments and stepped base. Dark wood returns, bevel shadows and a recessed instrument deck give the existing wide cabinet more physical depth. The reels remain the largest and brightest subject; START retains its raised brass treatment. No raster fruit or lounge artwork changed.

This is a landscape adaptation of the reference, not a reproduction of its portrait silhouette or painted volumetric fidelity. The independent review judged continuity improved and found no demonstrated visual regression. Physical richness is a visual judgment supported by rendered inspection, not by passing tests.

The protected game modules, reel rendering/cropping, symbol mappings, payout and RNG, all 15 bets, economy, balances, save format, input handlers, spin completion, result copy, announcement guard, effects and timing constants are unchanged. The only `SlotScene` edits replace decorative drawing and ornaments. Phase 3 and deferred payline improvements are excluded.

## Rendering strategy

Phaser owns the cabinet, reel backing, fruit and existing feedback. The cabinet painter bakes one 1530×780 CanvasTexture using the shared texture manager, then reuses it across scene visits. Four cropped image quads draw only the cabinet around the reel field. Native Phaser Graphics draw the matching dark gradient bands and dividers inside the aperture. Small drawing helpers keep bevel, brass, fastener and fan construction consistent; no new library, shader, render loop or animation is introduced.

The DOM retains all functional text, native bet controls, START/SKIP, focus rings, status regions and dialog semantics. CSS changes affect only the existing slot selectors and primary action materials. Disabled controls use opaque readable text on dark surfaces. Phase 1 scale compensation, positions and font sizes are unchanged.

## Visual evidence

Open [the full state/size comparison](../evidence/phase2/comparison.html) or [the draggable idle comparison](../evidence/phase2/comparison-inline.html). Evidence lives in the repository's existing ignored `docs/evidence/` directory and is available locally; commit or copy that directory separately if sharing the source checkout.

Both builds have native-resolution PNGs at **1280×800, 1366×768, 1600×900 and 1920×1080**. Each size includes idle, spinning with disabled controls, loss, partial return, break-even, win, active jackpot celebration, completed jackpot, long result and keyboard focus: **40 machine captures per build**, plus four lounge captures per build.

Captures use production offline HTML, fresh browser profiles and identical forced-stop fixtures injected by the test harness. The before artifact is the untouched Phase 1 build from commit `0f2c076a8be452324470b95569dfe33a21438e60`; its byte count and SHA-256, alongside the final build's, are recorded in `artifacts.json`. No player's save is used. Spinning screenshots were requested 400 ms after START; software screenshot latency varies, so these are matching states rather than a claim of identical animation timestamps. The initial virtual-clock attempt conflicted with Phaser's lag smoothing and was discarded.

`before-checks.json` and `after-checks.json` record actual element bounds, fit, overlaps, font sizes and expected outcomes. `comparison-checks.json` compares those records: no control geometry or rendered font-size changes, all screenshots have the requested dimensions, and the four lounge pairs are pixel-identical. Outcomes include the short zero-return result and the maximum-stake long result: `Stake 200 · Returned 13,055 · Net +12,855`.

The first visual inspection exposed a lower brass rail crossing the spin hint. It was moved below the controls before the final evidence. Final idle, spinning/disabled, loss, break-even, win, jackpot, long-text and focus renders were inspected; no decorative crossing or demonstrated text regression remains.

## Verification

- `npm test`: 40 tests across 11 files passed. The new focused cabinet test proves a single bake/refresh across 13 scene visits; after the sampling correction its focused run passed with the four crop regions asserted.
- `npm run typecheck`, `npm run build` (including repository Biome checks), `npm run check:offline` and `git diff --check`: passed. Offline validation retains all 22 embedded image/audio assets and rejects runtime files, network dependencies and developer controls.
- `scripts/browser-cabinet.mjs`: matching outcomes and all four resolutions; verifies disabled START, back and both selectors, text fit, stage bounds, control overlaps and final payout. No page errors or network requests.
- `scripts/browser-ux-clarity.mjs`: 22 actual spins, all 15 bet combinations, initial/loss/partial/break-even/win/skip, exactly one final announcement, silence during counting, held-input protection, focus, restored old-save results and unchanged lounge descriptions/costs.
- `scripts/browser-acceptance.mjs`: offline gameplay, supported line counts, save before motion, skip/Space/held Enter, repeated scene transitions and settings restoration. One audio context and no active sound after repeated transitions.
- `scripts/browser-save-business.mjs`: eight-hour income cap, all nine purchases and persistence, 50-token round, export/import, atomic invalid imports, damaged-original protection, recovery and storage-denied play.
- `scripts/browser-reel-clipping.mjs`: four moving frames; reel pixels move while upper/lower cabinet pixels remain unchanged; no unsupported-mask warning or page error.

Impeccable's mechanical scan reported advisory type/palette documentation mismatches, including pre-existing values and the intentional material ramps. Those are not evidence of visual defects or a reason to change protected functional type. The new material roles are documented in DESIGN.md and asset provenance. Rendered evidence and the independent review determine the visual verdict.

## Performance observations

Measurements use production HTML, Chromium 156 and **SwiftShader software rendering** on an AMD Ryzen 7 5800X3D. The repeated fixture is the 40×5 maximum payout, with 12 lounge/slot round trips. Hardware GPU timing and player-device FPS are not available. No FPS improvement is claimed.

The initial full-cabinet quad produced a repeatable slowdown: mean RAF interval was 29.51/29.66 ms versus baseline 24.72/24.42 ms; p95 rose from 33.4 to 50 ms. This was treated as a regression. Omitting texture sampling over the 1020×432 reel field removed 440,640 sampled pixels per reference-resolution frame (36.9% of that quad) while leaving the independently reviewed cabinet/control pixels unchanged. A subsequent measurement gave 25.61 ms mean RAF interval, 33.4 ms p95 and 0.80 ms p95 main callback, versus baseline 1.50/1.60 ms p95 callback. This supports removal of the large observed regression, not a statistically established frame-rate improvement; a small software-rendering cost can remain.

The final sequential pair (with no screenshot or test jobs running) measured:

| Metric              |  Phase 1 | Final Phase 2 |
| ------------------- | -------: | ------------: |
| Mean RAF interval   | 24.19 ms |      25.73 ms |
| Median RAF interval |  16.7 ms |       33.3 ms |
| p95 RAF interval    |  33.4 ms |       33.4 ms |
| Mean main callback  |  1.25 ms |       0.95 ms |
| p95 main callback   |  1.50 ms |       0.80 ms |

The final build retains a **1.54 ms / 6.4% higher mean RAF interval in this synthetic run**. The larger initial regression was reduced; complete performance parity is not established. The median interval crossing a refresh step is visible in the table rather than hidden behind the unchanged p95. These short software-rendered runs are not a hardware GPU benchmark or proof of perceived smoothness. Final raw files: `performance-before-final.json` and `performance-after-final.json`.

The texture adds **4.55 MiB of base RGBA GPU pixels**, plus CPU canvas/image buffers and renderer overhead. Instrumented WebGL observed two initial uploads (blank allocation and painted refresh) and no additional cabinet uploads across scene visits. DOM counters remain 434 nodes / 99 event listeners before and after 12 round trips in both builds. The final HTML is 6,630,410 bytes versus 6,627,337 bytes before (+3,073 bytes); no raster download was added.

Raw measurements are `performance-before.json`, `performance-before-repeat.json`, `performance-after.json`, `performance-after-repeat.json` (initial implementation) and `performance-after-cropped.json` (sampling correction), under the evidence directory. The historical `docs/performance-report.json` is preserved.

## Independent design review

See [the independent review](2026-11-05-phase2-independent.md). It assesses material continuity, physical credibility, hierarchy, ornament restraint, laptop readability and preservation of identity against the source miniature and all four screenshot sizes. Its verdict is **visual pass, no demonstrated objective regression**. It separates that verdict from subjective reservations: the cabinet remains flatter than the miniature, its frame is heavier, and fan fittings replace the previous small cherry/side-wordmark decorations. A second independent reviewer inspected the final cropped renderer, all four final idle sizes, and representative spinning/celebrating/long-result states, finding no objective rendering regression or visible seam. Its initial performance proof gap was addressed afterward by the measurements above; the remaining synthetic cost is explicitly recorded.

## Changed assets and files

| File                                      | Change                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/view/cabinet.ts`                     | New procedural cabinet texture, cache, cropped drawing and native reel backing.    |
| `src/view/SlotScene.ts`                   | Call cabinet painter; replace decorative header/side ornaments only.               |
| `src/style.css`                           | Scoped selector and START/SKIP material/disabled treatments.                       |
| `tests/cabinet.test.ts`                   | Cache, lifecycle and crop-region proof.                                            |
| `scripts/browser-cabinet.mjs`             | Reproducible four-resolution, ten-state capture and layout assertions.             |
| `scripts/browser-performance.mjs`         | Optional artifact/report paths and WebGL upload observation.                       |
| `DESIGN.md`, `docs/asset-generation.md`   | Material roles, rendering ownership, procedural asset provenance and memory limit. |
| Phase 2 plan and these two review reports | Scope decisions, evidence, independent assessment and limitations.                 |

Changed raster/audio assets: **none**. New runtime asset: the cached procedural `orchard-cabinet` texture. `dist/index.html` is rebuilt and remains ignored by existing repository rules.

## Remaining limits

No physical-laptop, hardware-GPU, Safari/Firefox, browser zoom/OS scaling, screen-reader speech or headphone listening verification. Existing fixed landscape scaling remains; no mobile redesign or full safe-integer balance stress rendering was added. The brass is deliberately restrained and the construction illustrative; it does not reproduce every painted highlight, lever or physical dimension of the miniature. Final artistic acceptance remains the user's judgment.
