# Phase 3.2 — implementation, evidence and test results

Status: implemented locally and uncommitted. Not accepted; visual acceptance is the owner's decision.
`docs/evidence/` is gitignored, so image paths below exist in the working tree only; regenerate with the scripts named in each section.

## What changed

| Area       | Change                                                                                                                                                                                                                                                                                                                                                                                                                  | Files                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Navigation | `BACK TO LOUNGE` removed from the cabinet; `← Lounge` is the first item of the shared header nav on the machine view only (`mountUI(..., { back: true })`). Same `#back` id, disabled while spinning, key-repeat guard and `cashOut()` path as before. Accessible name "Back to lounge"; arrow is an inline SVG with `aria-hidden`.                                                                                     | `src/view/ui.ts`, `src/view/SlotScene.ts`, `src/style.css`                                            |
| Type       | Marcellus + Source Sans 3 replaces Libre Caslon Text + Source Sans 3. Two tokens (`--font-display`, `--font-ui`) plus `--display-weight`. Display role: wordmark, nameplate, `h1/h2`, SPIN label. See the typography document.                                                                                                                                                                                          | `src/style.css`, `src/main.ts`, `src/view/ui.ts`, `src/assets/fonts/*`, `docs/THIRD_PARTY_NOTICES.md` |
| Win marks  | Outlined turquoise rectangles replaced by feathered warm plates and a mint thread, both **behind** the symbols (marks are created before the reels). No stroke around any symbol. Plates are additive-blended, 240×140 in the 254×156 cell; focus line alpha 0.30, others 0.16; above 9 winning cells only the focused line; path beyond the winning count at 16%.                                                      | `src/view/winMarks.ts`, `src/view/SlotScene.ts`                                                       |
| Cabinet    | Two stray fasteners on the instrument deck removed; nameplate 28px/3.5px tracking with matched indent; nameplate plate gradient lightened at its far end (ink contrast 2.95:1 → ≥ 4.9:1 across the text); SPIN 27px/2px; masthead subtitle floor 12px; the HUD's last group no longer has 28px right padding, so SPIN's right inset equals BALANCE's left inset (36px at 1600). Reel window and all geometry unchanged. | `src/view/cabinet.ts`, `src/style.css`                                                                |
| Docs       | DESIGN.md updated (type tokens, nav item, win marks, nameplate, Phase 3.2 note).                                                                                                                                                                                                                                                                                                                                        | `DESIGN.md`                                                                                           |

Not touched: `src/game/**` (paylines, RNG, engine, payouts, save, business). `git diff -- src/game` is empty; `docs/math-report.json` is byte-identical after the full unit run.

## Before/after evidence (regenerate: `node scripts/phase32-capture.mjs <label> [html] [--only=1600] [--states=a,b]` then `python3 scripts/phase32-sheets.py`)

- "Before" was captured from a copy of the build at clean HEAD (`684ae14`), not from a rebuild of this tree.
- Four resolutions, 1280×800, 1366×768, 1600×900, 1920×1080, same seeded save and reel stops:
  `docs/evidence/phase32/before-<WxH>-<state>.png` and `after-<WxH>-<state>.png`.
- States: `idle`, `spinning`, `loss`, `fruit` (cherry ×5), `fruit-multi` (three 5-of-a-kind lines), `wild` (WILD completes cherry ×5), `wild-overlap` (two lines share one WILD cell), `wild-five` (five WILD tiles on one line, 2,000 + two more lines), `busy` (40 lines × 5, many winning cells); `-celebrating` (350 ms after reels stop), `-hover` and `-keyfocus` (pointer and keyboard previews).
- Side-by-side sheets: `docs/evidence/phase32/sheets/overlay-wild.png`, `overlay-fruit.png`, `overlay-preview.png` (2× crops), `frames-<WxH>.png` (all four resolutions).
- Typography: `docs/evidence/phase32/fonts/cmp-*.png`.

What the sheets show (my reading, to be checked against the images):

- Before: a turquoise rounded rectangle sits just outside each WILD tile's own gold border, with the path drawn across the tile face (nested outlines and a line through the art).
- After: nothing is drawn around a WILD tile; the mint thread passes behind it and re-emerges between tiles; WILD art is unmodified. Fruit combinations show the thread through and around the fruit art and a warm plate under each winning cell.
- The plates are subtle and warm-brown on the dark reel well. Whether they read as "lit" or as "muddy" is an owner taste call; I could not settle it from screenshots alone.

## Independent review

`2026-11-05-phase32-independent.md` records the reviewer's findings and what was done with each. One fix batch followed (plate size/blend, deck right inset, subtitle floor, DESIGN.md consistency, comparison sheets re-captured on the final build); every suite and capture below was re-run after it.

