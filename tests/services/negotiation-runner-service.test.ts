import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";

import {
  NegotiationRunnerService,
} from "@/services/negotiation-runner-service";

import { BuyerAgent } from "@/agents/buyer-agent";
import { MerchantAgent } from "@/agents/merchant-agent";

import {
  NegotiationOrchestrator,
} from "@/orchestrator/negotiation-orchestrator";

import { persistence } from "@/services/persistence-instance";

import type { DealSession } from "@/models/deal-session";
import type { Product } from "@/models/product";
import type { MerchantPolicy } from "@/models/merchant-policy";

vi.mock("@/agents/buyer-agent");
vi.mock("@/agents/merchant-agent");
vi.mock("@/orchestrator/negotiation-orchestrator");
vi.mock("@/services/persistence-instance");

describe("NegotiationRunnerService", () => {
  let service: NegotiationRunnerService;

  let testSession: DealSession;
  let testProduct: Product;
  let testPolicy: MerchantPolicy;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(persistence).getOffers =
      vi.fn().mockReturnValue([]);

    vi.mocked(persistence).updateDeal =
      vi.fn();

    vi.mocked(persistence).createOffer =
      vi.fn();

    testSession = {
      id: "session-1",
      productId: "prod-1",
      merchantId: "merchant-1",
      buyerId: "buyer-1",
      state: "NEGOTIATING",
      currentRound: 0,
      maxRounds: 5,
      currency: "INR",
      initialPrice: 5500,
      currentPrice: 5000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + 60 * 60 * 1000
      ).toISOString(),
    };

    testProduct = {
      id: "prod-1",

      name: "Headphones",

      description:
        "Wireless noise-cancelling headphones",
 
      category: "Electronics",

      currency: "INR",

      price: 5500,

      inventory: {
        available: 10,
        reserved: 0,
      },

      status: "ACTIVE",

      merchantId: "merchant-1",

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString(),
    };

    testPolicy = {
      id: "policy-1",

      merchantId: "merchant-1",

      maxDiscountPercent: 10,

      minimumSellingPrice: 4500,

      minimumMargin: 650,

      maxNegotiationRounds: 5,

      bundleRules: {
        allowed: true,

        minimumQuantity: 1,

        additionalDiscountPercent: 5,
      },

      approval: {
        level: "HUMAN_REQUIRED",
 
        threshold: 4000,
      },

      currency: "INR",

      active: true,

      createdAt: new Date().toISOString(),

      updatedAt: new Date().toISOString(),
    };

    service = new NegotiationRunnerService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------
  // TEST 1
  // -------------------------------------------------------

  it("runs an autonomous negotiation", () => {
    vi.mocked(
      BuyerAgent.prototype.decide
    )
      .mockReturnValueOnce({
        agent: "BUYER_AGENT",
        decision: "MAKE_OFFER",
        offerPrice: 4500,
        quantity: 1,
        reasoning: "Want to negotiate down",
      })
      .mockReturnValueOnce({
        agent: "BUYER_AGENT",
        decision: "ACCEPT",
        reasoning: "Deal acceptable",
      });

    vi.mocked(
      MerchantAgent.prototype.decide
    ).mockReturnValueOnce({
      agent: "MERCHANT_AGENT",
      decision: "COUNTER",
      offerPrice: 4650,
      quantity: 1,
      reasoning: "Counter offer is acceptable",
    });

    vi.mocked(
      NegotiationOrchestrator.prototype
        .processAgentDecision
    ).mockImplementation(
      (session, decision, offer) => {
        if (decision.decision === "ACCEPT") {
          return {
            success: true,
            action: "ACCEPTED",
            session: {
              ...session,
              state: "ACCEPTED",
              currentPrice: 4650,
              updatedAt: new Date().toISOString(),
            },
            offer,
            errors: [],
          };
        }

        return {
          success: true,
          action: "PROCESSED_OFFER",
          session: {
            ...session,
            currentPrice:
              offer?.price ??
              session.currentPrice,
          },
          offer: offer!,
          errors: [],
        };
      }
    );

    const result = service.run(
      testSession,
      testProduct,
      testPolicy
    );

    expect(result.success).toBe(true);

    expect(result.session.state).toBe(
      "ACCEPTED"
    );

    expect(result.offers.length).toBe(2);

    expect(result.decisions.length).toBe(3);
  });

  // -------------------------------------------------------
  // TEST 2
  // -------------------------------------------------------

  it("records decisions made by agents", () => {
    vi.mocked(
      BuyerAgent.prototype.decide
    )
      .mockReturnValueOnce({
        agent: "BUYER_AGENT",
        decision: "MAKE_OFFER",
        offerPrice: 4500,
        quantity: 1,
        reasoning: "Starting with a lower offer",
      })
      .mockReturnValueOnce({
        agent: "BUYER_AGENT",
        decision: "ACCEPT",
        reasoning: "Merchant counter is acceptable",
      });

    vi.mocked(
      MerchantAgent.prototype.decide
    ).mockReturnValueOnce({
      agent: "MERCHANT_AGENT",
      decision: "COUNTER",
      offerPrice: 4650,
      quantity: 1,
      reasoning: "Offering a fair counter price",
    });

    vi.mocked(
      NegotiationOrchestrator.prototype
        .processAgentDecision
    ).mockImplementation(
      (session, decision, offer) => {
        if (decision.decision === "ACCEPT") {
          return {
            success: true,
            action: "ACCEPTED",
            session: {
              ...session,
              state: "ACCEPTED",
              currentPrice: 4650,
              updatedAt: new Date().toISOString(),
            },
            offer,
            errors: [],
          };
        }

        return {
          success: true,
          action: "PROCESSED_OFFER",
          session: {
            ...session,
          },
          offer: offer!,
          errors: [],
        };
      }
    );

    const result = service.run(
      testSession,
      testProduct,
      testPolicy
    );

    expect(
      result.decisions.length
    ).toBeGreaterThan(0);

    expect(
      result.decisions[0].agent
    ).toBe("BUYER_AGENT");

    expect(
      result.decisions[0].decision
    ).toBe("MAKE_OFFER");
  });

  // -------------------------------------------------------
  // TEST 3
  // -------------------------------------------------------

  it("does not exceed maximum rounds", () => {
    const sessionWith2Rounds: DealSession = {
      ...testSession,
      maxRounds: 2,
    };

    vi.mocked(
      BuyerAgent.prototype.decide
    ).mockReturnValue({
      agent: "BUYER_AGENT",
      decision: "COUNTER",
      offerPrice: 4500,
      quantity: 1,
      reasoning: "Continuing negotiation",
    });

    vi.mocked(
      MerchantAgent.prototype.decide
    ).mockReturnValue({
      agent: "MERCHANT_AGENT",
      decision: "COUNTER",
      offerPrice: 4600,
      quantity: 1,
      reasoning: "Maintaining a profitable price",
    });

    vi.mocked(
      NegotiationOrchestrator.prototype
        .processAgentDecision
    ).mockImplementation(
      (session, _decision, offer) => {
        return {
          success: true,
          action: "PROCESSED_OFFER",
          session,
          offer: offer!,
          errors: [],
        };
      }
    );

    const result = service.run(
      sessionWith2Rounds,
      testProduct,
      testPolicy
    );

    expect(
      result.session.currentRound
    ).toBeLessThanOrEqual(2);

    expect(
      result.session.state
    ).toBe("EXPIRED");
  });

  // -------------------------------------------------------
  // TEST 4
  // -------------------------------------------------------

  it(
    "ends in a terminal state or accepted state",
    () => {
      vi.mocked(
        BuyerAgent.prototype.decide
      )
        .mockReturnValueOnce({
          agent: "BUYER_AGENT",
          decision: "MAKE_OFFER",
          offerPrice: 4500,
          quantity: 1,
          reasoning: "Making an opening offer",
        })
        .mockReturnValueOnce({
          agent: "BUYER_AGENT",
          decision: "ACCEPT",
          reasoning: "Accepting the merchant counter",
        });

      vi.mocked(
        MerchantAgent.prototype.decide
      ).mockReturnValueOnce({
        agent: "MERCHANT_AGENT",
        decision: "COUNTER",
        offerPrice: 4650,
        quantity: 1,
        reasoning: "Countering the buyer offer",
      });

      vi.mocked(
        NegotiationOrchestrator.prototype
          .processAgentDecision
      ).mockImplementation(
        (session, decision, offer) => {
          /*
           * ACCEPT must return ACCEPTED.
           */
          if (
            decision.decision === "ACCEPT"
          ) {
            return {
              success: true,

              action: "ACCEPTED",

              session: {
                ...session,

                state: "ACCEPTED",

                currentPrice: 4650,

                updatedAt:
                  new Date().toISOString(),
              },

              offer,

              errors: [],
            };
          }

          /*
           * Normal MAKE_OFFER / COUNTER.
           */
          return {
            success: true,

            action: "PROCESSED_OFFER",

            session: {
              ...session,

              currentPrice:
                offer?.price ??
                session.currentPrice,
            },

            offer: offer!,

            errors: [],
          };
        }
      );

      const result = service.run(
        testSession,
        testProduct,
        testPolicy
      );

      expect([
        "ACCEPTED",
        "REJECTED",
        "CANCELLED",
        "EXPIRED",
      ]).toContain(
        result.session.state
      );

      expect(
        result.session.state
      ).not.toBe("NEGOTIATING");
    }
  );
});