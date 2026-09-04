import { NextResponse } from "next/server";

import type { Offer } from "@/models/offer";
import type { PolicyEvaluationContext } from "@/engine/policy-types";
import type { Product } from "@/models/product";
import type { MerchantPolicy } from "@/models/merchant-policy";

import {
  persistence,
} from "@/services/persistence-instance";

import {
  NegotiationEngine,
} from "@/engine/negotiation-engine";

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

const negotiationEngine =
  new NegotiationEngine();

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    /*
     * STEP 1
     * Resolve deal ID.
     */

    const { dealId } =
      await context.params;

    if (
      typeof dealId !== "string" ||
      dealId.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "dealId is required",
        },
        { status: 400 }
      );
    }

    /*
     * STEP 2
     * Load deal.
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
     * Reject offers for terminal deals.
     */

    if (
      session.state === "ACCEPTED" ||
      session.state === "REJECTED" ||
      session.state === "CANCELLED" ||
      session.state === "EXPIRED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Cannot submit an offer for a ${session.state.toLowerCase()} deal`,
        },
        { status: 409 }
      );
    }

    /*
     * STEP 4
     * Parse request body.
     */

    const body =
      await request.json();

    const {
      actor,
      price,
      quantity,
      round,
      product,
      policy,
    } = body;

    /*
     * STEP 5
     * Validate actor.
     */

    if (
      actor !== "BUYER_AGENT" &&
      actor !== "MERCHANT_AGENT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid offer actor",
        },
        { status: 400 }
      );
    }

    /*
     * STEP 6
     * Validate price.
     *
     * Keep this exact error message because
     * the API contract/tests expect it.
     */

    if (
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "price must be a positive number",
        },
        { status: 400 }
      );
    }

    /*
     * STEP 7
     * Validate quantity.
     */

    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "quantity must be a positive integer",
        },
        { status: 400 }
      );
    }

    /*
     * STEP 8
     * Validate negotiation round.
     */

    if (
      typeof round !== "number" ||
      !Number.isInteger(round) ||
      round <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "round must be a positive integer",
        },
        { status: 400 }
      );
    }

    if (
      round > session.maxRounds
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "round cannot exceed maximum negotiation rounds",
        },
        { status: 400 }
      );
    }

    /*
     * STEP 9
     * Product and policy are required
     * together.
     *
     * Do NOT perform ownership validation
     * here. The current API architecture
     * receives the policy context from the
     * caller and the negotiation engine is
     * responsible for evaluating it.
     */

    if (
      !product ||
      !policy
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "product and policy are required",
        },
        { status: 400 }
      );
    }

    /*
     * STEP 10
     * Treat the supplied objects as the
     * domain models used by the policy engine.
     */

    const typedProduct =
      product as Product;

    const typedPolicy =
      policy as MerchantPolicy;

    /*
     * STEP 11
     * Create offer.
     */

    const offer: Offer = {
      id:
        `offer-${crypto.randomUUID()}`,

      dealSessionId:
        dealId,

      actor,

      price,

      quantity,

      currency:
        "INR",

      status:
        "PENDING",

      round,

      createdAt:
        new Date().toISOString(),
    };

    /*
     * STEP 12
     * Build policy evaluation context.
     */

    const policyContext:
      PolicyEvaluationContext = {
      product:
        typedProduct,

      policy:
        typedPolicy,

      offer,

      currentRound:
        round,
    };

    /*
     * STEP 13
     * Send offer through the negotiation
     * engine.
     */

    const result =
      negotiationEngine.processOffer(
        session,
        offer,
        policyContext
      );

    /*
     * STEP 14
     * Negotiation/policy failure.
     *
     * These are business-level failures,
     * therefore return 422.
     */

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,

          decision:
            result.decision,

          session:
            result.session,

          offer:
            result.offer,

          errors:
            result.errors,
        },
        { status: 422 }
      );
    }

    /*
     * STEP 15
     * Persist updated deal.
     */

    persistence.updateDeal(
      result.session
    );

    /*
     * STEP 16
     * Persist successful offer.
     */

    persistence.createOffer(
      result.offer
    );

    /*
     * STEP 17
     * Return successful response.
     */

    return NextResponse.json(
      {
        success: true,

        decision:
          result.decision,

        session:
          result.session,

        offer:
          result.offer,

        errors: [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Failed to process offer:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to process offer",
      },
      { status: 500 }
    );
  }
}