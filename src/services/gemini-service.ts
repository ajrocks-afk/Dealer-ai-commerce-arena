import {
  GoogleGenAI,
  Type,
} from "@google/genai";

import type {
  AgentContext,
  AgentDecisionResult,
} from "@/agents/agent-types";

export interface GeminiService {
  generateDecision(
    context: AgentContext
  ): Promise<AgentDecisionResult>;
}

export class GeminiDecisionService
  implements GeminiService
{
  private client?: GoogleGenAI;

  constructor() {}

  private getClient(): GoogleGenAI {
    if (this.client) {
      return this.client;
    }

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "Gemini AI provider is not configured"
      );
    }

    this.client =
      new GoogleGenAI({
        apiKey,
      });

    return this.client;
  }

  async generateDecision(
    context: AgentContext
  ): Promise<AgentDecisionResult> {
    const prompt =
      this.buildPrompt(context);

    console.log(
      "Gemini negotiation request"
    );

    try {
      const client = this.getClient();
      const response = 
        await this.getClient().models.generateContent(
          {
            model:
              "gemini-3.6-flash",

            contents:
              prompt,

            config: {
              responseMimeType:
                "application/json",

              responseSchema: {
                type: Type.OBJECT,

                properties: {
                  agent: {
                    type: Type.STRING,

                    enum: [
                      "BUYER_AGENT",
                      "MERCHANT_AGENT",
                    ],
                  },

                  decision: {
                    type: Type.STRING,

                    enum: [
                      "MAKE_OFFER",
                      "ACCEPT",
                      "REJECT",
                      "COUNTER",
                      "STOP",
                    ],
                  },

                  offerPrice: {
                    type: Type.NUMBER,
                  },

                  quantity: {
                    type: Type.NUMBER,
                  },

                  reasoning: {
                    type: Type.STRING,
                  },
                },

                required: [
                  "agent",
                  "decision",
                  "reasoning",
                ],
              },
            },
          }
        );

      const raw =
        response.text;

      if (
        typeof raw !== "string" ||
        raw.trim().length === 0
      ) {
        throw new Error(
          "Gemini returned an empty response"
        );
      }

      let parsed: unknown;

      try {
        parsed =
          JSON.parse(raw);
      } catch {
        throw new Error(
          "Gemini returned invalid JSON"
        );
      }

      return this.validateDecision(
        parsed,
        context
      );
    } catch (error) {
      console.error(
        "Gemini request failed:",
        error
      );

      throw new Error(
        this.getFriendlyError(error)
      );
    }
  }

  private validateDecision(
    value: unknown,
    context: AgentContext
  ): AgentDecisionResult {
    if (
      typeof value !== "object" ||
      value === null
    ) {
      throw new Error(
        "Gemini returned an invalid decision object"
      );
    }

    const result =
      value as Record<
        string,
        unknown
      >;

    if (
      result.agent !==
        "BUYER_AGENT" &&
      result.agent !==
        "MERCHANT_AGENT"
    ) {
      throw new Error(
        "Gemini returned an invalid agent"
      );
    }

    const validDecisions = [
      "MAKE_OFFER",
      "ACCEPT",
      "REJECT",
      "COUNTER",
      "STOP",
    ];

    if (
      typeof result.decision !==
        "string" ||
      !validDecisions.includes(
        result.decision
      )
    ) {
      throw new Error(
        "Gemini returned an invalid decision"
      );
    }

    if (
      typeof result.reasoning !==
        "string" ||
      result.reasoning.trim().length === 0
    ) {
      throw new Error(
        "Gemini returned no reasoning"
      );
    }

    const createsOffer =
      result.decision ===
        "MAKE_OFFER" ||
      result.decision ===
        "COUNTER";

    let offerPrice:
      | number
      | undefined;

    if (createsOffer) {
      if (
        typeof result.offerPrice !==
          "number" ||
        !Number.isFinite(
          result.offerPrice
        ) ||
        result.offerPrice <= 0
      ) {
        throw new Error(
          "Gemini must provide a valid offer price"
        );
      }

      offerPrice =
        this.normalizeOfferPrice(
          result.offerPrice,
          context
        );
    }

    let quantity:
      | number
      | undefined;

    if (
      result.quantity !==
      undefined
    ) {
      if (
        typeof result.quantity !==
          "number" ||
        !Number.isInteger(
          result.quantity
        ) ||
        result.quantity <= 0
      ) {
        throw new Error(
          "Gemini returned an invalid quantity"
        );
      }

      quantity =
        result.quantity;
    }

    return {
      agent:
        result.agent as
          | "BUYER_AGENT"
          | "MERCHANT_AGENT",

      decision:
        result.decision as
          | "MAKE_OFFER"
          | "ACCEPT"
          | "REJECT"
          | "COUNTER"
          | "STOP",

      offerPrice,

      quantity,

      reasoning:
        result.reasoning,
    };
  }

  private normalizeOfferPrice(
    proposedPrice: number,
    context: AgentContext
  ): number {
    let price =
      Math.round(
        proposedPrice
      );

    const minimumSellingPrice =
      context.minimumSellingPrice;

    const initialPrice =
      context.initialPrice;

    const maxDiscountPercent =
      context.maxDiscountPercent;

    let legalMinimum =
      initialPrice;

    if (
      typeof maxDiscountPercent ===
        "number" &&
      Number.isFinite(
        maxDiscountPercent
      )
    ) {
      const discountFloor =
        Math.round(
          initialPrice *
            (
              1 -
              maxDiscountPercent /
                100
            )
        );

      legalMinimum =
        Math.max(
          legalMinimum,
          discountFloor
        );
    }

    if (
      typeof minimumSellingPrice ===
        "number" &&
      Number.isFinite(
        minimumSellingPrice
      )
    ) {
      legalMinimum =
        Math.max(
          legalMinimum,
          minimumSellingPrice
        );
    }

    legalMinimum =
      Math.min(
        legalMinimum,
        initialPrice
      );

    if (
      price < legalMinimum
    ) {
      console.log(
        `Gemini offer adjusted from ₹${price} to ₹${legalMinimum}`
      );

      price =
        legalMinimum;
    }

    if (
      price > initialPrice
    ) {
      price =
        initialPrice;
    }

    return price;
  }

  private buildPrompt(
    context: AgentContext
  ): string {
    const role =
      context.agentRole ??
      "BUYER_AGENT";

    const previousOffers =
      context.previousOffers
        .map(
          (offer) =>
            `${offer.actor}: ₹${offer.price} x ${offer.quantity} (round ${offer.round})`
        )
        .join("\n");

    return `
You are ${role} inside DEALER,
an AI CommerceArena negotiation system.

You are an AI negotiation agent.

You propose decisions.

You DO NOT execute payments.

You DO NOT directly change transaction state.

The deterministic policy engine and state
machine are authoritative.

DEAL

Deal ID:
${context.dealSessionId}

Round:
${context.round}

Maximum rounds:
${context.maxRounds}

Product:
${context.productName ?? "Unknown"}

Initial price:
₹${context.initialPrice}

Current price:
₹${context.currentPrice}

Currency:
${context.currency}

Merchant minimum selling price:
₹${context.minimumSellingPrice ?? context.initialPrice}

Merchant maximum discount:
${context.maxDiscountPercent ?? 0}%

Previous offers:
${previousOffers || "No previous offers."}

ROLE

${
  role === "BUYER_AGENT"
    ? `
You are the BUYER.

Try to obtain the best legal price.

You must NEVER propose a price below the
merchant's legal minimum.

Accept a commercially reasonable price
when appropriate.
`
    : `
You are the MERCHANT.

Protect merchant economics.

Do not accept an unnecessarily low price.

Make reasonable counters when appropriate.
`
}

ALLOWED DECISIONS

MAKE_OFFER
COUNTER
ACCEPT
REJECT
STOP

RULES

1. Return exactly one decision.

2. MAKE_OFFER and COUNTER require
   offerPrice.

3. offerPrice must be positive.

4. Never propose a price below the merchant
   legal minimum.

5. Never claim payment was completed.

6. Never claim that you changed system state.

7. The deterministic policy engine is
   authoritative.

8. Keep reasoning concise.

9. Return ONLY JSON.

Return this structure:

{
  "agent": "${role}",
  "decision": "MAKE_OFFER",
  "offerPrice": 100000,
  "quantity": 1,
  "reasoning": "Concise explanation"
}
`;
  }

  private getFriendlyError(
    error: unknown
  ): string {
    if (
      typeof error === "object" &&
      error !== null
    ) {
      const candidate =
        error as {
          status?: unknown;
          code?: unknown;
          message?: unknown;
        };

      const status =
        typeof candidate.status ===
        "number"
          ? candidate.status
          : typeof candidate.code ===
            "number"
            ? candidate.code
            : undefined;

      if (status === 429) {
        return (
          "Gemini rate limit reached. Please try the negotiation again."
        );
      }

      if (status === 503) {
        return (
          "Gemini is temporarily unavailable. Please try the negotiation again."
        );
      }

      if (status === 504) {
        return (
          "Gemini request timed out. Please try the negotiation again."
        );
      }

      if (status === 401 ||
          status === 403) {
        return (
          "Gemini API authentication failed. Check GEMINI_API_KEY."
        );
      }

      if (
        typeof candidate.message ===
        "string"
      ) {
        return candidate.message;
      }
    }

    if (
      error instanceof Error
    ) {
      return error.message;
    }

    return (
      "Gemini failed to generate a negotiation decision."
    );
  }
}