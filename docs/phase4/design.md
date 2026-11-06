# Amber Room — Phase 4 gameplay decision

2026-11-05 · **Design proposal, awaiting owner selection. Review outcome: REVISE; neither candidate is production-ready. No gameplay implementation authorized.**

This supersedes the earlier audit's recommendation to pursue Opening Hours. P1 is **not approved for integration**. Its isolated files remain untouched. Phase 3.3's visual direction is provisionally accepted; this proposal requires no general visual redesign.

Evidence: **V** = verified current code; **M** = deterministic calculation or seeded simulation; **H** = untested design/experience hypothesis. Model: [source](economy-model.ts), [complete data](simulation.json), [checkpoint CSV](deterministic.csv), [results](results.md). Separate [independent review](independent-review.md); accepted findings and revisions in §6. The reviewer assessed the initial draft; the final revisions below are the orchestrator's dispositions, not a claim of a second independent approval.

## 1. Verified gameplay baseline

Read against repository HEAD `c4e831a6c17f623b664517ba695d418689ae37fb`, with a clean worktree before this analysis. Older documents contain different policies, estimates and historical constants; the imported production functions are authoritative here.

### Actions and consequences [V]

| Action                                                   | Financial consequence                                                  | Persistent/experiential consequence                                                       |
| -------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Return or wait in either scene                           | Earn current hourly income, subject to accounting gaps below           | Wallet saved; no visitor simulation, stock, staff, operating costs or demand              |
| Buy bar tier                                             | Pay 500 / 1,000 / 2,000; +12/h each                                    | Three small bar details; first tier makes the bar fully visible                           |
| Buy extra machine                                        | Pay 750 / 1,500 / 3,000; +20/h each                                    | Up to three additional machine sprites; these are **not playable machines**               |
| Buy furnishings tier                                     | Pay 300 / 900 / 1,800; +0/h                                            | Sequential rug, plants, fixed Amber Room brass plaque; no name entry                      |
| Buy the room a round                                     | Pay 50; no bonus, income or odds effect; bar ownership not required    | Brief cheer/toast/light response, no enduring progression                                 |
| Choose lines/bet and deliberately spin                   | Stake subtracted, full payout added in one pre-animation transaction   | Persist last result; no spin XP, quests, collection, bar revenue or unlock                |
| Dismiss celebration / inspect lines / move between views | No additional wager or payout                                          | Existing keyboard controls, result diagram and adjustable audio/motion                    |
| Export/import local save                                 | Validated state replacement, not a token source within a single ledger | Portable local backup; no server authority, multi-device merge or cumulative play history |

Sources: [business.ts](../../src/game/business.ts), [SalonScene.ts](../../src/view/SalonScene.ts), [session.ts](../../src/game/session.ts), [save.ts](../../src/game/save.ts), [SlotScene.ts](../../src/view/SlotScene.ts), [ui.ts](../../src/view/ui.ts). No implementation has visitors purchasing spins: passive machine yield is an abstract constant.

### Income and offline accounting [V/M]

Start: **1,000 tokens**. Income `R = 64 + 12b + 20m`, `b,m,d ∈ {0,1,2,3}`. Full productive room: **160/h**. Productive purchases cost **8,750**; full nine-purchase room costs **11,750**.

Each accrual credits `floor((fractionalUnits + min(elapsedMs, 8h) × R) / 3,600,000)`, carries the fractional remainder and advances the checkpoint to now. Excess time is discarded. A backward/equal timestamp neither credits nor moves the checkpoint backward. Purchases settle the old rate before changing levels. Spins accrue in the UI before settlement.

The actual limit is **eight hours per accrual gap**, not per day or per meaningful interaction. `main.ts` calls every second while visible and on both visibility transitions; each scene also accrues on entry. Thus a continuously visible tab can earn 24 hours/day without playing. Hidden/closed daily and every-two-day visits both receive eight hours per visit. Frozen visible tabs can lose time if callback gaps exceed eight hours. These are code-derived facts; historical controlled browser reproduction is in [the P1 report](../phase40-opening-hours.md), not a fresh natural-scheduling observation.

At base/full rate, a capped visit yields **512 / 1,280**. Daily attendance captures 8 earning hours/day; every-two-day attendance averages 4; our frequent waking schedule captures 20 (6+6+8). No bankrupt state is permanent: one token accrues from zero after 56.25 seconds at base rate, if accounting runs.

