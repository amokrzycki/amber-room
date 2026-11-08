# Phase 4.1 — Living Lounge owner handoff

**Recommendation: hold Phase 4.2 integration until the owner playtest and existing release conditions are satisfied.** Independent code, scoped finish and documentation reviews are complete; no owner feedback or owner aesthetic acceptance exists yet. The finish ship verdict covers four fixes only, not the whole aesthetic. This is a development-only vertical slice, not a production migration.

## Play the slice

Run `npm run dev`, then open `http://localhost:5173/prototypes/living-lounge.html`. Production `/` and the standalone `dist/index.html` retain the incumbent lounge. Opening Hours remains a separate, unused prototype.

The labeled 20,000-token wallet is an accelerated fixture. Buy the actual nine upgrades for 11,750 total; the unchanged maximum income is 160 tokens/hour. Additional machines are decorative income upgrades, not new playable games. Furnishings and both rug styles are cosmetic. After the first furnishing, use **Style rug**, preview **Claret weave** or **Moss weave**, then **Apply** or **Cancel**. Escape, closing the chooser, navigation and reload discard an unconfirmed preview. **Reset playtest** requires confirmation and affects only prototype progress/appearance.

Prototype storage keys:

- `amber-room:prototype:living-lounge:v1`
- `amber-room:prototype:living-lounge:appearance:v1`

The prototype never imports or promotes `fruit-salon:v1`. Prototype export/import contains validated v1 game progress only, named `amber-room-living-lounge-prototype-progress.json`. **Rug appearance is excluded from the game backup** and persists separately. Before an intentional reset/import, use **Settings & save → Download damaged original** to preserve damaged progress bytes. Regular **Export JSON** backs up current in-memory progress (the fallback after a damaged load), not the damaged original. Rug appearance has no export action: manually preserve the raw `amber-room:prototype:living-lounge:appearance:v1` value if needed before reset. Storage warnings mean persistence was not confirmed.

## Verification and evidence

Generated evidence lives separately in `docs/evidence/phase41/`; that directory is ignored by Git and must be retained separately with this handoff.

- `npm test`: finish-correction rerun **95/95 passed**, 19 files, 39.44s. Earlier Task 4 final run passed in 33.47s. The original focused offline fixture run was RED (`ENOENT C:\tmp\slots-external-fixture.html`); its minimal unique-temporary-directory fix and all assertions remain unchanged.
- `npm run typecheck`: **passed**, exit 0.
- `npm run check`: historical Task 4 final **failed**, 115 baseline errors in 134 checked files. `npm run build`: historical final **failed** in the same prebuild check; Vite did not run through that command. Neither global gate was repeated in the narrow finish-correction wave. The previously reported baseline was 117; initial Task 4 runs reported 116/132. Exact per-run logs are retained, not replaced by a green claim. Unchanged `.github/workflows/check.yml`, `package.json`, `tsconfig.json`, `vite.config.ts` and `vitest.config.ts` remain affected. No broad CRLF normalization or relaxed checks.
- `npx vite build`: finish-correction rerun **passed**, 55 modules, 4.95s; standalone HTML 7,350.12 kB (gzip 4,381.18 kB). Newly rebuilt current artifact SHA-256: `938b72d813a95be3bedc12a61d9d837edf77447badedcf0f88b4f9e2c0b9e595`. It remains byte-identical to Task 4's production artifact; the revised art and eyebrow are prototype-only.
- `npm run check:offline`: **passed**, 22 embedded images/audio, no file/network references or developer controls.
- Focused `npx playwright test tests/e2e/living-lounge.spec.ts --workers=1`: finish-correction rerun **14/14 passed**, 43.8s, exit 0. Added real source-dimension/shelf-lamp/title-clearance checks at all four sizes and hidden-prototype/visible-production eyebrow assertions to existing cases. Before the fixes, the selected reward case failed for visible eyebrow and −34px lamp overlap; production passed. No literal economics or lifecycle assertion was weakened.
- Full `npx playwright test --workers=1 --global-timeout=3600000`: **historical Task 4 result, not rerun in this wave: 41 passed, 2 failed**, 43 total, 10.6 minutes, exit 1. All 14 lounge cases passed in that run too. Existing `@local` timing/resource cases passed except clipping's missing Python dependency. Failures: missing Playwright FFmpeg blocked video-enabled acceptance startup; missing `PIL` blocked clipping comparison after capture. These remain explicit infrastructure failures, not a green full-suite claim. Node's existing `DEP0205` warning remains non-fatal.

