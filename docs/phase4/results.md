# Phase 4 — quantified progression results

All values are **modeled**, using the imported production constants. Hospitality is hypothetical. No production values changed. See [method and command](README.md) and [complete output](simulation.json). Baseline is `production8`; proposed economy is `hospitality8`. Cap 24/48h variants are rejected comparators, not part of the preferred minimum expansion.

## Checkpoint convention

Time zero includes purchases and, for active cohorts, a play session. Frequent visits occur at hours 0, 6 and 12 of each day (12h overnight gap); daily every 24h; occasional every 48h. Events at a checkpoint are processed before its snapshot. A checkpoint itself never causes accrual/purchases. Values show the stored wallet; pending-if-returned income is separately present in CSV/JSON. One day without an occasional return therefore does not collect anything. Session lengths are zero; no session-minute emission is included.

ROI-target chooses lowest price/marginal gain among available next tiers, waits for that target if necessary, and repeats when affordable. It may be suboptimal. The separate fixed-order search tests all 1,680 legal orders. This is mathematical progression, not a retention estimate.

## 1. No-spin progression at all requested horizons

Cells: **purchases owned out of 9; stored token balance**. Levels and rate for every checkpoint are in [CSV](deterministic.csv).

| Economy / cadence         |    Day 1 |      Day 3 |       Day 7 |      Day 14 |       Day 30 |
| ------------------------- | -------: | ---------: | ----------: | ----------: | -----------: |
| production8 / frequent    |  3/9; 98 | 5/9; 1,234 |  9/9; 8,962 | 9/9; 31,362 |  9/9; 82,562 |
| production8 / daily       | 2/9; 422 |   3/9; 458 |    5/9; 458 |  9/9; 4,226 |  9/9; 24,706 |
| production8 / occasional  | 1/9; 250 |   2/9; 422 |    3/9; 458 |    5/9; 458 |   9/9; 5,506 |
| hospitality8 / frequent   | 4/9; 346 | 7/9; 1,682 | 9/9; 13,386 | 9/9; 43,346 | 9/9; 111,826 |
| hospitality8 / daily      | 3/9; 122 |   4/9; 754 |    7/9; 850 |  9/9; 7,282 |  9/9; 34,674 |
| hospitality8 / occasional | 1/9; 250 |   3/9; 122 |    4/9; 754 |    7/9; 850 |   9/9; 8,994 |

Hospitality does not manufacture a month of content: every no-spin cohort completes by day 20, frequent by day 4. Daily holdings grow much faster after completion. This is a finite-room game with a post-completion plateau in decisions, not a plateau in money.

## 2. Purchase milestones

Hours from starting. Purchases occur at visits, not automatically when affordability is first reached. Initial 1,000 is immediately spendable. All production prices remain 11,750 in total.

| Economy / cadence         |  Bar 1 / 2 / 3 | Machine 1 / 2 / 3 | Furnishings 1 / 2 / 3 | Full businesses | All nine |
| ------------------------- | -------------: | ----------------: | --------------------: | --------------: | -------: |
| production8 / frequent    |    6 / 36 / 78 |       0 / 24 / 60 |         84 / 96 / 102 |              78 |      102 |
| production8 / daily       |  24 / 96 / 216 |      0 / 72 / 168 |       216 / 240 / 264 |             216 |      264 |
| production8 / occasional  | 48 / 192 / 432 |     0 / 144 / 336 |       432 / 480 / 528 |             432 |      528 |
| hospitality8 / frequent   |    6 / 24 / 60 |       0 / 36 / 96 |          12 / 48 / 78 |              96 |       96 |
| hospitality8 / daily      |  24 / 72 / 168 |      0 / 96 / 240 |        24 / 120 / 192 |             240 |      240 |
| hospitality8 / occasional | 48 / 144 / 336 |     0 / 192 / 480 |        48 / 240 / 384 |             480 |      480 |

First self-funded purchase: baseline/proposed frequent bar at hour 6; daily bar at 24; occasional bar at 48. In the proposed policy, a first furnishing follows at hour 12/24/48, so the early room changes before the long last-tier waits. The daily proposed late gap from furnishings 3 at hour 192 to machine 3 at hour 240 is two days. Occasional has the analogous four-day gap. The business finale and furnishing finale can occur in different orders.

