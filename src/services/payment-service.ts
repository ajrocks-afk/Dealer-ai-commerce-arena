import type { DealSession } from "@/models/deal-session";
import type {
  RazorpayOrder,
  RazorpayOrderStatus,
} from "@/models/razorpay-order";

import {
  transitionDeal,
} from "@/state-machine/deal-state-machine";

import {
  RazorpayService,
} from "@/services/razorpay-service";

export interface PaymentServiceResult {
  success: boolean;
  order?: RazorpayOrder;
  session: DealSession;
  error?: string;
}

export class PaymentService {
  private readonly razorpayService: RazorpayService;

  constructor(
    razorpayService: RazorpayService =
      new RazorpayService()
  ) {
    this.razorpayService = razorpayService;
  }

  async createOrder(
    session: DealSession
  ): Promise<PaymentServiceResult> {
    if (session.state !== "PAYMENT_PENDING") {
      return {
        success: false,
        session,
        error:
          "Payment order can only be created when deal is PAYMENT_PENDING",
      };
    }

    const result =
      await this.razorpayService.createOrder({
        dealSessionId: session.id,
        amount:
          session.acceptedPrice ??
          session.currentPrice,
        currency: session.currency,
      });

    if (!result.success || !result.data) {
      return {
        success: false,
        session,
        error:
          result.error ??
          "Failed to create Razorpay order",
      };
    }

    return {
      success: true,
      order: result.data,
      session: {
        ...session,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  updateOrderStatus(
    order: RazorpayOrder,
    status: RazorpayOrderStatus,
    paymentId?: string
  ): RazorpayOrder {
    return {
      ...order,
      status,
      ...(paymentId !== undefined
        ? { paymentId }
        : {}),
      updatedAt: new Date().toISOString(),
    };
  }

  markPaymentPending(
    session: DealSession
  ): PaymentServiceResult {
    const transition = transitionDeal(
      session.state,
      "PAYMENT_PENDING"
    );

    if (!transition.allowed) {
      return {
        success: false,
        session,
        error:
          "Payment can only be initiated after deal acceptance",
      };
    }

    return {
      success: true,
      session: {
        ...session,
        state: "PAYMENT_PENDING",
        updatedAt: new Date().toISOString(),
      },
    };
  }

  completePayment(
    session: DealSession,
    order: RazorpayOrder
  ): PaymentServiceResult {
    if (order.status !== "PAID") {
      return {
        success: false,
        session,
        error:
          "Deal cannot be completed until Razorpay order is PAID",
      };
    }

    const transition = transitionDeal(
      session.state,
      "PAID"
    );

    if (!transition.allowed) {
      return {
        success: false,
        session,
        error: transition.reason,
      };
    }

    return {
      success: true,
      order,
      session: {
        ...session,
        state: "PAID",
        updatedAt: new Date().toISOString(),
      },
    };
  }

  completeDeal(
    session: DealSession
  ): PaymentServiceResult {
    const transition =
      transitionDeal(
        session.state,
        "COMPLETED"
      );

    if (!transition.allowed) {
      return {
        success: false,
        session,
        error:
          transition.reason ??
          "Deal cannot be completed",
      };
    }

    return {
      success: true,
      session: {
        ...session,
        state: "COMPLETED",
        updatedAt:
          new Date().toISOString(),
      },
    };
  }
}