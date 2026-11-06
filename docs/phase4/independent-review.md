# Independent review — Amber Room Phase 4

2026-11-05 · Signed: Independent reviewer (Codex subagent)

Scope: design and model critique only. I read `design.md`, the simulation method and selected `simulation.json` results, and checked the relevant production behavior in `business.ts`, `save.ts`, `engine.ts`, `machine.ts`, `SalonScene.ts`, and `PRODUCT.md`. I did not use `results.md`. No production or model files were changed. Mathematical statements below describe the supplied deterministic model; claims about interest, comprehension, identity, or retention remain player hypotheses.

## Findings, severity ranked

### 1. High — Furnished hospitality is a real formula interaction, but evidence does not establish a meaningfully better progression loop

**Disposition: REJECT the formula for production on current evidence; conditional approval for a small, isolated experiment only.**

The formula is valid and its marginal gains are correct: furnishing adds `4b + 2m` per tier, while a bar or machine tier gains `4d` or `2d` respectively. That creates mathematical coupling. It does not show that players experience a new decision. The simulated ROI policy still chooses the best current payback ratio, and the added rule may teach a second arithmetic comparison while mostly changing the shopping order. Since the proposal's stated risk is exactly that outcome and the submitted evidence does not resolve it, the formula should not advance to production as a demonstrated loop improvement.

The observable progression shift is small at common cadences. For the supplied ROI-target, no-spin simulations, current versus proposal completes in 11 versus 10 days (daily) and 22 versus 20 days (every two days); frequent completion moves from 4.25 to 4 days. The proposal's order enumeration also reports many equally fastest sequences: 471/1,680 at daily and occasional cadence, and 522/1,680 for frequent. These numbers mean the formula changes optimal sequences and yields, but do not demonstrate deeper or more engaging play. The 24/48-hour cap comparisons are separate hypothetical policies and cannot support the preferred package while it retains the eight-hour cap.

**Falsification test:** in the proposed counterbalanced, same-cadence virtual-time comparison, ask players to predict how decor changes two existing purchases before showing exact tooltips. Record whether they can explain the interaction, whether their purchase choices actually change for a stated room/economy reason, and whether they can identify a meaningful tradeoff without simply selecting the currently largest displayed return. Reject the coupling if comprehension fails or choices reduce to following a displayed ratio with no expressed value. Include a baseline condition with no formula change; do not infer preference from completion time alone.

### 2. High — The eight-hour gap cap is a product-identity conflict left inside the preferred direction

**Disposition: REVISE; do not describe cozy/occasional play as settled until cadence is tested.**

Production accrual caps each gap, not each day. Visible callbacks can therefore credit substantially more than eight hours per day; daily and 48-hour absence patterns get at most eight hours per visit. The proposal correctly discloses this and does not claim to fix it, but it also makes the income interaction central to the cozy idle loop. Under its own model the common daily/occasional room goals take 10 and 20 days, while frequent play reaches completion in four days. Those are schedule-specific simulation outputs, not observed experience. A system that rewards keeping a tab alive more than returning after a long absence may contradict a low-pressure “keeps its own hours” promise and can make the same lounge feel either fleeting or slow depending on attendance.

This is a material owner decision, not an implementation detail that the formula resolves. The described six-to-nine-person experiment can test comprehension and perceived attainability, but its proposed 2/3-per-cadence gate does not test whether players consider the cap fair or whether they feel encouraged to leave the game open.

**Falsification test:** compare the current cap against a clearly disclosed per-day/longer-gap counterfactual in isolated prototypes, with daily and occasional players represented. Ask what they believe earns income while away and whether they would leave the tab open to progress. If players infer an attendance or tab-open incentive, or if occasional players do not see a satisfying near-term goal, do not ship the package unchanged. Choose and document the cadence policy before making cozy idle the product promise.

### 3. Medium — Two equal-rate finishes and a plaque inscription risk adding save/UI work for weakly legible choices

**Disposition: REVISE; conditional experiment approval for one visible choice. Reject the three-choice implementation plan pending evidence.**

