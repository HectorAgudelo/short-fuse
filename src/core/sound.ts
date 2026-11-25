import {
  TICK_MAX_DISTANCE,
  TICK_MAX_INTERVAL_SECONDS,
  TICK_MIN_INTERVAL_SECONDS,
} from "./config";
import type { MatchState } from "./match";
import { compareRoundTotals, type RoundState } from "./round";

export type SoundCueType =
  "tick" | "defuse" | "perfect-defuse" | "spark" | "explosion";

export type RoundOutcomeCue = {
  sound: "defuse" | "perfect-defuse" | "spark" | "explosion" | null;
  visualEffect: "none" | "spark" | "explosion";
  targetSide: "player" | "ai" | null;
};

export type TickTimerState = {
  remainingSeconds: number;
};

export type TickTimerStep = {
  timer: TickTimerState;
  shouldPlayTick: boolean;
};

// Calculates the bomb tick interval, speeding up as the player nears the code.
export function getTickIntervalSeconds(
  playerTotal: number,
  code: number,
): number {
  const distance = Math.max(0, code - playerTotal);
  const ratio = Math.min(1, distance / TICK_MAX_DISTANCE);
  return (
    (1 - ratio) * TICK_MIN_INTERVAL_SECONDS + ratio * TICK_MAX_INTERVAL_SECONDS
  );
}

// Creates a tick timer set to the round's starting tick interval.
export function createTickTimer(round: RoundState): TickTimerState {
  return {
    remainingSeconds: getTickIntervalSeconds(round.playerTotal, round.code),
  };
}

// Advances the tick timer during the player's turn and signals each tick.
export function advanceTickTimer(
  timer: TickTimerState,
  round: RoundState,
  elapsedSeconds: number,
): TickTimerStep {
  if (
    round.turn !== "player" ||
    round.isPlayerOverloaded ||
    elapsedSeconds <= 0
  ) {
    return { timer, shouldPlayTick: false };
  }

  const interval = getTickIntervalSeconds(round.playerTotal, round.code);
  const clampedRemaining = Math.min(timer.remainingSeconds, interval);
  const nextRemaining = clampedRemaining - elapsedSeconds;
  if (nextRemaining > 0) {
    return {
      timer: { remainingSeconds: nextRemaining },
      shouldPlayTick: false,
    };
  }

  return {
    timer: { remainingSeconds: interval },
    shouldPlayTick: true,
  };
}

// Selects the sound and spark/explosion effect for a completed round.
export function getRoundOutcomeCue(
  round: RoundState,
  match: MatchState,
): RoundOutcomeCue {
  const result = compareRoundTotals(round);
  if (result.winner === "tie") {
    return { sound: null, visualEffect: "none", targetSide: null };
  }

  if (match.isMatchOver) {
    const loserSide = match.matchWinner === "player" ? "ai" : "player";
    return {
      sound: "explosion",
      visualEffect: "explosion",
      targetSide: loserSide,
    };
  }

  if (result.winner === "player") {
    const winSound = result.isPerfectDefuse ? "perfect-defuse" : "defuse";
    return {
      sound: winSound,
      visualEffect: "spark",
      targetSide: "ai",
    };
  }

  return {
    sound: "spark",
    visualEffect: "spark",
    targetSide: "player",
  };
}
