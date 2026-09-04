import Razorpay from "razorpay";
import crypto from "node:crypto";

import type { RazorpayOrder } from "@/models/razorpay-order";

export interface CreateRazorpayOrderInput {
  dealSessionId: string;
  amount: number;
  currency: "INR";
}

export interface RazorpayPaymentVerificationInput {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface RazorpayServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RazorpayClient {
  orders: {
    create(input: {
      amount: number;
      currency: string;
      receipt: string;
      notes: Record<string, string>;
    }): Promise<{
      id: string;
      amount: string | number;
      currency: string;
      status: string;
      created_at: number;
    }>;
  };
}

export class RazorpayService {
  private readonly client: RazorpayClient | null;
  private readonly keySecret: string | null;

  constructor(client?: RazorpayClient) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    this.keySecret = keySecret ?? null;

    if (client) {
      this.client = client;
    } else if (keyId && keySecret) {
      this.client = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    } else {
      this.client = null;
    }
  }

  async createOrder(
    input: CreateRazorpayOrderInput
  ): Promise<RazorpayServiceResult<RazorpayOrder>> {
    if (
      !Number.isFinite(input.amount) ||
      input.amount <= 0
    ) {
      return {
        success: false,
        error:
          "Razorpay order amount must be greater than zero",
      };
    }

    if (!this.client) {
      return {
        success: false,
        error:
          "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be configured",
      };
    }

    const amountInPaise = Math.round(
      input.amount * 100
    );

    try {
      const razorpayOrder =
        await this.client.orders.create({
          amount: amountInPaise,
          currency: input.currency,
          receipt:
            `dealer-${input.dealSessionId}`.slice(
              0,
              40
            ),
          notes: {
            dealSessionId:
              input.dealSessionId,
          },
        });

      const now = new Date().toISOString();

      const order: RazorpayOrder = {
        id:
          `order-${input.dealSessionId}`,

        dealSessionId:
          input.dealSessionId,

        razorpayOrderId:
          razorpayOrder.id,

        amount:
          input.amount,

        currency:
          input.currency,

        status:
          "CREATED",

        createdAt:
          now,

        updatedAt:
          now,
      };

      return {
        success: true,
        data: order,
      };
    } catch (error) {
      console.error(
        "Razorpay order creation failed:",
        error
      );

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Razorpay order",
      };
    }
  }

  verifyPayment(
    input: RazorpayPaymentVerificationInput
  ): RazorpayServiceResult<boolean> {
    /*
     * Validate request fields before checking
     * Razorpay configuration.
     */

    if (!input.orderId) {
      return {
        success: false,
        error:
          "Razorpay order ID is required",
      };
    }

    if (!input.paymentId) {
      return {
        success: false,
        error:
          "Razorpay payment ID is required",
      };
    }

    if (!input.signature) {
      return {
        success: false,
        error:
          "Razorpay payment signature is required",
      };
    }

    if (!this.keySecret) {
      return {
        success: false,
        error:
          "RAZORPAY_KEY_SECRET is not configured",
      };
    }

    try {
      const payload =
        `${input.orderId}|${input.paymentId}`;

      const expectedSignature =
        crypto
          .createHmac(
            "sha256",
            this.keySecret
          )
          .update(payload)
          .digest("hex");

      const received =
        Buffer.from(
          input.signature,
          "utf8"
        );

      const expected =
        Buffer.from(
          expectedSignature,
          "utf8"
        );

      if (
        received.length !==
        expected.length
      ) {
        return {
          success: false,
          error:
            "Invalid Razorpay payment signature",
        };
      }

      const valid =
        crypto.timingSafeEqual(
          received,
          expected
        );

      if (!valid) {
        return {
          success: false,
          error:
            "Invalid Razorpay payment signature",
        };
      }

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      console.error(
        "Razorpay payment verification failed:",
        error
      );

      return {
        success: false,
        error:
          "Unable to verify Razorpay payment signature",
      };
    }
  }
}