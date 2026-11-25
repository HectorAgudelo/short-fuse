import { describe, expect, it } from "vitest";
import {
  TICK_MAX_INTERVAL_SECONDS,
  TICK_MIN_INTERVAL_SECONDS,
} from "../src/core/config";
import { startMatch, type MatchState } from "../src/core/match";
import { createRng } from "../src/core/rng";
import { lockInPlayer, startRound } from "../src/core/round";
import {
  advanceTickTimer,
  createTickTimer,
  getRoundOutcomeCue,
  getTickIntervalSeconds,
} from "../src/core/sound";

describe("tick sound timing", () => {
  it("speeds up ticking as the player total gets closer to the code", () => {
    const farInterval = getTickIntervalSeconds(5, 25);
    const midInterval = getTickIntervalSeconds(15, 25);
    const nearInterval = getTickIntervalSeconds(23, 25);
    const exactInterval = getTickIntervalSeconds(25, 25);

    expect(farInterval).toBe(TICK_MAX_INTERVAL_SECONDS);
    expect(midInterval).toBeLessThan(farInterval);
    expect(nearInterval).toBeLessThan(midInterval);
    expect(exactInterval).toBe(TICK_MIN_INTERVAL_SECONDS);
  });

  it("plays a tick once the current interval elapses on the player turn", () => {
    const round = {
      ...startRound(createRng(12345)),
      code: 25,
      playerTotal: 15,
    };
    const interval = getTickIntervalSeconds(15, 25);
    const timer = createTickTimer(round);

    const halfStep = advanceTickTimer(timer, round, interval / 2);
    expect(halfStep.shouldPlayTick).toBe(false);

    const fullStep = advanceTickTimer(halfStep.timer, round, interval / 2);
    expect(fullStep.shouldPlayTick).toBe(true);
    expect(fullStep.timer.remainingSeconds).toBeCloseTo(interval);
  });

  it("does not tick when the player is locked in or overloaded", () => {
    const baseRound = startRound(createRng(12345));
    const lockedRound = lockInPlayer(baseRound);
    const overloadedRound = { ...baseRound, isPlayerOverloaded: true };
    const timer = createTickTimer(baseRound);

    expect(advanceTickTimer(timer, lockedRound, 2).shouldPlayTick).toBe(false);
    expect(advanceTickTimer(timer, overloadedRound, 2).shouldPlayTick).toBe(
      false,
    );
  });
});

describe("getRoundOutcomeCue", () => {
  it("plays the defuse sound and sparks the AI fuse on a normal player win", () => {
    const round = {
      ...lockInPlayer(startRound(createRng(12345))),
      code: 27,
      playerTotal: 25,
      aiTotal: 21,
    };
    const match = { ...startMatch(), aiFuse: 2 };

    expect(getRoundOutcomeCue(round, match)).toEqual({
      sound: "defuse",
      visualEffect: "spark",
      targetSide: "ai",
    });
  });

  it("plays the perfect-defuse sound when the player hits the code exactly", () => {
    const round = {
      ...lockInPlayer(startRound(createRng(12345))),
      code: 27,
      playerTotal: 27,
      aiTotal: 24,
    };
    const match = { ...startMatch(), aiFuse: 1 };

    expect(getRoundOutcomeCue(round, match)).toEqual({
      sound: "perfect-defuse",
      visualEffect: "spark",
      targetSide: "ai",
    });
  });

  it("plays the spark sound and sparks the player fuse on a lost round", () => {
    const round = {
      ...startRound(createRng(12345)),
      code: 24,
      playerTotal: 28,
      isPlayerOverloaded: true,
    };
    const match = { ...startMatch(), playerFuse: 2 };

    expect(getRoundOutcomeCue(round, match)).toEqual({
      sound: "spark",
      visualEffect: "spark",
      targetSide: "player",
    });
  });

  it("triggers an explosion on the loser's side when the match ends", () => {
    const round = {
      ...startRound(createRng(12345)),
      code: 24,
      playerTotal: 28,
      isPlayerOverloaded: true,
    };
    const playerLostMatch: MatchState = {
      playerFuse: 0,
      aiFuse: 3,
      isMatchOver: true,
      matchWinner: "ai",
    };
    const aiLostMatch: MatchState = {
      playerFuse: 2,
      aiFuse: 0,
      isMatchOver: true,
      matchWinner: "player",
    };

    expect(getRoundOutcomeCue(round, playerLostMatch)).toEqual({
      sound: "explosion",
      visualEffect: "explosion",
      targetSide: "player",
    });
    expect(getRoundOutcomeCue(round, aiLostMatch)).toEqual({
      sound: "explosion",
      visualEffect: "explosion",
      targetSide: "ai",
    });
  });

  it("returns no sound or visual effect on a tie", () => {
    const round = {
      ...lockInPlayer(startRound(createRng(12345))),
      code: 26,
      playerTotal: 22,
      aiTotal: 22,
    };

    expect(getRoundOutcomeCue(round, startMatch())).toEqual({
      sound: null,
      visualEffect: "none",
      targetSide: null,
    });
  });
});
