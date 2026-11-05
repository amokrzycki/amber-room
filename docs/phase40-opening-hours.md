# Phase 4.0 · P1 opening hours model and isolated prototype

2026-11-05. **Recommendation: REVISE before integration. GO for the isolated accounting experiment only.** P1 has real cadence tradeoffs; it is not a fix for the finite progression horizon. Nothing in production imports the experiment. P2, P3, RNG, payout tables and production save/accounting rules are unchanged.

## Verified production baseline

Source: `src/main.ts`, `src/runtime.ts`, `src/game/business.ts`, `src/game/save.ts`. Browser reproduction: `node scripts/browser-idle-baseline.mjs`; data: `docs/evidence/phase40/baseline-browser.json`.

- `accrueIncome` caps **each call's elapsed interval** at eight hours, carries fractional token units and moves the checkpoint to the supplied time even when excess time is discarded.
- A visible tab requests accounting every second. Repeated gaps below eight hours pay their whole duration. There is no inactivity budget; an unattended visible tab therefore continues earning up to the safe-integer limit, where the function throws. Browser observation below covers 48 hours of controlled time; indefinite continuation follows from the code, not a real multi-day observation.
- Hidden-tab ticks skip accounting. `visibilitychange` accounts on both transitions. Returning after a 48-hour hidden gap pays eight hours, once. Reload calls accounting from the persisted checkpoint; same-time events/reloads do not repay an interval.
- Earnings depend on callback delivery, not the number of frames. Delays under eight hours preserve elapsed income; a visible callback delayed longer than eight hours loses the excess. Hidden callbacks are skipped regardless of their cadence.

| Controlled browser case, base 64/hour                     | Earned in 48 hours | Same-time repeat | Reload at same time |
| --------------------------------------------------------- | -----------------: | ---------------: | ------------------: |
| Visible, actual installed timer callback delivered hourly |              3,072 |                0 |                   0 |
| Visible, callback delivered every 12 hours                |              2,048 |                0 |                   0 |
| Visible, one callback after 48 hours                      |                512 |                0 |                   0 |
| Hidden, skipped callbacks, then visible after 48 hours    |                512 |                0 |                   0 |

The script overrides `Date.now` and `document.hidden` and invokes the application's actual registered 1-second callback at controlled delivery times. It tests browser wiring and persistence without waiting days. It does **not** measure a browser vendor's natural throttling/freeze schedule; those schedules, power saving and OS suspension remain environment dependent. The outcome of each delivery schedule above is observed; claims about what a particular browser will schedule naturally would be assumptions.

Clock behavior today: a backward/equal timestamp pays nothing and preserves the high-water checkpoint. A forward jump pays at most eight hours **per call**, so repeated forward clock changes with intervening calls can farm income. This remains a production limitation in this phase.

## Strategies and fixed-rate earnings

Use P1's proposed values unchanged. For a gap `t` hours, earnings are `baseRate × multiplier × min(t, cap)`. Base rate is 64/hour; full income upgrades give 160/hour. The table excludes upgrades and spins inside the gap so its meaning stays exact.

| Strategy                         | Multiplier |  Cap | 8 h | 12 h |  16 h |  24 h |  48 h |
| -------------------------------- | ---------: | ---: | --: | ---: | ----: | ----: | ----: |
| Brisk                            |       1.5× |  4 h | 384 |  384 |   384 |   384 |   384 |
| Standard / current absent player |         1× |  8 h | 512 |  512 |   512 |   512 |   512 |
| Long nights                      |      0.75× | 12 h | 384 |  576 |   576 |   576 |   576 |
| Simpler 24 h cap comparator      |         1× | 24 h | 512 |  768 | 1,024 | 1,536 | 1,536 |

At full upgrades multiply every amount by 2.5: Brisk 960; Standard 1,280; Long nights 960 at 8 hours and 1,440 at 12+ hours. Full values and all runs are in `docs/evidence/phase40/simulation.json`.

**No mode permanently dominates.** Brisk wins for planned gaps below 5⅓ hours, Standard for 5⅓–10⅔ hours, Long nights above 10⅔ hours; endpoints tie. Four-hour visitors receive 384/256/192 respectively; eight-hour visitors receive 384/512/384. Upgrades scale all rates equally, so these crossovers do not drift with progression. Regular active interaction favors Brisk; once-a-day and every-two-day visitors favor Long nights. Occasional players still lose most elapsed time: Long nights pays only nine equivalent base-rate hours per absence, whether they return at 12, 24 or 48 hours. It adds 12.5% to the current capped payout, while two-day visitors have half as many upgrade opportunities as daily visitors.

The free switch can sensibly use Brisk during an active evening and Long nights before leaving. This is an explicit anticipated-cadence policy, not a permanently optimal fixed mode. A mistimed return loses opportunity: Brisk at 24 hours returns 384 versus Long's 576. No mode is inferred retroactively from the elapsed gap.

## Progression simulation assumptions

`tests/opening-hours-simulation.test.ts` is executable and generates the JSON report. Horizon: 180 days. Seed: 20261105 plus sample index; 100 seeds for mixed play, one exact deterministic path for non-spinning policies. No human behavior or retention claims.

