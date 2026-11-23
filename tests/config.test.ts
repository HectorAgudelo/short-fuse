import { expect, it } from "vitest";
import {
  CHARGE_MAX,
  CHARGE_MIN,
  CODE_MAX,
  CODE_MIN,
  DECISION_TIMER_SECONDS,
  FUSE_SIZE,
  NORMAL_LOSS_SEGMENTS,
  PERFECT_DEFUSE_LOSS_SEGMENTS,
  ROOKIE_STOP_DISTANCE,
} from "../src/core/config";

it("defines the game code and charge ranges", () => {
  expect(CODE_MIN).toBe(21);
  expect(CODE_MAX).toBe(30);
  expect(CHARGE_MIN).toBe(1);
  expect(CHARGE_MAX).toBe(10);
});

it("defines the timer and fuse sizes", () => {
  expect(DECISION_TIMER_SECONDS).toBe(10);
  expect(FUSE_SIZE).toBe(3);
});

it("defines round loss and Rookie rule values", () => {
  expect(NORMAL_LOSS_SEGMENTS).toBe(1);
  expect(PERFECT_DEFUSE_LOSS_SEGMENTS).toBe(2);
  expect(ROOKIE_STOP_DISTANCE).toBe(4);
});
