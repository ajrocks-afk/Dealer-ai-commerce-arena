import { describe, expect, it } from "vitest";

import {
  MerchantAgent,
} from "@/agents/merchant-agent";

import type {
  AgentContext,
} from "@/agents/agent-types";

import type {
  Offer,
} from "@/models/offer";

describe("MerchantAgent", () => {
  const buyerOffer: Offer = {
    id: "offer-001",
    dealSessionId: "deal-001",
    actor: "BUYER_AGENT",
    price: 4800000,
    quantity: 1,
    currency: "INR",
    status: "PENDING",
    round: 1,
    createdAt: "2026-08-24T00:00:00.000Z",
  };

  const context: AgentContext = {
    dealSessionId: "deal-001",

    round: 1,
    maxRounds: 5,

    currentPrice: 5000000,
    initialPrice: 5000000,

    currency: "INR",

    previousOffers: [buyerOffer],
  };

  it("accepts a buyer offer that meets the merchant threshold", () => {
    const agent = new MerchantAgent();

    const result = agent.decide(context);

    expect(result.agent).toBe("MERCHANT_AGENT");
    expect(result.decision).toBe("ACCEPT");
    expect(result.reasoning).toBeTruthy();
  });

  it("counters a buyer offer below the acceptable threshold", () => {
    const agent = new MerchantAgent();

    const lowOffer: Offer = {
      ...buyerOffer,
      price: 4000000,
    };

    const lowOfferContext: AgentContext = {
      ...context,
      previousOffers: [lowOffer],
    };

    const result = agent.decide(lowOfferContext);

    expect(result.agent).toBe("MERCHANT_AGENT");
    expect(result.decision).toBe("COUNTER");
    expect(result.offerPrice).toBeDefined();
    expect(result.quantity).toBe(1);
  });

  it("does not counter above the current price", () => {
    const agent = new MerchantAgent();

    const lowOffer: Offer = {
      ...buyerOffer,
      price: 4000000,
    };

    const lowOfferContext: AgentContext = {
      ...context,
      previousOffers: [lowOffer],
    };

    const result = agent.decide(lowOfferContext);

    expect(result.offerPrice).toBeLessThanOrEqual(
      context.currentPrice
    );
  });

  it("maintains the current price when there is no buyer offer", () => {
    const agent = new MerchantAgent();

    const freshContext: AgentContext = {
      ...context,
      previousOffers: [],
    };

    const result = agent.decide(freshContext);

    expect(result.agent).toBe("MERCHANT_AGENT");
    expect(result.decision).toBe("MAKE_OFFER");
    expect(result.offerPrice).toBe(
      context.currentPrice
    );
    expect(result.quantity).toBe(1);
  });

  it("accepts the current price in the final round", () => {
    const agent = new MerchantAgent();

    const finalRoundContext: AgentContext = {
      ...context,
      round: 5,
    };

    const result = agent.decide(finalRoundContext);

    expect(result.agent).toBe("MERCHANT_AGENT");
    expect(result.decision).toBe("ACCEPT");
    expect(result.offerPrice).toBeUndefined();
  });

  it("returns reasoning for every decision", () => {
    const agent = new MerchantAgent();

    const result = agent.decide(context);

    expect(typeof result.reasoning).toBe("string");
    expect(result.reasoning.length).toBeGreaterThan(0);
  });

  it("uses the latest buyer offer", () => {
    const agent = new MerchantAgent();

    const earlierOffer: Offer = {
      ...buyerOffer,
      id: "offer-000",
      price: 4900000,
    };

    const latestOffer: Offer = {
      ...buyerOffer,
      id: "offer-002",
      price: 4000000,
    };

    const multipleOfferContext: AgentContext = {
      ...context,
      previousOffers: [
        earlierOffer,
        latestOffer,
      ],
    };

    const result = agent.decide(
      multipleOfferContext
    );

    expect(result.agent).toBe("MERCHANT_AGENT");
    expect(result.decision).toBe("COUNTER");
    expect(result.offerPrice).toBeDefined();
  });
});