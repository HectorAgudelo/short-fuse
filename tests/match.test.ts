import { describe, expect, it } from "vitest";
import { ROUND_RESULT_DELAY_SECONDS } from "../src/core/config";
import {
  advanceRoundFlow,
  applyRoundResult,
  createRoundFlowState,
  startMatch,
} from "../src/core/match";
import { createRng } from "../src/core/rng";
import { lockInPlayer, startRound } from "../src/core/round";

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

describe("advanceRoundFlow", () => {
  it("keeps playing while the player has not overloaded and the AI turn is incomplete", () => {
    const match = startMatch();
    const round = startRound(createRng(12345));
    const flow = createRoundFlowState();

    const step = advanceRoundFlow(match, round, flow, false, 1);

    expect(step.outcome).toBe("playing");
    expect(step.match).toEqual(match);
    expect(step.flow.isShowingResult).toBe(false);
  });

  it("resolves immediately on player overload by burning one segment and showing the result", () => {
    const match = startMatch();
    const round = {
      ...startRound(createRng(12345)),
      code: 23,
      playerTotal: 26,
      isPlayerOverloaded: true,
    };

    const step = advanceRoundFlow(
      match,
      round,
      createRoundFlowState(),
      false,
      0.1,
    );

    expect(step.outcome).toBe("round-resolved");
    expect(step.match.playerFuse).toBe(2);
    expect(step.match.aiFuse).toBe(3);
    expect(step.flow.isShowingResult).toBe(true);
    expect(step.flow.resultText).toContain("Rookie wins");
  });

  it("resolves when the AI turn finishes and burns two AI segments on a perfect defuse", () => {
    const match = startMatch();
    const round = {
      ...lockInPlayer(startRound(createRng(12345))),
      code: 25,
      playerTotal: 25,
      aiTotal: 22,
    };

    const step = advanceRoundFlow(
      match,
      round,
      createRoundFlowState(),
      true,
      0.1,
    );

    expect(step.outcome).toBe("round-resolved");
    expect(step.match.aiFuse).toBe(1);
    expect(step.match.playerFuse).toBe(3);
    expect(step.flow.resultText).toContain("Perfect defuse");
  });

  it("shows a tie result without burning fuses", () => {
    const match = startMatch();
    const round = {
      ...lockInPlayer(startRound(createRng(12345))),
      code: 25,
      playerTotal: 21,
      aiTotal: 21,
    };

    const step = advanceRoundFlow(
      match,
      round,
      createRoundFlowState(),
      true,
      0.1,
    );

    expect(step.outcome).toBe("round-resolved");
    expect(step.match).toEqual(match);
    expect(step.flow.resultText).toContain("Tie");
  });

  it("starts the next round from the current RNG after the result delay when fuses remain", () => {
    const match = startMatch();
    const round = {
      ...startRound(createRng(12345)),
      code: 23,
      playerTotal: 26,
      isPlayerOverloaded: true,
    };
    const resolved = advanceRoundFlow(
      match,
      round,
      createRoundFlowState(),
      false,
      0.1,
    );

    const midPause = advanceRoundFlow(
      resolved.match,
      resolved.round,
      resolved.flow,
      false,
      ROUND_RESULT_DELAY_SECONDS / 2,
    );
    expect(midPause.outcome).toBe("showing-result");

    const nextRoundStep = advanceRoundFlow(
      midPause.match,
      midPause.round,
      midPause.flow,
      false,
      ROUND_RESULT_DELAY_SECONDS / 2,
    );
    expect(nextRoundStep.outcome).toBe("next-round");
    expect(nextRoundStep.round).toEqual(startRound(round.rng));
    expect(nextRoundStep.flow.isShowingResult).toBe(false);
  });

  it("signals match over after the result delay when a fuse reaches 0", () => {
    const match = { ...startMatch(), playerFuse: 1 };
    const round = {
      ...startRound(createRng(12345)),
      code: 23,
      playerTotal: 26,
      isPlayerOverloaded: true,
    };
    const resolved = advanceRoundFlow(
      match,
      round,
      createRoundFlowState(),
      false,
      0.1,
    );
    expect(resolved.match.playerFuse).toBe(0);
    expect(resolved.match.isMatchOver).toBe(true);

    const finished = advanceRoundFlow(
      resolved.match,
      resolved.round,
      resolved.flow,
      false,
      ROUND_RESULT_DELAY_SECONDS,
    );
    expect(finished.outcome).toBe("match-over");
    expect(finished.match.matchWinner).toBe("ai");
  });

  it("does not mutate the match, round, or flow state", () => {
    const match = startMatch();
    const round = {
      ...startRound(createRng(12345)),
      isPlayerOverloaded: true,
    };
    const flow = createRoundFlowState();
    const originalMatch = structuredClone(match);
    const originalRound = structuredClone(round);
    const originalFlow = structuredClone(flow);

    advanceRoundFlow(match, round, flow, false, 0.5);

    expect(match).toEqual(originalMatch);
    expect(round).toEqual(originalRound);
    expect(flow).toEqual(originalFlow);
  });
});
