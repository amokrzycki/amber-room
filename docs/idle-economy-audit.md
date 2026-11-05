# Amber Room — idle economy audit and design proposals

Status: analysis only. Nothing in this document is implemented. No game code, constants, RNG, paytable or save format was changed to write it. Three proposals at the end need an owner decision before any work starts.

Scope: the idle loop as it exists on `feat/impeccable` @ `684ae14` (plus the uncommitted Phase 3.2 visual changes, which do not touch `src/game/`).

Evidence labels used throughout:

- **[F]** measured or read directly from code, tests or `docs/math-report.json`.
- **[C]** computed by me from [F] constants (arithmetic or a small enumeration/simulation I re-ran; method stated).
- **[H]** design hypothesis. Not measured. No player engagement data exists for this game and none is invented here.

---

## 1. The current economy in one page

### 1.1 Constants [F]

| Item                                                                               | Value                                                                                                                                                                                                            | Source                                                         |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Starting balance                                                                   | 1,000 tokens                                                                                                                                                                                                     | `src/game/save.ts:9`                                           |
| Base income                                                                        | 64 tokens/h                                                                                                                                                                                                      | `src/game/business.ts:9`                                       |
| Bar                                                                                | 3 levels, 500 / 1,000 / 2,000, +12 tokens/h each                                                                                                                                                                 | `business.ts:3`                                                |
| Extra machines                                                                     | 3 levels, 750 / 1,500 / 3,000, +20 tokens/h each                                                                                                                                                                 | `business.ts:4`                                                |
| Furnishings                                                                        | 3 levels, 300 / 900 / 1,800, +0 tokens/h                                                                                                                                                                         | `business.ts:5`                                                |
| "Buy a round"                                                                      | 50 tokens, no effect on income                                                                                                                                                                                   | `business.ts` (`buyRound`), `SalonScene.ts:54`                 |
| Offline cap                                                                        | one gap between two accruals is credited for at most 8 h                                                                                                                                                         | `business.ts:13`                                               |
| Accrual triggers                                                                   | every 1 s while the tab is visible, on every visibility change, on scene creation, before each spin                                                                                                              | `src/main.ts:30-33`, `SlotScene.ts:54,309`, `SalonScene.ts:21` |
| Stake                                                                              | lines {1,5,10,20,40} × per-line {1,2,5}; default 5 × 1 = 5                                                                                                                                                       | `machine.ts`, `save.ts:16`                                     |
| Paytable ×3/×4/×5                                                                  | cherry 2/5/15, lemon 3/8/20, plum 4/12/35, melon 6/20/60, seven 12/40/120, wild 20/80/2000                                                                                                                       | `machine.ts:62-69`                                             |
| RTP (enumerated over all 248,832 stop combinations, identical at every line count) | 76.289%                                                                                                                                                                                                          | `docs/math-report.json` → `enumeration[*].rtp`                 |
| Spin duration                                                                      | last reel stops ≈ 1.68 s after SPIN (180 acceleration + 500 cruise + 4×120 stagger + 420 braking + 100 settle); celebration adds 0.7 / 2.2 / 4.0 s for small / big / jackpot tiers, and any of it can be skipped | `tuning.ts:25-29`, `game/feedback.ts:6`                        |
| Maximum income                                                                     | 64 + 36 + 60 = 160 tokens/h                                                                                                                                                                                      | `tests/business.test.ts` ("finite rates")                      |

Total price of everything: bar 3,500 + machines 5,250 + furnishings 3,000 = 11,750 tokens. Income-producing part: 8,750.

### 1.2 The model [C]

```
income/h      = 64 + 12·bar + 20·machines            (0 ≤ bar, machines ≤ 3)
credit(gap)   = income/h × min(gap, 8h)              (per accrual gap)
EV(spin)      = −0.2371 × stake                      (RTP 76.289%)
net(session)  = credit(session) − 0.2371 × Σ stake + variance
```