## Tests (all on the final build, `dist/index.html`, offline `file://`)

| Suite                                       | Result                                                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `npm test` (vitest, 15 files)               | 55 / 55 pass                                                                                                              |
| `npm run typecheck`                         | exit 0                                                                                                                    |
| `npm run check` (biome, warnings as errors) | exit 0                                                                                                                    |
| `npm run build`                             | ok; `dist/index.html` 7,342,035 bytes (was 7,448,493)                                                                     |
| `npm run check:offline`                     | pass: 22 embedded assets, no file/network references, no dev controls                                                     |
| `scripts/browser-acceptance.mjs`            | pass, no page errors, no HTTP requests                                                                                    |
| `scripts/browser-cabinet.mjs`               | pass: 40 state/size captures, bounds/overlap/focus                                                                        |
| `scripts/browser-save-business.mjs`         | pass: 8 h cap, all 9 purchases, export/import, damaged-save protection                                                    |
| `scripts/browser-idle.mjs`                  | pass: 24 h absence settles exactly 8 h once                                                                               |
| `scripts/browser-phase31.mjs`               | 16 / 16 (HUD stability, SPIN/SKIP, compact win details)                                                                   |
| `scripts/browser-phase21.mjs`               | pass: 4 resolutions, cash-out paths, reduced motion, exact-once accounting                                                |
| `scripts/browser-phase3.mjs`                | pass (assertion updated: nav item text `Lounge`, `aria-label` "Back to lounge", located in `.topbar nav`, not in the HUD) |
| `scripts/browser-ux-clarity.mjs`            | pass: 22 spins, 15 bets, 3 layouts, no clipping                                                                           |
| `scripts/browser-reel-clipping.mjs`         | pass                                                                                                                      |
| **`scripts/browser-phase32.mjs` (new)**     | **58 / 58**                                                                                                               |

First pass of the existing suites failed `browser-cabinet`, `browser-phase21` and `browser-ux-clarity` ("back clipped"/"text overflow"). Cause: my first divider for the lounge link was an absolutely positioned pseudo-element outside the button box, which counts as scrollable overflow. It was replaced with a background hairline inside the box; all three then passed. It was a real defect in my change, not a test problem.

New checks in `browser-phase32.mjs`, at 1280×800, 1366×768, 1600×900 and 1920×1080:

- `#back` is inside `.topbar nav`, not in the HUD; label, text, inside the topbar, clear of brand and other nav buttons, above the nameplate, ≥ 32px tall, disabled during a spin and enabled after, keyboard Enter returns to the lounge with the wallet unchanged.
- Wallet exactness through a spin: balance = before − 5 stake (loss scenario), `nextSpinId + 1`.
- Fonts: `document.fonts.check()` true for Marcellus and Source Sans 3, every font `loaded`, nameplate computed family starts with Marcellus and `scrollWidth ≤ clientWidth`, balance figures `lining-nums tabular-nums`.
- Fallback: display token replaced by an uninstalled name (Georgia fallback); nameplate still fits at 1280.
- At 1600×900 with pixel sampling: no mint pixels over a WILD tile; mint thread visible between WILD tiles (> 80 px); `document.elementFromPoint` on the reels returns the canvas (the overlay is still pass-through); hover changes the marks, pointer leave restores them (< 10% of the hover diff); Tab to a line row changes the marks and a different row gives a different result.
- No page errors; zero network requests.

## Verification of "no payout or wallet changes"

- `git diff --stat -- src/game` empty.
- `tests/**` unchanged and all 55 pass; the long-term simulation re-ran and `docs/math-report.json` is unchanged in git.
- Per-spin wallet assertions in the existing browser suites (acceptance, phase21, phase3, phase31, save-business) pass on the final build, including exact balances for loss, partial, break-even, big and jackpot results.

## Known gaps

- Win-details popover (pre-existing, from Phase 3.1) opens above the HUD and can cover the lower reel row, so previewing a line whose cells are on that row partly hides them behind the popover. Not fixed here; fixing it means moving or resizing that popover, a layout decision for the owner.
- The cabinet's left outer wood edge is lit and visibly brighter than the right. I read this as deliberate light-from-left and left it.
- `reduced-motion` and effect-intensity settings were not re-run visually for the marks; they are static (no animation was added) and the existing suites for those settings pass.
- Headless SwiftShader only; no GPU/FPS claims. No listening checks.
- The existing `browser-phase*` scripts write into their own `docs/evidence/phase*/` folders; the earlier phases' images there have been overwritten by this run (gitignored).
