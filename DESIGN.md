---
name: The Amber Room · The Orchard
description: An understated private arcade with illustrated rooms, wine-colored cabinets, and brass controls.
colors:
  antique-gold: '#d8af55'
  wine-velvet: '#4a1b2a'
  wine-shadow: '#210f18'
  candlelit-cream: '#fff2cc'
  mint-light: '#35e6d1'
  night: '#100c10'
  room-dark: '#171214'
  panel: '#21161d'
  control: '#2c1d26'
  control-hover: '#452633'
  brass-border: '#73503d'
  muted-copy: '#bca58f'
  field: '#20131b'
  gold-top: '#f4ce79'
  gold-bottom: '#c58d3c'
  gold-hover-top: '#ffe3a0'
  gold-rim: '#fff2b3'
  primary-ink: '#2b131b'
  payout-glow: '#ffe0a0'
  warning: '#ffc078'
typography:
  display:
    fontFamily: Libre Caslon Text, Georgia, serif
    fontSize: 57px
    fontWeight: 400
    lineHeight: 1.03
  headline:
    fontFamily: Libre Caslon Text, Georgia, serif
    fontSize: 35px
    fontWeight: 400
    lineHeight: 1.2
  title:
    fontFamily: Source Sans 3, Arial, sans-serif
    fontSize: 22px
    fontWeight: 600
  body:
    fontFamily: Source Sans 3, Arial, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: Source Sans 3, Arial, sans-serif
    fontSize: 13px
    fontWeight: 600
    letterSpacing: 0.7px
  navigation:
    fontFamily: Source Sans 3, Arial, sans-serif
    fontSize: 16px
  brand:
    fontFamily: Source Sans 3, Arial, sans-serif
    fontSize: 24px
    fontWeight: 600
    letterSpacing: 2px
  balance:
    fontFamily: Source Sans 3, Arial, sans-serif
    fontSize: 46px
    fontWeight: 400
  payout:
    fontFamily: Source Sans 3, Arial, sans-serif
    fontSize: 52px
    fontWeight: 400
    lineHeight: 1
  select:
    fontFamily: Source Sans 3, Arial, sans-serif
    fontSize: 22px
  spin:
    fontFamily: Source Sans 3, Arial, sans-serif
    fontSize: 25px
    fontWeight: 600
    letterSpacing: 1px
rounded:
  field: 6px
  button: 8px
  panel: 20px
  cabinet: 36px
spacing:
  tile-padding: 8px
  navigation-gap: 12px
  control-gap: 20px
  panel-padding: 38px
  header-inset: 50px
components:
  button-secondary:
    backgroundColor: '{colors.control}'
    textColor: '{colors.candlelit-cream}'
    rounded: '{rounded.button}'
    padding: 13px 20px
  button-secondary-hover:
    backgroundColor: '{colors.control-hover}'
  button-primary:
    textColor: '{colors.primary-ink}'
    typography: '{typography.spin}'
    rounded: '{rounded.button}'
    padding: 15px
    width: 220px
  button-navigation:
    backgroundColor: transparent
    textColor: '{colors.candlelit-cream}'
    typography: '{typography.navigation}'
    rounded: '{rounded.button}'
    padding: 11px 17px
  bet-select:
    backgroundColor: '{colors.field}'
    textColor: '{colors.candlelit-cream}'
    typography: '{typography.select}'
    rounded: '{rounded.field}'
    padding: 7px
    width: 95px
  purchase-row:
    padding: 17px 0
  dialog-panel:
    backgroundColor: '{colors.panel}'
    textColor: '{colors.candlelit-cream}'
    rounded: '{rounded.panel}'
    padding: '{spacing.panel-padding}'
    width: 1020px
  payline-tile:
    backgroundColor: '{colors.night}'
    textColor: '{colors.candlelit-cream}'
    rounded: '{rounded.field}'
    padding: '{spacing.tile-padding}'
---

# Design System: The Amber Room · The Orchard

## Overview

**Creative North Star: "The Lamplit Private Arcade"**

An understated, comfortable, traditional arcade: a warm lounge, a brass cabinet, and a personal retreat. Illustrated room artwork supplies the atmosphere; familiar controls keep the room and gameplay in the foreground.

