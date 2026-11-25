import {
  AI_CHARGE_DELAY_SECONDS,
  AI_REVEAL_DELAY_SECONDS,
  CHARGE_MAX,
  CHARGE_MIN,
  ROOKIE_STOP_DISTANCE,
} from "./config";
import { randomInt } from "./rng";
import type { RoundState } from "./round";
import { pickTaunt } from "./taunts";

export type AiTurnState = {
  isHiddenChargeRevealed: boolean;
  currentTaunt: string;
  delayRemainingSeconds: number;
  isTurnComplete: boolean;
};

export type AiChargeResult = {
  round: RoundState;
  taunt: string;
};

export type AiTurnStep = {
  round: RoundState;
  aiTurn: AiTurnState;
  hasChanged: boolean;
};

// Checks whether Rookie is still far enough below the code to take a charge.
export function shouldRookieTakeCharge(aiTotal: number, code: number): boolean {
  return code - aiTotal > ROOKIE_STOP_DISTANCE;
}

// Creates the initial AI turn state with the hidden charge still concealed.
export function createAiTurnState(): AiTurnState {
  return {
    isHiddenChargeRevealed: false,
    currentTaunt: "",
    delayRemainingSeconds: AI_REVEAL_DELAY_SECONDS,
    isTurnComplete: false,
  };
}

// Rolls one charge and one taunt for the AI when Rookie should keep drawing.
export function takeAiCharge(round: RoundState): AiChargeResult {
  if (
    round.turn !== "ai" ||
    !shouldRookieTakeCharge(round.aiTotal, round.code)
  ) {
    return { round, taunt: "" };
  }

  const chargeResult = randomInt(round.rng, CHARGE_MIN, CHARGE_MAX);
  const tauntResult = pickTaunt(chargeResult.rng);
  const aiTotal = round.aiTotal + chargeResult.value;

  return {
    round: {
      ...round,
      aiCharges: [...round.aiCharges, chargeResult.value],
      aiTotal,
      rng: tauntResult.rng,
    },
    taunt: tauntResult.taunt,
  };
}

// Advances the AI turn through the reveal pause and one-by-one charges.
export function advanceAiTurn(
  aiTurn: AiTurnState,
  round: RoundState,
  elapsedSeconds: number,
): AiTurnStep {
  if (round.turn !== "ai" || aiTurn.isTurnComplete || elapsedSeconds <= 0) {
    return { round, aiTurn, hasChanged: false };
  }

  const nextDelay = aiTurn.delayRemainingSeconds - elapsedSeconds;
  if (nextDelay > 0) {
    return {
      round,
      aiTurn: { ...aiTurn, delayRemainingSeconds: nextDelay },
      hasChanged: false,
    };
  }

  if (!aiTurn.isHiddenChargeRevealed) {
    return revealAiHiddenCharge(aiTurn, round);
  }

  return performNextAiCharge(aiTurn, round);
}

function revealAiHiddenCharge(
  aiTurn: AiTurnState,
  round: RoundState,
): AiTurnStep {
  const shouldContinue = shouldRookieTakeCharge(round.aiTotal, round.code);

  return {
    round,
    aiTurn: {
      ...aiTurn,
      isHiddenChargeRevealed: true,
      delayRemainingSeconds: shouldContinue ? AI_CHARGE_DELAY_SECONDS : 0,
      isTurnComplete: !shouldContinue,
    },
    hasChanged: true,
  };
}

function performNextAiCharge(
  aiTurn: AiTurnState,
  round: RoundState,
): AiTurnStep {
  if (!shouldRookieTakeCharge(round.aiTotal, round.code)) {
    return {
      round,
      aiTurn: { ...aiTurn, delayRemainingSeconds: 0, isTurnComplete: true },
      hasChanged: false,
    };
  }

  const chargeStep = takeAiCharge(round);
  const shouldContinue = shouldRookieTakeCharge(
    chargeStep.round.aiTotal,
    chargeStep.round.code,
  );

  return {
    round: chargeStep.round,
    aiTurn: {
      isHiddenChargeRevealed: true,
      currentTaunt: chargeStep.taunt,
      delayRemainingSeconds: shouldContinue ? AI_CHARGE_DELAY_SECONDS : 0,
      isTurnComplete: !shouldContinue,
    },
    hasChanged: true,
  };
}