## 3. Sampled active play

1,000 seeded paths per row, seed 20261105 + index; Mulberry32 draws from the exact correlated outcome table. Attempt 30 default spins per frequent visit, 100 per daily/occasional visit, **after purchases**, stopping a session if the next five-token stake is unaffordable. Starting session included. In 30 days this is 91/31/16 scheduled sessions respectively. Attempts missed through liquidity are counted, not silently refunded or assumed to happen. No expected-value payouts enter wallets.

| Economy / cadence         | Full room days p10 / median / p90 | Observed full-room days min–max | Day-30 balance p10 / median / p90 | Mean missed spins by day 30 |
| ------------------------- | --------------------------------: | ------------------------------: | --------------------------------: | --------------------------: |
| production8 / frequent    |                   4.5 / 4.5 / 4.5 |                           3.5–5 |          78,348 / 78,970 / 79,848 |                        9.13 |
| production8 / daily       |                      12 / 13 / 13 |                            9–14 |          19,936 / 20,673 / 21,728 |                       69.38 |
| production8 / occasional  |                      24 / 26 / 26 |                           18–28 |             2,675 / 3,264 / 3,948 |                       69.38 |
| hospitality8 / frequent   |                      4 / 4 / 4.25 |                       3.25–4.25 |       107,558 / 108,356 / 109,313 |                        9.97 |
| hospitality8 / daily      |                      11 / 11 / 12 |                            8–12 |          29,320 / 30,167 / 31,362 |                       65.39 |
| hospitality8 / occasional |                      22 / 22 / 24 |                           16–24 |             5,579 / 6,295 / 7,078 |                       65.39 |

Sample extrema are not mathematical bounds. A jackpot can accelerate an individual run; the expected effect of staking is a loss. The proposed system does not make gambling required or profitable.

### Proposed active-cohort checkpoints

Cells: **median purchases; median balance [p10–p90 balance]**. Medians of different variables need not describe the same individual save.

| Cadence    |             Day 1 |                  Day 3 |                       Day 7 |                      Day 14 |                         Day 30 |
| ---------- | ----------------: | ---------------------: | --------------------------: | --------------------------: | -----------------------------: |
| frequent   | 4/9; 195 [81–351] | 7/9; 1,296 [763–1,527] | 9/9; 12,468 [11,832–12,901] | 9/9; 41,634 [40,947–42,206] | 9/9; 108,356 [107,558–109,313] |
| daily      |   2/9; 34 [1–212] |      4/9; 288 [12–533] |      6/9; 1,487 [208–1,791] |    9/9; 4,734 [4,003–5,487] |    9/9; 30,167 [29,320–31,362] |
| occasional | 1/9; 125 [19–247] |        2/9; 34 [1–212] |           4/9; 288 [12–533] |      6/9; 1,487 [208–1,791] |       9/9; 6,295 [5,579–7,078] |

## 4. Sources, sinks and conservation

`wallet = 1,000 + passive emission + slot returns − upgrade spend − stakes − rounds` is asserted at every simulated event. Fractional emission is carried until a whole token is available. Free finish choices are financially inert; the model has no extra currency or reward for logging in.

Day-30 no-spin ledgers:

| Economy / cadence         | Passive source | Upgrade sink | Final wallet |
| ------------------------- | -------------: | -----------: | -----------: |
| production8 / frequent    |         93,312 |       11,750 |       82,562 |
| production8 / daily       |         35,456 |       11,750 |       24,706 |
| production8 / occasional  |         16,256 |       11,750 |        5,506 |
| hospitality8 / frequent   |        122,576 |       11,750 |      111,826 |
| hospitality8 / daily      |         45,424 |       11,750 |       34,674 |
| hospitality8 / occasional |         19,744 |       11,750 |        8,994 |

Proposed active paths, day-30 **means**, rounded to 0.1 token; any 0.1 discrepancy is display rounding.

