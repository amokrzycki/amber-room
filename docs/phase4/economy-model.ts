// Analysis only. Run from the repository root using the command in README.md.
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { accrueIncome, catalog, hourlyIncome, purchase, type Item } from "../../src/game/business";
import { spin } from "../../src/game/engine";
import { machine } from "../../src/game/machine";
import type { Businesses, SaveV1 } from "../../src/game/model";
import { createSave } from "../../src/game/save";

const H = 3600000;
const days = [1, 3, 7, 14, 30];
const seed = 20261105;
const samples = 1000;
const items: Item[] = ["bar", "machine", "decor"];
const variants = [
  { name: "production8", hospitality: false, cap: 8 },
  { name: "production24", hospitality: false, cap: 24 },
  { name: "production48", hospitality: false, cap: 48 },
  { name: "hospitality8", hospitality: true, cap: 8 },
  { name: "hospitality24", hospitality: true, cap: 24 },
  { name: "hospitality48", hospitality: true, cap: 48 },
];
const patterns = [
  { name: "frequent", hours: [0, 6, 12], period: 24, spins: 30 },
  { name: "daily", hours: [0], period: 24, spins: 100 },
  { name: "occasional", hours: [0], period: 48, spins: 100 },
];
type Variant = (typeof variants)[number];
type Pattern = (typeof patterns)[number];
type Policy = "income-first" | "roi-target" | "decor-first" | "balanced" | "none";
type Snapshot = {
  balance: number;
  pendingIfReturned: number;
  levels: Businesses;
  rate: number;
  bought: number;
  emission: number;
  upgrades: number;
  stakes: number;
  payouts: number;
  rounds: number;
  missed: number;
  attempted: number;
};
function rate(s: SaveV1, v: Variant) {
  const b = s.businesses;
  return hourlyIncome(b) + (v.hospitality ? b.decorLevel * (4 * b.barLevel + 2 * b.extraMachines) : 0);
}
function accrue(s: SaveV1, hour: number, v: Variant) {
  if (v.name === "production8") return accrueIncome(s, hour * H);
  const now = hour * H;
  if (now <= s.lastAccrualAtMs) return s;
  const units = s.remainderUnits + Math.min(now - s.lastAccrualAtMs, v.cap * H) * rate(s, v);
  return { ...s, balance: s.balance + Math.floor(units / H), remainderUnits: units % H, lastAccrualAtMs: now };
}
function cost(s: SaveV1, item: Item) {
  return catalog[item].prices.at(s.businesses[catalog[item].field]) ?? Infinity;
}
function gain(s: SaveV1, item: Item, v: Variant) {
  const b = s.businesses;
  if (item === "bar") return 12 + (v.hospitality ? 4 * b.decorLevel : 0);
  if (item === "machine") return 20 + (v.hospitality ? 2 * b.decorLevel : 0);
  return v.hospitality ? 4 * b.barLevel + 2 * b.extraMachines : 0;
}
function next(s: SaveV1, v: Variant, policy: Policy): Item | undefined {
  if (policy === "none") return undefined;
  let options = items.filter((i) => cost(s, i) < Infinity);
  if (policy === "income-first") {
    const productive = options.filter((i) => i !== "decor");
    if (productive.length) options = productive;
  }
  if (policy === "decor-first" && options.includes("decor")) return "decor";
  options.sort((a, b) => {
    if (policy === "balanced") {
      const difference = s.businesses[catalog[a].field] - s.businesses[catalog[b].field];
      if (difference) return difference;
    }
    if (policy === "roi-target") {
      const difference = cost(s, a) / gain(s, a, v) - cost(s, b) / gain(s, b, v);
      if (Number.isFinite(difference) && difference) return difference;
      if (!gain(s, a, v) && gain(s, b, v)) return 1;
      if (gain(s, a, v) && !gain(s, b, v)) return -1;
    }
    return cost(s, a) - cost(s, b);
  });
  return options[0];
}
function rng(initial: number) {
  let state = initial >>> 0;
  return (max: number) => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return Math.floor((((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296) * max);
  };
}
function distribution(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  assert(sorted.length);
  return {
    min: sorted[0],
    p10: sorted[Math.floor(sorted.length * 0.1)],
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p90: sorted[Math.floor(sorted.length * 0.9)],
    max: sorted[sorted.length - 1],
    mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,
  };
}

// Enumerate the real evaluator once. Prefix payouts preserve correlation between lines.
const stopCount = machine.reels.reduce((n, reel) => n * reel.length, 1);
const counts = [1, 5, 10, 20, 40] as const;
const tables = Object.fromEntries(counts.map((n) => [n, new Uint32Array(stopCount)])) as Record<number, Uint32Array>;
for (let n = 0; n < stopCount; n++) {
  let k = n;
  const result = spin(machine, { lineCount: 40, perLine: 1 }, (max) => {
    const stop = k % max;
    k = Math.floor(k / max);
    return stop;
  });
  for (const count of counts)
    tables[count][n] = result.lineWins.filter((w) => w.lineIndex < count).reduce((sum, w) => sum + w.payout, 0);
}
const slots = counts.map((n) => {
  const values = [...tables[n]];
  const d = distribution(values);
  const variance = values.reduce((sum, p) => sum + (p - d.mean) ** 2, 0) / stopCount;
  return {
    lines: n,
    perLine: 1,
    stake: n,
    rtp: d.mean / n,
    payout: d,
    variance,
    standardDeviation: Math.sqrt(variance),
    noReturn: values.filter((p) => p === 0).length / stopCount,
    profit: values.filter((p) => p > n).length / stopCount,
    expectedLoss: n - d.mean,
  };
});
assert(Math.abs(slots[1].rtp - 0.762892232510288) < 1e-12);

function simulate(
  v: Variant,
  p: Pattern,
  policy: Policy,
  options: {
    randomSeed?: number;
    play?: boolean;
    highStake?: boolean;
    spinFirst?: boolean;
    rounds?: boolean;
    order?: Item[];
  } = {},
) {
  let save = createSave(0);
  const random = rng(options.randomSeed ?? seed);
  let emission = 0,
    spent = 0,
    stakes = 0,
    payouts = 0,
    rounds = 0,
    missed = 0,
    attempted = 0;
  let orderIndex = 0,
    buyCount = 0;
  const bought: Record<string, number> = {};
  const snapshots: Record<string, Snapshot> = {};
  const visits = new Set<number>();
  for (let base = 0; base <= 365 * 24; base += p.period)
    for (const offset of p.hours) if (base + offset <= 365 * 24) visits.add(base + offset);
  const timeline = [...new Set([...visits, ...days.map((d) => d * 24)])].sort((a, b) => a - b);
  const buy = (hour: number) => {
    while (true) {
      const item = options.order ? options.order[orderIndex] : next(save, v, policy);
      if (!item || cost(save, item) > save.balance) break;
      const price = cost(save, item);
      const field = catalog[item].field;
      const level = save.businesses[field] + 1;
      if (v.name === "production8") {
        const result = purchase(save, item, hour * H);
        assert(result.ok);
        save = result.save;
      } else save = { ...save, balance: save.balance - price, businesses: { ...save.businesses, [field]: level } };
      bought[`${item}${level}`] = hour;
      spent += price;
      orderIndex++;
      buyCount++;
    }
  };
  const play = () => {
    if (!options.play) return;
    const count = options.highStake ? 20 : p.spins;
    const stake = options.highStake ? 200 : 5;
    for (let i = 0; i < count; i++) {
      if (save.balance < stake) {
        missed += count - i;
        break;
      }
      const payout = tables[options.highStake ? 40 : 5][random(stopCount)] * (options.highStake ? 5 : 1);
      save = { ...save, balance: save.balance - stake + payout };
      stakes += stake;
      payouts += payout;
      attempted++;
    }
  };
  let incomeHour: number | null = null,
    allHour: number | null = null;
  for (const hour of timeline) {
    if (visits.has(hour)) {
      const credited = accrue(save, hour, v);
      emission += credited.balance - save.balance;
      save = credited;
      if (options.spinFirst) play();
      buy(hour);
      if (!options.spinFirst) play();
      if (options.rounds && save.balance >= 50) {
        save = { ...save, balance: save.balance - 50 };
        rounds += 50;
      }
      if (save.businesses.barLevel === 3 && save.businesses.extraMachines === 3) incomeHour ??= hour;
      if (buyCount === 9) allHour ??= hour;
    }
    assert.equal(save.balance, 1000 + emission - spent - stakes + payouts - rounds);
    assert(Number.isSafeInteger(save.balance) && save.balance >= 0);
    if (days.includes(hour / 24)) {
      snapshots[hour / 24] = {
        balance: save.balance,
        pendingIfReturned: accrue(save, hour, v).balance - save.balance,
        levels: { ...save.businesses },
        rate: rate(save, v),
        bought: buyCount,
        emission,
        upgrades: spent,
        stakes,
        payouts,
        rounds,
        missed,
        attempted,
      };
    }
    if (hour >= 30 * 24 && (allHour !== null || policy === "none")) break;
  }
  return { incomeHour, allHour, bought, snapshots };
}

const deterministic = [];
for (const v of variants)
  for (const p of patterns)
    for (const policy of ["income-first", "roi-target", "decor-first", "balanced", "none"] as Policy[])
      deterministic.push({ variant: v.name, pattern: p.name, policy, ...simulate(v, p, policy) });

const stochastic = [];
for (const variantName of ["production8", "hospitality8", "hospitality48"])
  for (const p of patterns) {
    const v = variants.find((v) => v.name === variantName);
    assert(v);
    const runs = Array.from({ length: samples }, (_, i) =>
      simulate(v, p, "roi-target", { play: true, randomSeed: seed + i }),
    );
    stochastic.push({
      variant: v.name,
      pattern: p.name,
      policy: "roi-target",
      samples,
      incomeHour: distribution(runs.flatMap((r) => (r.incomeHour === null ? [] : [r.incomeHour]))),
      allHour: distribution(runs.flatMap((r) => (r.allHour === null ? [] : [r.allHour]))),
      unfinished: runs.filter((r) => r.allHour === null).length,
      snapshots: Object.fromEntries(
        days.map((day) => [
          day,
          Object.fromEntries(
            (
              [
                "balance",
                "bought",
                "rate",
                "emission",
                "upgrades",
                "stakes",
                "payouts",
                "rounds",
                "missed",
                "attempted",
              ] as const
            ).map((key) => [key, distribution(runs.map((r) => r.snapshots[day][key]))]),
          ),
        ]),
      ),
    });
  }

// Exhaust all 9!/(3!^3) legal fixed purchase orders, rather than declaring ROI greedy optimal.
function orders(prefix: Item[] = [], levels = [0, 0, 0]): Item[][] {
  if (prefix.length === 9) return [prefix];
  return items.flatMap((item, i) => {
    if (levels[i] === 3) return [];
    const nextLevels = [...levels];
    nextLevels[i]++;
    return orders([...prefix, item], nextLevels);
  });
}
const legalOrders = orders();
assert.equal(legalOrders.length, 1680);
const orderSearch = [];
for (const variantName of ["production8", "hospitality8", "hospitality48"])
  for (const p of patterns) {
    const v = variants.find((v) => v.name === variantName);
    assert(v);
    const runs = legalOrders.map((order) => ({ order, ...simulate(v, p, "income-first", { order }) }));
    const completionHours = runs.map((r) => {
      assert(r.allHour !== null);
      return r.allHour;
    });
    const fastest = Math.min(...completionHours);
    const richest = Math.max(...runs.map((r) => r.snapshots[30].balance));
    const fastestExample = runs.find((r) => r.allHour === fastest);
    const richestExample = runs.find((r) => r.snapshots[30].balance === richest);
    assert(fastestExample && richestExample);
    orderSearch.push({
      variant: v.name,
      pattern: p.name,
      orders: runs.length,
      completionHours: distribution(completionHours),
      fastestHours: fastest,
      fastestCount: runs.filter((r) => r.allHour === fastest).length,
      fastestExample: {
        order: fastestExample.order,
        milestones: fastestExample.bought,
        balance30: fastestExample.snapshots[30].balance,
      },
      richestBalance30: richest,
      richestCount: runs.filter((r) => r.snapshots[30].balance === richest).length,
      richestExample: {
        order: richestExample.order,
        allHour: richestExample.allHour,
        milestones: richestExample.bought,
      },
    });
  }

const stress = [];
for (const v of variants.filter((v) => ["production8", "hospitality8", "hospitality48"].includes(v.name)))
  for (const setting of ["spin-first", "high-stake", "round-each-visit"]) {
    const runs = Array.from({ length: samples }, (_, i) =>
      simulate(v, patterns[1], "roi-target", {
        randomSeed: seed + i,
        play: setting !== "round-each-visit",
        spinFirst: setting === "spin-first",
        highStake: setting === "high-stake",
        rounds: setting === "round-each-visit",
      }),
    );
    stress.push({
      variant: v.name,
      setting,
      samples,
      allHour: distribution(runs.flatMap((r) => (r.allHour === null ? [] : [r.allHour]))),
      unfinishedBy365: runs.filter((r) => r.allHour === null).length,
      completeBy30: runs.filter((r) => r.allHour !== null && r.allHour <= 720).length,
      balance30: distribution(runs.map((r) => r.snapshots[30].balance)),
      missed30: distribution(runs.map((r) => r.snapshots[30].missed)),
    });
  }

// Small independent checks for ledger, cap semantics, marginal returns and evaluator sampling.
const fresh = createSave(0);
assert.equal(accrue(fresh, 48, variants[0]).balance, 1512);
assert.equal(accrue(fresh, 48, variants[5]).balance, 4072);
assert.equal(accrue(accrue(fresh, 48, variants[5]), 48, variants[5]).balance, 4072);
assert.equal(accrue(accrue(fresh, 48, variants[5]), 47, variants[5]).balance, 4072);
let hourly = fresh;
for (let h = 1; h <= 48; h++) hourly = accrue(hourly, h, variants[0]);
assert.equal(hourly.balance, 4072);
for (let bar = 0; bar <= 3; bar++)
  for (let machineLevel = 0; machineLevel <= 3; machineLevel++)
    for (let decor = 0; decor <= 3; decor++) {
      const s = { ...fresh, businesses: { barLevel: bar, extraMachines: machineLevel, decorLevel: decor } } as SaveV1;
      assert(rate(s, variants[5]) >= hourlyIncome(s.businesses));
      assert(rate(s, variants[5]) <= 214);
      for (const item of items.filter((i) => cost(s, i) < Infinity)) {
        const upgraded = {
          ...s,
          businesses: { ...s.businesses, [catalog[item].field]: s.businesses[catalog[item].field] + 1 },
        };
        assert.equal(rate(upgraded, variants[5]) - rate(s, variants[5]), gain(s, item, variants[5]));
      }
    }
assert.equal(
  500 / gain({ ...fresh, businesses: { barLevel: 0, extraMachines: 0, decorLevel: 1 } }, "bar", variants[5]),
  31.25,
);
for (const n of [0, 101, stopCount - 1])
  for (const count of counts) {
    let k = n;
    const result = spin(machine, { lineCount: count, perLine: 5 }, (max) => {
      const r = k % max;
      k = Math.floor(k / max);
      return r;
    });
    assert.equal(result.payout, tables[count][n] * 5);
  }
const report = {
  seed,
  samples,
  days,
  stopCount,
  method:
    "Actual production imports; hypothetical rates/caps only in this analysis. Visit at t=0; purchase targets may wait. Seeded Mulberry32 samples exact joint payout distribution; no expected-value crediting. Snapshots never trigger accrual or purchases. All order permutations buy each target at first affordable visit; no voluntary waiting or spinning in order search.",
  constants: { startingBalance: fresh.balance, catalog, baseRate: hourlyIncome(fresh.businesses), variants, patterns },
  slots,
  deterministic,
  stochastic,
  orderSearch,
  stress,
};
writeFileSync("docs/phase4/simulation.json", `${JSON.stringify(report, null, 2)}\n`);
const csv = [
  "variant,pattern,policy,day,balance,pending,bar,machines,decor,rate,bought,emission,upgrades,stakes,payouts",
];
for (const r of deterministic)
  for (const day of days) {
    const s = r.snapshots[day];
    csv.push(
      [
        r.variant,
        r.pattern,
        r.policy,
        day,
        s.balance,
        s.pendingIfReturned,
        s.levels.barLevel,
        s.levels.extraMachines,
        s.levels.decorLevel,
        s.rate,
        s.bought,
        s.emission,
        s.upgrades,
        s.stakes,
        s.payouts,
      ].join(","),
    );
  }
writeFileSync("docs/phase4/deterministic.csv", `${csv.join("\n")}\n`);
process.stdout.write(
  `${JSON.stringify({ assertions: "pass", stopCount, samples, deterministicRows: deterministic.length, stochasticRows: stochastic.length, orderSearchRows: orderSearch.length, stressRows: stress.length })}\n`,
);