The historical full suite used the explicit production artifact for incumbent gameplay/offline checks. Current focused checks/captures use installed Chrome **156.0.8078.80** through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'`, not a committed channel override. Current logs: `finish-fix-{red,unit,typecheck,biome,vite,offline,e2e,capture,performance}.log`; focused results: `finish-fix-e2e-results.json`. Historical logs remain `verification-*.log` and `verification-final-*.log`; full results remain `e2e-full-results.json`. Current scoped Biome: **8 files clean**; script syntax and diff-whitespace checks passed.

Historical Task 4 investigation preserved those red results. Acceptance passed **1/1 (18.9s)** with the existing `CI=1` no-video path and a temporary config that only reuses port 5173 and redirects reports. Exact command/config are in the Task 4 report; no behavioral assertion changed. A browser-canvas equivalent of clipping's exact RGB regions found **zero changed pixels above/below the aperture in all four frames**, with 138,948–185,675 changed pixels inside. See `e2e-acceptance-ci-results.json`, `clipping-equivalent.json` and five `clipping-inputs/` images. These investigations were not repeated in the correction wave. FFmpeg/Pillow were not installed; the original full command remains red.

An extra historical Task 4 fresh-context standalone check passed a clean production start, bar purchase, real random reduced-motion spin, return and reload: production storage only, no prototype controls, no page errors (`production-artifact-check.json`). The current rebuilt artifact has the same hash. A deliberately overstrict bundle-string absence check failed: dead private prototype methods/helper constants retain prototype key literals, although the compiled artifact has **zero calls** to `mountPlaytest`. Runtime isolation, not literal absence, is the verified boundary; no code was changed to hide this finding.

The requested Impeccable detector ran **once**, using `C:\Users\Adrian\.config\opencode\skills\impeccable\scripts\impeccable.cmd detect --json src/view/SalonScene.ts src/view/ui.ts src/view/livingLounge.ts prototypes/living-lounge.html`. Exit **2**: three advisories (the unchanged production 19px nameplate, raw-entry loading text color, prototype 28px heading) and one spacing warning (~8px in 8/12 instances). Raw findings: `docs/evidence/phase41/impeccable-findings.json`. These are not a finish-review approval. The independent `finish-review.md` assessed the 28px heading and compact spacing as justified local adaptations, left the production nameplate outside this scope, and retained loading-state appearance as unverified. No detector rerun, finding suppression or design-system rewrite was made.

### Screenshot index and reproduction

With the dev server running, use:

```powershell
$env:PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node scripts/capture-living-lounge.mjs
node scripts/capture-living-lounge.mjs --performance-only
```

The executable setting is optional on hosts with Playwright Chromium installed. The final command refreshes performance without replacing the screenshot manifest. Contexts are disposable, DPR 1, normal OS motion; fixtures mute sound, retain effects intensity 0.4, and use a future accrual timestamp, **not a frozen Date.now**. Purchases and rug changes use the real UI. Route-only scene instrumentation never ships. Every capture asserts actual levels/rug, zero production-key access and byte-for-byte sentinel preservation. All browser contexts close.

**92 full-resolution PNGs: 23 states × 1600×900, 1440×900, 1366×768 and 1280×720.** Files use `<state>-<width>x<height>.png`; `manifest.json` records exact state, storage bytes, preview/focus/warnings and SHA-256. State names:

