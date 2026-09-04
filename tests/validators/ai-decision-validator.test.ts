import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateAIDecision,
} from "@/validators/ai-decision-validator";

describe(
  "AI Decision Validator",
  () => {
    it("accepts a valid MAKE_OFFER decision", () => {
      const result =
        validateAIDecision({
          agent: "BUYER_AGENT",
          decision: "MAKE_OFFER",
          offerPrice: 4800000,
          quantity: 1,
          reasoning:
            "Buyer proposes a reasonable price.",
        });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(
        result.decision?.decision
      ).toBe("MAKE_OFFER");
    });

    it("accepts a valid ACCEPT decision", () => {
      const result =
        validateAIDecision({
          agent: "MERCHANT_AGENT",
          decision: "ACCEPT",
          reasoning:
            "The offer meets merchant requirements.",
        });

      expect(result.valid).toBe(true);
      expect(result.decision?.decision).toBe(
        "ACCEPT"
      );
    });

    it("rejects a non-object response", () => {
      const result =
        validateAIDecision(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "AI decision must be an object"
      );
    });

    it("rejects an invalid agent", () => {
      const result =
        validateAIDecision({
          agent: "UNKNOWN_AGENT",
          decision: "ACCEPT",
          reasoning: "Test",
        });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Invalid or missing agent"
      );
    });

    it("rejects an invalid decision", () => {
      const result =
        validateAIDecision({
          agent: "BUYER_AGENT",
          decision: "DO_SOMETHING",
          reasoning: "Test",
        });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Invalid or missing decision"
      );
    });

    it("rejects missing reasoning", () => {
      const result =
        validateAIDecision({
          agent: "BUYER_AGENT",
          decision: "ACCEPT",
        });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Reasoning is required"
      );
    });

    it("rejects a negative offer price", () => {
      const result =
        validateAIDecision({
          agent: "BUYER_AGENT",
          decision: "MAKE_OFFER",
          offerPrice: -100,
          quantity: 1,
          reasoning: "Test",
        });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "offerPrice must be a positive number"
      );
    });

    it("rejects an invalid quantity", () => {
      const result =
        validateAIDecision({
          agent: "BUYER_AGENT",
          decision: "MAKE_OFFER",
          offerPrice: 4800000,
          quantity: 0,
          reasoning: "Test",
        });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "quantity must be a positive integer"
      );
    });

    it("rejects NaN offer prices", () => {
      const result =
        validateAIDecision({
          agent: "BUYER_AGENT",
          decision: "MAKE_OFFER",
          offerPrice: NaN,
          quantity: 1,
          reasoning: "Test",
        });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "offerPrice must be a positive number"
      );
    });
  }
);