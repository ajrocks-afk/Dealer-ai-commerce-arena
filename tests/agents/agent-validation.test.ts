import { describe, expect, it } from "vitest";

import {
  validateAgentDecision,
} from "@/validators/agent-validator";

import type {
  AgentDecisionResult,
} from "@/agents/agent-types";

describe("Agent Decision Validator", () => {
  it("accepts a valid offer decision", () => {
    const result: AgentDecisionResult = {
      agent: "BUYER_AGENT",
      decision: "MAKE_OFFER",
      offerPrice: 7400000,
      quantity: 1,
      reasoning:
        "Offer remains within the buyer's target range.",
    };

    const validation =
      validateAgentDecision(result);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("rejects an offer without a price", () => {
    const result: AgentDecisionResult = {
      agent: "BUYER_AGENT",
      decision: "MAKE_OFFER",
      quantity: 1,
      reasoning: "Attempting negotiation.",
    };

    const validation =
      validateAgentDecision(result);

    expect(validation.valid).toBe(false);

    expect(validation.errors).toContain(
      "Offer price must be greater than zero"
    );
  });

  it("rejects an offer without quantity", () => {
    const result: AgentDecisionResult = {
      agent: "BUYER_AGENT",
      decision: "MAKE_OFFER",
      offerPrice: 7400000,
      reasoning: "Attempting negotiation.",
    };

    const validation =
      validateAgentDecision(result);

    expect(validation.valid).toBe(false);

    expect(validation.errors).toContain(
      "Offer quantity must be greater than zero"
    );
  });

  it("requires reasoning", () => {
    const result: AgentDecisionResult = {
      agent: "BUYER_AGENT",
      decision: "STOP",
      reasoning: "",
    };

    const validation =
      validateAgentDecision(result);

    expect(validation.valid).toBe(false);

    expect(validation.errors).toContain(
      "Agent reasoning is required"
    );
  });

  it("allows a STOP decision without an offer", () => {
    const result: AgentDecisionResult = {
      agent: "MERCHANT_AGENT",
      decision: "STOP",
      reasoning:
        "Negotiation cannot continue within policy.",
    };

    const validation =
      validateAgentDecision(result);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
});