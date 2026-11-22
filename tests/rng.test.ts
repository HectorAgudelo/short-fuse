import { expect, it } from "vitest";
import { createRng, randomInt, type Rng } from "../src/core/rng";

function getSequence(seed: number): number[] {
  let rng: Rng = createRng(seed);
  const sequence: number[] = [];

  for (let index = 0; index < 20; index += 1) {
    const result = randomInt(rng, 1, 10);
    sequence.push(result.value);
    rng = result.rng;
  }

  return sequence;
}

it("produces the same sequence from the same seed", () => {
  expect(getSequence(12345)).toEqual(getSequence(12345));
});

it("keeps random integers within the inclusive range", () => {
  const sequence = getSequence(54321);

  for (const value of sequence) {
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(10);
  }
});

it("returns the bound when the minimum and maximum are equal", () => {
  const result = randomInt(createRng(12345), 7, 7);

  expect(result.value).toBe(7);
});
