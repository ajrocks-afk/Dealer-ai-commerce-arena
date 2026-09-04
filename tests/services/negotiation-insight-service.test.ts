import {
  describe,
  expect,
  it,
} from "vitest";

import {
  NegotiationInsightService,
} from "@/services/negotiation-insight-service";

import type {
  DealSession,
} from "@/models/deal-session";

import type {
  Offer,
} from "@/models/offer";

import type {
  PolicyEvaluationContext,
} from "@/engine/policy-types";

import type {
  AgentDecisionResult,
} from "@/agents/agent-types";

const createSession = (
  state: DealSession["state"] = "NEGOTIATING"
): DealSession => ({
  id: "deal-001",

  productId: "prod-001",

  merchantId: "merchant-001",

  buyerId: "buyer-001",

  state,

  currentRound: 2,

  maxRounds: 5,

  currency: "INR",

  initialPrice: 5000000,

  currentPrice: 4800000,

  createdAt:
    new Date().toISOString(),

  updatedAt:
    new Date().toISOString(),

  expiresAt:
    new Date(
      Date.now() + 3600000
    ).toISOString(),
});

const offer: Offer = {
  id: "offer-001",

  dealSessionId: "deal-001",

  actor: "BUYER_AGENT",

  price: 4600000,

  quantity: 1,

  currency: "INR",

  status: "PENDING",

  round: 2,

  createdAt:
    new Date().toISOString(),
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

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),
  },

  policy: {
    id: "policy-001",

    merchantId: "merchant-001",

    maxDiscountPercent: 10,

    minimumSellingPrice: 4500000,

    minimumMargin: 0,

    maxNegotiationRounds: 5,

    bundleRules: {
      allowed: false,
    },

    approval: {
      level: "NONE",
    },

    currency: "INR",

    active: true,

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString(),
  },

  offer,

  currentRound: 2,
};

describe(
  "NegotiationInsightService",
  () => {
    const service =
      new NegotiationInsightService();

    it(
      "creates a successful insight for a valid offer",
      () => {
        const session =
          createSession();

        const decision: AgentDecisionResult = {
          agent: "BUYER_AGENT",

          decision: "MAKE_OFFER",

          offerPrice: 4600000,

          quantity: 1,

          reasoning:
            "Buyer proposes a reasonable price.",
        };

        const result =
          service.createInsight(
            session,
            decision,
            offer,
            policyContext
          );

        expect(result.actor).toBe(
          "BUYER_AGENT"
        );

        expect(result.action).toBe(
          "MAKE_OFFER"
        );

        expect(result.severity).toBe(
          "SUCCESS"
        );

        expect(
          result.policy.allowed
        ).toBe(true);

        expect(
          result.price?.proposed
        ).toBe(4600000);

        expect(
          result.price?.policyFloor
        ).toBe(4500000);

        expect(
          result.round.current
        ).toBe(2);

        expect(
          result.round.maximum
        ).toBe(5);

        expect(
          result.facts.length
        ).toBeGreaterThan(0);
      }
    );

    it(
      "identifies an offer below the merchant floor",
      () => {
        const session =
          createSession();

        const blockedOffer: Offer = {
          ...offer,

          price: 4000000,
        };

        const decision: AgentDecisionResult = {
          agent: "BUYER_AGENT",

          decision: "MAKE_OFFER",

          offerPrice: 4000000,

          quantity: 1,

          reasoning:
            "Buyer attempts a lower price.",
        };

        const result =
          service.createInsight(
            session,
            decision,
            blockedOffer,
            policyContext
          );

        expect(result.severity).toBe(
          "BLOCKED"
        );

        expect(
          result.policy.allowed
        ).toBe(false);

        expect(
          result.policy.reason
        ).toContain(
          "below the merchant minimum selling price"
        );

        expect(
          result.facts.some(
            (fact) =>
              fact.includes(
                "Policy floor violation"
              )
          )
        ).toBe(true);
      }
    );

    it(
      "explains an accept action without exposing raw reasoning",
      () => {
        const session =
          createSession(
            "POLICY_CHECK"
          );

        const decision: AgentDecisionResult = {
          agent: "MERCHANT_AGENT",

          decision: "ACCEPT",

          reasoning:
            "The merchant believes the offer is acceptable.",
        };

        const result =
          service.createInsight(
            session,
            decision,
            offer,
            policyContext
          );

        expect(result.action).toBe(
          "ACCEPT"
        );

        expect(result.title).toBe(
          "Deal accepted"
        );

        expect(
          result.facts.some(
            (fact) =>
              fact.includes(
                "state machine"
              )
          )
        ).toBe(true);

        /*
         * The service exposes a concise explanation,
         * not the agent's raw reasoning.
         */
        expect(
          result.summary
        ).not.toContain(
          decision.reasoning
        );
      }
    );

    it(
      "reports price movement relative to the current price",
      () => {
        const session =
          createSession();

        const decision: AgentDecisionResult = {
          agent: "BUYER_AGENT",

          decision: "COUNTER",

          offerPrice: 4700000,

          quantity: 1,

          reasoning:
            "Buyer counters the current price.",
        };

        const counterOffer: Offer = {
          ...offer,

          price: 4700000,
        };

        const result =
          service.createInsight(
            session,
            decision,
            counterOffer,
            policyContext
          );

        expect(
          result.facts.some(
            (fact) =>
              fact.includes(
                "Price movement"
              )
          )
        ).toBe(true);
      }
    );

    it(
      "creates a deterministic policy explanation for an offer",
      () => {
        const session =
          createSession(
            "POLICY_CHECK"
          );

        const decision: AgentDecisionResult = {
          agent: "MERCHANT_AGENT",

          decision: "ACCEPT",

          reasoning:
            "Merchant believes the offer satisfies policy.",
        };

        const result =
          service.createInsight(
            session,
            decision,
            offer,
            policyContext
          );

        expect(
          result.policy.evaluated
        ).toBe(true);

        expect(
          result.policy.allowed
        ).toBe(true);

        expect(
          result.facts.some(
            (fact) =>
              fact.includes(
                "deterministic"
              )
          )
        ).toBe(true);
      }
    );
  }
);