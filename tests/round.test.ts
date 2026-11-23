import { describe, expect, it } from "vitest";
import { CHARGE_MAX, CHARGE_MIN } from "../src/core/config";
import { createRng, randomInt } from "../src/core/rng";
import { lockInPlayer, startRound, takePlayerCharge } from "../src/core/round";

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

    expect(state.playerTotal).toBe(
      state.playerCharges[0] + state.playerCharges[1],
    );
    expect(state.aiTotal).toBe(state.aiCharges[0] + state.aiCharges[1]);
  });

  it("starts on the player turn", () => {
    const state = startRound(createRng(12345));

    expect(state.turn).toBe("player");
  });

  it("moves to the AI turn when the player locks in", () => {
    const state = startRound(createRng(12345));

    const updatedState = lockInPlayer(state);

    expect(updatedState.turn).toBe("ai");
  });

  it("does not mutate the round when the player locks in", () => {
    const state = startRound(createRng(12345));
    const originalState = structuredClone(state);

    lockInPlayer(state);

    expect(state).toEqual(originalState);
  });

  it("does not pass an overloaded round to the AI", () => {
    const state = {
      ...startRound(createRng(12345)),
      isPlayerOverloaded: true,
    };

    expect(lockInPlayer(state)).toEqual(state);
  });

  it("adds a seeded charge to the player total", () => {
    const state = startRound(createRng(12345));
    const charge = randomInt(state.rng, CHARGE_MIN, CHARGE_MAX);

    const updatedState = takePlayerCharge(state);

    expect(updatedState.playerCharges).toEqual([
      ...state.playerCharges,
      charge.value,
    ]);
    expect(updatedState.playerTotal).toBe(state.playerTotal + charge.value);
    expect(updatedState.rng).toEqual(charge.rng);
  });

  it("does not take a charge after the player locks in", () => {
    const state = lockInPlayer(startRound(createRng(12345)));

    const updatedState = takePlayerCharge(state);

    expect(updatedState).toEqual(state);
  });

  it("detects when a charge takes the player over the code", () => {
    const roundState = startRound(createRng(12345));
    const nextCharge = randomInt(roundState.rng, CHARGE_MIN, CHARGE_MAX);
    const state = {
      ...roundState,
      code: roundState.playerTotal + nextCharge.value - 1,
    };

    const updatedState = takePlayerCharge(state);

    expect(updatedState.isPlayerOverloaded).toBe(true);
  });

  it("does not overload when a charge reaches the code exactly", () => {
    const roundState = startRound(createRng(12345));
    const nextCharge = randomInt(roundState.rng, CHARGE_MIN, CHARGE_MAX);
    const state = {
      ...roundState,
      code: roundState.playerTotal + nextCharge.value,
    };

    const updatedState = takePlayerCharge(state);

    expect(updatedState.playerTotal).toBe(updatedState.code);
    expect(updatedState.isPlayerOverloaded).toBe(false);
  });

  it("does not mutate the round when the player takes a charge", () => {
    const state = startRound(createRng(12345));
    const originalState = structuredClone(state);

    takePlayerCharge(state);

    expect(state).toEqual(originalState);
  });

  it("produces the same round for the same seed", () => {
    const firstRound = startRound(createRng(54321));
    const secondRound = startRound(createRng(54321));

    expect(firstRound).toEqual(secondRound);
  });
});
