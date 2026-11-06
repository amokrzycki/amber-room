# Phase 1: UX Clarity & Readability

Implemented against the existing dual-agent critique, without repeating that audit or starting Phase 2.

## Changes

| File                             | Purpose                                                                                                                                                                                                                                                                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/view/SlotScene.ts`          | Preserve primary gross payout; show Ready to play before the first spin, a completed-spin breakdown afterward, and an empty, polite, atomic DOM status region updated once per newly completed spin. Both normal completion and skip use the same final-result path. Reload displays the saved result without announcing it as new. |
| `src/view/spinResult.ts`         | Format the recorded stake, actual payout, and their exact difference; produce a meaningful spoken result including break-even, net gain, or net loss. No current-selector or balance-derived calculations.                                                                                                                          |
| `src/view/SalonScene.ts`         | Explain the 50-token round as celebration only before purchase; identify furnishings as cosmetic with no income; connect descriptions to the corresponding purchase buttons. Shorten introductory copy to make room.                                                                                                                |
| `src/main.ts`                    | Expose the existing overlay scale as a CSS custom property; preserve Phaser FIT and canvas/HTML alignment.                                                                                                                                                                                                                          |
| `src/style.css`                  | Compensate functional labels, details, and controls for stage scaling; preserve display fonts and primary number sizes. Add local translucent backing behind the wallet. Adjust HUD spacing for the result breakdown and shop spacing for purchase explanations.                                                                    |
| `tests/spin-result.test.ts`      | Cover four outcome classes across all 15 bets, recorded-stake restoration after changing selections, large-number formatting, and distinguishable consecutive announcements.                                                                                                                                                        |
| `scripts/browser-ux-clarity.mjs` | Reproducible offline Chromium verification of the new behavior, real layouts, announcement mutations, and evidence capture.                                                                                                                                                                                                         |

The two existing `.impeccable/critique/` archive files were formatted without content changes so the repository-wide build check passes. No dependencies, game mathematics, RNG, payline behavior, timing constants, economy, or persisted save schema changed.

## Outcome behavior

Gross payout remains the largest central result. The secondary breakdown uses `lastSpin.totalStake` and `lastSpin.outcome.payout`:

`net = actualReturnedTokens - actualSpinStake`

Verified default-stake examples:

| Stake | Returned | Net | Meaning                  |
| ----: | -------: | --: | ------------------------ |
|     5 |        0 |  -5 | No return                |
|     5 |        4 |  -1 | Partial return, net loss |
|     5 |        5 |   0 | Break-even               |
|     5 |       15 | +10 | Profitable return        |

Before a first spin, payout is a dash and the copy says Ready to play. The numeric counting field is outside the live region. A separate status region updates after celebration completion, skip, or immediate neutral completion. A spin-ID guard prevents duplicate completion updates; including the ID in the announcement makes consecutive identical outcomes distinguishable. Changing bets and income refreshes do not rewrite the announcement. Restored results remain visible without a new-spin announcement.

## Rendered evidence

Evidence is in `docs/evidence/phase1/` (ignored by the repository's existing evidence rule):

- `before-lounge-{width}x{height}.png` / `after-lounge-{width}x{height}.png`
- `before-slot-{width}x{height}.png` / `after-slot-{width}x{height}.png`
- Width/height pairs: 1280×800, 1366×768, 1600×900.
- `after-loss-1280x800.png`, `after-partial-return-1280x800.png`, `after-break-even-1280x800.png`, `after-win-1280x800.png`, plus repeated-loss and skipped-win captures.
- `before-measurements.json` and `browser-checks.json` record real viewport, geometry, and rendered-font measurements.
- `comparison.html` presents the before/after screens interactively.

Both screens were also inspected through the shared T3 browser at all three sizes. Some native screenshot outputs were downsampled despite a larger CSS viewport. To produce truthful, full-resolution comparisons, the final before images were captured from an isolated production build of pre-change commit `991e9ce`; the final after images came from the current production build. Both sets use offline Chromium with isolated profiles. Game sources in the working tree were not reverted for this capture.

The stage remains 16:9: 1280×720 inside 1280×800, and approximately 1365×768 inside 1366×768. Functional text compensates for that scaling rather than changing the game's coordinate system.

| Rendered text         | 1280×800 before → after | 1366×768 before → after |
| --------------------- | ----------------------- | ----------------------- |
| Upgrade level         | 10.4 → 13 px            | 11.1 → 13 px            |
| Upgrade benefit       | 12 → 14 px              | 12.8 → 14.5 px          |
| Purchase action/price | 13.6 → 15 px            | 14.5 → 15.4 px          |
| Spin hint             | 12 → 14 px              | 12.8 → 14.5 px          |

Wallet, initial machine, losing, partial-return, break-even, and winning screenshots were visually inspected. Tested control bounds and selected neighboring groups had no clipping, text overflow, or overlap at the target sizes.

## Verification

- `npm test`: 39 tests across 10 files passed, including the three new result tests. The result test was introduced before implementation and first failed because the new formatter was absent.
- `npm run typecheck`: passed.
- `npm run build`: passed, including the repository-wide Biome check.
- `npm run check:offline`: passed; 22 assets embedded, no runtime file/network dependencies or developer controls.
- `npm run check` and `git diff --check`: passed.
- `node scripts/browser-ux-clarity.mjs`: passed 22 real spins: zero return, repeated identical losses, partial return, break-even, natural win completion, big/jackpot skip, and all 15 actual bet combinations. Verified recorded-stake breakdown after changing selections and reload, exactly one final live-region mutation per spin, silence during animated counting, retained skip focus, held-Space protection, pre-purchase descriptions, unchanged round cost, and the three target layouts. No page errors or network requests.
- `node scripts/browser-acceptance.mjs`: passed existing offline gameplay, supported line counts, save-before-animation, skip/Space/held-Enter, repeated scenes, dialog bounds, and settings reload checks.
- `node scripts/browser-save-business.mjs`: passed all nine purchases and limits, income cap, round cost, export/import, invalid-import atomicity, damaged-original protection and recovery, and storage-unavailable behavior.

The new browser script initially exposed a missing wait in its test flow after Phaser scene changes; explicit DOM waits corrected that test race. Local Chromium required execution outside the filesystem sandbox because its socket setup was blocked. All browser tests used isolated offline profiles rather than the player's saved game.

## Limits and Phase 2

DOM semantics, result content, and mutation frequency were tested; actual VoiceOver/NVDA speech was not. No native accessibility certification, physical laptop testing, browser zoom sweep, Safari/Firefox verification, headphone listening, or user-device FPS claim is made. Moderate game values were rendered; the full safe-integer balance range was not visually stress-tested.

The existing fixed landscape model remains unsuitable for mobile. The cabinet's material mismatch and the active-payline discoverability issue from the critique remain outside Phase 1.

Recommended Phase 2: a separately approved cabinet craft pass carrying the lounge machine's brass and material detail into the playable cabinet, preserving the now-verified controls, result hierarchy, and timing. Do not start it automatically.