- `bar-0` through `bar-3`, `machine-0` through `machine-3`, `decor-0` through `decor-3`: each category starts independently from zero; all other levels remain zero. Each `*-0` is the clean room.
- `cumulative-1`, `cumulative-2`, `max-claret`: levels 1/1/1, 2/2/2, 3/3/3; default confirmed Claret.
- `max-moss`, `max-moss-reloaded`, `max-moss-roundtrip`: same 3/3/3 and 8,250 balance, confirmed Moss before/after reload and machine round trip.
- `mixed-bar3-machine1-decor2`: mixed Claret room; `preview-moss-confirmed-claret-keyfocus`: same progress, unconfirmed Moss and keyboard focus.
- `focus-style-rug-after-cancel`: same progress, restored Claret/focus after Escape; `error-apply-preview-moss-confirmed-claret`: failed Apply, preview still Moss, confirmed default still Claret.
- `error-protected-originals-decor1`: damaged originals preserved, in-memory 0/0/1 and 700 tokens; visible progress and appearance warnings.

For each viewport, `sheet-<width>x<height>-01.png` through `-06.png` cover bar, machines, furnishings, cumulative/rugs, persistence/mixed/preview, then focus/errors. The correction wave regenerated and opened **all 24 sheets**, covering every current matrix capture. It additionally opened full-size `bar-3`, `decor-2`, `max-claret` and `max-moss` at **1280×720 and 1600×900** (eight exact keyshots). `evidence-validation.json` verifies all 92 current dimensions/hashes, complete sheet coverage, preserved sentinels, identical independent-zero images and identical reload/roundtrip images at each size. Earlier full-size/clipping inspections are historical Task 4 evidence, not a fresh inspection claim. Compare category levels only at matching viewport/other levels; status naturally differs after actions/reload.

The reviewed correction redraws the shelf with dimensional frame/shelf returns and varied warm glass vessels, and replaces flat leaf fans with overlapping folded natural forms and lit/dark depth. The full **170×250** shelf now starts at **(380,350)**; the conservative 1600×900 source lamp/mount box ends at **y=334**, leaving **16 stage pixels**. Opened current pixels show the complete lower mounting detail, clear title and substantial stocked reward. Stools, rug, nameplate and their layout remain unchanged; controls, wallet, inline chooser and error states stay clear. Prototype lounge eyebrow is hidden; production eyebrow remains visible. **Independent scoped finish verdict: SHIP for the four scored fixes only**, all resolved: shelf/glass material, foliage finish, shelf/lamp separation and prototype eyebrow (`docs/evidence/phase41/finish-verdict.md`). The historical `finish-review.md` retains its original **fix** disposition. The follow-up is not whole-surface aesthetic approval, owner acceptance or permission to integrate.

### Observed performance — software only

Finish-correction standalone measurement: `performance.json`, **2026-11-08T09:02:44.930Z**, Chrome 156.0.8078.80, Phaser dependency 4.2.1, Windows 10.0.26200, Ryzen 7 5800X3D, 1600×900. Renderer: **ANGLE / Vulkan 1.3.0 / SwiftShader Device (Subzero)**; WebGL 1.0. No E2E/capture browser workload or unit/build check ran concurrently with this final performance-only measurement. This single new run is not a controlled before/after performance comparison.

Actual RAF interval mean / p95 / maximum, milliseconds:

- Idle, 5 seconds: **17.24 / 24.30 / 24.40**, 289 samples.
- Nine real purchases and settled local reveals: **25.10 / 36.40 / 84.90**, 136 samples.
- Twelve applied rug changes: **25.81 / 30.40 / 36.40**, 144 samples.
- Twenty-four machine round trips, two batches: **29.00 / 36.40 / 194.00**, 153 samples.

Page/console errors: **0**; production-key accesses: **0**, sentinel unchanged. Forced-GC DOM observations (nodes/listeners): initial **174/106**, after previews **184/105**, after 12 visits **324/119**, after another 12 **324/119**; one active UI screen. The plateau is consistent with first-use cached scene/UI retention rather than per-visit linear growth; this is not a heap-leak proof. The source removes window/document/media listeners on shutdown; the existing production resource test passed in the historical full run, not rerun in this wave.

Software intervals exceed a 16.67ms frame budget, with purchase/navigation spikes. This is a real observed performance risk to check on owner hardware, not evidence of hardware 60 FPS or a new regression. RAF includes automation, forced GC and scene work, not GPU presentation. Short, muted runs do not establish sustained-load behavior or acoustic/listening acceptance.

