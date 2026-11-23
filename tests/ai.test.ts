import { describe, expect, it } from "vitest";
import { shouldRookieTakeCharge } from "../src/core/ai";

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
