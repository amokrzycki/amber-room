# Phase 4 design artifacts

- [Design and bounded roadmap](design.md)
- [Quantified results](results.md)
- [Reproducible analysis](economy-model.ts)
- [Full model output](simulation.json)
- [Deterministic checkpoints](deterministic.csv)
- [Independent critical review](independent-review.md), with accepted dispositions in the design
- [Validation evidence and limits](validation.md)

These files are analysis artifacts. Production imports no Phase 4 module. No production mechanics, save or constants were edited. Hypothetical hospitality constants and cap comparisons exist only in the model. Opening Hours P1 remains isolated and unapproved.

Run from the repository root with the installed Vite/TypeScript toolchain (no dependencies, listeners or gameplay builds needed):

```sh
node --input-type=module -e 'import { createServer } from "vite"; const runner = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" }); try { await runner.ssrLoadModule("/docs/phase4/economy-model.ts"); } finally { await runner.close(); }'
```

The model imports real production catalog, income, purchase, save creation and slot evaluation. It asserts ledger conservation, bounds, actual RTP, sampling/scaling equivalence, all 64 room states' marginal returns, and basic cap/repeat/rollback behavior. It writes only `simulation.json` and `deterministic.csv` in this directory. `results.md` summarizes that output; it does not regenerate automatically.

There are 90 deterministic cases, 9 seeded slot cohorts (1,000 samples each), 9 exhaustive purchase-order searches (1,680 orders each) and 9 stress cohorts (1,000 samples each). Seed: 20261105 plus sample index. Joint payout tables are enumerated from actual reel outcomes, preserving all within-spin line correlation. Mulberry32 selects a whole enumerated outcome using `floor(uint32 / 2^32 × 248832)`; its negligible finite-generator discretization is not a claim to replace production secure RNG. No exact EV is ever deposited into a sampled wallet.

Visits begin at time zero; frequent returns at hours 0, 6 and 12 of each 24h cycle, daily every 24h, occasional every 48h. Buys occur before spins unless labeled otherwise. Samples attempt 30/100/100 default spins per frequent/daily/occasional visit, including the initial visit. Thus a 30-day daily row includes 31 sessions; a day-1 occasional row includes no return yet. Checkpoint snapshots do not collect income or create visits; pending earnings are recorded separately. Session duration is zero, so active session minutes add no income. This isolates actions and cadence; it is not a naturalistic human forecast.

ROI-target chooses minimum next price/marginal gain (zero gain last), waits for that target, buys it when affordable, and repeats. It is not declared optimal. Ties sort by lower cost. Income-first buys cheapest next bar/machine before any decor. Decor-first buys all three furnishing tiers before investing. Balanced buys a least-developed tier with lower-price tie break. None makes purchases in the no-purchase control. All models can spend the starting grant immediately.

Order search exhausts fixed legal orderings of three bar, three machine and three furnishing purchases, buying a target at the first affordable scheduled visit, then repeating while able. It searches fastest full-room completion and richest finished room at day 30. It does not establish optimality over arbitrary intentional waiting, variable cadence, gambling, or choosing never to finish.

Main runs stop at day 30 once finished; unfinished stress runs extend to 365 days for completion. Thirty-day snapshots never use subsequent earnings. Percentiles use the sorted value at `floor(n × percentile)`; these are sample summaries, not confidence intervals. No player preference or retention data is generated.
