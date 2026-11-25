import {
  CHARGE_MAX,
  CHARGE_MIN,
  SHAKE_MAX_DURATION_MS,
  SHAKE_MAX_INTENSITY,
  SHAKE_MIN_DURATION_MS,
  SHAKE_MIN_INTENSITY,
} from "./config";

export type ChargeShake = {
  durationMs: number;
  intensity: number;
};

// Calculates camera shake duration and intensity scaled to the charge size.
export function getChargeShake(charge: number): ChargeShake {
  const clampedCharge = Math.min(CHARGE_MAX, Math.max(CHARGE_MIN, charge));
  const scale = (clampedCharge - CHARGE_MIN) / (CHARGE_MAX - CHARGE_MIN);
  const durationMs = Math.round(
    SHAKE_MIN_DURATION_MS +
      scale * (SHAKE_MAX_DURATION_MS - SHAKE_MIN_DURATION_MS),
  );
  const intensity =
    SHAKE_MIN_INTENSITY + scale * (SHAKE_MAX_INTENSITY - SHAKE_MIN_INTENSITY);

  return {
    durationMs,
    intensity,
  };
}
