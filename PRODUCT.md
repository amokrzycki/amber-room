# The Amber Room · The Orchard

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A private single player on a desktop computer, with the option to share the game with a friend. The player wants satisfying slot-machine play and steady lounge development with little management overhead.

## Product Purpose

A local, offline game combining a fruit slot machine with an income-producing lounge. Success means smooth, satisfying spins and proportionate win celebrations, with idle income providing a continuing play budget and finite purchase goals.

## Positioning

The same fictional currency funds both spins and permanent lounge improvements. The lounge earns income during play and absences, giving the player a choice between playing now and investing in future income. This is a private game with no real-money stakes or redemption.

## Operating Context

- Desktop browser with WebGL, mouse and keyboard, and a landscape game area.
- Distributed as a standalone `dist/index.html` with embedded images, audio, styles, and code; opening the built file requires no server or network.
- Two separate views: the owner's lounge and the slot machine. The machine fills the game area, with no lounge visible behind the reels.
- Progress is stored locally. JSON export/import provides portable backups when moving the file or changing devices; browser storage for local files can depend on the file location.
- Existing implementation uses Phaser, TypeScript, and Vite. `npm run dev` starts the development app.

## Capabilities and Constraints

- One playable 5×3 machine, selectable active paylines, bets per line, and a visible payout table. Active line counts are 1, 5, 10, 20, or 40.
- One spin per deliberate gesture; holding the button or Space does not repeat spins. Win celebrations can be skipped without placing another bet.
- The machine shows balance on the left, payout in the center, and bet information on the right.
- The lounge includes a bar, up to three additional business machines, and furnishings. Each purchase category has three levels; furnishings do not increase income.
- Income accrues in both views and during absences, with an eight-hour limit per absence. Purchases are finite; progression has no prestige system or exponential upgrade ladder.
- Keep currency amounts moderate and readable without K/M/B notation. Do not silently cap winnings or confiscate accumulated balances.
- Save spin outcomes and balance together before animation. Validate imports before replacing progress, preserve damaged originals, and warn when storage is unavailable.
- No backend, accounts, real money, payments, or exchange of tokens for real goods.
- Additional playable machines, currencies, and progression systems require a new scope decision. Mobile and native versions are outside the confirmed desktop scope.

## Brand Commitments

- Product name: The Amber Room; playable machine: The Orchard. The interface is in English.
- Preserve the user's preference for calmer, smoother effects and a less generic presentation. Larger wins should feel satisfying without excessive spectacle; the lounge reacts through sound and cabinet lights while the player remains in the machine view.
- The supplied machine photograph at `docs/superpowers/references/salon-fruit-machine.png` is an existing reference commitment, not a final production asset. Visual-system documentation belongs outside this product record.

## Evidence on Hand

- `README.md`: current player instructions, development commands, save behavior, and release limitations.
- `docs/superpowers/specs/2026-11-04-juicy-fruit-salon-design.md`: accepted product decisions and original scope.
- `docs/decisions.md`: implementation decisions and subsequent user feedback, including confirmation of smooth motion and the reel-clipping correction.
- `src/assets/manifest.json`, `docs/asset-generation.md`, and `docs/THIRD_PARTY_NOTICES.md`: existing assets, provenance, and licensing records.
- `docs/math-report.json`, `docs/performance-report.json`, `docs/playtest.md`, and `docs/reviews/`: recorded math, tests, measurements, limitations, and independent reviews. These are historical evidence, not new verification from init.
- Listening checks on speakers/headphones and confirmation of 60 FPS on the player's hardware remain unverified. Do not imply those results or invent external endorsements.

## Product Principles

- Prioritize the feel of each spin and the clarity of its result.
- Let the lounge sustain play and offer lasting goals with minimal management.
- Keep the economy finite in upgrades, understandable, and free of real-money stakes.
- Protect local progress and make backup and recovery practical.
- Preserve player control through deliberate spins, skippable celebrations, and adjustable effects.

## Accessibility & Inclusion

Preserve existing keyboard operation and visible focus for standard controls, Space-based spin/skip behavior, audio muting, reduced motion and lights, and effect-intensity settings. No specific accessibility conformance standard has been confirmed.
