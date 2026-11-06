# Phase 2 cabinet craft: independent review

## Verdict

**Pass for visual scope; no demonstrated objective regression.** The redesign improves the playable cabinet's material continuity with the lounge and the supplied machine miniature while preserving the existing landscape reel and HUD composition. The proof set is broad enough to review the requested outcomes at all four desktop sizes. The post-change performance comparison is pending the parent agent's scheduled sequential benchmark; performance impact is not verified by this review.

## Review scope and evidence

Read `PRODUCT.md`, `DESIGN.md`, `docs/reviews/2026-11-05-phase1-ux-clarity.md`, the Phase 2 plan, the actual tracked and untracked implementation diff, and inspected `src/assets/art/salon-machine.png` plus the before/after captures. Evidence is in `docs/evidence/phase2/`; the full after matrix includes idle, spinning-disabled, loss, partial, break-even, win, celebrating, jackpot, long-result, keyboard-focus and lounge at 1280×800, 1366×768, 1600×900 and 1920×1080. `after-checks.json` records layout bounds, fit and overlap assertions.

Representative comparisons: [before idle, 1280×800](../evidence/phase2/before-idle-1280x800.png), [after idle, 1280×800](../evidence/phase2/after-idle-1280x800.png), [after idle, 1366×768](../evidence/phase2/after-idle-1366x768.png), [after idle, 1600×900](../evidence/phase2/after-idle-1600x900.png), [after idle, 1920×1080](../evidence/phase2/after-idle-1920x1080.png), [after disabled spin](../evidence/phase2/after-spinning-disabled-1280x800.png), [after break-even](../evidence/phase2/after-break-even-1600x900.png), [after jackpot](../evidence/phase2/after-jackpot-1600x900.png), and [the lounge reference composition](../evidence/phase2/after-lounge-1920x1080.png).

## Findings

### Demonstrated checks

- **Hierarchy and readability:** the reel aperture remains dominant; the balance, gross payout, bet selection and primary action retain their Phase 1 positions. Captures show no HUD crossing, clipping or long-result overflow. At 1280×800, compact text remains readable and the disabled START state is still visibly disabled.
- **Outcome/accessibility presentation:** loss, break-even, win and jackpot retain distinct result labels and payout figures. Keyboard focus remains visible in the capture. The HTML controls and role/status markup are not replaced by the cabinet texture; source inspection confirms the new canvas owns only decoration.
- **Fruit, reel geometry and behavior scope:** the implementation changes only decorative cabinet drawing and scoped control materials. Existing reel image creation, dimensions, outcome flow and settlement code are unchanged in the diff. The captured reel window and HUD align with the prior layout; no demonstrated crop regression is visible.
- **Texture lifecycle/cost:** `drawCabinet` checks the shared Phaser texture manager before creating `orchard-cabinet`, then adds an image instance for each scene. The focused test asserts one bake across 13 calls. The 1530×780 RGBA base is 4,773,600 bytes (about 4.55 MiB), before the canvas backing and renderer overhead. This is a single game-lifetime texture, not per-scene growth. Source inspection supports bounded allocation; total memory and GPU upload behavior were not measured here.
- **Material continuity:** burgundy enamel, a layered brass aperture, dark wood returns, plinth and ornamental fans echo the miniature and lounge palette. The ornament now frames the wide reel window instead of copying the miniature's portrait body.

### Objective proof gap

The Phase 2 plan requires a performance measurement of the changed build. At review time, `docs/performance-report.json` is dated 2026-11-04 and `docs/evidence/phase2/performance-before-first.json` is the pre-change capture. The parent agent has scheduled paired pre/post measurements after the sequential browser suite and will save `performance-before.json` and `performance-after.json`. The modified script tracks canvas uploads; until those measurements finish, performance impact remains unverified. This is not evidence of a performance regression.

### Subjective limits

- **Physical credibility:** the extra highlights, bevels and fluting read as a more finished illustrated cabinet, but remain flat canvas-painted shapes. They do not reproduce the miniature's polished, volumetric lighting, physical controls or portrait silhouette. “Matches the miniature” is accurate as material and motif continuity, not as fidelity or physical realism.
- **Restraint:** the frame is more ornate and visually heavier than the previous flat cabinet, especially at 1280×800. It still leaves the reels and results clear in the inspected states; whether the fans and broad brass rails are too prominent is a taste judgment.
- **Identity preservation:** the product name is moved into a raised marquee; side “AMBER ROOM” text and cherry ornaments are removed. This makes the machine feel more coherent with its source miniature, but reduces those small prior brand cues. No functional or product-name loss is demonstrated.
- **Laptop readability:** screenshots support legibility at 1280×800 and 1366×768 in the tested desktop layouts. They do not establish readability on physical laptop panels, at browser zoom, or with OS scaling.