- Initial wallet 1,000, actual `catalog` prices: bar 500/1,000/2,000 (+12/hour each), machines 750/1,500/3,000 (+20/hour each), furnishings 300/900/1,800 (+0/hour). Total finite purchase cost 11,750. Income 64→160/hour.
- At time zero, buy the cheapest affordable income upgrade. At each visit account the elapsed interval, buy cheapest income upgrades first, then all furnishings. This matches the existing house-policy simulation, not a globally optimized investment policy. "Afford time" below means the first visit where this policy can buy; affordability between visits is not observed. Other purchase orders can differ.
- Frequent short sessions: one visit every 4 hours (idealized around the clock). Added eight-hour cadence demonstrates Standard's niche. Daily/every-two-day sessions: fixed 24/48-hour start-to-start gaps. Visits and purchases are instantaneous model events; gaps already account for all elapsed time, and session minutes are not separately added. The model does not estimate attention or realistic sleep patterns.
- Passive-only means daily collection, no purchases, no spins. The daily investor row separately measures passive earnings funding upgrades. No-interaction tab abandonment is assessed in the accounting invariants, not confused with deliberate daily collection.
- Mixed play buys upgrades first, then attempts 100 real default-bet spins/day. Use actual `requestSpin`, settlement transitions, strips and payout evaluation with a deterministic seeded RNG. It is reproducible **stochastic sampling**, not a guaranteed EV payout. Unaffordable attempts stop; missed attempts are recorded. No production RNG change.
- Exhaustive enumeration of all 248,832 default-bet stop combinations gives RTP **76.289223251%**, expected loss **1.185538837 tokens per five-token spin**, or 118.553884 per 100 attempts. This expectation is reported for interpretation; actual sampled payouts determine every wallet and purchase.

## Before/after progression

Hours from start until all income upgrades / all nine purchases. Mixed figures are medians across 100 seeds. Baseline is production accounting for closed-between-visits players; Standard's budget fix has identical payouts for these discrete visits. It differs for an unattended visible tab.

| Pattern                   |  Current 8 h |        Brisk |     Standard |  Long nights | Simple 24 h comparator |
| ------------------------- | -----------: | -----------: | -----------: | -----------: | ---------------------: |
| frequent-short            |      68 / 88 |      48 / 60 |      68 / 88 |     88 / 116 |                68 / 88 |
| eight-hour-visits         |      72 / 88 |     96 / 120 |      72 / 88 |     96 / 120 |                72 / 88 |
| daily                     |    216 / 264 |    288 / 360 |    216 / 264 |    192 / 240 |                96 / 96 |
| every-two-days            |    432 / 528 |    576 / 720 |    432 / 528 |    384 / 480 |              192 / 192 |
| passive-only-no-purchases | No purchases | No purchases | No purchases | No purchases |           No purchases |
| mixed-daily-100-spins     |    240 / 312 |    312 / 408 |    240 / 312 |    216 / 264 |               96 / 120 |

### Each upgrade, exact daily passive investor

Hours when bought. This is the same purchase policy and actual catalog, with no spins.

| Upgrade  | Current / Standard | Brisk | Long nights | Simple 24 h |
| -------- | -----------------: | ----: | ----------: | ----------: |
| bar1     |                  0 |     0 |           0 |           0 |
| machine1 |                 24 |    24 |          24 |          24 |
| bar2     |                 48 |    72 |          48 |          24 |
| machine2 |                 96 |   120 |          96 |          48 |
| bar3     |                144 |   192 |         144 |          72 |
| machine3 |                216 |   288 |         192 |          96 |
| decor1   |                216 |   288 |         192 |          96 |
| decor2   |                240 |   312 |         216 |          96 |
| decor3   |                264 |   360 |         240 |          96 |

Every cadence and all nine upgrades, with min/p10/median/p90/max for mixed play, are recorded in the JSON. Mixed completion ranges (hours):

| Strategy | Minimum | Median | Maximum |
| -------- | ------: | -----: | ------: |
| baseline |     240 |    312 |     312 |
| brisk    |     312 |    408 |     456 |
| standard |     240 |    312 |     312 |
| long     |     216 |    264 |     288 |
| simple24 |      96 |    120 |     120 |

## Design review and failure modes

