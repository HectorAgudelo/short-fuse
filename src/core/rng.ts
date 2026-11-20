const MODULUS = 2147483647;
const MULTIPLIER = 48271;

export type Rng = {
  readonly seed: number;
};

export type RandomIntResult = {
  value: number;
  rng: Rng;
};

// Creates the initial state for a repeatable random sequence.
export function createRng(seed: number): Rng {
  if (!Number.isSafeInteger(seed)) {
    throw new RangeError("Seed must be a safe integer");
  }

  const seedRange = MODULUS - 1;
  const remainder = seed % seedRange;
  const positiveSeed = remainder < 0 ? remainder + seedRange : remainder;

  return { seed: positiveSeed + 1 };
}

// Returns an inclusive random integer and the next generator state.
export function randomInt(rng: Rng, min: number, max: number): RandomIntResult {
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min > max) {
    throw new RangeError("Range bounds must be safe integers with min <= max");
  }

  if (!Number.isSafeInteger(rng.seed) || rng.seed < 1 || rng.seed >= MODULUS) {
    throw new RangeError("RNG state must be created with createRng");
  }

  const range = max - min + 1;
  if (!Number.isSafeInteger(range)) {
    throw new RangeError("Range must fit within safe integer precision");
  }

  const nextSeed = (rng.seed * MULTIPLIER) % MODULUS;
  const fraction = nextSeed / MODULUS;
  const value = min + Math.floor(fraction * range);

  return {
    value,
    rng: { seed: nextSeed },
  };
}
