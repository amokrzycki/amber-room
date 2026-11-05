# Amber Room Phase 2: Cabinet Craft

The user's Phase 2 brief authorizes a bounded presentation pass and independent review. Phase 1 is the behavioral baseline. No game rules, input, settlement, announcements, save data, reel geometry, fruit, paylines or timing change.

## Direction and implementation

Use the existing `salon-machine.png` as the visual target: burgundy enamel, rounded brass window, fluted crown, side pillars and stepped plinth. Adapt its upright construction to the established landscape playable view. Warm light comes from above left; exposed brass has a narrow highlight, dark return and contact shadow. Keep the existing dark reel wells and cream functional text.

Use a static CanvasTexture rendered by Phaser, cached once in the game texture manager. A small cabinet module owns the decorative geometry and reusable material/bevel drawing. This avoids repeated vector tessellation, additional bitmap downloads and new effects pipelines. Native DOM controls retain their coordinates, sizing, focus and accessibility semantics; only the machine's selector/action material styling changes. A generated painted cabinet was considered but would introduce an unnecessarily large asset and uncertain aperture alignment. Pure Graphics was considered but does not provide the same controlled curved material shading.

## Scope and proof

- [x] Capture the unchanged production build at 1280×800, 1366×768, 1600×900 and 1920×1080, with real deterministic outcome fixtures.
- [x] Measure the existing release build using the existing offline performance script, without concurrent browser captures.
- [x] Add `src/view/cabinet.ts`; replace only decorative drawing in `SlotScene.create`; scope CSS to existing slot controls. No dependencies or fruit/room asset edits.
- [x] Add a focused cache/lifecycle check for the procedural texture. Capture idle, spinning/disabled, loss, partial, break-even, win, jackpot/long text and keyboard focus at every requested size.
- [x] Run existing unit, build, offline, Phase 1 browser, gameplay and reel-clipping checks. Compare layouts/font sizes to baseline and inspect actual rendered images.
- [x] Have a fresh default-model reviewer assess the six requested design criteria against the lounge, both render sets and actual diff. Resolve demonstrated regressions; record preferences separately.
- [x] Report measured performance, changed files, comparison evidence and limits. Phase 3 and deferred payline improvements stay outside scope.

Review focus: text crossing the new bezel/deck, bevel highlights competing with reels, focus/disabled contrast, cached texture growth across scene visits, and soft rendering at laptop scale. Screenshots and browser assertions provide the corresponding checks; GPU/user-hardware performance remains unverified.