1. P1 passes the narrow test of distinct cadence winners. Standard's niche appears at eight-hour visits; it is not hidden dominated. Frequent visitors can complete all content in 60 hours with Brisk, versus 88 hours today. That accelerates the existing finite-content problem.
2. Long nights changes daily completion from 11 to 10 days and every-two-day completion from 22 to 20 days. It does not substantially fix the once/twice-daily mismatch of a desktop companion. Mixed daily play reaches the last purchase around day 11 under Long nights (13 today), with variance from real outcomes.
3. The final upgrade still ends economic progression. Income stays fixed; the wallet grows unless spins/rounds consume it. Every sampled investor completes within 180 days. Passive-only no-purchase players have no upgrade progression by choice, not an accounting deadlock. Furnishings remain pure sinks; late upgrade payback and machine-vs-bar similarity remain unchanged.
4. At default stakes, 100 daily spins cost about 119 tokens in expectation; they compete with upgrades. Higher chosen stakes can consume more than the daily passive budget, delaying upgrades indefinitely under a spend-first policy. The simulation's buy-first policy must not be presented as a promise to all players.
5. Merely raising the cap to 24 hours is simpler but triples daily base income and compresses daily completion to four days (mixed: five). That is a major rebalance with current prices, not a harmless fairness fix. It still needs the inactivity budget correction or the visible-tab advantage persists.
6. Opening-hour choice is meaningful only if people can anticipate return cadence and understand the cap. A constant-mode strategy cannot be called universally best. Arbitrary/mixed cadences, free mode switching, spending habits and purchase orders are not validated by this finite sample.

## Working isolated prototype

Run `npm run dev`, then visit `/prototypes/opening-hours.html`. This is a virtual-time **accounting lab**, not a playable economy rollout. `prototypes/opening-hours.ts` holds the three fixed configurations and pure accounting functions; `opening-hours-lab.ts` drives the separate page. The production Vite entry does not import any of them. Typechecking includes the prototype; the normal build excludes it.

The lab permits strategy selection, explicit attendance, time advances, rollback, same-time polls, reset and copying a validated production save into its own namespace. There is no automatic mode selection or new game HUD. It writes only `amber-room:prototype:opening-hours:v1`; a copy reads `fruit-salon:v1` without changing it. Its separate save envelope is `{prototype: "opening-hours-v1", mode, creditedMs, save: SaveV1}`.

Accounting rule: the cap is a **persisted earning-time budget since deliberate attendance**, shared across visible/hidden/timer/reload paths. Polling cannot reset it; exhausted budget discards further elapsed time until another deliberate interaction. Changing strategy first settles the old mode, then starts a new future budget. In a future integration, only meaningful trusted player actions may call `attendPrototype`; automatic focus, visibility, scene creation, reload and timer callbacks must call `accruePrototype`. The lab's attendance control checks `event.isTrusted`. Its time buttons deliberately simulate the absence of player interaction despite being clicked in the diagnostic UI.

### Migration specification, tested before integration

1. Preserve the existing v1 production key/export byte for byte. Existing `parseSave` still reads the normal v1 shape; do not add prototype fields to it.
2. On explicit first copy, validate with `parseSave`, account any outstanding interval **under the old eight-hour rules** at migration time, retain balance, businesses, fractional units, settings and recorded spin settlement. Create a separate envelope with `mode` and zero consumed budget. Do not apply the chosen multiplier retroactively.
3. On lab reload, validate and resume the existing prototype envelope and consumed budget. Do not migrate the source again automatically. A deliberately requested reset/copy replaces only the lab state.
4. For future production integration, choose a new versioned schema/key and an atomic migration boundary; import/restore and persistence failure handling must be reviewed then. This lab is not a complete production migration rollout. To discard the experiment, remove only its key. Production progress never needs rollback.

### Tested invariants and honest clock limits

- Same-time events and reloads cannot duplicate credit; preserved fractional units do not round away income.
- Backward timestamps never pay or move the checkpoint backward. Invalid/nonfinite/negative timestamps throw. Overflow throws instead of silently changing money.
- A million-hour forward jump spends only the remaining mode budget. Repeated forward/rollback/reload cycles without attendance cannot earn more than one budget. Across 48 hourly polls Brisk still earns only 384, unlike production visible-tab accounting.
- Mode changes settle under the old mode before choosing the new one. Unattended visible-tab polling stops at the same cap as offline absence. Existing v1 and recorded spin outcomes remain readable and unchanged.
- **Local-clock limitation:** an offline app cannot authenticate wall-clock elapsed time across restarts. A forward jump may consume a budget early; a corrected backward clock can stall earnings until the stored high-water time catches up. Clock jumps plus new deliberate attendance can spend a new budget; synthetic interaction/save tampering cannot be secured by this local prototype. The tested bound is one persisted budget per genuine interaction interval, not universal anti-cheat. A production solution needs an explicit monotonic-session/rollback recovery policy (and a trusted time source if adversarial cross-restart clock accuracy is required). Do not claim this requirement fully solved.

Tests: `tests/opening-hours.test.ts`, `tests/opening-hours-simulation.test.ts`, `scripts/browser-opening-hours.mjs`. The browser lab verifies budget persistence through reload and mode changes with no production key creation, then checks explicit copy/reset against a seeded production value byte for byte; ordinary save/regression tests remain part of `npm test`.

## Integration gate

**REVISE.** Keep P1 isolated. Its mathematics justifies a prototype, not integration. Before a production GO, specify and test the clock-correction policy, define exactly which meaningful interactions renew the budget, and run the audit's three-cadence playtest. Compare the choice's comprehension/return value with a single attendance budget and a modest cap correction; do not adopt 24 hours unchanged at these prices. There is no retention evidence or owner aesthetic acceptance in this report. P2/P3 and a broader progression redesign were not implemented.
