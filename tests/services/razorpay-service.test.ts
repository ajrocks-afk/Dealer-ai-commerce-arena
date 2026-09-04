import {
  describe,
  expect,
  it,
  beforeEach,
} from "vitest";

import {
  RazorpayService,
} from "@/services/razorpay-service";

import crypto from "node:crypto";

describe("RazorpayService", () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_ID =
      "rzp_test_fake";

    process.env.RAZORPAY_KEY_SECRET =
      "test_secret";
  });

  it("creates a Razorpay order", async () => {
    const fakeClient = {
      orders: {
        create: async () => ({
          id: "rzp-order-001",
          amount: 480000000,
          currency: "INR",
          status: "created",
          created_at: Date.now(),
        }),
      },
    };

    const service =
      new RazorpayService(fakeClient);

    const result =
      await service.createOrder({
        dealSessionId: "deal-001",
        amount: 4800000,
        currency: "INR",
      });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();

    expect(
      result.data?.dealSessionId
    ).toBe("deal-001");

    expect(
      result.data?.amount
    ).toBe(4800000);

    expect(
      result.data?.currency
    ).toBe("INR");

    expect(
      result.data?.status
    ).toBe("CREATED");
  });

  it("rejects an order with zero amount", async () => {
    const service =
      new RazorpayService({
        orders: {
          create: async () => ({
            id: "unused",
            amount: 0,
            currency: "INR",
            status: "created",
            created_at: Date.now(),
          }),
        },
      });

    const result =
      await service.createOrder({
        dealSessionId: "deal-001",
        amount: 0,
        currency: "INR",
      });

    expect(result.success).toBe(false);

    expect(result.error).toContain(
      "amount must be greater than zero"
    );
  });

  it("rejects an order with a negative amount", async () => {
    const service =
      new RazorpayService({
        orders: {
          create: async () => ({
            id: "unused",
            amount: -100,
            currency: "INR",
            status: "created",
            created_at: Date.now(),
          }),
        },
      });

    const result =
      await service.createOrder({
        dealSessionId: "deal-001",
        amount: -100,
        currency: "INR",
      });

    expect(result.success).toBe(false);
  });

  it("verifies a payment with required fields", () => {
    const orderId =
      "rzp-deal-001";

    const paymentId =
      "pay-001";

    const secret =
      process.env.RAZORPAY_KEY_SECRET!;

    const signature =
      crypto
        .createHmac(
          "sha256",
          secret
        )
        .update(
          `${orderId}|${paymentId}`
        )
        .digest("hex");

    const service =
      new RazorpayService();

    const result =
      service.verifyPayment({
        orderId,
        paymentId,
        signature,
      });

    expect(result.success).toBe(true);
    expect(result.data).toBe(true);
  });

  it("rejects verification without an order ID", () => {
    const service =
      new RazorpayService();

    const result =
      service.verifyPayment({
        orderId: "",
        paymentId: "pay-001",
        signature: "test-signature",
      });

    expect(result.success).toBe(false);

    expect(result.error).toContain(
      "order ID is required"
    );
  });

  it("rejects verification without a payment ID", () => {
    const service =
      new RazorpayService();

    const result =
      service.verifyPayment({
        orderId: "rzp-deal-001",
        paymentId: "",
        signature: "test-signature",
      });

    expect(result.success).toBe(false);

    expect(result.error).toContain(
      "payment ID is required"
    );
  });

  it("rejects verification without a signature", () => {
    const service =
      new RazorpayService();

    const result =
      service.verifyPayment({
        orderId: "rzp-deal-001",
        paymentId: "pay-001",
        signature: "",
      });

    expect(result.success).toBe(false);

    expect(result.error).toContain(
      "signature is required"
    );
  });
});