### Upgrade payback [M]

Payback is marginal price / marginal gain, **earning hours**, not total-room income or calendar time.

| Upgrade tier          |               Price |  Gain/h |        Payback earning h | Days at daily 8h credit | Days at every-two-day visits, average 4h/day |
| --------------------- | ------------------: | ------: | -----------------------: | ----------------------: | -------------------------------------------: |
| Bar 1 / 2 / 3         | 500 / 1,000 / 2,000 | 12 each |   41.67 / 83.33 / 166.67 |    5.21 / 10.42 / 20.83 |                        10.42 / 20.83 / 41.67 |
| Machine 1 / 2 / 3     | 750 / 1,500 / 3,000 | 20 each |          37.5 / 75 / 150 |     4.69 / 9.38 / 18.75 |                          9.38 / 18.75 / 37.5 |
| Furnishings 1 / 2 / 3 |   300 / 900 / 1,800 |       0 | Never financially repays |                       — |                                            — |

These are amortization periods, not unlock times. At the start the first bar or machine can be bought immediately. Furniture competes for working capital: under the stated daily policies, furniture-first completes the current room on day 15 versus day 11 for an ROI-target investor. The difference includes foregone reinvestment, not just the 3,000-token purchase cost.

### Slot mathematics [V/M]

Five identical 12-stop strips; three visible symbols per reel; 40 fixed unique lines; active prefixes 1/5/10/20/40; per-line wager 1/2/5. WILD substitutes; only the best left-to-right 3–5-symbol match pays on each active line. No scatter, free spin, bonus mode, pity, skill timing or changing odds. Production RNG uses rejection-sampled `crypto.getRandomValues`.

Exact enumeration of **248,832 joint stops** gives RTP **76.289223251% for every legal bet**. Expected net loss is **23.710776749% of turnover**. More lines change the distribution, not RTP. Lines are correlated; modeling them as independent would understate/otherwise distort risk.

| Lines at 1/line | Mean payout | Payout standard deviation | Zero return | Net-profitable spin | Maximum payout |
| --------------- | ----------: | ------------------------: | ----------: | ------------------: | -------------: |
| 1               |       0.763 |                     5.433 |      89.24% |              10.76% |          2,000 |
| 5, default      |       3.814 |                    12.736 |      60.42% |              19.26% |          2,080 |
| 10              |       7.629 |                    18.938 |      37.27% |              22.37% |          2,218 |
| 20              |      15.258 |                    29.122 |      14.12% |              21.54% |          2,392 |
| 40              |      30.516 |                    47.034 |       4.51% |              23.26% |          2,611 |

Per-line wager 2 or 5 multiplies the payout, stake and standard deviation by 2 or 5, and variance by 4 or 25. Default expected loss: **1.18554/spin**, **118.55/100 spins**. Maximum bet: 200 stake, **47.4216 expected loss/spin**, maximum payout **13,055**. In 100 independent default spins the net standard deviation is about 127.36 tokens, with a strongly right-skewed distribution; a normal approximation is not a reliable tail model.

The base income funds about **54 default spins per earning hour in expectation**, not unlimited continuous play. It does not guarantee enough liquid balance for the next stake. A lucky win can accelerate a project; systematically spinning slows investment. Exact outcomes, not expected payouts, fund the stochastic wallets below.

### Current milestones, decisions and ending [V/M/H]

There are exactly **nine purchases**, all available from the beginning subject only to balance and preceding tier. No milestone unlocks new gameplay. Bar/machine completion and full furnishings are emergent milestones; there is no explicit finale. Afterward income continues; remaining sinks are voluntary slots and rounds. The last spin persists, but there is no persistent trophy shelf.

Meaningful today: play now versus permanent room improvement; aesthetic gratification now versus faster later income; small low-turnover bets versus larger financial swings; spend on a round for its own sake. None changes slot odds. [V/M]

Weak today: bar versus machine are mostly two versions of fixed income. Machines have better **standalone payback at matching tiers**, but do **not** strictly dominate every purchase: bar is cheaper and can accelerate another purchase sooner. Example: with 500 tokens and zero levels, bar is affordable and machine requires waiting. Enumerating all 1,680 legal purchase orders shows multiple completion-optimal orders, and the richest order at day 30 need not be the first completion-optimal order. Furnishings/rounds are economically dominated if the sole objective is maximum tokens; aesthetic enjoyment is a separate objective, not hidden financial value. [M]

