import { NextResponse } from "next/server";

import { PaymentService } from "@/services/payment-service";

import {
  persistence,
} from "@/services/persistence-instance";

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

const paymentService =
  new PaymentService();

export async function POST(
  _request: Request,
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
     * Idempotency: if a server-created order already exists for this deal,
     * return it instead of creating a second Razorpay order.
     */
    const existingOrder =
      persistence.getRazorpayOrder(dealId);

    if (existingOrder) {
      return NextResponse.json(
        {
          success: true,
          session,
          order: existingOrder,
          keyId: process.env.RAZORPAY_KEY_ID ?? null,
          errors: [],
        },
        { status: 200 }
      );
    }

    /*
     * STEP 3
     * Move the accepted deal into
     * PAYMENT_PENDING.
     */

    const pendingResult =
      paymentService.markPaymentPending(
        session
      );

    if (!pendingResult.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            pendingResult.error ??
            "Unable to initiate payment",
          session:
            pendingResult.session,
        },
        { status: 409 }
      );
    }

    /*
     * STEP 4
     * Persist PAYMENT_PENDING state.
     */

    const pendingSession =
      persistence.updateDeal(
        pendingResult.session
      );

    /*
     * STEP 5
     * Create the Razorpay order.
     */

    const orderResult =
      await paymentService.createOrder(
        pendingSession
      );

    if (
      !orderResult.success ||
      !orderResult.order
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            orderResult.error ??
            "Unable to create payment order",
          session:
            pendingSession,
        },
        { status: 502 }
      );
    }

    /*
     * STEP 6
     * Persist the server-created Razorpay order.
     *
     * Verification must use this server-side record instead of trusting
     * order metadata supplied by the browser.
     */
    try {
      persistence.createRazorpayOrder(
        orderResult.order
      );
    } catch (error) {
      console.error(
        "Failed to persist Razorpay order:",
        error
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to persist payment order",
          session: pendingSession,
        },
        { status: 500 }
      );
    }

    /*
     * STEP 7
     * Return payment order and public Razorpay key.
     * The secret never leaves the server.
     */

    return NextResponse.json(
      {
        success: true,

        session:
          orderResult.session,

        order:
          orderResult.order,

        keyId:
          process.env.RAZORPAY_KEY_ID ?? null,

        errors: [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to create payment order:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create payment order",
      },
      { status: 500 }
    );
  }
}