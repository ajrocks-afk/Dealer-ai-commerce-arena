import type { DealAnalytics } from "@/models/deal-analytics";
import type { DealSession } from "@/models/deal-session";
import type { Offer } from "@/models/offer";
import type { AuditEvent } from "@/models/audit-event";
import type { RazorpayOrder } from "@/models/razorpay-order";

export class DealAnalyticsService {
  calculate(
    session: DealSession,
    offers: Offer[],
    auditEvents: AuditEvent[],
    paymentOrder?: RazorpayOrder
  ): DealAnalytics {
    const startingPrice =
      session.initialPrice;

    const currentPrice =
      session.currentPrice;

    const finalPrice =
      session.acceptedPrice;

    const effectivePrice =
      finalPrice ??
      currentPrice;

    const buyerSavings =
      Math.max(
        0,
        startingPrice - effectivePrice
      );

    const buyerSavingsPercent =
      startingPrice > 0
        ? Number(
            (
              (buyerSavings /
                startingPrice) *
              100
            ).toFixed(2)
          )
        : 0;

    const merchantDiscount =
      buyerSavings;

    const merchantDiscountPercent =
      buyerSavingsPercent;

    const buyerOfferCount =
      offers.filter(
        (offer) =>
          offer.actor ===
          "BUYER_AGENT"
      ).length;

    const merchantOfferCount =
      offers.filter(
        (offer) =>
          offer.actor ===
          "MERCHANT_AGENT"
      ).length;

    const policyBlockCount =
      auditEvents.filter(
        (event) =>
          event.type ===
            "POLICY_CHECKED" &&
          (
            event.metadata?.allowed ===
              false ||
            event.metadata?.decision ===
              "REJECT" ||
            event.metadata?.blocked ===
              true
          )
      ).length;

    const paymentStatus =
      this.getPaymentStatus(
        paymentOrder
      );

    return {
      dealSessionId:
        session.id,

      startingPrice,

      currentPrice,

      finalPrice,

      buyerSavings,

      buyerSavingsPercent,

      merchantDiscount,

      merchantDiscountPercent,

      roundsUsed:
        Math.min(
          session.currentRound,
          session.maxRounds
        ),

      maximumRounds:
        session.maxRounds,

      offerCount:
        offers.length,

      buyerOfferCount,

      merchantOfferCount,

      policyBlockCount,

      result:
        session.state,

      paymentStatus,

      generatedAt:
        new Date().toISOString(),
    };
  }

  private getPaymentStatus(
    paymentOrder?: RazorpayOrder
  ): DealAnalytics["paymentStatus"] {
    if (!paymentOrder) {
      return "NOT_STARTED";
    }

    switch (paymentOrder.status) {
      case "PAID":
        return "PAID";

      case "FAILED":
        return "FAILED";

      case "CREATED":
      case "ATTEMPTED":
      case "CANCELLED":
      default:
        return "ORDER_CREATED";
    }
  }
}