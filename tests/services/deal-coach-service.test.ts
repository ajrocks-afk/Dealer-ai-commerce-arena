import { describe, expect, it } from "vitest";

import type { AgentContext } from "@/agents/agent-types";

import { DealCoachService } from "@/services/deal-coach-service";

function createContext(
  overrides: Partial<AgentContext> = {}
): AgentContext {
  return {
    dealSessionId: "deal-test",

    round: 2,

    maxRounds: 5,

    currentPrice: 120000,

    initialPrice: 120000,

    currency: "INR",

    previousOffers: [],

    agentRole: "BUYER_AGENT",

    productName: "Macbook Pro",

    productPrice: 120000,

    minimumSellingPrice: 96000,

    minimumMargin: 12000,

    maxDiscountPercent: 20,

    ...overrides,
  };
}

describe(
  "DealCoachService",
  () => {
    const service =
      new DealCoachService();

    it(
      "recommends a buyer counter when there is room to negotiate",
      () => {
        const result =
          service.analyze(
            createContext()
          );

        expect(
          result.recommendation
        ).toBe(
          "BUYER_COUNTER"
        );

        expect(
          result.suggestedPrice
        ).toBeDefined();

        expect(
          result.policySafe
        ).toBe(true);
      }
    );

    it(
      "detects a narrow buyer-merchant gap",
      () => {
        const result =
          service.analyze(
            createContext({
              previousOffers: [
                {
                  id: "offer-001",
                  dealSessionId:
                    "deal-test",
                  actor:
                    "BUYER_AGENT",
                  price: 116000,
                  quantity: 1,
                  currency: "INR",
                  status:
                    "PENDING",
                  round: 1,
                  createdAt:
                    new Date().toISOString(),
                },
                {
                  id: "offer-002",
                  dealSessionId:
                    "deal-test",
                  actor:
                    "MERCHANT_AGENT",
                  price: 117000,
                  quantity: 1,
                  currency: "INR",
                  status:
                    "PENDING",
                  round: 2,
                  createdAt:
                    new Date().toISOString(),
                },
              ],
            })
          );

        expect(
          result.recommendation
        ).toBe("ACCEPT");

        expect(
          result.risk
        ).toBe("LOW");

        expect(
          result.priceGap
        ).toBe(1000);
      }
    );

    it(
      "never recommends a policy-unsafe position",
      () => {
        const result =
          service.analyze(
            createContext({
              currentPrice:
                90000,
            })
          );

        expect(
          result.policySafe
        ).toBe(false);

        expect(
          result.recommendation
        ).toBe("STOP");

        expect(
          result.risk
        ).toBe("HIGH");
      }
    );

    it(
      "identifies negotiation pressure near the round limit",
      () => {
        const result =
          service.analyze(
            createContext({
              round: 4,
              maxRounds: 5,
            })
          );

        expect(
          result.factors.some(
            (factor) =>
              factor.includes(
                "round limit"
              )
          )
        ).toBe(true);
      }
    );

    it(
      "calculates buyer savings",
      () => {
        const result =
          service.analyze(
            createContext({
              currentPrice:
                108000,
            })
          );

        expect(
          result.estimatedSavings
        ).toBe(12000);

        expect(
          result.estimatedSavingsPercent
        ).toBe(10);
      }
    );
  }
);