import {
  FUSE_SIZE,
  NORMAL_LOSS_SEGMENTS,
  PERFECT_DEFUSE_LOSS_SEGMENTS,
} from "./config";
import type { RoundResult } from "./round";

export type MatchState = {
  playerFuse: number;
  aiFuse: number;
  isMatchOver: boolean;
  matchWinner: "player" | "ai" | null;
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
