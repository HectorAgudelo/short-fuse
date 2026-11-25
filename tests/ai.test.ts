import { describe, expect, it } from "vitest";
import {
  AI_CHARGE_DELAY_SECONDS,
  AI_REVEAL_DELAY_SECONDS,
  CHARGE_MAX,
  CHARGE_MIN,
} from "../src/core/config";
import {
  advanceAiTurn,
  createAiTurnState,
  shouldRookieTakeCharge,
  takeAiCharge,
} from "../src/core/ai";
import { createRng, randomInt } from "../src/core/rng";
import { lockInPlayer, startRound } from "../src/core/round";
import { TAUNT_LINES, pickTaunt } from "../src/core/taunts";

describe("shouldRookieTakeCharge", () => {
  it("takes a charge when the AI is five or more below the code", () => {
    expect(shouldRookieTakeCharge(20, 27)).toBe(true);
    expect(shouldRookieTakeCharge(22, 27)).toBe(true);
  });

  it("stops when the AI is within four of the code", () => {
    expect(shouldRookieTakeCharge(23, 27)).toBe(false);
  });

  it("stops when the AI reaches the code exactly", () => {
    expect(shouldRookieTakeCharge(27, 27)).toBe(false);
  });
});

describe("advanceAiTurn", () => {
  it("does not advance or reveal the hidden charge during the player turn", () => {
    const round = startRound(createRng(12345));
    const aiTurn = createAiTurnState();

    const step = advanceAiTurn(aiTurn, round, AI_REVEAL_DELAY_SECONDS + 5);

    expect(step.hasChanged).toBe(false);
    expect(step.aiTurn.isHiddenChargeRevealed).toBe(false);
    expect(step.round).toEqual(round);
  });

  it("keeps the hidden charge concealed until the reveal pause finishes", () => {
    const round = lockInPlayer(startRound(createRng(12345)));
    const aiTurn = createAiTurnState();

    const step = advanceAiTurn(aiTurn, round, AI_REVEAL_DELAY_SECONDS / 2);

    expect(step.hasChanged).toBe(false);
    expect(step.aiTurn.isHiddenChargeRevealed).toBe(false);
    expect(step.round).toEqual(round);
  });

  it("reveals the hidden charge after the pause and stops when within four of the code", () => {
    const baseRound = lockInPlayer(startRound(createRng(12345)));
    const round = {
      ...baseRound,
      code: 27,
      aiCharges: [13, 10],
      aiTotal: 23,
    };

    const step = advanceAiTurn(
      createAiTurnState(),
      round,
      AI_REVEAL_DELAY_SECONDS,
    );

    expect(step.hasChanged).toBe(true);
    expect(step.aiTurn.isHiddenChargeRevealed).toBe(true);
    expect(step.aiTurn.currentTaunt).toBe("");
    expect(step.aiTurn.isTurnComplete).toBe(true);
    expect(step.round.aiCharges).toEqual([13, 10]);
  });

  it("takes charges one by one with a taunt after revealing", () => {
    const baseRound = lockInPlayer(startRound(createRng(12345)));
    const round = {
      ...baseRound,
      code: 30,
      aiCharges: [4, 5],
      aiTotal: 9,
    };
    const expectedCharge = randomInt(round.rng, CHARGE_MIN, CHARGE_MAX);
    const expectedTaunt = pickTaunt(expectedCharge.rng);

    const revealedStep = advanceAiTurn(
      createAiTurnState(),
      round,
      AI_REVEAL_DELAY_SECONDS,
    );
    expect(revealedStep.aiTurn.isHiddenChargeRevealed).toBe(true);
    expect(revealedStep.aiTurn.isTurnComplete).toBe(false);
    expect(revealedStep.round.aiCharges).toHaveLength(2);

    const halfDelayStep = advanceAiTurn(
      revealedStep.aiTurn,
      revealedStep.round,
      AI_CHARGE_DELAY_SECONDS / 2,
    );
    expect(halfDelayStep.hasChanged).toBe(false);
    expect(halfDelayStep.round.aiCharges).toHaveLength(2);

    const firstChargeStep = advanceAiTurn(
      halfDelayStep.aiTurn,
      halfDelayStep.round,
      AI_CHARGE_DELAY_SECONDS / 2,
    );
    expect(firstChargeStep.hasChanged).toBe(true);
    expect(firstChargeStep.round.aiCharges).toEqual([
      4,
      5,
      expectedCharge.value,
    ]);
    expect(firstChargeStep.round.aiTotal).toBe(9 + expectedCharge.value);
    expect(firstChargeStep.aiTurn.currentTaunt).toBe(expectedTaunt.taunt);
    expect(TAUNT_LINES).toContain(firstChargeStep.aiTurn.currentTaunt);
  });

  it("stops taking charges once Rookie reaches within four or overloads", () => {
    const baseRound = lockInPlayer(startRound(createRng(12345)));
    const nextCharge = randomInt(baseRound.rng, CHARGE_MIN, CHARGE_MAX);
    const round = {
      ...baseRound,
      code: 27,
      aiCharges: [12, 10],
      aiTotal: 22,
    };

    const revealedStep = advanceAiTurn(
      createAiTurnState(),
      round,
      AI_REVEAL_DELAY_SECONDS,
    );
    const chargeStep = advanceAiTurn(
      revealedStep.aiTurn,
      revealedStep.round,
      AI_CHARGE_DELAY_SECONDS,
    );

    expect(chargeStep.round.aiTotal).toBe(22 + nextCharge.value);
    expect(chargeStep.aiTurn.isTurnComplete).toBe(true);

    const extraStep = advanceAiTurn(
      chargeStep.aiTurn,
      chargeStep.round,
      AI_CHARGE_DELAY_SECONDS * 2,
    );
    expect(extraStep.hasChanged).toBe(false);
    expect(extraStep.round).toEqual(chargeStep.round);
  });

  it("replays the exact same AI charges and taunts for the same seed", () => {
    const firstRound = {
      ...lockInPlayer(startRound(createRng(54321))),
      code: 29,
      aiCharges: [5, 6],
      aiTotal: 11,
    };
    const secondRound = {
      ...lockInPlayer(startRound(createRng(54321))),
      code: 29,
      aiCharges: [5, 6],
      aiTotal: 11,
    };

    const firstResult = takeAiCharge(firstRound);
    const secondResult = takeAiCharge(secondRound);

    expect(firstResult).toEqual(secondResult);
  });

  it("does not mutate the round or AI turn state", () => {
    const round = {
      ...lockInPlayer(startRound(createRng(12345))),
      code: 28,
      aiCharges: [6, 7],
      aiTotal: 13,
    };
    const aiTurn = createAiTurnState();
    const originalRound = structuredClone(round);
    const originalAiTurn = structuredClone(aiTurn);

    const revealed = advanceAiTurn(aiTurn, round, AI_REVEAL_DELAY_SECONDS);
    advanceAiTurn(revealed.aiTurn, revealed.round, AI_CHARGE_DELAY_SECONDS);

    expect(round).toEqual(originalRound);
    expect(aiTurn).toEqual(originalAiTurn);
  });
});