Completion under our ROI-target policy, no spins: **4.25 / 11 / 22 days** for frequent/daily/occasional. With modeled default play: medians **4.5 / 13 / 26 days**. These are policy outcomes, not measured player retention or global optima under all behaviors. [M]

Existing rewards are the room art additions, cabinet presentation, result feedback, sounds, skippable celebrations and the voluntary toast. Their emotional value and ability to motivate returns remain untested. [H]

## 2. Choose a direction

| Direction               | Main promise / decisions                                                                               | What it would require                                                                                | Strongest objection                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Cozy idle lounge** | Build a small personal room; choose when to invest versus enjoy it; optional slots funded by that room | Make existing purchases interact and make room changes personally legible; accept a finite ending    | Strategy remains light; it cannot credibly promise a 30-day management game                                                                                          |
| B. Arcade tycoon        | Operate a venue; choose capacity, service and demand allocations                                       | Genuine constraints, utilization, visitor behavior or operating choices; new simulation and feedback | At current scale it risks opaque multipliers or maintenance chores. A scalar income selector would be fake tycoon play                                               |
| C. Hybrid               | Arcade actions and management reinforce each other                                                     | A valuable active input separate from luck, or rewards tied to wagering                              | Rebates, spin quotas and outcome collections incentivize token churn/RNG; non-wager tasks introduce another game. An optional bonus easily becomes the optimal chore |

**Preferred hypothesis: A, testing one bounded economy interaction and one visible authorship choice.** [H] This follows the existing private-arcade purpose and allows a player to stop after finishing a satisfying small space. It is not a direction lock or a finding that added systems improve the game. Do not label it a hybrid merely because both views exist. Passive income supports active entertainment; active slots do not owe the player a progression bonus.

Tradeoffs accepted by this recommendation: less strategic depth than a real tycoon; financially optimal purchase orders will exist for a given objective; optional gambling remains negative EV; the current cap still favors attendance; content can finish well before 30 days. If the owner wants operational mastery or financially rewarding active play, reject this recommendation and choose B or a separately scoped non-wager active game. Do not conceal that choice inside Phase 4.

## 3. Recommended loop and candidate minimum expansion

**Return → see the tokens earned and the next room change → compare investing in service, machines or furnishing the existing room → buy or save → optionally play The Orchard / buy a round → leave freely.**

There are **two connected experiment candidates**, not three mandatory new systems. Both remain rejected for production pending evidence. Purchase explanation belongs to the existing shop, not another progression mechanic. No currencies, prestige, timers, daily tasks, missions, inventory, staff or new playable machines.

### Mechanic 1 — Furnished hospitality [H; modeled; experiment only]

Keep all existing prices, levels, base income, standalone business gains, spins and token accounting. Furnishings additionally improve the existing businesses:

```
R = 64 + 12b + 20m + d(4b + 2m)
  = 64 + b(12 + 4d) + m(20 + 2d)
```

The **4 and 2** are proposed tuning constants, not production values. All income remains tokens/hour. Maximum is **214/h**, +33.75% over today's 160/h. No business loses its existing yield; no ongoing cost or decay. Furnishings without a bar or extra machine still produce no income. A starting decorative purchase remains an honest taste choice, not a trap presented as investment.

What the player does: compare the next bar, machine and furnishing purchase in the actual room state. The shop shows exact **current → after income**, marginal gain and price; a short explanation names which existing businesses benefit. The existing room drawing updates on purchase. No guest or demand simulation is implied.

Why it matters: an upgrade changes the value of later upgrades. Marginal gains are bar `12+4d`, machine `20+2d`, furnishings `4b+2m`. At no furnishings, a first machine has 37.5h payback versus bar's 41.67h. At one furnished tier, first bar has **31.25h** versus machine's **34.09h**. With one bar and machine, the 300-token first furnishing earns **6/h**, paying back in **50h**; next bar is 62.5h and next machine 68.18h. This is a state-dependent choice, not three parallel fixed-yield tracks.

