# The Amber Room · The Orchard

A private offline game with a 5×3 slot machine and a separate lounge with a bar, three business machines, and furnishings. The interface is in English. The game uses one fictional currency, with no backend, accounts, or real money.

## Play the game

Double-click [dist/index.html](dist/index.html) to open it in a current browser with WebGL support (tested in Chromium 156). You do not need a server or an internet connection. The file is about 7.5 MB and includes all 22 image and audio assets, code, and styles. Your first click enables audio.

- `Play The Orchard` opens the slot machine. Press `SPIN` or Space to spin once. Holding the button or key does not trigger automatic spins.
- `Bet / line` × `Lines` = `TOTAL BET`. Choose the first 1, 5, 10, 20, or 40 paylines. `Lines & payouts` shows their exact paths and the payout table.
- One button does both jobs: `SPIN` (or Space) starts a spin, the same button reads `SKIP` while the reels turn and reveals the already-saved result at once, and reads `SPIN` again when they stop. While a win celebration is still active, the first SPIN activation dismisses it without placing a wager; a later distinct activation starts the next spin. After dismissing or skipping, extra presses within about a third of a second are ignored so a double-click cannot place another bet. Holding Space or Enter does not repeat. Escape (or clicking the machine) also ends a win celebration without placing a bet. `← Lounge` returns to the lounge once the reels stop.
- `Settings & save` lets you mute audio, adjust independent music/room and machine-effects volume for the session, reduce motion, adjust effect intensity, and back up your progress. Use Tab/Shift+Tab to move between standard buttons and Enter/Space to activate them. Keyboard focus is visible.
- The lounge earns income automatically in both views and credits up to 8 hours of income when you return from an absence. Each purchase has three upgrade levels. `Buy the room a round` costs 50 and triggers a brief reaction with no other benefit.

## Back up and transfer saves

Open `Settings & save` and choose `Export JSON` to download your save. To move it to another folder or device, open the game there and choose `Import JSON`. The game validates the entire file before importing it. A valid import replaces your current progress; an invalid file leaves it untouched.

The game saves to localStorage under `fruit-salon:v1`. For `file://` pages, storage access depends on the browser and the HTML file's location. Use JSON exports as portable backups.

If a save is damaged, the game protects the original and lets you retrieve it with `Download damaged original`. If the browser blocks storage, the game runs in memory and displays a warning. Export your save before closing it. Spin results and the balance are saved together before the animation starts, so restarting does not pay out the same win twice.

## Development and checks

Use Node 24 or 26 (tested with 26.12.1). The initial `npm ci` downloads dependencies; the built game does not download them.

```sh
npm ci
npm run check
npm test
npm run typecheck
npm run build
npm run check:offline
```

`npm run dev` starts Vite for development. Labeled buttons for forcing test scenarios appear only in development, not in `dist/index.html`. Phaser is pinned to 4.2.1, and the lockfile records dependencies. `build` produces a single standalone file without a `public` directory or external fonts.

Use `npm run format` to format supported files across the repository with Biome. `npm run check` checks formatting and lint rules; `npm run check:fix` applies formatting and safe fixes. You can also run `npm run lint` and `npm run format:check` separately. The build and GitHub Actions require `check` to pass. For formatting on save in VS Code or Cursor, install the recommended Biome extension. Biome does not handle Python scripts or binary files.

Browser tests live in `tests/e2e/*.spec.ts` and use the Playwright Test runner. Install Chromium once, then run the suite (the command builds the standalone game first):

```sh
npx playwright install chromium
npm run test:e2e
```

GitHub Actions runs `npm run test:e2e:ci`, which excludes tests tagged `@local`. It checks offline startup, exact-once wagers and payouts, all bet settings, save recovery/import/export, purchases, idle income, keyboard input, accessible announcements, reduced motion, result dialogs and DOM layout bounds. These checks wait for application state rather than require a particular frame rate.

`npm run test:e2e:local` runs the eight local audits: resource/FPS measurements, the full cabinet state/viewport sweep, moving-reel clipping, reel motion/audio sequencing and pixel alignment, font/win-preview pixels, skip at specific animation phases, the two-frame skip limit, and the full per-frame HUD stability sweep. `npm run test:e2e` still runs all 29 tests. Functional assertions bundled in these audits remain part of the full local suite; CI covers the corresponding game flows without FPS thresholds or the full visual audits.

Use `npm run test:e2e:ui` for the interactive runner, or `npx playwright test tests/e2e/save-business.spec.ts` to run one suite after building. `npm test` runs the separate Vitest unit tests. `npm run typecheck` checks both unit and browser tests.

The suite opens the production build via `file://` with networking disabled. Playwright starts and stops Vite automatically for the isolated opening-hours prototype. Chromium is managed by Playwright; to use an existing browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. The reel-clipping test also needs Python with Pillow (`python -m pip install Pillow`).

The tests force outcomes by replacing the RNG within their browser environment. They do not use a production control panel or add to the in-game balance. Performance measurements come from headless SwiftShader, not the player's GPU.

## Assets and reports

Screenshots, recordings, and the asset preview sheet go in `docs/evidence/`. This local directory is ignored by Git and created automatically by the scripts.

The custom bitmap set was created with `image_gen`. The 7/WILD symbols and the precise cabinet geometry were drawn in code. Audio consists of 13 original synthesized WAV files. The game uses no Kenney or Freesound samples; the Kenney archive download returned HTTP 403. Lossless sources and generators are included in the repository.

For asset details, sources, and modifications, see the [runtime manifest](src/assets/manifest.json), [asset origins and prompts](docs/asset-generation.md), and [Phaser MIT notices](docs/THIRD_PARTY_NOTICES.md).

Further documentation covers [tests and limitations](docs/playtest.md), [design decisions](docs/decisions.md), [exact game math](docs/math-report.json), and [performance measurements](docs/performance-report.json). Independent reviews are in `docs/reviews/`.

The owner accepted the Phase 2.1 visual direction. Phase 3 listening checks on headphones/speakers, screen-reader output, and other browsers remain unverified. Hardware-reported shared-preview measurements are documented separately from headless SwiftShader results.

Phase 3 uses display-only debit/credit counting, smooth reel acceleration and braking, staggered stops, a small mechanical settle, and subdued machine sounds. Gross/returned/net share one counter; the full settlement remains saved before playback. Reduced-motion preferences and hidden tabs settle directly to the recorded grid. Winning line numbers remain available after the visual highlight ends. No RNG, economy, progression, or save-schema changes were made.

See the [Phase 3 report](docs/reviews/2026-11-05-phase3-motion.md) and [independent recording review](docs/reviews/2026-11-05-phase3-independent.md) for recordings, measurements, test coverage, and remaining listening/device limitations.

## Phase 3.3 / isolated Phase 4 lab

The compact winning-line count opens a result-details dialog with its own 5×3 diagram. Select a line with the pointer or arrow keys; Home/End select the first/last line. Tab stays in the dialog; Escape or Close returns focus to the result trigger. Line numbers and payouts come from the recorded outcome.

P1 is **not enabled in the normal game**. With `npm run dev`, open `/prototypes/opening-hours.html` for the virtual-time accounting lab. It uses `amber-room:prototype:opening-hours:v1`; copying a v1 save never overwrites `fruit-salon:v1`. The normal standalone build contains neither the lab nor its accounting module.

See [P1 model, migration and integration recommendation](docs/phase40-opening-hours.md) and [Phase 3.3 verification](docs/reviews/2026-11-05-phase33-closure.md). Reproduce with `npm test` and `npm run test:e2e`.
