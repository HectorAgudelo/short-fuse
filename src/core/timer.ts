import {
  DECISION_TIMER_SECONDS,
  DECISION_TIMER_WARNING_SECONDS,
} from "./config";
import { takePlayerCharge, type RoundState } from "./round";

export type DecisionTimerState = {
  remainingSeconds: number;
  isRunning: boolean;
};

export type DecisionTimerStep = {
  round: RoundState;
  timer: DecisionTimerState;
  hasExpired: boolean;
};

// Creates a full 10-second timer for a new player decision.
export function createDecisionTimer(): DecisionTimerState {
  return {
    remainingSeconds: DECISION_TIMER_SECONDS,
    isRunning: true,
  };
}

// Stops the decision timer while keeping its current remaining time.
export function stopDecisionTimer(
  timer: DecisionTimerState,
): DecisionTimerState {
  return {
    ...timer,
    isRunning: false,
  };
}

// Returns the timer bar width ratio clamped between 0 and 1.
export function getTimerProgress(timer: DecisionTimerState): number {
  const ratio = timer.remainingSeconds / DECISION_TIMER_SECONDS;
  return Math.min(1, Math.max(0, ratio));
}

// Checks whether the timer is in the final warning window.
export function shouldShowTimerWarning(timer: DecisionTimerState): boolean {
  return timer.remainingSeconds <= DECISION_TIMER_WARNING_SECONDS;
}

// Advances the timer and automatically takes a charge if time runs out.
export function advanceDecisionTimer(
  timer: DecisionTimerState,
  round: RoundState,
  elapsedSeconds: number,
): DecisionTimerStep {
  if (!timer.isRunning || round.turn !== "player" || round.isPlayerOverloaded) {
    return {
      round,
      timer: stopDecisionTimer(timer),
      hasExpired: false,
    };
  }

  if (elapsedSeconds <= 0) {
    return { round, timer, hasExpired: false };
  }

  const nextRemaining = timer.remainingSeconds - elapsedSeconds;
  if (nextRemaining > 0) {
    return {
      round,
      timer: { remainingSeconds: nextRemaining, isRunning: true },
      hasExpired: false,
    };
  }

  return expireDecisionTimer(round);
}

function expireDecisionTimer(round: RoundState): DecisionTimerStep {
  const updatedRound = takePlayerCharge(round);
  if (updatedRound.isPlayerOverloaded) {
    return {
      round: updatedRound,
      timer: { remainingSeconds: 0, isRunning: false },
      hasExpired: true,
    };
  }

  return {
    round: updatedRound,
    timer: createDecisionTimer(),
    hasExpired: true,
  };
}