At `b=2,m=2,d=1`, furnishings 2 costs 900 for +12/h (75h), versus bar 3 at 2,000 for +16/h (125h), or machine 3 at 3,000 for +22/h (136.36h). At a full business room the final furnishing costs 1,800 for +18/h (100h). Opportunity cost includes withholding capital from those alternatives. Short horizons or wanting a particular room piece can still favor a different purchase from long-horizon ROI.

Theme: a furnished bar and a pleasant arcade corner work together. This remains an abstract lounge income model, not invented individual patrons paying real bets. Business losses never become revenue, and furnishings never alter RTP.

UI/assets: reuse the three shop rows and their existing art states; no new scene, currency display or overall layout. Replace cosmetic-only furnishing copy if approved. Keep exact gains, keyboard focus and readable disabled-state reasons. A project pin may be session-only; do not add a save field just for it. An ETA must disclose cadence/cap assumptions and stop at the cap; do not promise an impossible continuous countdown across an absence.

Implementation reach after approval: `business.ts` income formula; furnishing/benefit copy in `SalonScene.ts`; business, offline and balance expectations; regenerated math forecasts and relevant product/readme descriptions. `SaveV1` levels already represent all required state, so **this mechanic does not need a schema change**. Import validation and recorded payouts stay intact. Offline intervals must settle at the old rate before upgrades, as today. Old saves keep all tokens, items and recorded results; owner must decide whether their first post-update absence uses the new formula or a versioned old-rate boundary. Avoid silently asserting that a build can identify its first update without storing a marker.

Cost estimate: **1–2 focused development days**, including import/accounting boundary decisions and focused regression checks, not measured effort. Risk: bonuses are opaque or merely replace one shopping order with another. Falsification: in a same-cadence virtual-time A/B playtest, if players cannot explain how one purchase changes another's value, or choose by the largest displayed number alone, do not ship the coupling just because the math works.

### Mechanic 2 — One furnishing choice [H; experiment only; zero token source]

The initial draft offered two treatments for each furnishing plus custom plaque text. **Independent review rejected that expansion pending evidence; it is removed from the minimum scope.** Test only **one existing rug with two visibly distinct, equal-cost/equal-income treatments**, within the accepted visual language. Re-select the owned treatment freely, without a refund, resale value or token effect. No art has been produced in this task.

Decision: which room to inhabit, and whether to buy that piece before the best financial purchase. This is **expressive agency**, not two economic strategies. The 300/900/1,800 furnishing sequence remains; no extra commission ladder or expensive finale. Mechanic 1 gives the same rug a business relationship; this choice tests whether it also has personal value.

UI/assets: one choice in the existing shop/dialog shell and existing rug layer. Reuse the current frame, palette and drawing approach. Preserve keyboard selection, text labels, focus return, reduced motion and supported desktop sizes. No new scene, screen or general redesign. The other furnishings and plaque stay as current content in this candidate.

Changes/cost if demonstrated valuable: one validated finish selection, backward-compatible default for old saves, and ordinary save/export/import recovery checks. Do not overload business levels or payout records. Approximately **0.5–1.5 additional development days** for a simple visible variant and persistence; define the exact schema after scope approval. Even this single saved choice is unjustified if players cannot see or remember it.

Falsification: show both room treatments without feature labels, then ask after a delay which they chose, what they prefer and whether they want to revisit their finished room. If choices are unnoticed or taste is better served by a fixed strong rug, remove the selector. Custom inscription may be assessed only as a static alternative during the experiment; text input, a save migration for names and additional treatments are **excluded** unless separately selected later.

### Milestones and ending [H]

Early: the first self-funded purchase after the starting grant; a rug that supports the bar/machine, with its income effect explained in the shop. Middle: a second business tier changes the next furnishing's value; the preferred rug remains visible. End: all nine purchases, full room with the owned rug treatment; one understated completion message in the shop, without a badge/achievement system or token prize. These are proposed meaningful moments to test, not newly unlocked content or claimed observations.

After completion: owned room, available income, slots and voluntary rounds. Re-enter to inhabit/play, not to preserve a streak. There is no promised new economic decision on day 30. **Stopping is an allowed outcome.** If a finished room is not satisfying, cheaper numbers or an endless queue cannot repair that; revisit direction A before adding content.

## 4. Economy and progression evaluation

See [results](results.md) for all requested day checkpoints, ledgers, milestones, cap sensitivity and stochastic ranges. Key results, with all prices unchanged:

