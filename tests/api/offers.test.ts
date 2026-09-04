import {
  describe,
  expect,
  it,
} from "vitest";

import {
  POST as createDeal,
} from "@/app/api/deals/route";

import {
  POST as createOffer,
} from "@/app/api/deals/[dealId]/offers/route";

const createTestDeal = async () => {
  const request = new Request(
    "http://localhost/api/deals",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: `prod-${crypto.randomUUID()}`,
        merchantId: `merchant-${crypto.randomUUID()}`,
        buyerId: `buyer-${crypto.randomUUID()}`,
        initialPrice: 5000000,
        currency: "INR",
        maxRounds: 5,
      }),
    }
  );

  const response =
    await createDeal(request);

  const data = await response.json();

  return data.session.id as string;
};

const createValidProduct = () => ({
  id: `prod-${crypto.randomUUID()}`,

  name: "Test Laptop",

  description: "Test product",

  category: "Electronics",

  currency: "INR",

  price: 5000000,

  inventory: {
    available: 10,
    reserved: 0,
  },

  status: "ACTIVE",

  merchantId: "merchant-001",

  createdAt: new Date().toISOString(),

  updatedAt: new Date().toISOString(),
});

const createValidPolicy = () => ({
  id: `policy-${crypto.randomUUID()}`,

  merchantId: "merchant-001",

  maxDiscountPercent: 10,

  minimumSellingPrice: 4500000,

  minimumMargin: 0,

  maxNegotiationRounds: 5,

  bundleRules: {
    allowed: false,
  },

  approval: {
    level: "NONE",
  },

  currency: "INR",

  active: true,

  createdAt: new Date().toISOString(),

  updatedAt: new Date().toISOString(),
});

describe("Offers API", () => {
  it("creates a valid offer", async () => {
    const dealId =
      await createTestDeal();

    const request = new Request(
      `http://localhost/api/deals/${dealId}/offers`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          actor: "BUYER_AGENT",

          price: 4800000,

          quantity: 1,

          round: 1,

          product:
            createValidProduct(),

          policy:
            createValidPolicy(),
        }),
      }
    );

    const response =
      await createOffer(
        request,
        {
          params: Promise.resolve({
            dealId,
          }),
        }
      );

    expect(response.status).toBe(200);

    const data =
      await response.json();

    expect(data.success).toBe(true);

    expect(data.decision).toBe(
      "ALLOW"
    );

    expect(data.session).toBeDefined();

    expect(data.session.state).toBe(
      "NEGOTIATING"
    );

    expect(data.offer).toBeDefined();

    expect(data.offer.actor).toBe(
      "BUYER_AGENT"
    );

    expect(data.offer.price).toBe(
      4800000
    );

    expect(data.errors).toHaveLength(0);
  });

  it("returns 404 for an unknown deal", async () => {
    const dealId =
      `missing-${crypto.randomUUID()}`;

    const request = new Request(
      `http://localhost/api/deals/${dealId}/offers`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          actor: "BUYER_AGENT",

          price: 4800000,

          quantity: 1,

          round: 1,

          product:
            createValidProduct(),

          policy:
            createValidPolicy(),
        }),
      }
    );

    const response =
      await createOffer(
        request,
        {
          params: Promise.resolve({
            dealId,
          }),
        }
      );

    expect(response.status).toBe(404);

    const data =
      await response.json();

    expect(data.success).toBe(false);

    expect(data.error).toBe(
      "Deal not found"
    );
  });

  it("rejects an invalid offer actor", async () => {
    const dealId =
      await createTestDeal();

    const request = new Request(
      `http://localhost/api/deals/${dealId}/offers`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          actor: "INVALID_AGENT",

          price: 4800000,

          quantity: 1,

          round: 1,

          product:
            createValidProduct(),

          policy:
            createValidPolicy(),
        }),
      }
    );

    const response =
      await createOffer(
        request,
        {
          params: Promise.resolve({
            dealId,
          }),
        }
      );

    expect(response.status).toBe(400);

    const data =
      await response.json();

    expect(data.success).toBe(false);

    expect(data.error).toBe(
      "Invalid offer actor"
    );
  });

  it("rejects a non-positive price", async () => {
    const dealId =
      await createTestDeal();

    const request = new Request(
      `http://localhost/api/deals/${dealId}/offers`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          actor: "BUYER_AGENT",

          price: 0,

          quantity: 1,

          round: 1,

          product:
            createValidProduct(),

          policy:
            createValidPolicy(),
        }),
      }
    );

    const response =
      await createOffer(
        request,
        {
          params: Promise.resolve({
            dealId,
          }),
        }
      );

    expect(response.status).toBe(400);
  });

  it("rejects an invalid quantity", async () => {
    const dealId =
      await createTestDeal();

    const request = new Request(
      `http://localhost/api/deals/${dealId}/offers`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          actor: "BUYER_AGENT",

          price: 4800000,

          quantity: 0,

          round: 1,

          product:
            createValidProduct(),

          policy:
            createValidPolicy(),
        }),
      }
    );

    const response =
      await createOffer(
        request,
        {
          params: Promise.resolve({
            dealId,
          }),
        }
      );

    expect(response.status).toBe(400);
  });

  it("rejects an invalid round", async () => {
    const dealId =
      await createTestDeal();

    const request = new Request(
      `http://localhost/api/deals/${dealId}/offers`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          actor: "BUYER_AGENT",

          price: 4800000,

          quantity: 1,

          round: 0,

          product:
            createValidProduct(),

          policy:
            createValidPolicy(),
        }),
      }
    );

    const response =
      await createOffer(
        request,
        {
          params: Promise.resolve({
            dealId,
          }),
        }
      );

    expect(response.status).toBe(400);
  });

  it("rejects an offer when product or policy is missing", async () => {
    const dealId =
      await createTestDeal();

    const request = new Request(
      `http://localhost/api/deals/${dealId}/offers`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          actor: "BUYER_AGENT",

          price: 4800000,

          quantity: 1,

          round: 1,
        }),
      }
    );

    const response =
      await createOffer(
        request,
        {
          params: Promise.resolve({
            dealId,
          }),
        }
      );

    expect(response.status).toBe(400);

    const data =
      await response.json();

    expect(data.success).toBe(false);
  });

  it("rejects an offer violating merchant policy", async () => {
    const dealId =
      await createTestDeal();

    const request = new Request(
      `http://localhost/api/deals/${dealId}/offers`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          actor: "BUYER_AGENT",

          price: 4000000,

          quantity: 1,

          round: 1,

          product:
            createValidProduct(),

          policy:
            createValidPolicy(),
        }),
      }
    );

    const response =
      await createOffer(
        request,
        {
          params: Promise.resolve({
            dealId,
          }),
        }
      );

    expect(response.status).toBe(422);

    const data =
      await response.json();

    expect(data.success).toBe(false);

    expect(data.decision).toBe(
      "REJECT"
    );

    expect(data.errors.length).toBeGreaterThan(
      0
    );
  });
});
