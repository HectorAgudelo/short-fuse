import { describe, expect, it } from "vitest";
import { applyRoundResult, startMatch } from "../src/core/match";

describe("startMatch", () => {
  it("starts both fuses at 3 and the match not over", () => {
    const state = startMatch();

    expect(state.playerFuse).toBe(3);
    expect(state.aiFuse).toBe(3);
    expect(state.isMatchOver).toBe(false);
    expect(state.matchWinner).toBeNull();
  });
});

describe("applyRoundResult", () => {
  it("burns 1 segment of the player fuse when the player loses normally", () => {
    const state = applyRoundResult(startMatch(), {
      winner: "ai",
      isPerfectDefuse: false,
    });

    expect(state.playerFuse).toBe(2);
    expect(state.aiFuse).toBe(3);
  });

  it("burns 1 segment of the AI fuse when the AI loses normally", () => {
    const state = applyRoundResult(startMatch(), {
      winner: "player",
      isPerfectDefuse: false,
    });

    expect(state.aiFuse).toBe(2);
    expect(state.playerFuse).toBe(3);
  });

  it("burns 2 segments when the loser faces a perfect defuse", () => {
    const state = applyRoundResult(startMatch(), {
      winner: "player",
      isPerfectDefuse: true,
    });

    expect(state.aiFuse).toBe(1);
  });

  it("burns nothing on a tie", () => {
    const state = applyRoundResult(startMatch(), {
      winner: "tie",
      isPerfectDefuse: false,
    });

    expect(state).toEqual(startMatch());
  });

  it("ends the match with the AI as winner when the player fuse reaches 0", () => {
    const state = applyRoundResult(
      { ...startMatch(), playerFuse: 1 },
      { winner: "ai", isPerfectDefuse: false },
    );

    expect(state.playerFuse).toBe(0);
    expect(state.isMatchOver).toBe(true);
    expect(state.matchWinner).toBe("ai");
  });

  it("ends the match with the player as winner when the AI fuse reaches 0", () => {
    const state = applyRoundResult(
      { ...startMatch(), aiFuse: 2 },
      { winner: "player", isPerfectDefuse: true },
    );

    expect(state.aiFuse).toBe(0);
    expect(state.isMatchOver).toBe(true);
    expect(state.matchWinner).toBe("player");
  });

  it("never lets a fuse go below 0", () => {
    const state = applyRoundResult(
      { ...startMatch(), playerFuse: 1 },
      { winner: "ai", isPerfectDefuse: true },
    );

    expect(state.playerFuse).toBe(0);
  });

  it("ignores round results after the match is over", () => {
    const overState = applyRoundResult(
      { ...startMatch(), playerFuse: 1 },
      { winner: "ai", isPerfectDefuse: false },
    );
    const afterState = applyRoundResult(overState, {
      winner: "player",
      isPerfectDefuse: false,
    });

    expect(afterState).toEqual(overState);
  });
});
