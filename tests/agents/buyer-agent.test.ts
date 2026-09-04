import { describe, expect, it } from "vitest";

import {
  BuyerAgent,
} from "@/agents/buyer-agent";

import type {
  AgentContext,
} from "@/agents/agent-types";

import type {
  Offer,
} from "@/models/offer";

describe("BuyerAgent", () => {
  const previousOffers: Offer[] = [
    {
      id: "offer-001",
      dealSessionId: "deal-001",
      actor: "BUYER_AGENT",
      price: 4800000,
      quantity: 1,
      currency: "INR",
      status: "PENDING",
      round: 1,
      createdAt: "2026-08-24T00:00:00.000Z",
    },
  ];

  const context: AgentContext = {
    dealSessionId: "deal-001",

    round: 1,
    maxRounds: 5,

    currentPrice: 5000000,
    initialPrice: 5000000,

    currency: "INR",

    previousOffers,
  };

  it("creates a buyer offer", () => {
    const agent = new BuyerAgent();

    const result = agent.decide(context);

    expect(result.agent).toBe("BUYER_AGENT");
    expect(result.decision).toBe("MAKE_OFFER");
    expect(result.offerPrice).toBeDefined();
    expect(result.quantity).toBe(1);
    expect(result.reasoning).toBeTruthy();
  });

  it("never offers more than the current price", () => {
    const agent = new BuyerAgent();

    const result = agent.decide(context);

    expect(result.offerPrice).toBeLessThanOrEqual(
      context.currentPrice
    );
  });

  it("returns a valid positive offer price", () => {
    const agent = new BuyerAgent();

    const result = agent.decide(context);

    expect(result.offerPrice).toBeGreaterThan(0);
  });

  it("returns a valid quantity", () => {
    const agent = new BuyerAgent();

    const result = agent.decide(context);

    expect(result.quantity).toBeGreaterThan(0);
  });

  it("includes reasoning with the decision", () => {
    const agent = new BuyerAgent();

    const result = agent.decide(context);

    expect(typeof result.reasoning).toBe("string");
    expect(result.reasoning.length).toBeGreaterThan(0);
  });

  it("respects the negotiation round", () => {
    const agent = new BuyerAgent();

    const laterRoundContext: AgentContext = {
      ...context,
      round: 4,
    };

    const result = agent.decide(
      laterRoundContext
    );

    expect(result.agent).toBe("BUYER_AGENT");
    expect(result.offerPrice).toBeDefined();
  });

  it("handles a context with no previous offers", () => {
    const agent = new BuyerAgent();

    const freshContext: AgentContext = {
      ...context,
      previousOffers: [],
    };

    const result = agent.decide(freshContext);

    expect(result.agent).toBe("BUYER_AGENT");
    expect(result.decision).toBe("MAKE_OFFER");
    expect(result.offerPrice).toBeDefined();
  });
});