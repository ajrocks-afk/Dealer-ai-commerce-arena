import { NextResponse } from "next/server";

import {
  persistence,
} from "@/services/persistence-instance";

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

export async function GET(
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

    const offers =
      persistence.getOffers(
        dealId
      );

    const approval =
      persistence.getHumanApproval(
        dealId
      );

    const audit =
      persistence.getAuditEvents(
        dealId
      );

    const paymentOrder =
      persistence.getRazorpayOrder(
        dealId
      );

    return NextResponse.json(
      {
        success: true,

        session,

        offers,

        approval:
          approval ?? null,

        audit,

        paymentOrder:
          paymentOrder ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Failed to retrieve deal:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to retrieve deal",
      },
      { status: 500 }
    );
  }
}