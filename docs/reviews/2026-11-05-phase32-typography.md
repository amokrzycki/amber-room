# Phase 3.2 — typography comparison and rationale

Evidence: `docs/evidence/phase32/fonts/` (gitignored, regenerate with `FONT_DIR=<dir with the font files> node scripts/phase32-fonts.mjs`).
Harness (re-run on the final build after the independent review, so every sheet shows the final role map and the final 28px/3.5px nameplate and 27px/2px SPIN for all three candidates; those values were tuned on Marcellus, which slightly favours B): identical seeded save and reel stops (`[9,6,0,0,0]`), the same build, only the display face and its weight swapped through the `--font-display` / `--display-weight` tokens; fonts injected as data URIs so `file://` loading cannot differ between candidates.

| Sheet                 | What it shows                                                             |
| --------------------- | ------------------------------------------------------------------------- |
| `cmp-plate.png`       | Nameplate at 2× DPR (final build)                                         |
| `cmp-hud.png`         | Slot HUD at 2×: labels, figures, SPIN                                     |
| `cmp-topbar.png`      | Masthead at 2×                                                            |
| `cmp-lounge-1280.png` | Lounge title, shop heading, purchase names at 1280×800                    |
| `cmp-dialog-1280.png` | "Lines & payouts" dialog heading and table at 1280×800                    |
| `cmp-win-1920.png`    | Settled win with win details open at 1920×1080                            |
| `cmp-scaling.png`     | Nameplate and SPIN at 0.8× (1280 wide) and 1.2× (1920 wide) per candidate |

## Candidates

All three pair with Source Sans 3 for labels, controls and every figure; the only variable is the display voice.

|     | Display face                          | Notes                                                               |
| --- | ------------------------------------- | ------------------------------------------------------------------- |
| A   | Libre Caslon Text 400 (previous face) | Same role map as the others, so it is a fair control                |
| B   | **Marcellus 400**                     | Roman-inscription capitals with flared strokes; single weight       |
| C   | Newsreader 500, `opsz` auto           | Contemporary editorial text serif; variable weight and optical size |

I did not propose a fourth face. The brief asked for B and C; A is the control. A fourth candidate would have needed its own justification beyond "different", and none of the three failed in a way another family would have fixed.

## Role map (applies to all candidates)

Display role, and only these: masthead wordmark, machine nameplate, lounge/shop/dialog headings (`h1`, `h2`), SPIN/SKIP label. Everything else (HUD labels, notes, buttons, purchase names, table, bet controls, all numbers) is Source Sans 3. Phase 3.1 used the display face only on `h1`/`h2`, which is why the machine read as "one serif title on a sans-serif interface". Moving the wordmark, SPIN and nameplate onto the same voice is what makes the system coherent rather than a swap of one font.

Purchase item names (`.purchase h3`) stayed Source Sans 600. In the Marcellus capture the item names read lighter than the bold level counter and price beside them, which weakened a list the player scans for prices.

## Findings by criterion

**Game identity and historical character.**
A reads as a book face: handsome but it is the default "classic" choice and the owner already found it insufficiently distinctive. C is close to A in colour and rhythm (a sturdy serif), so it changes little. B is the only candidate that behaves like lettering rather than text: inscriptional capitals fit a brass nameplate and a club wordmark, and its lowercase in headings ("The Amber Room", "A good room. A better evening.") is lighter and more individual than Caslon's.

**Readability of small HUD labels.** Unchanged by the choice, because all HUD labels, notes and figures remain Source Sans 3 in every system. One real fix came out of the review: the masthead subtitle "PRIVATE ARCADE" was 10px (≈ 8px on screen at 1280) and is now 11px with the scale-compensated floor already used elsewhere.

**Numeric clarity and tabular figures.** Checked in the font files with fontTools:

| Font              | `tnum`                                               | `lnum`            | Notes                                                    |
| ----------------- | ---------------------------------------------------- | ----------------- | -------------------------------------------------------- |
| Source Sans 3     | default digits are tabular; `pnum`, `onum` available | no feature needed | all figures stay here                                    |
| Marcellus         | none                                                 | none              | GSUB: `aalt frac liga ordn sups`. Never used for figures |
| Newsreader        | yes                                                  | none              | numerals would need `tnum` and still not be lining       |
| Libre Caslon Text | yes                                                  | none              | `onum` available                                         |

