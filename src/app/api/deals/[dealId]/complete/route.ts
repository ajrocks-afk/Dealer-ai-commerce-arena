import { NextResponse } from "next/server";

import {
  PaymentService,
} from "@/services/payment-service";

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

    const result =
      paymentService.completeDeal(
        session
      );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.error ??
            "Unable to complete deal",
          session:
            result.session,
        },
        { status: 409 }
      );
    }

    const updatedSession =
      persistence.updateDeal(
        result.session
      );

    return NextResponse.json(
      {
        success: true,
        session:
          updatedSession,
        errors: [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Failed to complete deal:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to complete deal",
      },
      { status: 500 }
    );
  }
}