| No-spin ROI-target policy              | Frequent | Daily | Every two days |
| -------------------------------------- | -------: | ----: | -------------: |
| Current room complete                  |   4.25 d |  11 d |           22 d |
| Furnished hospitality, existing 8h cap |      4 d |  10 d |           20 d |
| Same, 24h cap comparator               |    3.5 d |   4 d |            8 d |
| Same, 48h cap comparator               |    3.5 d |   4 d |            4 d |

**Do not integrate a cap increase in this minimum expansion.** It is a useful counterfactual, but the 24/48h variants turn the current catalogue into a very short economic tutorial and create much larger post-completion balances. At 48h, 1,485/1,680 daily fixed purchase orders finish equally fast (day 4); the economy becomes less sensitive to sequencing. No cadence modes or attendance-reset budgets are recommended. This is not a claim that the current eight-hour behavior is ideal: it is a recorded unresolved tension with relaxed, occasional play, and a separate owner choice after the core-loop experiment.

Sources: initial 1,000; passive earnings; slot returns. Sinks: upgrades, stakes, 50-token rounds. Furnished hospitality adds passive emission only; authorship has zero financial effect. No cap on accumulated tokens and no confiscation of old balances. At full state proposed income is 1,712 per capped return. Daily default play of 100 spins loses about 118.55 in expectation: idle remains the progression source. Even after finishing, everyday playing at that volume does not absorb all emission.

Financially no-play is best for a fixed policy and expected future wealth; occasional lucky runs do better. High-stake play is not a viable progression strategy. A single best fixed order for a chosen objective is not inherently a design failure; pretending it remains an open strategic question after solving it would be. The interaction must be judged against its small cognitive cost and the expressive goal, not sold as deep emergent management.

## 5. Exploits, degenerate strategies and limits

- **Visible-tab advantage remains.** More callbacks below the cap credit more earning time than a long absence. No natural browser throttling guarantee is asserted. Do not tell players keeping the tab open is active skill.
- **Clock/save manipulation remains.** Repeated forward clock moves can repeatedly credit capped gaps; rollback can stall income. Importing an old backup reverts losses, including gambling losses. These are local authority limits, not solved by the formula. No backend anti-cheat is proposed for a private offline room.
- **Rate switching:** accrue old room before buying; retroactive new-rate credit would be an exploit. New formula adoption for existing saves needs the explicit policy above. Never multiply an already-earned wallet.
- **Multiple tabs:** each holds its own `SaveOwner`; writes can overwrite each other's progress, rather than safely merging. No economy claim assumes concurrent tabs. A separate correctness fix may warn about another instance, but is not a new progression feature.
- **No round/rebate farm:** rounds remain a pure cost; no “play N spins” award, outcome reward, rebate, per-visit gift or repeatable claim. Free finish switching changes neither items nor rates.
- **ROI-target is not an oracle:** it may wait for an unaffordable target while another purchase is affordable. Exact order enumeration is reported separately; no greedy-optimality claim. Static 1,680-order search excludes intentional waiting after affordability, variable visit schedules, gambling and unfinished-room wealth optimization.
- **Known sequencing:** at a fixed horizon and objective some policies win; the proposed formula reverses local rankings and integrates decor, but can still become a short solved sequence. Daily no-spin financial policies complete in 10–13 days; the value of three additional days of deliberation is not established by a simulator.
- **Completion/large wallets:** no infinitely scaling sinks. Hospitality increases daily no-spin day-30 balance from 24,706 to 34,674 under ROI targeting. Do not add overpriced content solely to consume this number.
- **Model scope:** instantaneous visits; no session-minute income, real return behavior or human engagement. Frequent has daytime 6h/6h gaps and a 12h overnight gap, not all-night four-hour check-ins. Daily at 24h, occasional at 48h. Random samples do not bound all tails. Cosmetic preference is not assigned a made-up numerical utility.

## 6. Independent review, dispositions and implementation gates

The [separate reviewer](independent-review.md) **rejected the formula for production on current evidence**, found no mathematical defect overturning the broad model comparison, and challenged whether either mechanic creates valued play. **Accept that rejection.** A is the preferred direction to investigate, not an implementation recommendation. No candidate has passed a human gate.

