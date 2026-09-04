import { NextResponse } from "next/server";

import type { DealSession } from "@/models/deal-session";

import {
  persistence,
} from "@/services/persistence-instance";

export async function GET() {
  try {
    const deals = persistence.getAllDeals();

    return NextResponse.json({
      success: true,
      deals,
    });
  } catch (error) {
    console.error(
      "Failed to list deals:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve deals",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      productId,
      merchantId,
      buyerId,
      initialPrice,
      maxRounds,
    } = body;

    if (
      typeof productId !== "string" ||
      !productId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "productId is required",
        },
        { status: 400 }
      );
    }

    if (
      typeof merchantId !== "string" ||
      !merchantId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "merchantId is required",
        },
        { status: 400 }
      );
    }

    if (
      typeof buyerId !== "string" ||
      !buyerId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "buyerId is required",
        },
        { status: 400 }
      );
    }

    if (
      typeof initialPrice !== "number" ||
      !Number.isFinite(initialPrice) ||
      initialPrice <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "initialPrice must be a valid positive number",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const dealId =
      `deal-${crypto.randomUUID()}`;

    const deal: DealSession = {
      id: dealId,

      productId,

      merchantId,

      buyerId,

      initialPrice,

      currency: "INR",

      maxRounds:
        typeof maxRounds === "number" &&
        Number.isFinite(maxRounds) &&
        maxRounds > 0
          ? Math.floor(maxRounds)
          : 5,

      state: "CREATED",

      currentRound: 0,

      currentPrice: initialPrice,

      createdAt:
        now.toISOString(),

      updatedAt:
        now.toISOString(),

      expiresAt:
        new Date(
          now.getTime() +
            30 * 60 * 1000
        ).toISOString(),
    };

    persistence.createDeal(deal);

    return NextResponse.json(
      {
        success: true,
        session: deal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to create deal:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create deal",
      },
      { status: 500 }
    );
  }
}