import { describe, expect, it } from "vitest";
import { createRng } from "../src/core/rng";
import {
  compareRoundTotals,
  startRound,
  type RoundState,
} from "../src/core/round";

function createRoundState(
  code: number,
  playerTotal: number,
  aiTotal: number,
  isPlayerOverloaded = false,
): RoundState {
  return {
    ...startRound(createRng(12345)),
    code,
    playerTotal,
    aiTotal,
    isPlayerOverloaded,
  };
}

describe("compareRoundTotals", () => {
  it("makes the AI win when the player overloads", () => {
    const state = {
      ...createRoundState(27, 28, 22),
      isPlayerOverloaded: true,
    };

    expect(compareRoundTotals(state)).toEqual({
      winner: "ai",
      isPerfectDefuse: false,
    });
  });

  it("makes the player win when the AI overloads", () => {
    const state = createRoundState(27, 24, 28);

    expect(compareRoundTotals(state)).toEqual({
      winner: "player",
      isPerfectDefuse: false,
    });
  });

  it("makes the player with the closer total win", () => {
    const state = createRoundState(27, 25, 21);

    expect(compareRoundTotals(state)).toEqual({
      winner: "player",
      isPerfectDefuse: false,
    });
  });

  it("makes the AI with the closer total win", () => {
    const state = createRoundState(27, 20, 25);

    expect(compareRoundTotals(state)).toEqual({
      winner: "ai",
      isPerfectDefuse: false,
    });
  });

  it("marks the player's exact total as a perfect defuse", () => {
    const state = createRoundState(27, 27, 25);

    expect(compareRoundTotals(state)).toEqual({
      winner: "player",
      isPerfectDefuse: true,
    });
  });

  it("marks the AI's exact total as a perfect defuse", () => {
    const state = createRoundState(27, 25, 27);

    expect(compareRoundTotals(state)).toEqual({
      winner: "ai",
      isPerfectDefuse: true,
    });
  });

  it("ties when both totals are equally distant from the code", () => {
    const state = createRoundState(27, 25, 25);

    expect(compareRoundTotals(state)).toEqual({
      winner: "tie",
      isPerfectDefuse: false,
    });
  });
});