Per-level payback, price ÷ gain (hours of income at that upgrade's own gain):

| Level | Bar                    | Extra machine          |
| ----- | ---------------------- | ---------------------- |
| 1     | 500/12 = **41.7 h**    | 750/20 = **37.5 h**    |
| 2     | 1,000/12 = **83.3 h**  | 1,500/20 = **75.0 h**  |
| 3     | 2,000/12 = **166.7 h** | 3,000/20 = **150.0 h** |

Because gain is constant and price rises, every level pays back slower than the one before: 37.5 → 75 → 150 h, i.e. ×2 per level in both categories. Machines beat the bar at every level by about 10%.

Break-even play rate, the number of spins per hour the base income can fund at zero net change, `income ÷ (stake × 0.2371)`:

| Bet (lines × per line)   | EV loss per spin | Spins/h funded at 64/h | at 160/h |
| ------------------------ | ---------------- | ---------------------- | -------- |
| 1 × 1 (stake 1)          | 0.24             | 270                    | 675      |
| 5 × 1 (stake 5, default) | 1.19             | **54**                 | 135      |
| 5 × 5 (stake 25)         | 5.93             | 10.8                   | 27       |
| 20 × 2 (stake 40)        | 9.48             | 6.7                    | 16.9     |
| 40 × 5 (stake 200)       | 47.4             | 1.3                    | 3.4      |

At about 1.7 s per spin the machine can burn roughly 2,100 spins/h if the player skips every celebration. At the default bet that is ≈ 2,500 tokens/h of expected loss against 64 tokens/h of income. Income funds a _budget_; it never funds _continuous play_.

### 1.3 Time to finish, visit cadence as the only variable [C]

Method: I re-simulated the purchase loop in Python with the constants above, no spins, starting at 1,000 tokens, crediting `income × min(gap, 8h)` at each visit and buying greedily. (The repo's own `tests/balance.test.ts` simulates a once-a-day visitor who also plays 100 spins/day and reports a median completion of day 10, range 7–11, for the bar + machines; it does not buy furnishings. My once-a-day no-spin result, day 9–10, agrees with it.)

| Visits per day (gap)    | Credited per visit at base | Business items finished (day) | Including furnishings (day) |
| ----------------------- | -------------------------- | ----------------------------- | --------------------------- |
| 1 (24 h, capped to 8 h) | 512                        | 9–10                          | 11–13                       |
| 2 (12 h, capped to 8 h) | 512                        | 5                             | 6–7                         |
| 3 (8 h)                 | 512                        | 3–4                           | 4–5                         |

Order of purchases barely matters: bar-first, machine-first, cheapest-first, best-payback-first all finish within one day of each other at every cadence.

---

## 2. Facts worth stating plainly [F]/[C]

1. **The cap wastes most of a once-a-day visitor's potential income.** A 24 h gap credits 8 h. At base income that is 512 of a possible 1,536 tokens; 1,024 tokens (two thirds) are never credited. At full upgrades 1,280 of a possible 3,840 are credited; 2,560 are lost. [C from `business.ts:13`]
2. **Presence, not play, is what is rewarded.** While the tab is visible `accrue()` runs every second (`main.ts:30`), so each gap is one second and the cap never binds. A visible tab left alone earns at the full rate for as long as it is open. _This follows from reading the code; I did not run a 24 h browser test._ A hidden tab accrues nothing until it becomes visible again, then the cap applies.
3. **Spinning has negative expected value and no progression value.** Nothing in the code converts spinning into lounge income (`tests/business.test.ts` "manual losses do not become business revenue" locks that in). The only way spinning accelerates upgrades is a lucky payout.
4. **Every upgrade is eventually bought.** All purchases are finite, price-ordered and affordable; the balance test requires completion in all 100 seeded paths (`balance.test.ts`, "invest … completedBusinesses === 100").
5. **Furnishings are a pure sink** (3,000 tokens, +0 income). Bought early they delay the income path by one to three days at once-a-day cadence [C].
6. **After the last purchase the wallet only grows.** There is no sink except spins (EV −23.7%) and the 50-token round. `math-report.json` records a 180-day idle-only median balance of 93,160 tokens; the wallet is unbounded in principle and the code throws rather than clamps on integer overflow (`business.ts:16`).
7. **The lounge is passive.** The only lounge interactions are: buy one of three upgrade lines, buy a round, click your own machine to play (`SalonScene.ts:34-76, 147-156`). Extra machines are sprites, not playable.
8. **Copy says "net".** The lounge shows `N tokens / hour net · up to 8 hours away` (`SalonScene.ts:110`); no costs are modelled, "net" is the gross income figure.

---

## 3. The eight questions

### Q1. What motivates the player to return?

- **[F] What the game offers a returning player:** a waiting credit (up to 512–1,280 tokens per 8 h), the next affordable purchase (price shown on the button, `SalonScene.ts:128-131`), visible lounge changes after buying (`drawRoom`), the persisted last spin.
- **[C]** A once-a-day visitor at base income receives 512 tokens: enough to buy the first bar level (500) every day or a machine in two days.
- **[H]** The strongest pull is "tokens are waiting + something I can now afford". It decays as purchases run out (≈ day 10). I have no data on whether players value the lounge's look, the spin feel or the numbers going up.

### Q2. What decisions exist beyond buying the next affordable upgrade?

- **[F]** Bet size/lines (risk appetite), buying furnishings vs income, buying a round, whether to spin at all.
- **[C]** The only _economic_ decision of substance is furnishings now vs later, worth 1–3 days of completion time. Bar vs machine is not a real decision: machines are better by ~10% at every level, the 0–2 day difference in completion is within noise of cadence, and both are needed to finish.
- **[H]** For a player whose goal is "unlock everything", the optimal policy is trivially "buy whatever is affordable". There is no planning.

### Q3. How do active play and passive earnings interact?

- **[F]** One shared wallet. Income accrues while the machine view is open and while away (`SlotScene.ts:54,309`). Spins deduct stake and add payout in one transaction (`session.ts`).
- **[C]** Because EV per spin is −23.7% of stake, each spin spends progress; income pays for it. At the default bet 54 spins/h is break-even at 64 tokens/h.
- **[H]** The relationship is "income is the budget, spinning is how you spend it", with upgrades competing for the same budget. That is coherent, but it makes spinning and upgrading _rivals_ rather than partners.

### Q4. Expected upgrade payback

Computed in §1.2: 37.5–166.7 hours of _income_, 1.6–7 days at 24 h/day of presence, or 4.7–20.8 visit-days for a once-a-day visitor (machine L1 adds 160/day for 750; L3 adds 160/day for 3,000). Late levels are not worth buying for their income alone; they are bought because they exist [H].

### Q5. Does passive income make active play irrelevant?

- **To progression: yes [C].** EV −23.7%; completion happens at the same pace with or without spinning (once-a-day: day 9–10 with no spins vs day 7–11 with 100 spins/day in the repo's simulation). Spinning does not accelerate anything except through variance.
- **To the game's purpose: no [H].** PRODUCT.md says the lounge sustains play. Passive income buys the _right to keep playing_; spinning is the thing players do with it.
- **[F]** There is a second trap: because the 1-second accrual never hits the cap, an idle visible tab out-earns a player who closes the tab (fact 2).

### Q6. Are the upgrade paths meaningfully different?

No. Bar and machines both add a flat hourly number, have the same three-level structure and similar price curves (see §1.2). Furnishings are cosmetic. [F]/[C]

### Q7. How does progression end or plateau?

- **[F]/[C]** All purchases are bought by day ≈ 10 at once-a-day cadence (≈ 3 at three visits/day). Income then stays at 160 tokens/h, 1,280 per capped visit, forever.
- **[F]** There is no completion state, summary or new goal. The only remaining sinks are spins and 50-token rounds.
- **[H]** The plateau is the main structural weakness. A hard stop at ≈ 2 weeks of casual play is short for a game meant to live on a desktop.

### Q8. What meaningful choices could exist without complexity?

Choices need to differ by _how the player plays_, not by which number is bigger. Three bounded candidates follow in §5. Each adds one decision, no new currency, no new prestige layer.

---

## 4. Imbalances and dead ends

| #   | Finding                                                                                                                                                                             | Evidence                           | Severity                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| I1  | Two thirds of a daily visitor's income is lost to the 8 h cap; a visible idle tab suffers no cap. Rewards presence over play, and punishes the cadence the game is designed around. | `business.ts:13`, `main.ts:30`     | High                                                                                                  |
| I2  | Bar and machines are the same upgrade; machines dominate by ~10%.                                                                                                                   | §1.2                               | Medium                                                                                                |
| I3  | Content ends at ≈ day 10 (3 visits/day: day 3–4). Afterwards: no goal, no sink with value.                                                                                          | `balance.test.ts` completion; §1.3 | High                                                                                                  |
| I4  | Late purchases have 150–167 h payback; levels get strictly worse. Buying them is completionism, not investment.                                                                     | §1.2                               | Low (finite game)                                                                                     |
| I5  | Spinning cannot help progression, and nothing in the lounge reacts to a good or bad evening except sound/lights.                                                                    | `business.test.ts`                 | Medium                                                                                                |
| I6  | Furnishings delay income if bought first. UI offers no hint.                                                                                                                        | §2 fact 5                          | Low                                                                                                   |
| I7  | "net" in lounge copy suggests costs that do not exist.                                                                                                                              | `SalonScene.ts:110,126`            | Cosmetic                                                                                              |
| I8  | Income is a local-clock number. Setting the system clock forward before returning pays up to 8 h per forward jump.                                                                  | `runtime.ts`, `accrue(Date.now())` | Accepted for a private offline game; any proposal that raises the cap raises this exploit's value too |

No _progression dead end_ in the sense of a state the player cannot leave: income never stops, the minimum spin (1 token) is funded from zero in 56 s (`balance.test.ts` "smallest bet returns within an hour").

---

## 5. Three proposals

All three preserve: one currency, no streaks or daily rewards, no real-money framing, finite purchases, nothing silently capped, local-only. All three require an owner scope decision (PRODUCT.md: "Additional … progression systems require a new scope decision"). They are **alternatives with partial overlap**; I would not combine P1 and P2 (both repurpose the bar).

### P1. Opening hours — match the lounge to how you visit

**Player-facing purpose.** The player sets how the lounge keeps house before leaving, matched to when they expect to come back. A quiet, reversible decision: _"Brisk evenings"_, _"Standard hours"_, _"Long nights"_.

**Interaction with the existing lounge.** A three-way switch on the lounge screen (next to the income line). Upgrades still work as today; the mode scales the rate and changes the cap.

| Mode             | Rate × | Cap  | Income at base 64/h for a gap of 2 h / 4 h / 8 h / 24 h |
| ---------------- | ------ | ---- | ------------------------------------------------------- |
| Brisk            | 1.5    | 4 h  | 192 / 384 / 384 / 384                                   |
| Standard (today) | 1.0    | 8 h  | 128 / 256 / 512 / 512                                   |
| Long nights      | 0.75   | 12 h | 96 / 192 / 384 / 576                                    |

[C]. Brisk wins for players who return every ≤ 4 h (+50%), Standard for ≈ 8 h, Long nights for once a day (+12.5% over today).

**Economic consequences.** Once-a-day players gain +12.5% (not a transformative change). Frequent returners gain up to +50% over today's income. Completion time moves by roughly one day either way. Overall inflation is bounded (Brisk caps at 160 × 1.5 = 240/h while present).

**Dependencies and implementation cost.** A new save field (mode) and a save migration from v1 (`parseSave` currently rejects unknown shapes, `save.ts:21-39`); `accrueIncome` takes mode; one UI control; copy update; tests. Small (≈ 1 day), but touches the save format, which is the riskiest file in the project.

**Possible exploits and risks.**

- Brisk + a visible idle tab = +50% forever (I1). Needs a decision: either accept it as "an attended room earns more" or make Brisk only affect the first N hours of presence.
- The switch must apply at the moment of leaving. If it applies retroactively the player can read the gap they just had and pick the best mode afterwards.
- A mode chosen wrongly feels like a punishment; copy must show what each mode yields for the player's last gap.

**Minimal prototype / playtest criteria.** Prototype: compute `credit` in a pure function with a mode parameter, unit-test the table above, add a debug switch, no UI polish. Run with three people who visit at different cadences (hourly, twice daily, once daily) for three days. Success: at least two of three modes are chosen by someone, and people can say in one sentence why they chose it. Failure: everyone settles on Standard, or players report "I should have switched" more than once without finding it out in advance.

### P2. The house remembers — a hospitality rebate that connects the bar to the machine

**Player-facing purpose.** A rough evening at the machine is cushioned by the lounge you built. The bar stops being "+12 tokens/h" and becomes _"the bar looks after you"_.

**Interaction with the existing lounge.** Bar levels 1–3 give a rebate of 5% / 10% / 15% of each spin's shortfall (stake − payout, when positive), booked as lounge credit at the next accrual, never more than 2 h of current income per absence. The lounge shows "The bar returned N tokens from last evening" on return. Machines keep their income role, which makes the two paths genuinely different: machines pay for the room, the bar pays for your luck.

**Economic consequences [C].** Expected shortfall per stake is 0.672 at 5 lines and 0.586 at 10 lines (I re-enumerated all 248,832 outcomes; RTP matched the repo's 76.289%). Effective RTP at the default bet: 76.3% → 79.7% / 83.0% / 86.4%. Below 100% for any rebate under about 35%, so the machine remains a sink. The bar's income gain (+36/h) would be removed, delaying completion by about 1–2 days (my sim, with the bar still bought as a non-income item: once-a-day day 9 → 11, twice-a-day 5 → 6, thrice-a-day 3 → 4); income at plateau falls from 160 to 124 tokens/h.

**Dependencies and implementation cost.** Gameplay-side: `requestSpin`/`finishSpin` would need to record the booked shortfall in the save (new field → migration). `accrueIncome` credits it. Touches the explicit rule "manual losses do not become business revenue" (`business.test.ts`): this is a rule change, not an addition. Medium (≈ 2 days including migration, tests, copy).

**Possible exploits and risks.**

- Loop farming: spin at 1×1 stake, lose, collect rebate. Cannot profit because rebate < loss. The per-absence 2 h cap makes it irrelevant.
- It softens loss and can hide the real RTP from the player. Copy should say plainly what it is. PRODUCT.md demands transparency; this must not look like a better payout table.
- If the rebate is too small to notice (5%), the bar becomes a trap. Needs testing of whether anyone feels it.

**Minimal prototype / playtest criteria.** Prototype: compute the rebate in a script from recorded spins; show it as one sentence in the lounge; no new art. Playtest with three players over three sessions each. Success: players who play ≥ 100 spins between visits notice and mention the rebate; no one reads it as a payout change. Failure: nobody notices, or someone says "so spinning is safe now".

### P3. Commissions — a finite horizon beyond the last upgrade

**Player-facing purpose.** After the last upgrade the lounge still has something to become. A short list of one-off, expensive _commissions_ (a piano, a better lamp over the machine, a mirror above the bar) each with two finishes to pick from, chosen once. This makes the late game a series of tasteful decisions instead of a wallet that only grows.

**Interaction with the existing lounge.** Same shop panel, a new "Commissions" section that appears once the first income-producing pieces are bought. Items are drawn like the existing furnishings (procedural Phaser graphics in `drawRoom`, as for the rug and plants), so no new raster art. No income effect, in keeping with Furnishings.

**Economic consequences [C].** A ladder of about six pieces at 2,500 / 4,000 / 6,000 / 9,000 / 13,000 / 18,000 tokens (≈ 52,500) would take ≈ 41 once-a-day visits at the plateau credit of 1,280, or ≈ 14 days at three visits/day. It extends the horizon from ≈ 2 weeks to ≈ 7 weeks at once-a-day cadence. It adds a real sink without changing income. The numbers are placeholders chosen to fit between completion (≈ day 10) and a sensible ceiling; they need a playtest.

**Dependencies and implementation cost.** Save: a small list of purchased commissions (migration from v1). UI: one more shop section. Art: procedural drawings per item and finish, which is the main cost (≈ 6 items × 2 finishes = 12 small drawings). Highest cost of the three (≈ 3–5 days).

**Possible exploits and risks.**

- None economic: no income effect.
- Real risk is value: _if the player does not care about the room, this extends nothing._ I have no data on whether they do. Phase 3's work on the room suggests the owner does; that is not evidence about players.
- Choice paralysis: avoid by keeping to six pieces, two finishes, no re-roll.

**Minimal prototype / playtest criteria.** Prototype: two commissions with two finishes, hard-coded prices, drawn in the existing `drawRoom` style, shown only in the lounge. Success: a player who has finished the income path buys at least one commission unprompted and can say which finish they chose and why. Failure: the player stops logging in once the income path is complete, which would show the real problem is motivation, not content.

### Choosing between them

|                        | Fixes        | Adds a decision        | Risk to existing systems                | Cost    |
| ---------------------- | ------------ | ---------------------- | --------------------------------------- | ------- |
| P1 Opening hours       | I1 (cap), I2 | Yes, per visit         | Save migration; Brisk idle-tab exploit  | Small   |
| P2 The house remembers | I2, I5       | Mild (bar vs machines) | Reverses an explicit test; transparency | Medium  |
| P3 Commissions         | I3, I4       | Yes, but cosmetic      | Art cost, unknown demand                | Largest |

My recommendation, as a hypothesis for the owner to overrule: P1 first because it addresses the visible inefficiency (I1) with the smallest change. Whether P3 is needed depends on whether the room itself is worth returning to, which the owner and a playtest can answer and this audit cannot. P2 is the most interesting design but the one that most changes the game's honesty story; I would only do it if the owner wants spinning to matter to the lounge.

---

## 6. What this audit did not measure

- No player data of any kind (retention, session length, purchase order). Nothing above is a claim about what players want.
- The visible-tab no-cap behaviour (fact 2) was read from code, not reproduced in a browser.
- Time per spin and spins/h are from animation constants, not play sessions.
- I did not test the clock-forward exploit (I8).
- The sampled day counts (§1.3) are my own deterministic sim of the constants, not a replacement for `balance.test.ts`; they agree with it where the two overlap (day 9–10 vs 7–11 with spinning).

## 7. Open question for the owner

The product record promises a single eight-hour absence limit (PRODUCT.md). P1 changes it per mode and P2 changes what "income" means. Choose **one** of the three, or none; I will not implement any until told.
