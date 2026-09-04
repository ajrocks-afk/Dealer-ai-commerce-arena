import { describe, expect, it } from "vitest";

import {
  NegotiationEngine,
} from "@/engine/negotiation-engine";

import type { DealSession } from "@/models/deal-session";
import type { Offer } from "@/models/offer";
import type {
  PolicyEvaluationContext,
} from "@/engine/policy-types";

const session: DealSession = {
  id: "deal-001",

  productId: "prod-001",
  merchantId: "merchant-001",
  buyerId: "buyer-001",

  state: "CREATED",

  currentRound: 0,
  maxRounds: 5,

  currency: "INR",

  initialPrice: 5000000,
  currentPrice: 5000000,

  createdAt: "2026-08-23T00:00:00.000Z",
  updatedAt: "2026-08-23T00:00:00.000Z",
  expiresAt: "2026-08-24T00:00:00.000Z",
};

const offer: Offer = {
  id: "offer-001",

  dealSessionId: "deal-001",

  actor: "BUYER_AGENT",

  price: 4800000,

  quantity: 1,

  currency: "INR",

  status: "PENDING",

  round: 1,

  createdAt: "2026-08-23T00:00:00.000Z",
};

const policyContext: PolicyEvaluationContext = {
  product: {
    id: "prod-001",
    name: "Test Laptop",
    description: "Test product",
    category: "Electronics",
    currency: "INR",
    price: 5000000,
    inventory: {
      available: 10,
      reserved: 0,
    },
    status: "ACTIVE",
    merchantId: "merchant-001",
    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
  },

  policy: {
    id: "policy-001",
    merchantId: "merchant-001",
    currency: "INR",
    minimumSellingPrice: 4500000,
    maxDiscountPercent: 10,
    minimumMargin: 0,
    maxNegotiationRounds: 5,

    bundleRules: {
      allowed: false,
    },

    approval: {
      level: "NONE",
    },

    active: true,

    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
  },

  offer,

  currentRound: 0,
};

describe("Negotiation Engine", () => {
  it("processes a valid offer", () => {
    const engine = new NegotiationEngine();

    const result = engine.processOffer(
      session,
      offer,
      policyContext
    );

    expect(result.success).toBe(true);
    expect(result.decision).toBe("ALLOW");
    expect(result.session.state).toBe(
      "NEGOTIATING"
    );
    expect(result.session.currentPrice).toBe(
      4800000
    );
  });

  it("rejects an offer violating policy", () => {
    const engine = new NegotiationEngine();

    const invalidOffer: Offer = {
      ...offer,
      price: 4000000,
    };

    const invalidContext: PolicyEvaluationContext = {
      ...policyContext,
      offer: invalidOffer,
    };

    const result = engine.processOffer(
      session,
      invalidOffer,
      invalidContext
    );

    expect(result.success).toBe(false);
    expect(result.decision).toBe("REJECT");
    expect(result.session.state).toBe(
      "NEGOTIATING"
    );
  });

  it("records audit events", () => {
    const engine = new NegotiationEngine();

    engine.processOffer(
      session,
      offer,
      policyContext
    );

    const events =
      engine.getAuditTrail("deal-001");

    expect(events.length).toBeGreaterThanOrEqual(2);

    expect(
      events.some(
        (event) =>
          event.type === "POLICY_CHECKED"
      )
    ).toBe(true);

    expect(
      events.some(
        (event) =>
          event.type === "OFFER_CREATED"
      )
    ).toBe(true);
  });
});