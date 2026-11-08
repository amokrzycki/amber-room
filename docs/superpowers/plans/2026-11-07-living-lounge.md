# Living Lounge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved isolated Phase 4.1 slice with visible rewards for all nine purchases and two reversible rug appearances.

**Architecture:** A separate development HTML entry enables a narrow prototype mode before dynamically importing the existing game entry. The existing runtime uses a prototype storage adapter only in that mode; production SaveOwner, save shape, catalog and slot engine remain unchanged. Prototype-only room painting and controls extend SalonScene without replacing production rendering.

**Tech Stack:** Existing Phaser 4.2.1, TypeScript, Vite, Vitest, Playwright and Biome. No dependencies or generated assets are required unless static authored art cannot meet the approved visual bar.

**Spec:** `docs/superpowers/specs/2026-11-07-living-lounge-design.md`

## Global Constraints

- No commit, push, publication, or Phase 4.2 work is authorized.
- No changes to catalog prices, purchase limits, rates, income accounting, slot RNG, payouts, RTP, or production save semantics.
- No imports from Opening Hours; no multipliers, currencies, prestige, extra playable machines or cosmetic catalog.
- Preserve incumbent artwork, composition, fonts, accessibility, reduced motion, settings and production default behavior.
- Prototype save key: `amber-room:prototype:living-lounge:v1`; appearance key: `amber-room:prototype:living-lounge:appearance:v1`.
- Prototype startup must never read, create or change `fruit-salon:v1`. No automatic production import or write-back.
- Test wallet 20,000; nine purchases still cost 11,750; baseline/full income remains 64/160 tokens/hour.
- Rug styles: Claret weave and Moss weave; unlocked at furnishings level one; no extra costs or income differences.
- Local reveal target 240ms; no movement with OS/game reduced motion or zero effects intensity.
- Desktop/laptop verification: 1600×900, 1440×900, 1366×768 and 1280×720. No mobile redesign.
- Do not repair pre-existing `.impeccable/design.json` drift as part of this task.

## Review Focus

- Damaged/unavailable prototype storage must preserve originals or warn, never fall back to production; Task 1 tests this.
- Preview interruption by Escape, navigation, reload or a new purchase must not persist an unconfirmed rug; Task 3 tests this.
- Rapid purchases and preference changes must settle local feedback without leaving hidden objects or orphaned work; Task 3 tests this.
- High-level combinations can cover rugs, stools, wallet or controls despite isolated reward tests; Task 4 captures mixed/maxed states at all target sizes.
- Export/import and resets must stay within prototype boundaries, including machine settings; Tasks 1 and 3 test production sentinels and navigation.

---

## File responsibilities

- Create `src/runtimeMode.ts`: explicit prototype boot flag, enabled only before loading the existing game entry.
- Create `prototypes/living-lounge.html` and `prototypes/living-lounge.ts`: standalone development entry markup and mode-first dynamic bootstrap.
- Create `prototypes/living-lounge-state.ts`: pure prototype save adapter, validated appearance persistence, accelerated fixture and prototype-only reset.
- Modify `src/runtime.ts`: select the adapter when the explicit mode is enabled; preserve ordinary SaveOwner construction otherwise.
- Create `src/view/livingLounge.ts`: static room artwork/groups and prototype reward descriptions, reusing existing images and painter conventions.
- Modify `src/view/SalonScene.ts`: guarded prototype room rendering, rug preview controls and lifecycle-aware local feedback.
- Modify `src/view/ui.ts`: guarded prototype labeling/export names only; existing production strings and operations stay unchanged.
- Modify `src/style.css`: scoped prototype controls, keeping existing typography and stage scaling.
- Create `tests/living-lounge.test.ts`, `tests/e2e/living-lounge.spec.ts`: state/unit tests and real browser interaction/isolation checks.
- Create `scripts/capture-living-lounge.mjs`: deterministic isolated screenshot/performance capture driver using installed Playwright.
- Create `docs/phase41-living-lounge.md`: tested outcomes, screenshot index, limits, playtest protocol, proposed migration and evidence-based next-phase recommendation.
- Add focused art provenance to `docs/asset-generation.md` if new procedural room artwork ships; production assets are not replaced.