Wine-colored cabinet surfaces, Antique Gold trim, and Candlelit Cream type connect the game art to the interface. Mint Light marks focus, active paylines, and feedback. Depth comes from layered artwork and dark panels, with structural shadows on primary buttons and dialogs. Controls are comfortable and traditional: familiar controls within the arcade cabinet.

**Key Characteristics:**

- Illustrated lounge artwork and glossy fruit symbols.
- Wine-colored surfaces, brass edges, warm text, and selective mint signals.
- Libre Caslon Text display paired with Source Sans 3 controls and tabular lining numerals.
- A fixed landscape stage with calm, skippable win effects.

This records the incumbent implementation, using the user's confirmed descriptive language. Source authority: `src/style.css`, `src/view/SlotScene.ts`, `src/view/SalonScene.ts`, `src/view/ReelView.ts`, `src/view/feedback.ts`, and `src/view/tuning.ts`. Existing `docs/evidence/salon.png` and `docs/evidence/slot.png` were inspected for visual context; current code resolves any differences. No fresh browser capture was made for this documentation pass.

## Colors

The palette combines warm metal and wine-colored surfaces with cream text and a small set of mint signals. Frontmatter holds the normative extracted values; the names below describe their roles.

### Primary

- **Antique Gold** (`antique-gold`): cabinet trim, eyebrows, monetary labels and prices, hover borders, and native setting accents. Raised primary actions use `gold-top` → `gold-bottom`, changing to `gold-hover-top` → `antique-gold` on hover, with `gold-rim` and `primary-ink` completing the treatment.

### Secondary

- **Wine Velvet** (`wine-velvet`): the cabinet gradient's upper tone, shading into `wine-shadow`. The red inner bezel and alternating dark reel columns remain implementation-specific cabinet details.

### Tertiary

- **Mint Light** (`mint-light`): keyboard focus, active payline borders and paths, winning-line outlines, and lounge feedback.

### Neutral

- **Candlelit Cream** (`candlelit-cream`): primary text and control text.
- **Night / Room Dark** (`night`, `room-dark`): outer background and game backdrop. The header uses the room tone with transparency; the lounge's shop has a nearly opaque dark overlay.
- **Panel / Control / Field** (`panel`, `control`, `field`): dialogs, standard buttons, and native selectors. `control-hover` warms button hover states; `brass-border` supplies fine control edges and dividers.
- **Muted Copy** (`muted-copy`): shop descriptions and upgrade-level metadata. Related warm text tints remain contextual source values.
- **Payout Glow / Warning** (`payout-glow`, `warning`): the central payout and local-save notices respectively.

**The Signal Rule.** Preserve Mint Light for the implemented focus, payline, and feedback roles; use Antique Gold for trim, labels, prices, and primary-action gradients.

The sidecar's eight-step tonal ramps are generated swatch previews, not additional shades used by the game or permission to recolor it.

## Typography

**Display font:** Libre Caslon Text, with Georgia fallback. **UI and numeric font:** Source Sans 3, with Arial fallback. Both primary families are embedded, with real variable weights and tabular lining data figures. Values are logical stage pixels before scaling; functional UI sizes retain the existing laptop compensation.

- **Display / headline:** `display` is the lounge title; `headline` is the base secondary heading. The shop overrides its heading to (32px), and dialogs to (33px).
- **Title / body:** `title` describes purchase headings; `body` describes the lounge paragraph. Shop introductory copy uses (16px, line-height 1.6), and purchase descriptions (15px).
- **Label / brand / navigation:** `label` is the bold tracked eyebrow; wallet and machine labels use (13px, tracking 2px). `brand` is the uppercase masthead, with a subtitle at (10px, tracking 3px). Navigation uses `navigation`.
- **Balance / payout:** `balance` is the machine balance; the lounge wallet uses (46px). `payout` is the larger central result. Machine HUD numbers request tabular numerals.
- **Select / spin:** `select` describes native bet controls; `spin` describes the single SPIN/SKIP control (SPIN when idle or settled, SKIP while the reels turn). The lounge entry action uses (20px) instead.
- **Cabinet title:** DOM-rendered Libre Caslon Text 400 at (27px), with (2px) tracking and a subtle offset engraving highlight.

