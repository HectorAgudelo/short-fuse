import { describe, expect, it } from "vitest";
import { createRng } from "../src/core/rng";
import { TAUNT_LINES, pickTaunt } from "../src/core/taunts";

describe("taunts", () => {
  it("provides at least ten short taunt lines", () => {
    expect(TAUNT_LINES.length).toBeGreaterThanOrEqual(10);
  });

  it("picks a taunt from the fixed list", () => {
    const result = pickTaunt(createRng(12345));

    expect(TAUNT_LINES).toContain(result.taunt);
  });

  it("picks the same taunt sequence from the same seed", () => {
    const firstSeed = createRng(54321);
    const secondSeed = createRng(54321);

    const firstResult = pickTaunt(firstSeed);
    const secondResult = pickTaunt(secondSeed);

    expect(firstResult.taunt).toBe(secondResult.taunt);
  });
});
