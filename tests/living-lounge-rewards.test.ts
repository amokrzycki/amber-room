import { expect, it } from "vitest";
import { loungeReward } from "../prototypes/living-lounge-state";
import { hourlyIncome, purchase } from "../src/game/business";
import { createSave } from "../src/game/save";

it.each([
  ["bar", 1, /stocked bar/i],
  ["bar", 2, /upholstered stools/i],
  ["bar", 3, /stocked back-bar/i],
  ["machine", 1, /first additional cabinet/i],
  ["machine", 2, /second additional cabinet/i],
  ["machine", 3, /third additional cabinet/i],
  ["decor", 1, /woven rug.*cosmetic only/i],
  ["decor", 2, /brass planters.*cosmetic only/i],
  ["decor", 3, /engraved.*nameplate.*cosmetic only/i],
] as const)("names the visible %s level %i reward", (item, level, expected) => {
  expect(loungeReward(item, level)).toMatch(expected);
});

it("keeps all furnishing purchases cosmetic with no income gain", () => {
  let save = { ...createSave(1000), balance: 20000 };
  for (let level = 1; level <= 3; level++) {
    const result = purchase(save, "decor", 1000);
    expect(result.ok).toBe(true);
    save = result.save;
    expect(save.businesses.decorLevel).toBe(level);
    expect(hourlyIncome(save.businesses)).toBe(64);
  }
});
