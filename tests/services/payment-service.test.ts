import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PaymentService,
} from "@/services/payment-service";

import {
  RazorpayService,
} from "@/services/razorpay-service";

import type { DealSession } from "@/models/deal-session";
import type { RazorpayOrder } from "@/models/razorpay-order";

describe("PaymentService", () => {
  const fakeRazorpayService =
    new RazorpayService({
      orders: {
        create: async () => ({
          id: "rzp-test-order",
          amount: 480000000,
          currency: "INR",
          status: "created",
          created_at: Date.now(),
        }),
      },
    });

  const service =
    new PaymentService(
      fakeRazorpayService
    );

  const acceptedSession: DealSession = {
    id: "deal-001",
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

    createdAt:
      "2026-08-23T00:00:00.000Z",

    updatedAt:
      "2026-08-23T00:00:00.000Z",

    expiresAt:
      "2026-08-24T00:00:00.000Z",
  };

  const pendingSession: DealSession = {
    ...acceptedSession,
    state: "PAYMENT_PENDING",
  };

  it(
    "moves an accepted deal to payment pending",
    () => {
      const result =
        service.markPaymentPending(
          acceptedSession
        );

      expect(result.success).toBe(true);

      expect(
        result.session.state
      ).toBe(
        "PAYMENT_PENDING"
      );

      expect(
        result.session.updatedAt
      ).not.toBe(
        acceptedSession.updatedAt
      );
    }
  );

  it(
    "rejects payment pending for a non-accepted deal",
    () => {
      const session: DealSession = {
        ...acceptedSession,
        state: "NEGOTIATING",
      };

      const result =
        service.markPaymentPending(
          session
        );

      expect(result.success).toBe(false);

      expect(
        result.session.state
      ).toBe("NEGOTIATING");

      expect(result.error).toContain(
        "after deal acceptance"
      );
    }
  );

  it(
    "creates a payment order for a pending deal",
    async () => {
      const result =
        await service.createOrder(
          pendingSession
        );

      expect(result.success).toBe(true);

      expect(
        result.order
      ).toBeDefined();

      expect(
        result.order?.dealSessionId
      ).toBe("deal-001");

      expect(
        result.order?.amount
      ).toBe(4800000);

      expect(
        result.order?.currency
      ).toBe("INR");

      expect(
        result.order?.status
      ).toBe("CREATED");
    }
  );

  it(
    "rejects order creation for a non-pending deal",
    async () => {
      const result =
        await service.createOrder(
          acceptedSession
        );

      expect(result.success).toBe(false);

      expect(
        result.order
      ).toBeUndefined();

      expect(result.error).toContain(
        "PAYMENT_PENDING"
      );
    }
  );

  it(
    "updates a payment order status",
    () => {
      const order: RazorpayOrder = {
        id:
          "order-deal-001",

        dealSessionId:
          "deal-001",

        razorpayOrderId:
          "rzp-deal-001",

        amount:
          4800000,

        currency:
          "INR",

        status:
          "CREATED",

        createdAt:
          "2026-08-24T00:00:00.000Z",

        updatedAt:
          "2026-08-24T00:00:00.000Z",
      };

      const updated =
        service.updateOrderStatus(
          order,
          "PAID",
          "pay-001"
        );

      expect(
        updated.status
      ).toBe("PAID");

      expect(
        updated.paymentId
      ).toBe("pay-001");

      expect(
        updated.updatedAt
      ).not.toBe(
        order.updatedAt
      );
    }
  );

  it(
    "completes payment only after the order is paid",
    () => {
      const order: RazorpayOrder = {
        id:
          "order-deal-001",

        dealSessionId:
          "deal-001",

        razorpayOrderId:
          "rzp-deal-001",

        amount:
          4800000,

        currency:
          "INR",

        status:
          "PAID",

        paymentId:
          "pay-001",

        createdAt:
          "2026-08-24T00:00:00.000Z",

        updatedAt:
          "2026-08-24T00:01:00.000Z",
      };

      const result =
        service.completePayment(
          pendingSession,
          order
        );

      expect(
        result.success
      ).toBe(true);

      expect(
        result.session.state
      ).toBe("PAID");
    }
  );

  it(
    "rejects completion when the order is not paid",
    () => {
      const order: RazorpayOrder = {
        id:
          "order-deal-001",

        dealSessionId:
          "deal-001",

        razorpayOrderId:
          "rzp-deal-001",

        amount:
          4800000,

        currency:
          "INR",

        status:
          "CREATED",

        createdAt:
          "2026-08-24T00:00:00.000Z",

        updatedAt:
          "2026-08-24T00:00:00.000Z",
      };

      const result =
        service.completePayment(
          pendingSession,
          order
        );

      expect(
        result.success
      ).toBe(false);

      expect(
        result.session.state
      ).toBe(
        "PAYMENT_PENDING"
      );

      expect(result.error).toContain(
        "PAID"
      );
    }
  );
});