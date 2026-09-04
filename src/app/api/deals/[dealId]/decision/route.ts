import { NextResponse } from "next/server";

import type { AgentDecisionResult } from "@/agents/agent-types";
import type { Offer } from "@/models/offer";
import type { PolicyEvaluationContext } from "@/engine/policy-types";
import type { Product } from "@/models/product";

import {
  NegotiationOrchestrator,
} from "@/orchestrator/negotiation-orchestrator";

import {
  persistence,
} from "@/services/persistence-instance";

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

const orchestrator =
  new NegotiationOrchestrator();

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    /*
     * =========================================================
     * 1. GET DEAL
     * =========================================================
     */

    const { dealId } =
      await context.params;

    const session =
      persistence.getDeal(dealId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Deal not found",
        },
        { status: 404 }
      );
    }

    /*
     * =========================================================
     * 2. READ REQUEST
     * =========================================================
     */

    const body = await request.json();

    const {
      agent,
      decision,
      reasoning,
      offer,
    } = body;

    /*
     * =========================================================
     * 3. VALIDATE AGENT
     * =========================================================
     */

    if (
      agent !== "BUYER_AGENT" &&
      agent !== "MERCHANT_AGENT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid agent type",
        },
        { status: 400 }
      );
    }

    /*
     * =========================================================
     * 4. VALIDATE DECISION
     * =========================================================
     */

    const validDecisions = [
      "MAKE_OFFER",
      "ACCEPT",
      "REJECT",
      "COUNTER",
      "STOP",
    ] as const;

    if (
      !validDecisions.includes(decision)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid agent decision",
        },
        { status: 400 }
      );
    }

    /*
     * =========================================================
     * 5. VALIDATE REASONING
     * =========================================================
     */

    if (
      typeof reasoning !== "string" ||
      !reasoning.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Agent reasoning is required",
        },
        { status: 400 }
      );
    }

    /*
     * =========================================================
     * 6. BUILD AGENT DECISION
     * =========================================================
     */

    const agentDecision:
      AgentDecisionResult = {
      agent,
      decision,
      reasoning: reasoning.trim(),

      ...(typeof body.offerPrice ===
      "number"
        ? {
            offerPrice:
              body.offerPrice,
          }
        : {}),

      ...(typeof body.quantity ===
      "number"
        ? {
            quantity:
              body.quantity,
          }
        : {}),
    };

    /*
     * =========================================================
     * 7. DETERMINE WHETHER AN OFFER IS REQUIRED
     * =========================================================
     */

    const requiresOffer =
      decision === "MAKE_OFFER" ||
      decision === "COUNTER";

    /*
     * =========================================================
     * 8. BUILD INTERNAL OFFER
     * =========================================================
     */

    let internalOffer:
      | Offer
      | undefined;

    if (requiresOffer) {
      if (!offer) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Offer is required for this decision",
          },
          { status: 400 }
        );
      }

      if (
        typeof offer.price !== "number" ||
        !Number.isFinite(offer.price) ||
        offer.price <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A valid offer price is required",
          },
          { status: 400 }
        );
      }

      if (
        typeof offer.quantity !== "number" ||
        !Number.isFinite(offer.quantity) ||
        offer.quantity <= 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A valid offer quantity is required",
          },
          { status: 400 }
        );
      }

      internalOffer = {
        id:
          typeof offer.id === "string"
            ? offer.id
            : `offer-${crypto.randomUUID()}`,

        dealSessionId:
          dealId,

        actor:
          agent,

        price:
          offer.price,

        quantity:
          offer.quantity,

        currency:
          session.currency,

        status:
          "PENDING",

        round:
          typeof offer.round === "number"
            ? offer.round
            : session.currentRound + 1,

        createdAt:
          typeof offer.createdAt === "string"
            ? offer.createdAt
            : new Date().toISOString(),

        ...(typeof offer.expiresAt ===
        "string"
          ? {
              expiresAt:
                offer.expiresAt,
            }
          : {}),
      };
    }

    /*
     * =========================================================
     * 9. SAFE PRODUCT
     * =========================================================
     */

    const product: Product = {
      id: session.productId,

      name: session.productId
        .split("-")
        .map(
          (word: string) =>
           word.charAt(0).toUpperCase() +
           word.slice(1)
        )
        .join(" "),

      description:
       "Product available through DEALER.",

      category: "Electronics",

      currency: session.currency,

      price: session.initialPrice,

      inventory: {
        available: 100,
        reserved: 0,
      },

      status: "ACTIVE",

      merchantId: session.merchantId,

      createdAt: session.createdAt,

      updatedAt: session.updatedAt,
    };

    /*
     * =========================================================
     * 10. SAFE POLICY
     *
     * IMPORTANT:
     * approval MUST always exist.
     * =========================================================
     */

    const policy = {
      id:
        `policy-${dealId}`,

      merchantId:
        session.merchantId,

      maxDiscountPercent:
        20,

      minimumSellingPrice:
        Math.round(
          session.initialPrice * 0.8
        ),

      minimumMargin:
        Math.round(
          session.initialPrice * 0.1
        ),

      maxNegotiationRounds:
        session.maxRounds,

      bundleRules: {
        allowed: false,
      },

      approval: {
        level: "HUMAN_REQUIRED" as const,
        threshold:
          Math.round(
            session.initialPrice * 0.9
          ),
      },

      currency:
        session.currency,

      active:
        true,

      createdAt:
        session.createdAt,

      updatedAt:
        session.updatedAt,
    };

    /*
     * =========================================================
     * 11. FALLBACK OFFER
     * =========================================================
     */

    const fallbackOffer: Offer = {
      id:
        `offer-${crypto.randomUUID()}`,

      dealSessionId:
        dealId,

      actor:
        agent,

      price:
        session.currentPrice,

      quantity:
        1,

      currency:
        session.currency,

      status:
        "PENDING",

      round:
        session.currentRound,

      createdAt:
        new Date().toISOString(),
    };

    /*
     * =========================================================
     * 12. POLICY CONTEXT
     * =========================================================
     */

    const policyContext:
      PolicyEvaluationContext = {
      product,

      policy,

      offer:
        internalOffer ??
        fallbackOffer,

      currentRound:
        session.currentRound,
    };

    /*
     * =========================================================
     * 13. CREATED STATE GUARD
     * =========================================================
     */

    if (
      session.state === "CREATED" &&
      (
        decision === "ACCEPT" ||
        decision === "REJECT" ||
        decision === "STOP"
      )
    ) {
      return NextResponse.json(
        {
          success: false,

          action:
            decision,

          session,

          errors: [
            "Deal is still CREATED. Submit an offer first.",
          ],
        },
        { status: 422 }
      );
    }

    /*
     * =========================================================
     * 14. PROCESS DECISION
     * =========================================================
     */

    const result =
      orchestrator.processAgentDecision(
        session,
        agentDecision,
        internalOffer,
        policyContext
      );

    /*
     * =========================================================
     * 15. SUCCESSFUL STATE UPDATE
     * =========================================================
     */

    if (result.success) {
      persistence.updateDeal(
        result.session
      );

      if (result.offer) {
        try {
          persistence.createOffer(
            result.offer
          );
        } catch (error) {
          console.error(
            "Failed to persist offer:",
            error
          );
        }
      }
    }

    /*
     * =========================================================
     * 16. RETURN RESULT
     * =========================================================
     */

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          action:result.action,
          session:result.session,
          offer:result.offer,
          negotiationResult:result.negotiationResult,
          insight: result.insight,
          errors:result.errors?.length
              ? result.errors
              : [
                  "Agent decision was rejected by the negotiation engine.",
                ],
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        success: true,

        action:
          result.action,

        session:
          result.session,

        offer:
          result.offer,

        negotiationResult:
          result.negotiationResult,

        insight: result.insight,

        errors: [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "FAILED TO PROCESS AGENT DECISION:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : String(error),

        details:
          error instanceof Error
            ? error.stack
            : undefined,
      },
      { status: 500 }
    );
  }
}