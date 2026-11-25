import { describe, expect, it } from "vitest";
import {
  CHARGE_MAX,
  CHARGE_MIN,
  SHAKE_MAX_DURATION_MS,
  SHAKE_MAX_INTENSITY,
  SHAKE_MIN_DURATION_MS,
  SHAKE_MIN_INTENSITY,
} from "../src/core/config";
import { getChargeShake } from "../src/core/shake";

describe("getChargeShake", () => {
  it("uses the minimum shake values for the smallest charge", () => {
    const shake = getChargeShake(CHARGE_MIN);

    expect(shake).toEqual({
      durationMs: SHAKE_MIN_DURATION_MS,
      intensity: SHAKE_MIN_INTENSITY,
    });
    expect(shake.intensity).toBeGreaterThan(0);
    expect(shake.durationMs).toBeGreaterThan(0);
  });

  it("uses the maximum shake values for the largest charge", () => {
    const shake = getChargeShake(CHARGE_MAX);

    expect(shake).toEqual({
      durationMs: SHAKE_MAX_DURATION_MS,
      intensity: SHAKE_MAX_INTENSITY,
    });
  });

  it("shakes more strongly and longer as the charge increases", () => {
    for (let charge = CHARGE_MIN; charge < CHARGE_MAX; charge += 1) {
      const smallerShake = getChargeShake(charge);
      const biggerShake = getChargeShake(charge + 1);

      expect(biggerShake.intensity).toBeGreaterThan(smallerShake.intensity);
      expect(biggerShake.durationMs).toBeGreaterThan(smallerShake.durationMs);
    }
  });

  it("clamps charges outside the valid charge range", () => {
    expect(getChargeShake(0)).toEqual(getChargeShake(CHARGE_MIN));
    expect(getChargeShake(99)).toEqual(getChargeShake(CHARGE_MAX));
  });
});