The current scene has three one-time decor states: a rug, greenery, and a fixed “THE AMBER ROOM” plaque. The proposed variants are not yet art or tested affordances. Equal-cost/equal-income options deliberately create no economic distinction; whether this becomes expressive authorship depends entirely on visible contrast and personal significance. A text inscription offers more nominal freedom, but also adds validation, text rendering, import defaults, and migration behavior. `SaveV1` currently validates and reconstructs exactly the existing three level fields; finishes or custom text require new persisted state and backward-compatible parsing. This is disproportionate if the choice is unnoticed, which the design itself identifies as a risk.

The proposal appropriately suggests testing one furnishing choice and the plaque first. Keep that as the maximum approved experiment, not a commitment to expand choices across all tiers. Prefer one reversible, visibly distinct treatment using the existing scene/UI shell; treat custom text as a separate hypothesis because its persistence and safety work is greater than a fixed two-option choice.

**Falsification test:** test one treatment choice and one fixed-versus-custom plaque mockup, with the finished room shown both immediately and after a delay. Measure unprompted noticing, recall, preference, and desire to revisit the room. If players cannot recall or prefer the chosen treatment without prompting, or if the two treatments are not reliably distinguished, remove the choice rather than add variants or a collection layer.

### 4. Medium — The proposal's “identity” is mostly expressed through shop copy and unproduced variants

**Disposition: REVISE; conditional experiment approval, not a direction lock.**

The production product record frames the game around satisfying slot play with lounge development as a continuing budget and finite purchase goal. The cozy lounge direction is compatible with that scope, but this proposal does not yet establish the lounge as a sufficiently personal destination to justify the added economy coupling or save schema. Current room purchases change a few static layers and income; there is no visitor behavior, active hospitality, or persistent authored story. Naming the cross-term “furnished hospitality” risks implying patron/service simulation that is not present, though the design explicitly says none is implied. The title/copy alone should not be counted as identity evidence.

**Falsification test:** show players the current and proposed rooms without the direction labels or explanatory copy. Ask what the game is about, what makes the room theirs, and which finished state they prefer. If the answer is still “buy upgrades to earn tokens for slots” and the proposed details do not change that perception, accept that as the product's actual identity and cut systems that depend on a stronger cozy-home promise.

### 5. Low — Model assumptions are suitable for comparisons but should not be read as forecasts or proof of optimal play

**Disposition: REVISE wording only; no arithmetic defect found that invalidates the stated comparison.**

The simulation uses the real spin evaluator for its payout tables, and the balance ledger assertion checks emitted income, purchases, stakes, payouts, and rounds. The hypothetical hospitality accrual applies the proposed rate directly and keeps the existing cap. The deterministic order search covers 1,680 fixed sequences that buy each specified next item as soon as affordable; it does not cover voluntary waiting, alternative visit times, or strategic spins. The ROI-target policy is a heuristic, not a global optimizer. The design mostly discloses these limits correctly.

Stochastic results use 1,000 seeded Mulberry32 samples and a floor-mapped joint stop index, whereas production uses rejection-sampled cryptographic randomness. The finite-sample distributions are illustrative and do not bound tails or predict player luck. This does not affect exact RTP enumeration, and is unlikely to change the broad qualitative comparison, but language like “medians” should stay explicitly attached to this simulation policy and sample. The small floor-mapping bias is immaterial to the proposed directional conclusions; no claim about exact sample quantiles is warranted beyond the generated run.

**Falsification/check:** rerun with multiple independent seed ranges and a stop-selection method without floor-mapping bias; compare completion quantiles and unfinished counts. If conclusions about ordering, completion, or bankroll depend on this one sample, weaken those claims. Separately test reachable-level marginal gains against the formula (the supplied assertions already do this) and test import/backward-compatibility once schema or rate adoption is specified.

## Recommendation

Retain A only as a product hypothesis, not a settled direction. Reject the income cross-term for production unless a bounded experiment shows it creates an understandable, valued choice beyond moving the solved shopping order. Its mathematical effect is sound, but its demonstrated progression effect is modest, and the model cannot establish fun, agency, identity, or retention. Run the core comparison with the same cadence and outcomes, make the cap/fairness question explicit, and test no more than one furnishing choice plus a plaque mockup. Do not authorize either mechanic for production until the stated tests support each independently.

I found no mathematical error in the proposed marginal-gain/payback examples or a simulation accounting defect that overturns the broad findings. Remaining risk is primarily experiential and policy-related: the current cap may conflict with the cozy idle promise, while the proposed authored details may not earn their save and UI complexity.
