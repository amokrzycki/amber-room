import { expect, it } from "vitest";
import { idleGrid } from "../src/view/idleGrid";
import { evaluate } from "../src/game/engine";
import { machine } from "../src/game/machine";
it("has no payable lines, matching first three symbols or repeated adjacent columns", () => {
  expect(evaluate(machine, idleGrid, { lineCount: 40, perLine: 5 })).toEqual([]);
  for (let c = 1; c < 5; c++) expect(idleGrid[c]).not.toEqual(idleGrid[c - 1]);
});
