import { CHARGE_MAX, CHARGE_MIN, CODE_MAX, CODE_MIN } from "./config";
import { randomInt, type Rng } from "./rng";

export type RoundState = {
  code: number;
  playerCharges: number[];
  aiCharges: number[];
  aiHiddenChargeIndex: number;
  playerTotal: number;
  aiTotal: number;
  rng: Rng;
};

// Creates a new round with a rolled code and four initial charges.
export function startRound(rng: Rng): RoundState {
  const codeResult = randomInt(rng, CODE_MIN, CODE_MAX);
  const playerFirst = randomInt(codeResult.rng, CHARGE_MIN, CHARGE_MAX);
  const playerSecond = randomInt(playerFirst.rng, CHARGE_MIN, CHARGE_MAX);
  const aiFirst = randomInt(playerSecond.rng, CHARGE_MIN, CHARGE_MAX);
  const aiSecond = randomInt(aiFirst.rng, CHARGE_MIN, CHARGE_MAX);

  const playerCharges = [playerFirst.value, playerSecond.value];
  const aiCharges = [aiFirst.value, aiSecond.value];

  return {
    code: codeResult.value,
    playerCharges,
    aiCharges,
    aiHiddenChargeIndex: 1,
    playerTotal: playerCharges[0] + playerCharges[1],
    aiTotal: aiCharges[0] + aiCharges[1],
    rng: aiSecond.rng,
  };
}
