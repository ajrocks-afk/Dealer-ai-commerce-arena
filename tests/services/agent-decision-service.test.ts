import {
  describe,
  expect,
  it,
} from "vitest";

import {
  AgentDecisionService,
} from "@/services/agent-decision-service";

import type {
  AgentContext,
  AgentDecisionResult,
} from "@/agents/agent-types";

describe("AgentDecisionService", () => {
  const service =
    new AgentDecisionService();

  const context: AgentContext = {
    dealSessionId: "deal-test",
    round: 1,
    maxRounds: 5,
    currentPrice: 5000000,
    initialPrice: 5000000,
    currency: "INR",
    previousOffers: [],
  };

  it("accepts a valid MAKE_OFFER decision", () => {
    const decision: AgentDecisionResult = {
      agent: "BUYER_AGENT",
      decision: "MAKE_OFFER",
      offerPrice: 4500000,
      quantity: 1,
      reasoning: "Buyer wants a lower price",
    };

    const result =
      service.evaluate(
        context,
        decision
      );

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("accepts a valid ACCEPT decision", () => {
    const decision: AgentDecisionResult = {
      agent: "BUYER_AGENT",
      decision: "ACCEPT",
      reasoning: "Price is acceptable",
    };

    const result =
      service.evaluate(
        context,
        decision
      );

    expect(result.success).toBe(true);
  });

  it("rejects an invalid decision", () => {
    const decision =
      {
        agent: "BUYER_AGENT",
        decision: "MAKE_OFFER",
        reasoning: "",
      } as AgentDecisionResult;

    const result =
      service.evaluate(
        context,
        decision
      );

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(
      0
    );
  });

  it("rejects offers after maximum rounds", () => {
    const maxRoundContext: AgentContext = {
      ...context,
      round: 5,
      maxRounds: 5,
    };

    const decision: AgentDecisionResult = {
      agent: "BUYER_AGENT",
      decision: "COUNTER",
      offerPrice: 4500000,
      quantity: 1,
      reasoning: "Counter offer",
    };

    const result =
      service.evaluate(
        maxRoundContext,
        decision
      );

    expect(result.success).toBe(false);

    expect(result.errors).toContain(
      "Maximum negotiation rounds reached"
    );
  });

  it("rejects an invalid round", () => {
    const invalidContext: AgentContext = {
      ...context,
      round: 6,
      maxRounds: 5,
    };

    const decision: AgentDecisionResult = {
      agent: "BUYER_AGENT",
      decision: "ACCEPT",
      reasoning: "Accepting offer",
    };

    const result =
      service.evaluate(
        invalidContext,
        decision
      );

    expect(result.success).toBe(false);
  });
});