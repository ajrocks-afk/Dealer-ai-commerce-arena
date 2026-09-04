import type {
  AgentContext,
  AgentDecisionResult,
} from "@/agents/agent-types";

import {
  GeminiDecisionService,
  type GeminiService,
} from "@/services/gemini-service";

export class BuyerAgent {
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
        agent: "BUYER_AGENT",
        decision: "ACCEPT",
        reasoning:
          "Maximum negotiation rounds reached. Buyer accepts the current price.",
      };
    }

    const lastBuyerOffer =
      [...previousOffers]
        .reverse()
        .find(
          (offer) =>
            offer.actor === "BUYER_AGENT"
        );

    if (lastBuyerOffer) {
      const previousPrice =
        lastBuyerOffer.price;

      if (currentPrice <= previousPrice) {
        return {
          agent: "BUYER_AGENT",
          decision: "ACCEPT",
          reasoning:
            "The current price is at or below the buyer's previous offer.",
        };
      }
    }

    const discountFactor =
      round === 1
        ? 0.9
        : 0.9 + round * 0.02;

    const proposedPrice =
      Math.round(
        Math.min(
          currentPrice,
          initialPrice * discountFactor
        )
      );

    if (proposedPrice >= currentPrice) {
      return {
        agent: "BUYER_AGENT",
        decision: "ACCEPT",
        reasoning:
          "The current price is acceptable to the buyer.",
      };
    }

    return {
      agent: "BUYER_AGENT",
      decision: "MAKE_OFFER",
      offerPrice: proposedPrice,
      quantity: 1,
      reasoning:
        `Buyer proposes ₹${proposedPrice} based on the current negotiation round.`,
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
        agentRole: "BUYER_AGENT",
      });

    if (
      decision.agent !==
      "BUYER_AGENT"
    ) {
      throw new Error(
        "Gemini returned a decision for the wrong agent"
      );
    }

    return decision;
  }
}