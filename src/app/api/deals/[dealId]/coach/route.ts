import { NextResponse } from "next/server";

import type { AgentContext } from "@/agents/agent-types";
import type { Product } from "@/models/product";
import type { MerchantPolicy } from "@/models/merchant-policy";

import { DealCoachService } from "@/services/deal-coach-service";
import { persistence } from "@/services/persistence-instance";

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

const coachService = new DealCoachService();

export async function POST(
  _request: Request,
  routeContext: RouteContext
) {
  try {
    /*
     * STEP 1
     * Get the deal ID from the route.
     */

    const { dealId } =
      await routeContext.params;

    /*
     * STEP 2
     * Retrieve the existing deal.
     */

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
     * STEP 3
     * Retrieve offers belonging to
     * this exact deal.
     */

    const previousOffers =
      persistence.getOffers(dealId);

    /*
     * STEP 4
     * Build the same server-side
     * product information used by
     * the negotiation endpoint.
     */

    const now =
      new Date().toISOString();

    const product: Product = {
      id: session.productId,

      name: session.productId
        .split("-")
        .map(
          (word) =>
            word.charAt(0).toUpperCase() +
            word.slice(1)
        )
        .join(" "),

      description:
        "Product available through DEALER.",

      category: "Electronics",

      currency:
        session.currency,

      price:
        session.initialPrice,

      inventory: {
        available: 100,
        reserved: 0,
      },

      status: "ACTIVE",

      merchantId:
        session.merchantId,

      createdAt:
        session.createdAt,

      updatedAt:
        now,
    };

    /*
     * STEP 5
     * Build the merchant policy.
     *
     * These values mirror the current
     * negotiation route.
     */

    const policy: MerchantPolicy = {
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
        level: "NONE",
      },

      currency:
        session.currency,

      active: true,

      createdAt:
        session.createdAt,

      updatedAt:
        now,
    };

    /*
     * STEP 6
     * Create the AgentContext expected
     * by DealCoachService.
     */

    const agentContext: AgentContext = {
      dealSessionId:
        session.id,

      round:
        session.currentRound,

      maxRounds:
        session.maxRounds,

      currentPrice:
        session.currentPrice,

      initialPrice:
        session.initialPrice,

      currency:
        session.currency,

      previousOffers,

      productName:
        product.name,

      productPrice:
        product.price,

      minimumSellingPrice:
        policy.minimumSellingPrice,

      minimumMargin:
        policy.minimumMargin,

      maxDiscountPercent:
        policy.maxDiscountPercent,

      approvalThreshold:
        undefined,
    };

    /*
     * STEP 7
     * Analyze the current negotiation.
     *
     * This is deterministic.
     * No Gemini request happens here.
     */

    const analysis =
      coachService.analyze(
        agentContext
      );

    /*
     * STEP 8
     * Return the coach analysis.
     */

    return NextResponse.json(
      {
        success: true,

        analysis,

        session,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Failed to generate deal coach analysis:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to generate deal coach analysis",
      },
      {
        status: 500,
      }
    );
  }
}