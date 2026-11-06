import { expect, it } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { catalog, hourlyIncome } from "../src/game/business";
import { spin } from "../src/game/engine";
import { machine } from "../src/game/machine";
import { createSave } from "../src/game/save";
import { createSession, requestSpin, reelsStopped, finishSpin } from "../src/game/session";
import type { Item } from "../src/game/business";
import { openingHours } from "../prototypes/opening-hours";
const modes = {
  baseline: { multiplier: 1, cap: 8 },
  brisk: { multiplier: openingHours.brisk.multiplier, cap: openingHours.brisk.capHours },
  standard: { multiplier: openingHours.standard.multiplier, cap: openingHours.standard.capHours },
  long: { multiplier: openingHours.long.multiplier, cap: openingHours.long.capHours },
  simple24: { multiplier: 1, cap: 24 },
};
const patterns = [
  { name: "frequent-short", gap: 4, spins: 0, invest: true },
  { name: "eight-hour-visits", gap: 8, spins: 0, invest: true },
  { name: "daily", gap: 24, spins: 0, invest: true },
  { name: "every-two-days", gap: 48, spins: 0, invest: true },
  { name: "passive-only-no-purchases", gap: 24, spins: 0, invest: false },
  { name: "mixed-daily-100-spins", gap: 24, spins: 100, invest: true },
];
function seeded(seed: number) {
  return (max: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor((seed / 4294967296) * max);
  };
}
function simulate(mode: keyof typeof modes, pattern: (typeof patterns)[number], seed: number) {
  let save = createSave(0),
    units = 0,
    emission = 0,
    stakes = 0,
    payouts = 0,
    missedSpins = 0;
  const bought: Record<string, number> = {};
  const rng = seeded(seed);
  const buy = (hour: number) => {
    while (true) {
      // House policy: cheapest income upgrade first, cosmetics only after both income paths finish.
      const income = (["bar", "machine"] as Item[]).filter((key) => save.businesses[catalog[key].field] < 3);
      const options = income.length
        ? income
        : (["decor"] as Item[]).filter((key) => save.businesses[catalog[key].field] < 3);
      options.sort(
        (a, b) =>
          (catalog[a].prices.at(save.businesses[catalog[a].field]) ?? Infinity) -
          (catalog[b].prices.at(save.businesses[catalog[b].field]) ?? Infinity),
      );
      const key = options[0];
      if (!key) return;
      const entry = catalog[key],
        level = save.businesses[entry.field],
        cost = entry.prices.at(level) ?? Infinity;
      if (save.balance < cost) return;
      save = { ...save, balance: save.balance - cost, businesses: { ...save.businesses, [entry.field]: level + 1 } };
      bought[`${key}${level + 1}`] = hour;
    }
  };
  if (pattern.invest) buy(0); // Initial 1000 tokens are spendable before the first absence.
  for (let hour = pattern.gap; hour <= 180 * 24; hour += pattern.gap) {
    const config = modes[mode];
    units += Math.min(pattern.gap, config.cap) * hourlyIncome(save.businesses) * config.multiplier;
    const credit = Math.floor(units);
    units -= credit;
    save = { ...save, balance: save.balance + credit };
    emission += credit;
    if (pattern.invest) buy(hour);
    let state = createSession(save);
    for (let n = 0; n < pattern.spins; n++) {
      const result = requestSpin(state, rng);
      if (!result.ok) {
        missedSpins += pattern.spins - n;
        break;
      }
      stakes += result.spin.totalStake;
      payouts += result.spin.outcome.payout;
      state = finishSpin(reelsStopped(result.state, result.spin.id), result.spin.id);
    }
    save = state.save;
    if (save.balance < 0 || !Number.isSafeInteger(save.balance)) throw Error("Invalid wallet");
  }
  const businessHours =
    bought.bar3 === undefined || bought.machine3 === undefined ? null : Math.max(bought.bar3, bought.machine3);
  return {
    boughtHours: bought,
    businessHours,
    allHours: bought.decor3 ?? null,
    balance: save.balance,
    emission,
    stakes,
    payouts,
    missedSpins,
  };
}
function range(values: number[]) {
  const ordered = [...values].sort((a, b) => a - b);
  return {
    min: ordered[0],
    p10: ordered[Math.floor(ordered.length * 0.1)],
    median: ordered[Math.floor(ordered.length * 0.5)],
    p90: ordered[Math.floor(ordered.length * 0.9)],
    max: ordered.at(-1),
  };
}
it("models actual finite upgrades and seeded slot outcomes without crediting expected returns", () => {
  // Independently measure the exact default-bet RTP from all real reel stops.
  let returned = 0;
  for (let n = 0; n < 12 ** 5; n++) {
    let k = n;
    const outcome = spin(machine, { lineCount: 5, perLine: 1 }, () => {
      const stop = k % 12;
      k = Math.floor(k / 12);
      return stop;
    });
    returned += outcome.payout;
  }
  const rtp = returned / (12 ** 5 * 5);
  expect(rtp).toBeCloseTo(0.762892, 5);
  const rows = [];
  for (const [mode, config] of Object.entries(modes))
    for (const pattern of patterns) {
      const samples = Array.from({ length: pattern.spins ? 100 : 1 }, (_, seed) =>
        simulate(mode as keyof typeof modes, pattern, 20261105 + seed),
      );
      const completed = samples.filter((s) => s.allHours !== null);
      rows.push({
        mode,
        pattern: pattern.name,
        samples: samples.length,
        businessHours: range(samples.flatMap((s) => (s.businessHours === null ? [] : [s.businessHours]))),
        allHours: range(completed.flatMap((s) => (s.allHours === null ? [] : [s.allHours]))),
        completed: completed.length,
        upgradeHours: Object.fromEntries(
          ["bar1", "machine1", "bar2", "machine2", "bar3", "machine3", "decor1", "decor2", "decor3"].map((key) => [
            key,
            range(samples.flatMap((s) => (s.boughtHours[key] === undefined ? [] : [s.boughtHours[key]]))),
          ]),
        ),
        balance180Days: range(samples.map((s) => s.balance)),
        meanEmission: samples.reduce((n, s) => n + s.emission, 0) / samples.length,
        meanStakes: samples.reduce((n, s) => n + s.stakes, 0) / samples.length,
        meanPayouts: samples.reduce((n, s) => n + s.payouts, 0) / samples.length,
        missedSpins: samples.reduce((n, s) => n + s.missedSpins, 0),
        fixedRateEarnings: [8, 12, 16, 24, 48].map((hours) => ({
          hours,
          base: Math.min(hours, config.cap) * 64 * config.multiplier,
          full: Math.min(hours, config.cap) * 160 * config.multiplier,
        })),
      });
    }
  expect(rows.filter((r) => !r.pattern.startsWith("passive-only")).every((r) => r.completed === r.samples)).toBe(true);
  expect(rows.find((r) => r.mode === "brisk" && r.pattern === "frequent-short")?.allHours.median).toBeLessThan(
    rows.find((r) => r.mode === "standard" && r.pattern === "frequent-short")?.allHours.median ?? Infinity,
  );
  expect(rows.find((r) => r.mode === "long" && r.pattern === "daily")?.allHours.median).toBeLessThan(
    rows.find((r) => r.mode === "brisk" && r.pattern === "daily")?.allHours.median ?? Infinity,
  );
  mkdirSync("docs/evidence/phase40", { recursive: true });
  writeFileSync(
    "docs/evidence/phase40/simulation.json",
    JSON.stringify(
      { seed: 20261105, horizonDays: 180, rtp, expectedLossPerDefaultSpin: 5 * (1 - rtp), modes, patterns, rows },
      null,
      2,
    ),
  );
}, 120000);