## Layout

The game uses a centered landscape stage (1600×900, 16:9), fitted to the viewport. CSS sets stage width to `min(100vw, 177.77778vh)`; Phaser uses FIT, while a ResizeObserver scales the HTML overlay by stage width / 1600. There are no width breakpoints or mobile column changes. Browser page scrolling is disabled.

The shared header is (90px) high with horizontal inset `header-inset`. The lounge's art is full-stage, with a dark shop overlay on the right; its shop column is positioned at (1100px, 128px) and sized (435px). Purchase rows use the final shop-specific padding from `purchase-row`, overriding an earlier generic row rule.

The machine uses a separate cabinet view. Its HUD sits on the instrument deck at x (125px), y (723px), 1350×144px, as three fixed grid tracks (270px / remaining space / 640px) named BALANCE, RETURNED, and BET & SPIN; every row inside is a fixed track, so results never move the box. Reels fill 1286px of the 1508px cabinet face (85%): column spacing (258px), row spacing (156px), symbol display size (184×184px), all defined once in `reelWindow`/`tuning`. Texture cropping keeps symbols inside the window from y (207px) through (678px), including during movement.

Spacing tokens record recurring observed roles, not a new uniform spacing scale. The payline catalog is an eight-column grid with gap (10px). Dialogs have viewport guards of viewport width minus (40px) and the lesser of (800px) or viewport height minus (40px); content scrolls within the dialog.

## Elevation & Depth

Layered room artwork and dark panels provide ambient depth. Primary buttons and dialogs use structural shadows. Purchase rows use tonal contrast and fine separators without individual card shadows.

- **Raised action:** `0 5px 0 #72401f, 0 8px 28px #0006` supplies a solid lower edge and soft surrounding shadow.
- **Dialog separation:** `0 20px 90px #000b`, paired with backdrop `#09060bd9`, separates modal content from the game.
- **Text over artwork:** `0 2px 20px #000` protects the lounge's introductory copy.
- **Cabinet:** nested rounded outlines, brass strokes, screw details, and dark reel wells supply depth in Phaser graphics.

**The Structural Shadow Rule.** Preserve the raised primary-button edge and dialog separation; purchase rows remain flat and divided by fine rules.

## Shapes

Small rounded corners distinguish selectors and payline tiles (`rounded.field`) from buttons (`rounded.button`). Dialogs use `rounded.panel`; the large cabinet uses `rounded.cabinet`, with nested tighter corners. These are distinct existing roles, not interchangeable corner presets.

Control borders are generally (1px). Keyboard focus is a Mint Light outline (3px) with offset (4px). The cabinet's heavier brass strokes belong to the game artwork. Glossy fruit assets retain transparency and their existing crop; the code-drawn cabinet is not an HTML card primitive.

## Components

**Character:** Comfortable and traditional — familiar controls within the arcade cabinet. The sidecar includes nine self-contained HTML/CSS samples of implemented patterns. Samples show appearance and native controls; they do not implement purchases, game transitions, or save operations.