| Cadence    | Passive source | Upgrade sink | Stakes sink | Slot-return source | Final wallet |
| ---------- | -------------: | -----------: | ----------: | -----------------: | -----------: |
| frequent   |      122,382.3 |     11,750.0 |    13,600.1 |           10,402.9 |    108,435.1 |
| daily      |       44,605.7 |     11,750.0 |    15,173.1 |           11,609.7 |     30,292.3 |
| occasional |       18,925.7 |     11,750.0 |     7,673.1 |            5,859.5 |      6,362.1 |

Observed lower wallet versus no-play includes both net wagering loss and later investment/earnings. It is not just `spins × expected loss`. Slot stakes, returns and passive emission remain separately auditable.

At full proposed income, a capped visit generates 1,712 tokens, while 100 default spins lose about 118.55 on average. The daily late game therefore accumulates roughly 1,593.45 tokens per such visit before rounds. At every-two-day cadence that is half as much per calendar day. A 50-token round has no financial payback and remains optional. No added sink is proposed merely to eliminate these balances.

## 5. Opportunity cost, rank changes and strategies

Current bar/machine marginal paybacks are 41.67/83.33/166.67 and 37.5/75/150 earning hours; decor never financially repays. Proposed marginal returns: bar `12+4d`; machine `20+2d`; furnishing `4b+2m`. These are incremental gains, not the full income divided by price.

| State (bar, machine, decor) | Next bar: price / gain / payback h | Next machine        | Next furnishing  |
| --------------------------- | ---------------------------------- | ------------------- | ---------------- |
| 0,0,0                       | 500 / 12 / 41.67                   | 750 / 20 / 37.5     | 300 / 0 / never  |
| 0,0,1                       | 500 / 16 / 31.25                   | 750 / 22 / 34.09    | 900 / 0 / never  |
| 1,1,0                       | 1,000 / 12 / 83.33                 | 1,500 / 20 / 75     | 300 / 6 / 50     |
| 2,2,1                       | 2,000 / 16 / 125                   | 3,000 / 22 / 136.36 | 900 / 12 / 75    |
| 3,3,2                       | complete                           | complete            | 1,800 / 18 / 100 |

Even +6/h does not justify claiming a free rug: spending 300 delays the alternative that capital could finance. At daily eight-hour credit the +6 earns only 48 tokens per calendar day; direct payback takes 6.25 days. The final decor pays itself back in 12.5 days at daily cadence, or 25 days for occasional. A player near their desired ending may rationally buy for appearance rather than amortization.

Daily no-spin policy sensitivity:

| Policy       | Current full-room days | Proposed full-room days | Current day-30 wallet | Proposed day-30 wallet |
| ------------ | ---------------------: | ----------------------: | --------------------: | ---------------------: |
| income-first |                     11 |                      11 |                24,642 |                 33,282 |
| roi-target   |                     11 |                      10 |                24,706 |                 34,674 |
| balanced     |                     12 |                      10 |                23,266 |                 34,450 |
| decor-first  |                     15 |                      13 |                20,130 |                 30,178 |
| none         |           No purchases |            No purchases |                16,360 |                 16,360 |

The no-purchase control is not a strategy for completing the room. Best finishing time and highest wealth are distinct objectives; cosmetic taste is not assigned invented numeric utility. Economically bad sequences remain possible. No system promises that every choice is equally strong.

### Exhaustive fixed-order search

All 1,680 legal orders; each buys its next target as soon as affordable at a scheduled visit, repeating within the visit. This establishes optimality **within that policy family**, not among all possible intentional waits and visits. Example orders/milestones and the richest day-30 order are in JSON.

| Economy / cadence         | Fastest finish days | Equally fastest orders | Worst finish days | Richest finished day-30 wallet |
| ------------------------- | ------------------: | ---------------------: | ----------------: | -----------------------------: |
| production8 / frequent    |                4.25 |               28/1,680 |                 6 |                         82,562 |
| production8 / daily       |                  11 |              245/1,680 |                15 |                         24,738 |
| production8 / occasional  |                  22 |              245/1,680 |                30 |                          5,538 |
| hospitality8 / frequent   |                   4 |              522/1,680 |               5.5 |                        111,826 |
| hospitality8 / daily      |                  10 |              471/1,680 |                14 |                         34,722 |
| hospitality8 / occasional |                  20 |              471/1,680 |                28 |                          9,042 |

