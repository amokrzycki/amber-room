---

target: slot machine screen
total_score: 28
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 1
target_identity: "file:/home/adrian/Repos/slots/src/view/SlotScene.ts"
target_fingerprint: "sha256:b69f8b14b0df33d8cdc2ebee0affc522751b6017b84b90bc742ef2dc517b7af1"
target_path: /home/adrian/Repos/slots/src/view/SlotScene.ts
timestamp: 2026-11-05T10-50-05Z
slug: src-view-slotscene-ts
---

Method: dual-agent (A: /root/design_review · B: /root/detector_review)

The lounge has the stronger identity. The machine is easy to operate, but its flatter cabinet loses some of the room’s richness. Preserve the wine, brass, fruit artwork, and calm pacing; improve material continuity, result clarity, and small text.

Design specificity: Both screens feel authored for The Amber Room. The illustrated interior, named machine, finite lounge investments, and restrained atmosphere form a coherent world. The main weakness is the transition from richly rendered room artwork to a largely flat, code-drawn cabinet.

## Design health

Scores are judgment calls informed by live desktop/laptop inspection and source review, not accessibility certification.

| Heuristic               | Lounge /4 | Slot /4 | Main observation                                                |
| ----------------------- | --------: | ------: | --------------------------------------------------------------- |
| System status           |         3 |       2 | Visible values; completed spin result lacks a live announcement |
| Real-world language     |         3 |       3 | Warm copy; gross return still requires interpretation           |
| Control and freedom     |         3 |       3 | Clear entry/back, native dialogs, skippable wins                |
| Consistency             |         3 |       3 | Shared palette and controls; material treatment diverges        |
| Error prevention        |         3 |       3 | Unaffordable purchases and busy controls guarded                |
| Recognition over recall |         3 |       2 | Active line paths and profit require extra work                 |
| Efficiency              |         3 |       3 | Direct actions and Space support                                |
| Aesthetic restraint     |         3 |       3 | Clear main actions; small type and cabinet trim need refinement |
| Error recovery          |         3 |       3 | Useful source-backed balance/storage/import messages            |
| Help                    |         2 |       3 | Rules available; optional lounge spending underspecified        |
| Total                   |     29/40 |   28/40 | Both Good; targeted improvements warranted                      |

## What works

- The lounge’s red walls, lamplight, parquet, and serif typography establish a convincing private arcade.
- Play Orchard No. 7 and START have clear priority. The separate machine view lets the reels dominate.
- Finite upgrade levels, visible prices, native controls, and calm/skippable effects fit the product’s low-management brief.

## Priority issues

1. **[P2] The full-size cabinet loses the lounge’s material richness.** The miniature cabinet looks like an ornate physical object; the playable one reads as a broad wine panel with nested outlines. Carry over a few specific details—brass edge shading, a more substantial reel bezel, and a deliberate control deck—while retaining the current layout. Avoid extra glow. Evidence: src/view/SlotScene.ts:35 and src/view/SalonScene.ts:147. Suggested command: `$impeccable polish`.

2. **[P1] The result needs a clearer ending.** GROSS PAYOUT is accurate, but the player must subtract the completed spin’s stake to understand profit. The initial placeholder even shows matching rows with payout zero. Keep the gross figure, add a quiet summary such as “Returned 3 · Cost 5 · Net −2,” and give the unplayed state an explicit label. Announce the completed result through the existing status region; currently the result label/payout have no live region while spin-status is cleared. Use the completed spin’s stake, not newly selected bet settings. Evidence: src/view/SlotScene.ts:67,74,183,201. Suggested command: `$impeccable clarify` plus `$impeccable harden`.

3. **[P2] Optional lounge spending explains itself too late.** “Buy the room a round 50” sits beside investments, but only after purchase says “No bonus — just a moment.” Put “50 tokens · celebration only” at the decision point, and explicitly identify furnishings as cosmetic. Keep the warm voice, while making the consequence clear before spending. Evidence: src/view/SalonScene.ts:31,54,118. Suggested command: `$impeccable clarify`.

4. **[P2] Laptop scaling makes useful information feel like fine print.** At 1280×800 the game occupies 1280×720 and scales the overlay to 80%. Labels, upgrade levels, and status hints become roughly 9–12 rendered pixels. Raise the smallest functional text first and protect the wallet against the busy floor artwork. This is a desktop readability issue, not a request for mobile reflow. Evidence: src/style.css:49,65,182,222,327,343. Suggested command: `$impeccable typeset`.

5. **[P2] The selected paylines are detached from the reels.** “Lines: 5” does not explain “first five paths.” The rules dialog then reveals all 40 paths. Provide a compact active-path preview near the line selector, and foreground active paths in the dialog while retaining the complete catalog as secondary reference. Evidence: src/view/SlotScene.ts:74 and src/view/ui.ts:76. Suggested command: `$impeccable clarify`.

## Cognitive load and emotional journey

The lounge has moderate choice load: Play plus three upgrades plus the room round are five apparent actions, although the three upgrade rows are well grouped. The slot’s primary action is clear; understanding a return and recalling active paths create avoidable mental work. Its line selector has five numeric options when opened, which is a modest choice count rather than a reason to remove supported values. The largest reference load is the 40-path catalog.

The lounge builds welcome and anticipation. The biggest emotional dips are an unexplained optional expense and a spin ending without an immediately legible profit/loss story. Celebration timing and sound were source-reviewed, not played in this run.

## Persona red flags

- Jordan, first-timer: cannot know the room round has no mechanical benefit before spending, or tell net profit directly from the large payout.
- Sam, screen-reader/low-vision user: controls have native semantics and focus styling, but the reels are canvas-only and completed results lack a live announcement; small scaled labels impose additional visual effort.
- Alex, returning player: Space and skip are useful; active-path inspection still requires leaving the play surface for the rules dialog.

## Minor observations

Use symbol thumbnails beside payout-table names to connect rules to the fruit art. Keep DEV scenario buttons out of production judgments: they are development-only. Preserve the existing palette and system fonts.

## Detector evidence

The CLI scan of src returned 34 findings: 1 overused-font warning, 23 font-size advisories, and 10 color advisories. The Arial warning at src/style.css:2 conflicts with the explicitly documented font choice and is a false positive. The other findings mostly concern literal values absent from extracted token lists; they do not establish visual defects. Font-size locations: src/style.css:104,170,195,229,233,246,256,284,310,328,332,344,356,387,391,396,447,480,492,511; src/view/SalonScene.ts:200; src/view/SlotScene.ts:55,65. Color locations: src/style.css:108,196,285,299,311,315,372,393,420,481. The independent visual review and browser geometry support the small-type concern; the detector cannot judge the canvas cabinet’s material treatment.

## Questions to consider

Which should lead the next pass: cabinet material/detail, clearer outcomes and spending, or laptop readability? Should that pass address the top three issues or all five while preserving the current visual identity?
