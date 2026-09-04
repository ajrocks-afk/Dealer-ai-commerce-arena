import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

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
 * The actual Razorpay verification logic is tested
 * separately in:
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
} from "@/app/api/deals/[dealId]/payment/verify/route";

describe(
  "Payment Verification API",
  () => {
    const createPendingDeal = () => {
      const now =
        new Date().toISOString();

      const session = {
        id:
          `deal-${crypto.randomUUID()}`,

        productId: "prod-001",

        merchantId: "merchant-001",

        buyerId: "buyer-001",

        state:
          "PAYMENT_PENDING" as const,

        currentRound: 2,

        maxRounds: 5,

        currency:
          "INR" as const,

        initialPrice: 5000000,

        currentPrice: 4800000,

        acceptedPrice: 4800000,

        createdAt: now,

        updatedAt: now,

        expiresAt:
          new Date(
            Date.now() +
              60 * 60 * 1000
          ).toISOString(),
      };

      persistence.createDeal(
        session
      );

      return session;
    };

    const createOrder = (
      dealId: string
    ): RazorpayOrder => {
      const now =
        new Date().toISOString();

      return {
        id:
          `order-${crypto.randomUUID()}`,

        dealSessionId:
          dealId,

        razorpayOrderId:
          `rzp-${crypto.randomUUID()}`,

        amount: 4800000,

        currency: "INR",

        status: "CREATED",

        createdAt: now,

        updatedAt: now,
      };
    };

    const createRequest = (
      body: unknown
    ) =>
      new Request(
        "http://localhost/api/deals/test/payment/verify",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            body
          ),
        }
      );

    it(
      "verifies a payment and moves the deal to PAID",
      async () => {
        /*
         * Reset mocks before the test.
         */
        fakeRazorpayService
          .createOrder
          .mockReset();

        fakeRazorpayService
          .verifyPayment
          .mockReset();

        const session =
          createPendingDeal();

        const order =
          createOrder(
            session.id
          );

        persistence.createRazorpayOrder(order);

        /*
         * Simulate successful Razorpay
         * signature verification.
         */
        fakeRazorpayService
          .verifyPayment
          .mockReturnValueOnce({
            success: true,
            data: true,
          });

        const response =
          await POST(
            createRequest({
              order,

              orderId:
                order.razorpayOrderId,

              paymentId:
                "pay-001",

              signature:
                "signature-001",
            }),
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
        ).toBe(200);

        const data =
          await response.json();

        expect(
          data.success
        ).toBe(true);

        expect(
          data.session.state
        ).toBe("PAID");

        expect(
          data.order.status
        ).toBe("PAID");

        expect(
          data.order.paymentId
        ).toBe("pay-001");

        expect(
          fakeRazorpayService
            .verifyPayment
        ).toHaveBeenCalledTimes(1);

        expect(
          fakeRazorpayService
            .verifyPayment
        ).toHaveBeenCalledWith({
          orderId:
            order.razorpayOrderId,

          paymentId:
            "pay-001",

          signature:
            "signature-001",
        });

        const stored =
          persistence.getDeal(
            session.id
          );

        expect(
          stored?.state
        ).toBe("PAID");
      }
    );

    it(
      "returns 404 for an unknown deal",
      async () => {
        fakeRazorpayService
          .verifyPayment
          .mockReset();

        const order =
          createOrder(
            "missing-deal"
          );

        const response =
          await POST(
            createRequest({
              order,

              orderId:
                order.razorpayOrderId,

              paymentId:
                "pay-001",

              signature:
                "signature-001",
            }),
            {
              params:
                Promise.resolve({
                  dealId:
                    "missing-deal",
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
          fakeRazorpayService
            .verifyPayment
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects verification for a non-pending deal",
      async () => {
        fakeRazorpayService
          .verifyPayment
          .mockReset();

        const session =
          createPendingDeal();

        persistence.updateDeal({
          ...session,

          state: "ACCEPTED",
        });

        const order =
          createOrder(
            session.id
          );

        const response =
          await POST(
            createRequest({
              order,

              orderId:
                order.razorpayOrderId,

              paymentId:
                "pay-001",

              signature:
                "signature-001",
            }),
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
          "PAYMENT_PENDING"
        );

        expect(
          fakeRazorpayService
            .verifyPayment
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a payment order belonging to another deal",
      async () => {
        fakeRazorpayService
          .verifyPayment
          .mockReset();

        const session =
          createPendingDeal();

        const order =
          createOrder(
            session.id
          );

        persistence.createRazorpayOrder(order);

        const response =
          await POST(
            createRequest({
              orderId:
                "different-order-id",

              paymentId:
                "pay-001",

              signature:
                "signature-001",
            }),
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
        ).toBe(400);

        const data =
          await response.json();

        expect(
          data.success
        ).toBe(false);

        expect(
          data.error
        ).toContain(
          "does not belong"
        );

        expect(
          fakeRazorpayService
            .verifyPayment
        ).not.toHaveBeenCalled();
      }
    );
  }
);