`#balance` and `#payout` computed `font-variant-numeric` is `lining-nums tabular-nums` in the built page (asserted by `scripts/browser-phase32.mjs`).

**Legibility of the machine nameplate.** Tuning was needed for B: at 27px/2px Marcellus has the thinnest strokes of the three and left the title narrow on the plate. With 28px/3.5px tracking (plus an equal text indent so tracking does not push the title off-centre) it fills the plate. **With those values applied to all three, the nameplate is close to a tie** (`cmp-plate.png`, `cmp-scaling.png`): A, B and C are all legible at 0.8×, 1.0× and 1.2×. The nameplate is therefore not where Marcellus earns its place; the masthead wordmark and the lowercase headings are (`cmp-topbar.png`, `cmp-lounge-1280.png`).

The plate gradient ran #c8aa76 → #80603b. Dark ink (#281b14) contrast against it falls from 7.5:1 at the left to 2.95:1 at the right end, computed from the gradient stops across the text extent. This was already the case before, but a thin face exposes it. The plate's far stop is now #a88650 and the middle #b69561; contrast over the text extent is ≥ 4.9:1 (computed, not measured on pixels).

**Button labels.** Marcellus has a lower cap height than Caslon. At the old 25px/1px tracking SPIN in B looked smaller and lighter than in A or C (seen in the pre-tune render, which I no longer keep). SPIN is now 27px/2px (text indent 2px for optical centring), and in the final `cmp-scaling.png` B's SPIN is comparable to A and C at 0.8× and 1.2×. Cap text #fff0d5 on the cap gradient: ≥ 6.4:1 at its lightest stop.

**Font weights and letter-spacing.** Marcellus ships one weight (400). With `font-synthesis: none` any `600` would render as 400, so the display role uses `--display-weight: 400` and nothing else. Source Sans 3 keeps its variable 400/600. Tracking: masthead 2px, nameplate 3.5px, SPIN 2px; headings 0.

**Rendering quality at different scaling factors.** `cmp-scaling.png` (0.8× and 1.2× of the 1600 stage) and the 2× crops: all three candidates render the nameplate and SPIN cleanly; at 0.8× Marcellus's hairlines stay visible. No bitmap or synthesised glyphs. Honest limit: headless Chromium, one machine.

## Choice

**Marcellus + Source Sans 3.** It is the candidate that changes the interface's voice most (wordmark and lowercase headings; `cmp-topbar.png`, `cmp-lounge-1280.png`), it suits engraved brass, and it keeps every number in the face that was already designed for tabular figures. On the nameplate and SPIN alone, with matched sizes, the three are close. Costs and limits, stated plainly:

- single weight, so no bold display role (headings carry no emphasis weight; emphasis comes from size, tracking and the sans);
- a lower cap height, which required the +2px on SPIN and +1px/+1.5px tracking on the nameplate;
- Reserved Font Name "Marcellus" (OFL 1.1): shipped **unmodified**. I did not subset or rename it, because a subset is a Modified Version and could not keep the name.

This is a recommendation for the owner to review in the screenshots, not an acceptance.

## Licensing, assets, loading, fallback

- `src/assets/fonts/Marcellus.ttf` (46,004 bytes) and `Marcellus-OFL.txt`; Source Sans 3 unchanged. Libre Caslon Text (126,876 bytes) and its licence file are removed from the repo and the bundle. `THIRD_PARTY_NOTICES.md` and the in-game "Typeface credits & licenses" (Settings) now cite Marcellus and Source Sans 3. Fonts are embedded in `dist/index.html` (7.34 MB, down from 7.45 MB).
- Loading: `src/main.ts` awaits `document.fonts.load` for Marcellus 400 and Source Sans 3 400/600 before Phaser starts. `scripts/browser-phase32.mjs` asserts `document.fonts.check()` for both in the built `file://` page at all four viewports and that no font has a status other than `loaded`.
- Fallback: with the display face replaced by a name that is not installed, the stack falls to Georgia; the nameplate's `scrollWidth <= clientWidth` still holds at 1280 (`fallback-1280x800.png`, asserted).
- Offline: `npm run check:offline` passes; zero network requests during all browser tests.

## What was not tested

- Other operating systems' Georgia or Arial metrics; fallback was exercised on this machine only.
- Real-hardware subpixel rendering. All captures use headless Chromium with SwiftShader.
- No readability test with other people.