## Not tested

No new tests or browser sessions were run for this review. I did not verify actual VoiceOver/NVDA output, zoom or OS scaling, Safari/Firefox, physical-device GPU performance, full balance-range rendering, or run the scheduled performance comparison. Source and screenshots cannot establish these results.

## Final rendering review · 2026-11-05

**Reviewer:** independent final pass in the current Codex review context. **Verdict: pass; no objective rendering regression found.** I reviewed the final source after the crop/native-rendering adjustment; this does not replace or overwrite the first review above.

### Inspected

- Read `src/view/cabinet.ts`, `tests/cabinet.test.ts`, the tracked diff for `src/view/SlotScene.ts`, `src/style.css`, `DESIGN.md`, `docs/asset-generation.md` and `scripts/browser-performance.mjs`, plus `docs/evidence/phase2/sampling-fix-check.json` and the final layout checks.
- Viewed the source miniature `src/assets/art/salon-machine.png` and these final captures with `view_image`: idle at 1280×800, 1366×768, 1600×900 and 1920×1080; spinning-disabled at 1366×768 and 1920×1080; celebrating at 1366×768 and 1600×900; long-result at 1280×800 and 1920×1080. The representative captures cover all four requested sizes and all three requested result/interaction states.
- Read `performance-before-final.json` and `performance-after-final.json`; I did not launch a browser or run tests during this review.

### Objective regressions

None demonstrated. The sampling-fix check reports that all image differences fall inside the reel aperture and that cabinet/DOM pixels outside it are unchanged. The four cropped cabinet quads meet the aperture edges in the viewed captures; the native Graphics reel field has no visible seam or gap against the surrounding frame, and the existing reel cells, symbols, result labels and HUD remain aligned. The viewed disabled and long-result states fit within the cabinet, with status and payout text unobstructed. The source test covers texture reuse, placement and crop coordinates; it was inspected but not executed in this review.

### Six criteria

- **Lounge material continuity:** strong. Warm brass, burgundy enamel, lacquered dark returns and fan motifs carry the miniature’s material vocabulary into the lounge’s palette.
- **Physical credibility:** improved illustration depth through bevels, shadows, stepped rails and dark returns. It still reads as a clean, code-drawn adaptation rather than the miniature’s highly glossy, volumetric physical machine; actual hardware appearance was not tested.
- **Hierarchy:** the reel field stays dominant, with the raised nameplate secondary and the instrument deck holding controls and payout. Captured high payouts remain legible without competing with the symbols.
- **Ornament restraint:** subjective. The frame and side fans are intentionally decorative and make the cabinet feel heavier than the lounge shell. In the viewed 1280×800 capture they do not intrude into the reel aperture or status/control text.
- **Laptop legibility:** desktop captures at 1280×800 and 1366×768 show readable controls, disabled state and payout copy. They do not prove physical laptop readability, zoom behavior or OS scaling.
- **Identity:** the centered ORCHARD No. 7 marquee preserves the machine name and the design now relates more clearly to the supplied miniature. Removing the side “AMBER ROOM” engraving and cherry accents weakens those former machine-specific cues; this remains a subjective brand tradeoff, not a functional or product-name loss.

### Final performance comparison

The matched headless Chromium/SwiftShader run recorded mean RAF interval 24.19 ms before and 25.73 ms after; p95 was 33.4 ms in both, and mean main-callback time fell from 1.25 ms to 0.95 ms. The roughly 1.54 ms slower mean interval is a measured difference worth retaining in the record, but this synthetic software-rendered run does not establish a hardware performance regression. There were no reported JS errors or DOM listener growth, and the after run observed the expected two initial cabinet texture uploads with no repeated scene-visit uploads in the supplied instrumentation report. No physical-device, GPU, or laptop performance claim follows from these data.

### Limits

This review used screenshots, source and saved headless measurements. It did not run tests, exercise browser zoom/OS scaling or assistive technology, inspect other browser engines, or validate on physical hardware. No claim of physical-hardware validation is made.