- **Primary action:** the lounge entry retains its raised gold material, (350px) width and (21px) padding. The cabinet SPIN uses a burgundy switch surface, muted brass rim, fixed (240×64px) footprint and (3px) pressed depression.
- **Secondary button:** dark plum fill, cream text, fine brass border, and rounded corners from `button-secondary`. Hover uses `button-secondary-hover` and a brighter brass border. Disabled buttons use opacity (0.5) and the default cursor.
- **Navigation:** two transparent outlined header buttons in a horizontal group with `navigation-gap`. The later header rule preserves their transparent fill and muted border on hover; keyboard focus remains visible. The lounge back action is borderless and transparent at rest.
- **Selectors and settings:** native selects use `bet-select` with a contextual field border. Checkboxes are (22×22px), ranges (240px) wide, and both use Antique Gold accents. Preserve native keyboard behavior and the shared focus outline.
- **Purchase rows:** flat rows with a fine brass divider, a bold title and level on one line, benefit text, and a full-width dark button with the price aligned right. They are not independently raised cards.
- **Dialogs:** a dark rounded panel with brass edge, deep shadow, viewport limits, close button, and scrollable content. Settings and payouts reuse this shell; do not infer additional modal variants.
- **Payline tiles:** dark rounded tiles with a line number and inline SVG path. Inactive tiles have opacity (0.45); active tiles use full opacity and a Mint Light border and path.
- **Game feedback:** show the single highest-paying winning line while reporting the full payout. Reels use acceleration (220ms), cruise (560ms), braking (380ms), and per-reel stagger (110ms), giving approximately (1160–1600ms) across the five reels. Small, big, and jackpot celebrations last up to (700ms / 2200ms / 4000ms); skip clears them immediately. Positive returns without profit get a brief static line without fanfare.
- **Motion preferences:** CSS removes button transitions for `prefers-reduced-motion`. The in-game reduced-motion setting suppresses symbol pulses, animated cabinet glow, and the lounge toast glow, while reels and payout counting still move. Default effect intensity is (0.4); zero intensity suppresses line and frame decoration. There is no claim of a fully motion-free mode.

## Phase 2.1 corrective direction

The machine display name is **THE ORCHARD**. Its flush brass nameplate has two fasteners, dark Libre Caslon Text 400 lettering, 27px type and 2px tracking. Georgia was compared in the same rendered cabinet; Caslon's wider, quieter capitals were selected. The lounge uses the same display family without changing its composition or artwork.

Source Sans 3 supplies UI type and numeric counters. Use real 400 and 600 variable-font weights, no synthetic bold/italic, tabular lining figures for balance, payout, stake and net. Base line height is 1.25; slot HUD balance and returned 52px/1 (shrinking only if the digit count would overflow the column); the lounge wallet stays 46px. Font files and SIL OFL 1.1 licenses are embedded in the standalone build. The existing scale compensation keeps functional detail at least 14 physical pixels on the requested laptop sizes.

The static cabinet painter retains burgundy enamel, warm wood returns, a narrow structural brass perimeter, one recessed reel bezel, dark instrument deck and fastening screws. Fan/shell motifs, fluted rails, arbitrary vertical strokes, extra enamel collar and duplicated plinth highlights have been removed. No replacement ornaments were added.

SPIN/SKIP is a fixed 220×64px burgundy physical control (the cap is a pseudo-element, so pressing depresses it without moving the button box), 25px/600 lettering, 1px tracking, 16px corners and a muted brass rim. Idle, hover, pressed (3px depression), spinning/disabled, celebration/skip and mint keyboard-focus states preserve its footprint. No bounce or glow. Native bet selectors retain the dark recessed treatment and keyboard behavior.

CASH OUT · Lounge ends a session after the reels stop, including during a celebration. Adjacent copy states that payouts are already in the balance. It never credits money. Spinning disables this control until the saved result has been presented.

Display-only counters use 320ms cubic ease-out for balance, payout and net. New targets interrupt from the visible integer; skip, navigation and hiding finish or dispose the relevant work. Both the OS reduced-motion preference and game setting bypass counter motion. Screen readers get a single final outcome including the authoritative balance, with no animated frames or reload announcement. The last completed result remains statically readable after reload. Reel timing, RNG, paylines and settlement are unchanged.

The `.impeccable/design.json` sidecar predates these changes and has not been regenerated as an unrelated maintenance task.

## Do's and Don'ts

### Do:

- **Do** keep the supplied illustrated lounge, glossy fruit assets, and code-drawn cabinet visually connected.
- **Do** retain the cream-on-dark controls, brass emphasis, and visible mint focus outlines.
- **Do** preserve fixed-stage alignment, clipped reel symbols, and separate lounge and machine views.
- **Do** keep effects calm, proportional, adjustable, and skippable.

### Don't:

- **Don't** present the extracted role names as existing CSS variables; the implementation uses literal values.
- **Don't** claim that scaling is mobile reflow or that reduced motion removes reel movement.
- **Don't** replace fonts, artwork, palette, or control behavior as part of documenting this system.
- **Don't** add card shadows, pressed animations, type-scale ratios, or breakpoints that the code does not define.
