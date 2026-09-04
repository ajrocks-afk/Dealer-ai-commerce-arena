import { NextResponse } from "next/server";

import {
  PaymentService,
} from "@/services/payment-service";

import {
  RazorpayService,
} from "@/services/razorpay-service";

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

const razorpayService =
  new RazorpayService();

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
     * Payment verification is only
     * allowed while payment is pending.
     */

    if (
      session.state !==
      "PAYMENT_PENDING"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Payment can only be verified when deal is PAYMENT_PENDING",
          session,
        },
        { status: 409 }
      );
    }

    /*
     * STEP 4
     * Parse verification request.
     */

    const body =
      await request.json();

    const {
      orderId,
      paymentId,
      signature,
    } = body;

    /*
     * STEP 6
     * Validate required Razorpay verification fields.
     */

    if (
      typeof orderId !== "string" ||
      orderId.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay order ID is required",
        },
        { status: 400 }
      );
    }

    if (
      typeof paymentId !== "string" ||
      paymentId.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay payment ID is required",
        },
        { status: 400 }
      );
    }

    if (
      typeof signature !== "string" ||
      signature.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay payment signature is required",
        },
        { status: 400 }
      );
    }

    /*
     * The browser is NOT trusted to tell us which order belongs to the deal.
     * Load the order created by our server.
     */
    const storedOrder =
      persistence.getRazorpayOrder(dealId);

    if (!storedOrder) {
      return NextResponse.json(
        {
          success: false,
          error: "No payment order exists for this deal",
          session,
        },
        { status: 409 }
      );
    }

    if (storedOrder.razorpayOrderId !== orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Razorpay order does not belong to this deal",
          session,
        },
        { status: 400 }
      );
    }

    const expectedAmount =
      session.acceptedPrice ?? session.currentPrice;

    if (storedOrder.amount !== expectedAmount) {
      return NextResponse.json(
        {
          success: false,
          error: "Stored payment amount does not match the accepted deal value",
          session,
        },
        { status: 409 }
      );
    }

    if (storedOrder.currency !== session.currency) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment currency does not match the deal",
          session,
        },
        { status: 409 }
      );
    }

    /*
     * STEP 7
     * Verify the Razorpay payment.
     */

    const verification =
      razorpayService.verifyPayment({
        orderId,
        paymentId,
        signature,
      });

    if (
      !verification.success
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            verification.error ??
            "Payment verification failed",
          session,
        },
        { status: 422 }
      );
    }

    /*
     * STEP 8
     * Mark the order as PAID.
     */

    const paidOrder =
      paymentService.updateOrderStatus(
        storedOrder,
        "PAID",
        paymentId
      );

    /*
     * STEP 9
     * Complete the payment on
     * the deal state machine.
     */

    persistence.updateRazorpayOrder(paidOrder);

    const completion =
      paymentService.completePayment(
        session,
        paidOrder
      );

    if (
      !completion.success
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            completion.error ??
            "Unable to complete payment",
          session:
            completion.session,
          order:
            paidOrder,
        },
        { status: 422 }
      );
    }

    /*
     * STEP 10
     * Persist the PAID deal.
     */

    const updatedSession =
      persistence.updateDeal(
        completion.session
      );

    /*
     * STEP 11
     * Return successful payment
     * verification result.
     */

    return NextResponse.json(
      {
        success: true,

        session:
          updatedSession,

        order:
          paidOrder,

        errors: [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Failed to verify payment:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to verify payment",
      },
      { status: 500 }
    );
  }
}