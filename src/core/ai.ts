import { ROOKIE_STOP_DISTANCE } from "./config";

// Checks whether Rookie is still far enough below the code to take a charge.
export function shouldRookieTakeCharge(aiTotal: number, code: number): boolean {
  return code - aiTotal > ROOKIE_STOP_DISTANCE;
}
