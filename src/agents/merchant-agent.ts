import type {
  AgentContext,
  AgentDecisionResult,
} from "@/agents/agent-types";

import {
  GeminiDecisionService,
  type GeminiService,
} from "@/services/gemini-service";

export class MerchantAgent {
  constructor(
    private readonly geminiService?: GeminiService
  ) {}

  decide(
    context: AgentContext
  ): AgentDecisionResult {
    const {
      round,
      maxRounds,
      currentPrice,
      initialPrice,
      previousOffers,
    } = context;

    if (round >= maxRounds) {
      return {
        agent: "MERCHANT_AGENT",
        decision: "ACCEPT",
        reasoning:
          "Maximum negotiation rounds reached. Merchant accepts the current price.",
      };
    }

    const lastBuyerOffer =
      [...previousOffers]
        .reverse()
        .find(
          (offer) =>
            offer.actor === "BUYER_AGENT"
        );

    if (!lastBuyerOffer) {
      return {
        agent: "MERCHANT_AGENT",
        decision: "MAKE_OFFER",
        offerPrice: currentPrice,
        quantity: 1,
        reasoning:
          "No buyer offer exists yet. Merchant maintains the current price.",
      };
    }

    const buyerPrice =
      lastBuyerOffer.price;

    const minimumAcceptablePrice =
      Math.round(initialPrice * 0.95);

    if (
      buyerPrice >=
      minimumAcceptablePrice
    ) {
      return {
        agent: "MERCHANT_AGENT",
        decision: "ACCEPT",
        reasoning:
          "The buyer's offer meets the merchant's acceptable price threshold.",
      };
    }

    const counterPrice =
      Math.round(
        (buyerPrice + currentPrice) / 2
      );

    if (counterPrice >= currentPrice) {
      return {
        agent: "MERCHANT_AGENT",
        decision: "ACCEPT",
        reasoning:
          "The current price is already acceptable to the merchant.",
      };
    }

    return {
      agent: "MERCHANT_AGENT",
      decision: "COUNTER",
      offerPrice: counterPrice,
      quantity: 1,
      reasoning:
        `Merchant counters with ₹${counterPrice} to protect the deal value.`,
    };
  }

  async decideWithAI(
    context: AgentContext
  ): Promise<AgentDecisionResult> {
    const service =
      this.geminiService ??
      new GeminiDecisionService();

    const decision =
      await service.generateDecision({
        ...context,
        agentRole: "MERCHANT_AGENT",
      });

    if (
      decision.agent !==
      "MERCHANT_AGENT"
    ) {
      throw new Error(
        "Gemini returned a decision for the wrong agent"
      );
    }

    return decision;
  }
}