## Owner playtest — 10–15 minutes

1. **2 minutes:** inspect a clean room without reading level labels. Say what looks unfinished.
2. **4 minutes:** buy all bar and machine levels in your chosen order. Identify each visible change and whether it feels worth owning. Play a few real spins; return to the lounge.
3. **3 minutes:** buy furnishing levels. Preview both rugs, cancel once, confirm one, then freely reverse it. Describe any preference; none is required.
4. **2 minutes:** reload and visit/return from the machine. Identify retained changes without prompting.
5. **1–4 minutes:** name the least noticeable upgrade, whether the room feels personally different, and when buying becomes repetitive. Record actual words and disagreements, not inferred retention/enjoyment metrics.

**KEEP for further exploration:** identify every reward without labels; distinguish cosmetic/income benefits; preview/cancel/switch rugs unaided; find room development satisfying enough to explore further; no persistence/isolation defects. This is owner evidence, not population validation.

**REVISE:** the slice is technically safe, but a reward is missed, art feels incoherent, rug choice lacks value, feedback confuses, or purchases feel repetitive. Name the failed reward/interaction and revise only that hypothesis.

**REJECT a mechanic:** a cosmetic choice or purchase category adds no worthwhile environmental value even when seen correctly, or demands unwanted management. Any isolation/persistence defect blocks playtesting and integration regardless of preference.

Owner feedback: **pending**. Do not choose KEEP automatically or begin Phase 4.2.

## Migration proposal — not implemented or approved

Keep the prototype separate. A future production change needs an explicitly approved, versioned appearance schema with a validated Claret default; defined export/import treatment for appearance; damaged-save preservation; and atomic migration/recovery tests, including denied/quota-failed storage and interrupted writes. Decide whether appearance belongs in a future backup envelope or a separately exported preference. Do not silently add it to the current game backup.

Never promote the 20,000-token fixture, accelerated balances, or prototype progress. Any approved migration must read validated production progress only, preserve its economics and settings, and write no prototype data into production. No migration runs in Phase 4.1.

## Known limits and operational rulings

- Reset is not atomic across two localStorage keys. Failure on the second write can leave zero-level reset progress and the prior rug on disk while the live session remains unchanged. A failure on the final owner-save write reconciles the live wallet/room but still reports failure. Export current progress before reloading after **Reset failed**; no rollback or transaction guarantee exists.
- Progression is finite: three levels per category, nine purchases and two rugs. Acceleration does not test waiting cadence, long-term economy, retention, or repeated ownership value. Local storage availability and local clock trust remain limits; the existing eight-hour income cap and slot balance are unchanged.
- Measurements use headless Chrome with software rendering, not owner hardware. No hardware 60 FPS, GPU presentation, acoustic listening or player-satisfaction claim.
- Specialized game-design/game-test skills were unavailable; no missing guidance is represented as loaded. Owner judgement remains necessary for reward scale, material coherence, rug preference and repetition.
- Work stays on the explicitly selected `feat/p4` branch. No commits, push, publication, dependencies, worktree change or Phase 4.2 work. Agent models inherit the controller's choice under the developer requirement; none was overridden. No broad formatting repair or check relaxation was authorized.
- Independent reviews: **complete within their stated scopes**. The appended `.superpowers/sdd/2026-11-07-living-lounge/final-code-review.md` verdict is **CODE APPROVED**, no unresolved code blocker; the damaged-original wording minor is **ADDRESSED**. `docs/evidence/phase41/finish-verdict.md` records **SHIP for the four fixes only**, not whole-aesthetic or owner acceptance. `docs/evidence/phase41/documentation-review.md` records the incumbent-system comparison and completed documentation pass. The earlier pending statements in `.superpowers/sdd/2026-11-07-living-lounge/finish-fix-report.md` describe its historical handoff point, not the later verdicts. Owner feedback remains **pending**; **hold Phase 4.2**. `DESIGN.md`, its known-stale sidecar and the established surface contract remain unchanged; sidecar identity/type/control drift is documented, not repaired or canonized. Procedural provenance is in `docs/asset-generation.md`; no new shipping raster was added.
