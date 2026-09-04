import {
  describe,
  expect,
  it,
} from "vitest";

import { POST } from "@/app/api/deals/[dealId]/complete/route";

import {
  persistence,
} from "@/services/persistence-instance";

describe("Deal Completion API", () => {
  it("completes a PAID deal", async () => {
    const session = persistence.createDeal({
      id: "deal-complete-001",

      productId: "prod-001",
      merchantId: "merchant-001",
      buyerId: "buyer-001",

      state: "PAID",

      currentRound: 2,
      maxRounds: 5,

      currency: "INR",

      initialPrice: 5000000,
      currentPrice: 4800000,
      acceptedPrice: 4800000,

      createdAt:
        "2026-08-25T00:00:00.000Z",

      updatedAt:
        "2026-08-25T00:00:00.000Z",

      expiresAt:
        "2026-08-26T00:00:00.000Z",
    });

    const request = new Request(
      "http://localhost/api/deals/deal-complete-001/complete",
      {
        method: "POST",
      }
    );

    const response = await POST(
      request,
      {
        params: Promise.resolve({
          dealId: session.id,
        }),
      }
    );

    expect(response.status).toBe(200);

    const body =
      await response.json();

    expect(body.success).toBe(true);

    expect(
      body.session.state
    ).toBe("COMPLETED");

    expect(
      body.errors
    ).toEqual([]);
  });

  it("returns 404 for an unknown deal", async () => {
    const request = new Request(
      "http://localhost/api/deals/missing-deal/complete",
      {
        method: "POST",
      }
    );

    const response = await POST(
      request,
      {
        params: Promise.resolve({
          dealId: "missing-deal",
        }),
      }
    );

    expect(response.status).toBe(404);

    const body =
      await response.json();

    expect(body.success).toBe(false);

    expect(body.error).toBe(
      "Deal not found"
    );
  });

  it("rejects completion for a non-PAID deal", async () => {
    persistence.createDeal({
      id: "deal-complete-002",

      productId: "prod-001",
      merchantId: "merchant-001",
      buyerId: "buyer-001",

      state: "PAYMENT_PENDING",

      currentRound: 2,
      maxRounds: 5,

      currency: "INR",

      initialPrice: 5000000,
      currentPrice: 4800000,
      acceptedPrice: 4800000,

      createdAt:
        "2026-08-25T00:00:00.000Z",

      updatedAt:
        "2026-08-25T00:00:00.000Z",

      expiresAt:
        "2026-08-26T00:00:00.000Z",
    });

    const request = new Request(
      "http://localhost/api/deals/deal-complete-002/complete",
      {
        method: "POST",
      }
    );

    const response = await POST(
      request,
      {
        params: Promise.resolve({
          dealId: "deal-complete-002",
        }),
      }
    );

    expect(response.status).toBe(409);

    const body =
      await response.json();

    expect(body.success).toBe(false);

    expect(body.session.state).toBe(
      "PAYMENT_PENDING"
    );

    expect(body.error).toContain(
      "Invalid deal state transition"
    );
  });
});