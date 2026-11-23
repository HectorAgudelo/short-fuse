import { describe, expect, it } from "vitest";
import { createRng } from "../src/core/rng";
import { startRound } from "../src/core/round";

describe("startRound", () => {
  it("rolls a code within the code range", () => {
    const state = startRound(createRng(12345));

    expect(state.code).toBeGreaterThanOrEqual(21);
    expect(state.code).toBeLessThanOrEqual(30);
  });

  it("deals two visible player charges", () => {
    const state = startRound(createRng(12345));

    expect(state.playerCharges).toHaveLength(2);
    for (const charge of state.playerCharges) {
      expect(charge).toBeGreaterThanOrEqual(1);
      expect(charge).toBeLessThanOrEqual(10);
    }
  });

  it("deals two AI charges with only the second one hidden", () => {
    const state = startRound(createRng(12345));

    expect(state.aiCharges).toHaveLength(2);
    expect(state.aiHiddenChargeIndex).toBe(1);
    for (const charge of state.aiCharges) {
      expect(charge).toBeGreaterThanOrEqual(1);
      expect(charge).toBeLessThanOrEqual(10);
    }
  });

  it("sets both totals to the sum of their dealt charges", () => {
    const state = startRound(createRng(12345));

    expect(state.playerTotal).toBe(state.playerCharges[0] + state.playerCharges[1]);
    expect(state.aiTotal).toBe(state.aiCharges[0] + state.aiCharges[1]);
  });

  it("produces the same round for the same seed", () => {
    const firstRound = startRound(createRng(54321));
    const secondRound = startRound(createRng(54321));

    expect(firstRound).toEqual(secondRound);
  });
});
