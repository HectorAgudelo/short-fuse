import { randomInt, type Rng } from "./rng";

export const TAUNT_LINES: readonly string[] = [
  "Feeling lucky?",
  "I can hear it ticking.",
  "Careful, it bites.",
  "Your move.",
  "No sweat.",
  "Time to sweat.",
  "The fuse is short.",
  "Don't blink.",
  "That charge looks risky.",
  "Try to keep up.",
  "Second thoughts?",
  "Here comes the spark.",
];

export type TauntResult = {
  taunt: string;
  rng: Rng;
};

// Picks one taunt and returns the RNG state needed for the next pick.
export function pickTaunt(rng: Rng): TauntResult {
  const result = randomInt(rng, 0, TAUNT_LINES.length - 1);

  return {
    taunt: TAUNT_LINES[result.value],
    rng: result.rng,
  };
}
