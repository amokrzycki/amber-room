import { expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { spin } from "../src/game/engine";
import { machine } from "../src/game/machine";
import { classifyWin } from "../src/game/feedback";
import { createSave } from "../src/game/save";
import { createSession, requestSpin, reelsStopped, finishSpin } from "../src/game/session";
import { accrueIncome, purchase, catalog } from "../src/game/business";
import type { Bet, WinTier } from "../src/game/model";
const counts = [1, 5, 10, 20, 40] as const;
function seeded(seed: number) {
  return (max: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor((seed / 4294967296) * max);
  };
}
function distribution(values: number[]) {
  values.sort((a, b) => a - b);
  return {
    min: values[0],
    p10: values[Math.floor(values.length * 0.1)],
    p50: values[Math.floor(values.length * 0.5)],
    p90: values[Math.floor(values.length * 0.9)],
    p99: values[Math.floor(values.length * 0.99)],
    max: values.at(-1),
    mean: values.reduce((a, b) => a + b, 0) / values.length,
  };
}
const report: any = { seed: 20261104, stops: 12 ** 5 };
it("exhaustively enumerates all stops, active prefixes and exact per-line scaling", () => {
  const rows = counts.map((n) => ({
    lineCount: n,
    total: 0,
    profit: 0,
    tiers: { neutral: 0, small: 0, big: 0, jackpot: 0 } as Record<WinTier, number>,
    values: [] as number[],
  }));
  for (let n = 0; n < 12 ** 5; n++) {
    let k = n;
    const stops = Array.from({ length: 5 }, () => {
      const v = k % 12;
      k = Math.floor(k / 12);
      return v;
    });
    for (const row of rows) {
      let i = 0;
      const bet: Bet = { lineCount: row.lineCount, perLine: 1 };
      const o = spin(machine, bet, () => stops[i++]);
      if (!Number.isSafeInteger(o.payout) || o.lineWins.some((w) => w.lineIndex >= row.lineCount))
        throw Error("Unsafe or inactive payout");
      i = 0;
      const scaled = spin(machine, { ...bet, perLine: 5 }, () => stops[i++]);
      if (scaled.payout !== o.payout * 5) throw Error("Bet scaling mismatch");
      row.total += o.payout;
      row.profit += Number(o.payout > row.lineCount);
      row.tiers[classifyWin(row.lineCount, o.payout)]++;
      row.values.push(o.payout);
    }
  }
  report.enumeration = rows.map((r) => ({
    lineCount: r.lineCount,
    rtp: r.total / (12 ** 5 * r.lineCount),
    profitFrequency: r.profit / 12 ** 5,
    tiers: Object.fromEntries(Object.entries(r.tiers).map(([k, v]) => [k, v / 12 ** 5])),
    payout: distribution(r.values),
  }));
  report.enumeration.forEach((r: any) => {
    r.maxAtPerLine5 = r.payout.max * 5;
  });
  expect(report.enumeration.every((r: any) => r.rtp > 0 && r.rtp < 1 && r.maxAtPerLine5 <= 40000)).toBe(true);
  writeFileSync("docs/math-report.json", `${JSON.stringify(report, null, 2)}\n`);
}, 120000);
it("runs 10000 reproducible sessions of 100 default spins through public session transitions", () => {
  const balances: number[] = [];
  let bankrupt = 0,
    big = 0,
    jackpot = 0,
    spins = 0;
  for (let n = 0; n < 10000; n++) {
    let s = createSession(createSave(0));
    const rng = seeded(20261104 + n);
    for (let i = 0; i < 100; i++) {
      const r = requestSpin(s, rng);
      if (!r.ok) {
        bankrupt++;
        break;
      }
      spins++;
      const tier = classifyWin(r.spin.totalStake, r.spin.outcome.payout);
      big += Number(tier === "big");
      jackpot += Number(tier === "jackpot");
      s = finishSpin(reelsStopped(r.state, r.spin.id), r.spin.id);
    }
    balances.push(s.save.balance);
  }
  report.sessions = { count: 10000, spins, bankrupt, big, jackpot, balance: distribution(balances) };
  expect(spins).toBe(1000000);
  expect(bankrupt).toBe(0);
  writeFileSync("docs/math-report.json", `${JSON.stringify(report, null, 2)}\n`);
}, 120000);
it("measures 30/180 days idle, daily play and finite investing without hidden caps", () => {
  report.longTerm = [];
  for (const days of [30, 180])
    for (const mode of ["idle", "play", "invest"]) {
      const balances: number[] = [];
      let incomeTotal = 0,
        stakeTotal = 0,
        payoutTotal = 0;
      const completed: number[] = [];
      for (let seed = 0; seed < 100; seed++) {
        let save = createSave(0);
        let completedDay: number | null = null;
        const rng = seeded(20261104 + seed);
        for (let day = 1; day <= days; day++) {
          const now = day * 24 * 3600000;
          const accrued = accrueIncome(save, now);
          incomeTotal += accrued.balance - save.balance;
          save = accrued;
          if (mode === "invest") {
            while (true) {
              const options = (["bar", "machine"] as const)
                .filter((key) => save.businesses[catalog[key].field] < 3)
                .sort(
                  (a, b) =>
                    (catalog[a].prices.at(save.businesses[catalog[a].field]) ?? Infinity) -
                    (catalog[b].prices.at(save.businesses[catalog[b].field]) ?? Infinity),
                );
              if (!options.length) {
                completedDay ??= day;
                break;
              }
              const bought = purchase(save, options[0], now);
              if (!bought.ok) break;
              save = bought.save;
            }
          }
          if (mode !== "idle") {
            let state = createSession(save);
            for (let i = 0; i < 100; i++) {
              const r = requestSpin(state, rng);
              if (!r.ok) break;
              stakeTotal += r.spin.totalStake;
              payoutTotal += r.spin.outcome.payout;
              state = finishSpin(reelsStopped(r.state, r.spin.id), r.spin.id);
            }
            save = state.save;
          }
          if (!Number.isSafeInteger(save.balance) || save.balance < 0) throw Error("Invalid long-term wallet");
        }
        if (mode === "invest" && save.businesses.decorLevel !== 0)
          throw Error("Business-only strategy must not buy decor");
        balances.push(save.balance);
        if (completedDay !== null) completed.push(completedDay);
      }
      report.longTerm.push({
        days,
        mode,
        seeds: 100,
        balance: distribution(balances),
        averageIdleEmission: incomeTotal / 100,
        averageStakes: stakeTotal / 100,
        averagePayouts: payoutTotal / 100,
        completedBusinesses: completed.length,
        completionDays: completed.length ? distribution(completed) : null,
      });
    }
  expect(report.longTerm.every((r: any) => r.balance.max < 1000000)).toBe(true);
  expect(report.longTerm.filter((r: any) => r.mode === "invest").every((r: any) => r.completedBusinesses === 100)).toBe(
    true,
  );
  writeFileSync("docs/math-report.json", `${JSON.stringify(report, null, 2)}\n`);
}, 120000);
it("a day away funds 100 default spins and the smallest bet returns within an hour", () => {
  const save = createSave(0);
  save.balance = 0;
  expect(accrueIncome(save, 24 * 3600000).balance).toBeGreaterThanOrEqual(500);
  expect(accrueIncome(save, 3600000).balance).toBeGreaterThanOrEqual(1);
});
