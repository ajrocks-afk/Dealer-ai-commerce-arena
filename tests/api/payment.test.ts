import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { DealSession } from "@/models/deal-session";
import type { RazorpayOrder } from "@/models/razorpay-order";

import {
  persistence,
} from "@/services/persistence-instance";

/*
 * IMPORTANT:
 *
 * vi.mock() is hoisted by Vitest.
 *
 * Therefore the fake service MUST be created
 * with vi.hoisted().
 */
const fakeRazorpayService = vi.hoisted(
  () => ({
    createOrder: vi.fn(),
    verifyPayment: vi.fn(),
  })
);

/*
 * Mock only the external Razorpay integration.
 *
 * The real RazorpayService is tested separately in:
 *
 * tests/services/razorpay-service.test.ts
 */
vi.mock(
  "@/services/razorpay-service",
  () => ({
    RazorpayService: class {
      createOrder =
        fakeRazorpayService.createOrder;

      verifyPayment =
        fakeRazorpayService.verifyPayment;
    },
  })
);

import {
  POST,
} from "@/app/api/deals/[dealId]/payment/route";

describe("Payment API", () => {
  const createSession = (
    overrides: Partial<DealSession> = {}
  ): DealSession => {
    const now =
      new Date().toISOString();

    return {
      id: `deal-payment-${crypto.randomUUID()}`,

      productId: "prod-001",

      merchantId: "merchant-001",

      buyerId: "buyer-001",

      state: "ACCEPTED",

      currentRound: 2,

      maxRounds: 5,

      currency: "INR",

      initialPrice: 5000000,

      currentPrice: 4800000,

      acceptedPrice: 4800000,

      createdAt: now,

      updatedAt: now,

      expiresAt:
        new Date(
          Date.now() +
            24 * 60 * 60 * 1000
        ).toISOString(),

      ...overrides,
    };
  };

  it(
    "creates a payment order for an accepted deal",
    async () => {
      /*
       * Reset mocks so this test is isolated.
       */
      fakeRazorpayService.createOrder.mockReset();
      fakeRazorpayService.verifyPayment.mockReset();

      const session =
        createSession();

      persistence.createDeal(
        session
      );

      const mockedOrder: RazorpayOrder =
        {
          id:
            `order-${crypto.randomUUID()}`,

          dealSessionId:
            session.id,

          razorpayOrderId:
            `rzp-${crypto.randomUUID()}`,

          amount: 4800000,

          currency: "INR",

          status: "CREATED",

          createdAt:
            new Date().toISOString(),

          updatedAt:
            new Date().toISOString(),
        };

      /*
       * PaymentService calls RazorpayService.createOrder().
       *
       * The RazorpayService contract returns:
       *
       * {
       *   success: true,
       *   data: order
       * }
       */
      fakeRazorpayService.createOrder
        .mockResolvedValueOnce({
          success: true,
          data: mockedOrder,
        });

      const request =
        new Request(
          "http://localhost/api/deals/test/payment",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({}),
          }
        );

      const response =
        await POST(
          request,
          {
            params:
              Promise.resolve({
                dealId:
                  session.id,
              }),
          }
        );

      expect(
        response.status
      ).toBe(201);

      const data =
        await response.json();

      expect(
        data.success
      ).toBe(true);

      expect(
        data.session.state
      ).toBe(
        "PAYMENT_PENDING"
      );

      expect(
        data.order
      ).toBeDefined();

      expect(
        data.order.dealSessionId
      ).toBe(
        session.id
      );

      expect(
        data.order.amount
      ).toBe(4800000);

      expect(
        data.order.currency
      ).toBe("INR");

      expect(
        data.order.status
      ).toBe("CREATED");

      expect(
        fakeRazorpayService.createOrder
      ).toHaveBeenCalledTimes(1);

      expect(
        fakeRazorpayService.createOrder
      ).toHaveBeenCalledWith({
        dealSessionId:
          session.id,

        amount: 4800000,

        currency: "INR",
      });
    }
  );

  it(
    "returns 404 for an unknown deal",
    async () => {
      fakeRazorpayService.createOrder.mockReset();

      const request =
        new Request(
          "http://localhost/api/deals/unknown/payment",
          {
            method: "POST",
          }
        );

      const response =
        await POST(
          request,
          {
            params:
              Promise.resolve({
                dealId:
                  "deal-does-not-exist",
              }),
          }
        );

      expect(
        response.status
      ).toBe(404);

      const data =
        await response.json();

      expect(
        data.success
      ).toBe(false);

      expect(
        data.error
      ).toBe(
        "Deal not found"
      );

      expect(
        fakeRazorpayService.createOrder
      ).not.toHaveBeenCalled();
    }
  );

  it(
    "rejects payment for a non-accepted deal",
    async () => {
      fakeRazorpayService.createOrder.mockReset();

      const session =
        createSession({
          state: "NEGOTIATING",
        });

      persistence.createDeal(
        session
      );

      const request =
        new Request(
          "http://localhost/api/deals/test/payment",
          {
            method: "POST",
          }
        );

      const response =
        await POST(
          request,
          {
            params:
              Promise.resolve({
                dealId:
                  session.id,
              }),
          }
        );

      expect(
        response.status
      ).toBe(409);

      const data =
        await response.json();

      expect(
        data.success
      ).toBe(false);

      expect(
        data.error
      ).toContain(
        "after deal acceptance"
      );

      expect(
        fakeRazorpayService.createOrder
      ).not.toHaveBeenCalled();
    }
  );
});