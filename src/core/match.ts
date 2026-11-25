import {
  FUSE_SIZE,
  NORMAL_LOSS_SEGMENTS,
  PERFECT_DEFUSE_LOSS_SEGMENTS,
  ROUND_RESULT_DELAY_SECONDS,
} from "./config";
import {
  compareRoundTotals,
  startRound,
  type RoundResult,
  type RoundState,
} from "./round";

export type MatchState = {
  playerFuse: number;
  aiFuse: number;
  isMatchOver: boolean;
  matchWinner: "player" | "ai" | null;
};

export type RoundFlowOutcome =
  "playing" | "round-resolved" | "showing-result" | "next-round" | "match-over";

export type RoundFlowState = {
  isShowingResult: boolean;
  resultText: string;
  roundWinner: "player" | "ai" | "tie" | null;
  delayRemainingSeconds: number;
};

export type RoundFlowStep = {
  match: MatchState;
  round: RoundState;
  flow: RoundFlowState;
  outcome: RoundFlowOutcome;
};

// Creates a new match where both fuses are full.
export function startMatch(): MatchState {
  return {
    playerFuse: FUSE_SIZE,
    aiFuse: FUSE_SIZE,
    isMatchOver: false,
    matchWinner: null,
  };
}

// Creates the initial round flow state while a round is in progress.
export function createRoundFlowState(): RoundFlowState {
  return {
    isShowingResult: false,
    resultText: "",
    roundWinner: null,
    delayRemainingSeconds: 0,
  };
}

// Burns fuse segments for the round loser and ends the match at 0 segments.
export function applyRoundResult(
  state: MatchState,
  result: RoundResult,
): MatchState {
  if (state.isMatchOver || result.winner === "tie") {
    return state;
  }

  let segmentsLost = NORMAL_LOSS_SEGMENTS;
  if (result.isPerfectDefuse) {
    segmentsLost = PERFECT_DEFUSE_LOSS_SEGMENTS;
  }

  let playerFuse = state.playerFuse;
  let aiFuse = state.aiFuse;
  if (result.winner === "player") {
    aiFuse = Math.max(0, aiFuse - segmentsLost);
  } else {
    playerFuse = Math.max(0, playerFuse - segmentsLost);
  }

  let matchWinner: "player" | "ai" | null = null;
  if (aiFuse === 0) {
    matchWinner = "player";
  } else if (playerFuse === 0) {
    matchWinner = "ai";
  }

  return {
    playerFuse,
    aiFuse,
    isMatchOver: matchWinner !== null,
    matchWinner,
  };
}

// Resolves finished rounds, pauses to show results, then advances the match.
export function advanceRoundFlow(
  match: MatchState,
  round: RoundState,
  flow: RoundFlowState,
  isAiTurnComplete: boolean,
  elapsedSeconds: number,
): RoundFlowStep {
  if (!flow.isShowingResult) {
    if (!round.isPlayerOverloaded && !isAiTurnComplete) {
      return { match, round, flow, outcome: "playing" };
    }
    return resolveCompletedRound(match, round);
  }

  if (elapsedSeconds <= 0) {
    return { match, round, flow, outcome: "showing-result" };
  }

  const nextDelay = flow.delayRemainingSeconds - elapsedSeconds;
  if (nextDelay > 0) {
    return {
      match,
      round,
      flow: { ...flow, delayRemainingSeconds: nextDelay },
      outcome: "showing-result",
    };
  }

  return finishResultPause(match, round, flow);
}

function resolveCompletedRound(
  match: MatchState,
  round: RoundState,
): RoundFlowStep {
  const result = compareRoundTotals(round);
  const updatedMatch = applyRoundResult(match, result);

  return {
    match: updatedMatch,
    round,
    flow: {
      isShowingResult: true,
      resultText: formatRoundResultText(round, result),
      roundWinner: result.winner,
      delayRemainingSeconds: ROUND_RESULT_DELAY_SECONDS,
    },
    outcome: "round-resolved",
  };
}

function finishResultPause(
  match: MatchState,
  round: RoundState,
  flow: RoundFlowState,
): RoundFlowStep {
  if (match.isMatchOver) {
    return {
      match,
      round,
      flow: { ...flow, delayRemainingSeconds: 0 },
      outcome: "match-over",
    };
  }

  return {
    match,
    round: startRound(round.rng),
    flow: createRoundFlowState(),
    outcome: "next-round",
  };
}

function formatRoundResultText(round: RoundState, result: RoundResult): string {
  if (result.winner === "tie") {
    return "Tie round — no fuse burned";
  }

  if (result.winner === "player") {
    if (result.isPerfectDefuse) {
      return "Perfect defuse! You win the round";
    }
    if (round.aiTotal > round.code) {
      return "Rookie overloaded! You win the round";
    }
    return "You win the round!";
  }

  if (round.isPlayerOverloaded) {
    return "Overload! Rookie wins the round";
  }
  if (result.isPerfectDefuse) {
    return "Perfect defuse! Rookie wins the round";
  }
  return "Rookie wins the round!";
}