## Task 1: Isolated playable runtime and persistence

**Consumes:** `SaveOwner`, `SAVE_KEY`, `createSave`, `parseSave`, existing `src/main.ts`.

**Produces:** `livingLounge: boolean`, `enableLivingLounge(): void`; pure `createLoungeStorage(storage: Pick<Storage, "getItem" | "setItem">, nowMs: number): Pick<Storage, "getItem" | "setItem">`; `RugStyle = "claret" | "moss"`; `readRug(storage): { style: RugStyle; warning: string }`, `writeRug(storage, style: RugStyle): { ok: boolean }`; `resetLounge(storage: Storage, nowMs: number): void`. Appearance envelope is `{version: 1, rug: RugStyle}`. A missing prototype game save yields a validated accelerated fixture; invalid existing game saves still pass through SaveOwner protection.

- [x] Write unit tests for default 20,000 balance/zero levels, all nine unchanged purchases (remaining balance 8,250 at fixed time), rates 64→160, free appearance changes, invalid appearance fallback with warning, unavailable storage, damaged game original preservation, and strict adapter rejection of unexpected keys. Assert no storage spy reads/writes production key.
- [x] Run `npx vitest run tests/living-lounge.test.ts`; confirm failure from missing implementation.
- [x] Add the mode module, pure storage/appearance helpers, development HTML/TS bootstrap and guarded runtime adapter. Bootstrap enables mode before `await import("../src/main")`; do not statically import main/runtime first. Production entry never enables it. Reset confirms in UI before calling the pure helper and touches only prototype keys.
- [x] Run focused tests and `npm run typecheck`; require PASS. Verify `/` and `/prototypes/living-lounge.html` both load without modifying actual user saves by using fresh automated browser contexts.

## Task 2: Static, coherent reward artwork

**Consumes:** `Businesses`, `RugStyle`, original room/bar/machine textures and current stage coordinates.

**Produces:** `drawLivingLounge(scene: Phaser.Scene, businesses: Businesses, rug: RugStyle): { room: Phaser.GameObjects.Container; groups: Record<Item, Phaser.GameObjects.Container> }`; `loungeReward(item: Item, level: number): string` for preview/purchase descriptions. Named groups permit bounded local reveals and browser inspection without production cheat hooks.

- [x] Read Impeccable `reference/craft-floor.md` immediately before UI edits. Record the existing-world direction contract in the lounge surface brief using the Impeccable launcher; no new identity/comp tournament.
- [x] Add failing unit assertions for all nine distinct reward descriptions and no furnishing income; add browser assertions for named room groups and visible cabinet count 1–4.
- [x] Run focused unit/browser checks to observe expected missing-feature failures.
- [x] Implement grounded static layers: floor rug first, shadows, bar/cabinets, plants and nameplate. Bar: empty→existing bar→two upholstered stools→matching stocked back-bar display. Machines: retain one cabinet per purchase. Furnishings: rug→two planted brass planters→engraved brass nameplate with existing display font. Rug styles share geometry with clearly different burgundy/moss material. Reuse cached CanvasTexture painter conventions for missing materials; no per-frame painting or arbitrary ornaments.
- [x] Wire only the prototype branch of SalonScene to the painter; keep original production drawRoom implementation. Add procedural-art provenance. Run focused tests, typecheck and build; require PASS before interaction work.

## Task 3: Rug controls and connected purchase feedback

**Consumes:** Task 1 mode/state helpers, Task 2 room groups/descriptions, existing catalog/purchase functions and mountUI.

**Produces:** Prototype-only inline preview/apply/cancel controls, explicit prototype label and confirmed reset control; local interruptible feedback, specific purchase announcements and economic benefit copy. No production UI changes when mode is false.

