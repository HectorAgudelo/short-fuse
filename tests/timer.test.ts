import { describe, expect, it } from "vitest";
import {
  CHARGE_MAX,
  CHARGE_MIN,
  DECISION_TIMER_SECONDS,
  DECISION_TIMER_WARNING_SECONDS,
} from "../src/core/config";
import { createRng, randomInt } from "../src/core/rng";
import { lockInPlayer, startRound, takePlayerCharge } from "../src/core/round";
import {
  advanceDecisionTimer,
  createDecisionTimer,
  getTimerProgress,
  shouldShowTimerWarning,
  stopDecisionTimer,
} from "../src/core/timer";

describe("decision timer", () => {
  it("starts the decision timer at 10 seconds and running", () => {
    const timer = createDecisionTimer();

    expect(DECISION_TIMER_WARNING_SECONDS).toBe(3);
    expect(timer).toEqual({
      remainingSeconds: DECISION_TIMER_SECONDS,
      isRunning: true,
    });
    expect(getTimerProgress(timer)).toBe(1);
  });

  it("counts down remaining seconds during the player turn", () => {
    const round = startRound(createRng(12345));
    const timer = createDecisionTimer();

    const step = advanceDecisionTimer(timer, round, 4);

    expect(step.hasExpired).toBe(false);
    expect(step.round).toEqual(round);
    expect(step.timer).toEqual({
      remainingSeconds: 6,
      isRunning: true,
    });
    expect(getTimerProgress(step.timer)).toBeCloseTo(0.6);
  });

  it("shows the warning state in the last 3 seconds", () => {
    expect(
      shouldShowTimerWarning({ remainingSeconds: 3.1, isRunning: true }),
    ).toBe(false);
    expect(
      shouldShowTimerWarning({ remainingSeconds: 3, isRunning: true }),
    ).toBe(true);
    expect(
      shouldShowTimerWarning({ remainingSeconds: 0.5, isRunning: true }),
    ).toBe(true);
  });

  it("automatically takes a player charge and resets to 10 seconds when time runs out", () => {
    const dealtRound = startRound(createRng(12345));
    const nextCharge = randomInt(dealtRound.rng, CHARGE_MIN, CHARGE_MAX);
    const round = {
      ...dealtRound,
      code: dealtRound.playerTotal + nextCharge.value + 2,
    };
    const timer = createDecisionTimer();

    const step = advanceDecisionTimer(timer, round, DECISION_TIMER_SECONDS);

    expect(step.hasExpired).toBe(true);
    expect(step.round).toEqual(takePlayerCharge(round));
    expect(step.timer).toEqual({
      remainingSeconds: DECISION_TIMER_SECONDS,
      isRunning: true,
    });
  });

  it("stops at 0 when the automatic charge overloads the player", () => {
    const dealtRound = startRound(createRng(12345));
    const nextCharge = randomInt(dealtRound.rng, CHARGE_MIN, CHARGE_MAX);
    const round = {
      ...dealtRound,
      code: dealtRound.playerTotal + nextCharge.value - 1,
    };
    const timer = createDecisionTimer();

    const step = advanceDecisionTimer(timer, round, DECISION_TIMER_SECONDS);

    expect(step.hasExpired).toBe(true);
    expect(step.round.isPlayerOverloaded).toBe(true);
    expect(step.timer).toEqual({
      remainingSeconds: 0,
      isRunning: false,
    });
    expect(getTimerProgress(step.timer)).toBe(0);
  });

  it("does not count down or take a charge after the player locks in", () => {
    const lockedRound = lockInPlayer(startRound(createRng(12345)));
    const timer = createDecisionTimer();

    const step = advanceDecisionTimer(
      timer,
      lockedRound,
      DECISION_TIMER_SECONDS,
    );

    expect(step.hasExpired).toBe(false);
    expect(step.round).toEqual(lockedRound);
    expect(step.timer.isRunning).toBe(false);
  });

  it("does not count down when the timer is stopped", () => {
    const round = startRound(createRng(12345));
    const stoppedTimer = stopDecisionTimer(createDecisionTimer());

    const step = advanceDecisionTimer(stoppedTimer, round, 5);

    expect(step.hasExpired).toBe(false);
    expect(step.round).toEqual(round);
    expect(step.timer).toEqual({
      remainingSeconds: DECISION_TIMER_SECONDS,
      isRunning: false,
    });
  });

  it("does not mutate the timer or round state when advancing", () => {
    const round = startRound(createRng(12345));
    const timer = createDecisionTimer();
    const originalRound = structuredClone(round);
    const originalTimer = structuredClone(timer);

    advanceDecisionTimer(timer, round, DECISION_TIMER_SECONDS);

    expect(round).toEqual(originalRound);
    expect(timer).toEqual(originalTimer);
  });
});
