import { NextResponse } from "next/server";

import type {
  Product,
} from "@/models/product";

import type {
  MerchantPolicy,
} from "@/models/merchant-policy";

import {
  NegotiationRunnerService,
} from "@/services/negotiation-runner-service";

import {
  persistence,
} from "@/services/persistence-instance";

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

const negotiationRunner =
  new NegotiationRunnerService();

export async function POST(
  _request: Request,
  context: RouteContext
) {
  try {
    /*
     * STEP 1
     * Get the deal ID.
     */

    const { dealId } =
      await context.params;

    /*
     * STEP 2
     * Retrieve the deal.
     */

    const session =
      persistence.getDeal(
        dealId
      );

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
     * Prevent negotiation on
     * completed deals.
     */

    if (
      session.state ===
        "ACCEPTED" ||
      session.state ===
        "REJECTED" ||
      session.state ===
        "CANCELLED" ||
      session.state ===
        "EXPIRED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Negotiation cannot continue for this deal",

          session,
        },
        { status: 409 }
      );
    }

    /*
     * STEP 4
     * Build the product and merchant policy from server-side deal data.
     *
     * The browser must not be allowed to rewrite merchant constraints.
     */
    const now = new Date().toISOString();

    const product: Product = {
      id: session.productId,
      name: session.productId
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      description: "Product available through DEALER.",
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
      updatedAt: now,
    };

    const policy: MerchantPolicy = {
      id: `policy-${dealId}`,
      merchantId: session.merchantId,
      maxDiscountPercent: 20,
      minimumSellingPrice: Math.round(session.initialPrice * 0.8),
      minimumMargin: Math.round(session.initialPrice * 0.1),
      maxNegotiationRounds: session.maxRounds,
      bundleRules: {
        allowed: false,
      },
      approval: {
        level: "NONE",
      },
      currency: session.currency,
      active: true,
      createdAt: session.createdAt,
      updatedAt: now,
    };

    /*
     * STEP 6
     * Run the complete autonomous
     * negotiation.
     */

    const result =
      await negotiationRunner.runWithAI(
        session,
        product as Product,
        policy as MerchantPolicy
      );

    /*
     * STEP 7
     * Return the complete
     * negotiation result.
     */

    return NextResponse.json(
      {
        success:
          result.success,

        session:
          result.session,

        offers:
          result.offers,

        decisions:
          result.decisions,

        errors:
          result.errors,
      },
      {
        status:
          result.success
            ? 200
            : 422,
      }
    );
  } catch (error) {
    console.error(
      "Failed to run negotiation:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to run negotiation",
      },
      { status: 500 }
    );
  }
}