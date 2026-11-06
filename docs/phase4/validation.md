# Analysis validation

2026-11-05. Scope: new design/model artifacts only; production has no edits.

- Executed the model successfully, including all ledger, payout, marginal-gain and accounting assertions: 248,832 enumerated stops, 90 deterministic cases, 9 × 1,000 seeded main paths, 9 × 1,680 fixed-order searches, 9 × 1,000 stress paths.
- Repeated the final model run. JSON and CSV were byte-identical across runs:
  - `simulation.json`: SHA-256 `154217315576b954da67f50b471c940a1f4d49345b236f72f2020486980e8104`
  - `deterministic.csv`: SHA-256 `a6ae604dc4cb861d5ea46ad49b30ec26eecdf46d88bd4493f397caef451b657a`
- Type-checked the standalone model and its imported production modules using installed TypeScript with strict checking: pass.
- Biome check with warnings treated as errors on `economy-model.ts` and `completion-comparison.html`: pass.
- Focused unchanged-production regression: `npm test -- tests/business.test.ts tests/session.test.ts tests/save.test.ts tests/engine.test.ts` — **28 tests in four files pass**.
- Exact enumerated RTP agrees with the existing math report, 0.762892232510288; no machine, RNG or payout changes were made.
- Comparison chart preview: 728px and 390px widths, readable labels and values, no reported console messages. This is an analysis chart, not gameplay-browser verification.
- Separate reviewer inspected the proposal, selected model output and production code. They did not execute the simulation or conduct player tests. The review rejected production adoption pending experiments. Final design records accepted dispositions; it does not claim a second independent approval.

No full build, broad browser gameplay rerun, natural multi-day browser scheduling test, human playtest, extra independent seed-range test or unbiased-sampler sensitivity run was needed to claim completion of this analysis; none is claimed. Precise stochastic tails remain illustrative. The initial model invocation attempted Vite's default hot-reload listener and reported sandbox `EPERM`; the documented command disables HMR/WebSocket listeners and subsequent runs completed without that warning. No listening server was required.

The only worktree additions are under `docs/phase4/`. Production source, tests, economy constants, save data/schema, P1 prototype, dependency/config files and historical reports remain unchanged. No commit, push, publication or gameplay implementation.
