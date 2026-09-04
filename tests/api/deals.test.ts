import {
  describe,
  expect,
  it,
  beforeEach,
} from "vitest";

import {
  POST as createDeal,
} from "@/app/api/deals/route";

import {
  GET as getDeal,
} from "@/app/api/deals/[dealId]/route";

import {
  POST as createOffer,
} from "@/app/api/deals/[dealId]/offers/route";

describe("Deals API", () => {
  beforeEach(() => {
    // The current persistence implementation
    // intentionally keeps state in memory.
    // Tests use unique IDs to avoid collisions.
  });

  it("creates a deal", async () => {
    const request =
      new Request(
        "http://localhost/api/deals",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
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

    expect(response.status).toBe(201);

    const data =
      await response.json();

    expect(data.success).toBe(true);
    expect(data.session).toBeDefined();
    expect(data.session.state).toBe(
      "CREATED"
    );
    expect(data.session.initialPrice).toBe(
      5000000
    );
    expect(data.session.currentPrice).toBe(
      5000000
    );
  });

  it("rejects an invalid create request", async () => {
    const request =
      new Request(
        "http://localhost/api/deals",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productId: "prod-001",
          }),
        }
      );

    const response =
      await createDeal(request);

    expect(response.status).toBe(400);

    const data =
      await response.json();

    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
  });

  it("rejects a non-positive price", async () => {
    const request =
      new Request(
        "http://localhost/api/deals",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productId: "prod-price-test",
            merchantId:
              "merchant-price-test",
            buyerId:
              "buyer-price-test",
            initialPrice: 0,
          }),
        }
      );

    const response =
      await createDeal(request);

    expect(response.status).toBe(400);
  });

  it("retrieves an existing deal", async () => {
    const productId =
      `prod-${crypto.randomUUID()}`;

    const request =
      new Request(
        "http://localhost/api/deals",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            productId,
            merchantId:
              "merchant-001",
            buyerId:
              "buyer-001",
            initialPrice: 4500000,
          }),
        }
      );

    const createResponse =
      await createDeal(request);

    const created =
      await createResponse.json();

    const dealId =
      created.session.id;

    const getResponse =
      await getDeal(
        new Request(
          `http://localhost/api/deals/${dealId}`
        ),
        {
          params: Promise.resolve({
            dealId,
          }),
        }
      );

    expect(getResponse.status).toBe(200);

    const data =
      await getResponse.json();

    expect(data.success).toBe(true);
    expect(data.session.id).toBe(
      dealId
    );
  });

  it("returns 404 for an unknown deal", async () => {
    const dealId =
      `missing-${crypto.randomUUID()}`;

    const response =
      await getDeal(
        new Request(
          `http://localhost/api/deals/${dealId}`
        ),
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

  it("creates a valid offer", async () => {
    const merchantId =
      `merchant-${crypto.randomUUID()}`;

    const buyerId =
      `buyer-${crypto.randomUUID()}`;

    const productId =
      `prod-${crypto.randomUUID()}`;

    const createResponse =
      await createDeal(
        new Request(
          "http://localhost/api/deals",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              productId,
              merchantId,
              buyerId,
              initialPrice: 5000000,
              currency: "INR",
              maxRounds: 5,
            }),
          }
        )
      );

    const created =
      await createResponse.json();

    const dealId =
      created.session.id;

    const now =
      new Date().toISOString();

    const response =
      await createOffer(
        new Request(
          `http://localhost/api/deals/${dealId}/offers`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              actor: "BUYER_AGENT",
              price: 4500000,
              quantity: 1,
              round: 1,

              product: {
                id: productId,
                name: "Test Laptop",
                description:
                  "Test product",
                category: "Electronics",
                currency: "INR",
                price: 5000000,

                inventory: {
                  available: 10,
                  reserved: 0,
                },

                status: "ACTIVE",
                merchantId,

                createdAt: now,
                updatedAt: now,
              },

              policy: {
                id: `policy-${crypto.randomUUID()}`,

                merchantId,

                maxDiscountPercent: 10,

                minimumSellingPrice:
                  4500000,

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

                createdAt: now,
                updatedAt: now,
              },
            }),
          }
        ),
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

    expect(data.offer).toBeDefined();

    expect(data.offer.price).toBe(
      4500000
    );

    expect(data.offer.quantity).toBe(
      1
    );

    expect(data.session.state).toBe(
      "NEGOTIATING"
    );
  });

  it(
    "returns 404 when creating an offer for an unknown deal",
    async () => {
      const dealId =
        `missing-${crypto.randomUUID()}`;

      const response =
        await createOffer(
          new Request(
            `http://localhost/api/deals/${dealId}/offers`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                actor: "BUYER_AGENT",

                price: 4500000,

                quantity: 1,

                round: 1,

                product: {},

                policy: {},
              }),
            }
          ),

          {
            params: Promise.resolve({
              dealId,
            }),
          }
        );

      expect(response.status).toBe(
        404
      );

      const data =
        await response.json();

      expect(data.success).toBe(false);

      expect(data.error).toBe(
        "Deal not found"
      );
    }
  );

  it(
    "rejects an invalid offer actor",
    async () => {
      const merchantId =
        `merchant-${crypto.randomUUID()}`;

      const buyerId =
        `buyer-${crypto.randomUUID()}`;

      const productId =
        `prod-${crypto.randomUUID()}`;

      const createResponse =
        await createDeal(
          new Request(
            "http://localhost/api/deals",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                productId,
                merchantId,
                buyerId,
                initialPrice: 5000000,
              }),
            }
          )
        );

      const created =
        await createResponse.json();

      const dealId =
        created.session.id;

      const response =
        await createOffer(
          new Request(
            `http://localhost/api/deals/${dealId}/offers`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                actor: "INVALID_AGENT",

                price: 4500000,

                quantity: 1,

                round: 1,

                product: {},

                policy: {},
              }),
            }
          ),

          {
            params: Promise.resolve({
              dealId,
            }),
          }
        );

      expect(response.status).toBe(
        400
      );

      const data =
        await response.json();

      expect(data.success).toBe(false);

      expect(data.error).toBe(
        "Invalid offer actor"
      );
    }
  );

  it(
    "rejects a non-positive offer price",
    async () => {
      const merchantId =
        `merchant-${crypto.randomUUID()}`;

      const buyerId =
        `buyer-${crypto.randomUUID()}`;

      const productId =
        `prod-${crypto.randomUUID()}`;

      const createResponse =
        await createDeal(
          new Request(
            "http://localhost/api/deals",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                productId,
                merchantId,
                buyerId,
                initialPrice: 5000000,
              }),
            }
          )
        );

      const created =
        await createResponse.json();

      const dealId =
        created.session.id;

      const response =
        await createOffer(
          new Request(
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

                product: {},

                policy: {},
              }),
            }
          ),

          {
            params: Promise.resolve({
              dealId,
            }),
          }
        );

      expect(response.status).toBe(
        400
      );

      const data =
        await response.json();

      expect(data.success).toBe(false);

      expect(data.error).toBe(
        "price must be a positive number"
      );
    }
  );

  it(
    "rejects an invalid quantity",
    async () => {
      const merchantId =
        `merchant-${crypto.randomUUID()}`;

      const buyerId =
        `buyer-${crypto.randomUUID()}`;

      const productId =
        `prod-${crypto.randomUUID()}`;

      const createResponse =
        await createDeal(
          new Request(
            "http://localhost/api/deals",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                productId,
                merchantId,
                buyerId,
                initialPrice: 5000000,
              }),
            }
          )
        );

      const created =
        await createResponse.json();

      const dealId =
        created.session.id;

      const response =
        await createOffer(
          new Request(
            `http://localhost/api/deals/${dealId}/offers`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                actor: "BUYER_AGENT",

                price: 4500000,

                quantity: 0,

                round: 1,

                product: {},

                policy: {},
              }),
            }
          ),

          {
            params: Promise.resolve({
              dealId,
            }),
          }
        );

      expect(response.status).toBe(
        400
      );

      const data =
        await response.json();

      expect(data.success).toBe(false);

      expect(data.error).toBe(
        "quantity must be a positive integer"
      );
    }
  );

  it(
    "rejects an invalid negotiation round",
    async () => {
      const merchantId =
        `merchant-${crypto.randomUUID()}`;

      const buyerId =
        `buyer-${crypto.randomUUID()}`;

      const productId =
        `prod-${crypto.randomUUID()}`;

      const createResponse =
        await createDeal(
          new Request(
            "http://localhost/api/deals",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                productId,
                merchantId,
                buyerId,
                initialPrice: 5000000,
              }),
            }
          )
        );

      const created =
        await createResponse.json();

      const dealId =
        created.session.id;

      const response =
        await createOffer(
          new Request(
            `http://localhost/api/deals/${dealId}/offers`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                actor: "BUYER_AGENT",

                price: 4500000,

                quantity: 1,

                round: 0,

                product: {},

                policy: {},
              }),
            }
          ),

          {
            params: Promise.resolve({
              dealId,
            }),
          }
        );

      expect(response.status).toBe(
        400
      );

      const data =
        await response.json();

      expect(data.success).toBe(false);

      expect(data.error).toBe(
        "round must be a positive integer"
      );
    }
  );

  it(
    "rejects an offer without product and policy",
    async () => {
      const merchantId =
        `merchant-${crypto.randomUUID()}`;

      const buyerId =
        `buyer-${crypto.randomUUID()}`;

      const productId =
        `prod-${crypto.randomUUID()}`;

      const createResponse =
        await createDeal(
          new Request(
            "http://localhost/api/deals",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                productId,
                merchantId,
                buyerId,
                initialPrice: 5000000,
              }),
            }
          )
        );

      const created =
        await createResponse.json();

      const dealId =
        created.session.id;

      const response =
        await createOffer(
          new Request(
            `http://localhost/api/deals/${dealId}/offers`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                actor: "BUYER_AGENT",

                price: 4500000,

                quantity: 1,

                round: 1,
              }),
            }
          ),

          {
            params: Promise.resolve({
              dealId,
            }),
          }
        );

      expect(response.status).toBe(
        400
      );

      const data =
        await response.json();

      expect(data.success).toBe(false);

      expect(data.error).toBe(
        "product and policy are required"
      );
    }
  );
});