| Review finding                                                             | Disposition / resulting change                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| High: coupling may only move the solved shopping order; many sequences tie | Accepted. Formula is experiment-only. Compare to an unchanged-economy condition with the same improved purchase explanation; require player-valued tradeoffs, not arithmetic comprehension alone                                                                                              |
| High: eight-hour attendance advantage conflicts with cozy identity         | Accepted. Current cap is retained only as a modeling/control condition, not endorsed as the final cadence policy. Fairness/tab-open incentives must be resolved before production, independently of coupling                                                                                  |
| Medium: three cosmetic choices and custom text are speculative             | Accepted. Cut the expansion to one reversible rug choice for testing. No custom text or three-tier variant implementation in this minimum scope                                                                                                                                               |
| Medium: cozy identity may be shop copy rather than experienced ownership   | Accepted. Use unlabeled current/proposed finished rooms; do not credit the direction with a personal-room identity until players perceive it                                                                                                                                                  |
| Low: sample assumptions/optimality need careful language and sensitivity   | Accepted. Heuristic, fixed-order family, finite sample and floor-mapping limits are explicit. Do not base design approval on precise seed-specific tails. Additional seed-range/unbiased-sampler sensitivity belongs before treating tail differences as tuning evidence; it was not run here |

The owner selects direction and scope before implementation. The model's inequalities are evidence for interactions, not evidence of engagement. A negative experiment is a valid Phase 4 result; rejection does not authorize a bigger feature list.

Bounded roadmap, **not authorization to execute**:

1. **Owner direction decision:** choose A/B/C; if A, decide whether a finite room with roughly 10/20-day daily/occasional no-spin completion and a four-day frequent path is an acceptable hypothesis. The cap policy remains a separate unresolved decision. P1 remains excluded. No action on production follows this document alone.
2. **Isolated core experiment after approval:** use nine players, three per cadence, with virtual time. Compare current formula plus clear upgrade gains against the same presentation with coupling, keeping prices, cadence and outcomes identical. Counterbalance order. Ask two effect predictions before explanatory tooltips, observe unprompted purchase reasons and which tradeoffs players value. Control the UI explanation so its benefit is not falsely attributed to the formula. No production saves; no polished asset work.
3. **Independent cadence gate:** compare disclosed eight-hour and static 24/48-hour counterfactual results, without a mode selector, resettable budget or any P1 integration. Ask players to explain absent/visible earning and whether they would leave the tab open or change their schedule. Observe which next goal seems worthwhile. If players feel attendance pressure, reject eight hours as a fit for A. If larger caps make purchases inconsequential, reject those unchanged-price variants too. **If none passes, stop this package and return the cadence/horizon conflict to the owner; do not ship an unresolved cozy promise.** A multi-day natural return test is needed before a cadence claim; virtual time only checks comprehension and perceived value.
4. **Core/identity go/no-go:** at least 6/9 explain an interaction and identify a tradeoff they personally value beyond following a displayed ratio; at least 2/3 per cadence see an attainable room goal without wanting to keep a tab alive or check more often; no participant thinks spinning is required. These are proposed qualitative usability gates, not statistical retention evidence. Show finished rooms without direction labels; compare the one rug treatment choice. Cut the choice if unremembered/unpreferred; cut the formula if it is only another shopping checklist. Passing comprehension alone is insufficient.
5. **Only after successful evidence and renewed owner sign-off:** settle the cadence and adoption boundaries explicitly, then implement only the formula and single choice that survived. Preserve accepted visual hierarchy and slot settlement. Run relevant business/save/session/offline tests, exact RTP comparison, deterministic ledger checks, keyboard/dialog checks and supported-size browser regression. Verify old exports recover all money, purchases, settings and last-spin result. If changing cadence requires retuned prices or a new accounting system, that requires another bounded design decision, not an extension of this plan.
6. **Stop:** at most the two described candidates, existing nine prices/three levels in the control experiment, no new machine, cap-mode picker, currency, events, prestige, visitor simulation, name-entry system or content pipeline. Approximately **2–4 engineering days if both candidates earn implementation**, plus experiment/player scheduling; this excludes a separately chosen cadence redesign. Failure returns to owner direction selection and does not authorize a tycoon build. No production implementation is recommended yet.

No production source, RNG, paytable, production save data or prototype has been changed; no commit, push or publication. No human playtest has been performed in this task.