In particular, hundreds of proposed orders tie for completion. The rank reversals are real, but the evidence does **not** establish deep strategy. A publishable claim is “furnishing the existing businesses changes what is worth buying next,” not “every room needs a different optimal build.” A same-goal optimizer will still solve the finite system.

## 6. Cap and attendance sensitivity

ROI-target no-spin full-room completion, changing only the stated cap/formula. All preserve the starting grant and actual prices.

| Model         | Frequent days | Daily days | Occasional days | Daily day-30 wallet |
| ------------- | ------------: | ---------: | --------------: | ------------------: |
| production8   |          4.25 |         11 |              22 |              24,706 |
| production24  |             4 |          4 |               8 |             100,802 |
| production48  |             4 |          4 |               6 |             100,802 |
| hospitality8  |             4 |         10 |              20 |              34,674 |
| hospitality24 |           3.5 |          4 |               8 |             135,794 |
| hospitality48 |           3.5 |          4 |               4 |             135,794 |

A larger static cap helps occasional visitors but does not by itself provide a richer game. The 48h hospitality model has 1,485/1,680 daily purchase orders complete on day 4; its coarse cash batches largely erase purchase-order consequences. It also approaches 136,000 daily no-spin tokens by day 30. Both 24h and 48h cap increases are excluded from the preferred minimum expansion at these prices; they remain owner-visible tradeoffs, not hidden tuning.

Keeping eight hours leaves a substantial fairness/cadence limitation: occasional players take twice as many calendar days as daily players under identical per-visit actions, and an unattended visible tab can earn more. No mode selector or attendance-reset accounting is smuggled into the recommendation. If this gap fails the playtest, the package needs another owner decision, not silent integration.

## 7. Stress cases

Daily schedule, 1,000 seeds. Spin-first plays 100 defaults before buying; high-stake attempts 20 spins at 40×5 **after buying**, truncating when unable to afford the next 200-token stake; rounds spends 50 once after each visit’s purchases if affordable, with no spins. Completion can extend to day 365 for this report; day-30 wallets use no future income.

| Economy / case                  | Completed by day 30 | Completion days p10 / median / p90 | Day-30 wallet median | Mean missed spins by day 30 |
| ------------------------------- | ------------------: | ---------------------------------: | -------------------: | --------------------------: |
| production8 / spin-first        |          1000/1,000 |                       12 / 13 / 14 |               20,459 |                           0 |
| production8 / high-stake        |           560/1,000 |                       18 / 29 / 50 |                1,006 |                      202.51 |
| production8 / round-each-visit  |          1000/1,000 |                       12 / 12 / 12 |               23,156 |                           0 |
| hospitality8 / spin-first       |          1000/1,000 |                       11 / 12 / 12 |               29,901 |                           0 |
| hospitality8 / high-stake       |           897/1,000 |                       15 / 21 / 31 |                6,636 |                      177.03 |
| hospitality8 / round-each-visit |          1000/1,000 |                       11 / 11 / 11 |               32,516 |                           0 |

These policies are examples, not safe spending recommendations or promises. Investing first can starve the first play session; buying later can slow income. The high-stake stress is deliberately optional and can delay the entire room far past casual completion. No active reward or loss subsidy is added to disguise that effect. Replaying an exported backup can erase losses because this is a local offline game.

## 8. Validation and limits

The analysis asserts exact RTP agreement, evaluator payout scaling at sampled stops, cap/repeat/rollback behavior, every event’s token ledger, nonnegative safe-integer wallets, the 1,680-order count, and marginal-gain equality across every possible room state. Enumerated payouts preserve within-spin correlations; between-spin sampled draws are pseudorandom. The generator is for reproducible design evidence, not production RNG.

The simulation does not claim natural browser scheduling, offline anti-cheat, player preferences, retention, session length, art acceptance or user comprehension. No human tests were conducted. Small seeded tails can miss rare paths; reported extrema are not guarantees. Rates/rounds are mathematical abstractions already in the game. No new guests, skill play or dynamic demand is simulated.
