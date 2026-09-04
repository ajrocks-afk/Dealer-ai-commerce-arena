import type { AgentContext } from "@/agents/agent-types";

import type {
  DealCoachAnalysis,
  DealCoachRecommendation,
  DealCoachRisk,
} from "@/models/deal-coach";

export class DealCoachService {
  analyze(
    context: AgentContext
  ): DealCoachAnalysis {
    const offers = context.previousOffers;

    const buyerOffers = offers.filter(
      (offer) =>
        offer.actor === "BUYER_AGENT"
    );

    const merchantOffers = offers.filter(
      (offer) =>
        offer.actor === "MERCHANT_AGENT"
    );

    const lastBuyerOffer =
      buyerOffers.at(-1)?.price;

    const lastMerchantOffer =
      merchantOffers.at(-1)?.price;

    const buyerOffer =
      lastBuyerOffer;

    const merchantOffer =
      lastMerchantOffer;

    const priceGap =
      buyerOffer !== undefined &&
      merchantOffer !== undefined
        ? Math.abs(
            merchantOffer -
              buyerOffer
          )
        : undefined;

    const currentPrice =
      context.currentPrice;

    const initialPrice =
      context.initialPrice;

    const estimatedSavings =
      Math.max(
        0,
        initialPrice -
          currentPrice
      );

    const estimatedSavingsPercent =
      initialPrice > 0
        ? Math.round(
            (estimatedSavings /
              initialPrice) *
              100
          )
        : 0;

    const legalMinimum =
      this.getLegalMinimum(context);

    const policySafe =
      currentPrice >=
      legalMinimum;

    let recommendation:
      DealCoachRecommendation =
      "CONTINUE";

    let risk:
      DealCoachRisk = "MEDIUM";

    let suggestedPrice:
      | number
      | undefined;

    const factors: string[] = [];

    if (!policySafe) {
      recommendation = "STOP";
      risk = "HIGH";

      factors.push(
        "Current price is below the configured legal minimum."
      );
    } else if (
      buyerOffer !== undefined &&
      merchantOffer !== undefined
    ) {
      const gap =
        Math.abs(
          merchantOffer -
            buyerOffer
        );

      const midpoint =
        Math.round(
          (buyerOffer +
            merchantOffer) /
            2
        );

      suggestedPrice =
        Math.max(
          legalMinimum,
          Math.min(
            initialPrice,
            midpoint
          )
        );

      if (gap <= initialPrice * 0.03) {
        recommendation =
          "ACCEPT";

        risk = "LOW";

        factors.push(
          "Buyer and merchant offers are within a narrow negotiation gap."
        );
      } else {
        recommendation =
          context.agentRole ===
          "BUYER_AGENT"
            ? "BUYER_COUNTER"
            : "MERCHANT_COUNTER";

        risk =
          gap <=
          initialPrice * 0.08
            ? "LOW"
            : "MEDIUM";

        factors.push(
          "Buyer and merchant still have a measurable price gap."
        );
      }
    } else if (
      context.agentRole ===
      "BUYER_AGENT"
    ) {
      recommendation =
        "BUYER_COUNTER";

      risk = "MEDIUM";

      suggestedPrice =
        Math.round(
          Math.min(
            currentPrice,
            initialPrice * 0.9
          )
        );

      factors.push(
        "Buyer has room to negotiate against the current price."
      );
    } else {
      recommendation =
        "MERCHANT_COUNTER";

      risk = "LOW";

      suggestedPrice =
        currentPrice;

      factors.push(
        "Merchant should protect the current transaction value until a stronger buyer offer appears."
      );
    }

    if (
      context.round >=
      context.maxRounds - 1
    ) {
      factors.push(
        "Negotiation is approaching the configured round limit."
      );

      if (risk === "LOW") {
        risk = "MEDIUM";
      }
    }

    if (
      estimatedSavingsPercent >=
      10
    ) {
      factors.push(
        `Buyer has already achieved approximately ${estimatedSavingsPercent}% savings from the initial price.`
      );
    }

    const reasoning =
      this.buildReasoning(
        recommendation,
        suggestedPrice,
        priceGap,
        risk
      );

    return {
      recommendation,

      risk,

      suggestedPrice,

      currentPrice,

      buyerOffer,

      merchantOffer,

      priceGap,

      estimatedSavings,

      estimatedSavingsPercent,

      reasoning,

      factors,

      policySafe,

      round:
        context.round,

      maxRounds:
        context.maxRounds,

      generatedAt:
        new Date().toISOString(),
    };
  }

  private getLegalMinimum(
    context: AgentContext
  ): number {
    let minimum =
      context.initialPrice;

    if (
      typeof context.maxDiscountPercent ===
        "number" &&
      Number.isFinite(
        context.maxDiscountPercent
      )
    ) {
      minimum =
        Math.max(
          0,
          Math.round(
            context.initialPrice *
              (1 -
                context.maxDiscountPercent /
                  100)
          )
        );
    }

    if (
      typeof context.minimumSellingPrice ===
        "number" &&
      Number.isFinite(
        context.minimumSellingPrice
      )
    ) {
      minimum =
        Math.max(
          minimum,
          context.minimumSellingPrice
        );
    }

    return Math.min(
      minimum,
      context.initialPrice
    );
  }

  private buildReasoning(
    recommendation: DealCoachRecommendation,
    suggestedPrice:
      | number
      | undefined,
    priceGap:
      | number
      | undefined,
    risk: DealCoachRisk
  ): string {
    if (
      recommendation ===
      "STOP"
    ) {
      return "The current negotiation position violates the configured legal pricing boundary.";
    }

    if (
      recommendation ===
        "ACCEPT"
    ) {
      return "The current buyer and merchant positions are close enough that accepting the negotiated value is commercially reasonable.";
    }

    if (
      recommendation ===
        "BUYER_COUNTER"
    ) {
      return suggestedPrice !==
        undefined
        ? `The buyer can continue negotiating with a controlled counter around ₹${suggestedPrice.toLocaleString(
            "en-IN"
          )}.`
        : "The buyer should continue negotiating while remaining within the configured policy.";
    }

    if (
      recommendation ===
        "MERCHANT_COUNTER"
    ) {
      return suggestedPrice !==
        undefined
        ? `The merchant should protect transaction value with a counter around ₹${suggestedPrice.toLocaleString(
            "en-IN"
          )}.`
        : "The merchant should continue negotiating while protecting its pricing policy.";
    }

    if (
      priceGap !==
      undefined
    ) {
      return `The negotiation should continue because the current price gap is ₹${priceGap.toLocaleString(
        "en-IN"
      )}. Risk is currently ${risk.toLowerCase()}.`;
    }

    return "The negotiation should continue while the agents gather a stronger price signal.";
  }
}