- [x] Add failing browser tests: rug control locked before furnishing one; immediate room preview; Apply persists; Cancel/Escape/navigation restore; reload discards preview; appearance switching costs zero and preserves rates; confirmed style survives machine visits/reload; all purchases deduct exact catalog prices and cap at three; maximum benefits remain clear.
- [x] Add failing isolation/error tests: seed byte-for-byte production sentinel; exercise purchases, spins, settings export/import, preview, reset/reload; sentinel unchanged. Add malformed progress/appearance, denied writes and storage getter denial. Reset cancellation must preserve both prototype values. Verify exported filenames label prototype progress; document appearance export boundary.
- [x] Add failing lifecycle tests for rapid purchases, OS and game reduced motion, zero effects intensity, navigation, hidden-page interruption and preference changes. Check final room group alpha is one and no reveal remains active after settling; keyboard focus and status messages remain usable.
- [x] Run `npx playwright test tests/e2e/living-lounge.spec.ts --workers=1`; confirm expected feature failures.
- [x] Implement inline rug chooser using existing native button/focus styling. Keep only confirmed preference persistent; dispose preview on every exit. Add guarded prototype labels/export filename and Reset playtest confirmation. Use existing status region for reward/new-level/economic result; do not repeat it on income ticks.
- [x] Implement one local 240ms opacity reveal for the affected group. Kill and settle prior feedback on new work, reduced-motion changes, hidden page or shutdown. Respect OS/game reduced motion and zero intensity; never animate room-wide geometry.
- [x] Run focused unit/browser suite and typecheck; require PASS.

## Task 4: Regression, rendered evidence and owner handoff

**Consumes:** Working slice and all previous tests.

**Produces:** Screenshot matrix under `docs/evidence/phase41/`, reproducible performance JSON, complete `docs/phase41-living-lounge.md`, independent finish review and unchanged incumbent design-system documentation.

- [x] Run `npm test`, `npm run typecheck`, `npm run check`, `npm run build`, `npm run check:offline`; record exact counts/results. Run full existing Playwright regressions serially or with bounded workers so software rendering does not introduce avoidable load; record failures rather than weakening tests. Production tests still load the normal offline artifact.
- [x] Implement capture driver with independent temporary browser contexts and controlled prototype fixtures. Capture zero; each category's levels 1–3 from zero; cumulative all-upgrades; both confirmed rugs; reload and round-trip navigation; mixed layout; preview/error/focus states. Match screenshots at all four target viewports. Never use the user's browser storage or import production progress.
- [x] Capture performance during idle, purchase sequence, repeated rug changes and repeated scene visits. Record frame intervals, renderer/browser and errors; distinguish software measurements from owner-hardware FPS claims.
- [x] Open and inspect every capture, preferably in contact sheets plus full-size key states. Batch visual fixes, recapture, and confirm named screenshots match states. No aesthetic acceptance from tests. Run Impeccable detector once on changed UI files after visual work; fix mechanical findings.
- [x] Request fresh Impeccable finish review with screenshot matrix, spec, direction contract, craft floor and detector findings; apply material findings and recapture as directed. Request documentation check as the skill directs, preserving DESIGN.md/sidecar on this ordinary extension.
- [x] Write concise owner instructions, exact tested outcomes, screenshot index, performance limits and proposed migration. Include the approved 10–15 minute protocol and KEEP/REVISE/REJECT criteria. If owner feedback is absent, explicitly hold integration pending playtest; do not claim enjoyment or start Phase 4.2.
- [x] Run final verification on touched files and inspect `git diff --check` / `git status --short`; leave changes uncommitted. Mark completed plan checkboxes and report known limits.

## Plan self-review

Spec coverage maps isolation/persistence to Task 1, all visible rewards to Task 2, personalization/feedback to Task 3, and regression/rendered evidence/performance/playtest/migration to Task 4. The five review-focus cases have explicit owning tests or captures. All interfaces use the same boolean mode, RugStyle values and storage namespaces. No implementation requires a new dependency, economy change, production migration, or automatic next phase.
