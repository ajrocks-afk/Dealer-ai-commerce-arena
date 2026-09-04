import {
  describe,
  expect,
  it,
} from "vitest";

import {
  DealAnalyticsService,
} from "@/services/deal-analytics-service";

import type {
  DealSession,
} from "@/models/deal-session";

import type {
  Offer,
} from "@/models/offer";

import type {
  AuditEvent,
} from "@/models/audit-event";

import type {
  RazorpayOrder,
} from "@/models/razorpay-order";

describe(
  "DealAnalyticsService",
  () => {
    const service =
      new DealAnalyticsService();

    const session: DealSession = {
      id: "deal-analytics-test",

      productId:
        "iphone-17-pro",

      merchantId:
        "merchant-1",

      buyerId:
        "buyer-1",

      state:
        "NEGOTIATING",

      currentRound:
        3,

      maxRounds:
        5,

      currency:
        "INR",

      initialPrice:
        120000,

      currentPrice:
        108000,

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString(),

      expiresAt:
        new Date(
          Date.now() +
            60 * 60 * 1000
        ).toISOString(),
    };

    const offers: Offer[] = [
      {
        id:
          "offer-1",

        dealSessionId:
          session.id,

        actor:
          "BUYER_AGENT",

        price:
          105000,

        quantity:
          1,

        currency:
          "INR",

        status:
          "PENDING",

        round:
          1,

        createdAt:
          new Date().toISOString(),
      },

      {
        id:
          "offer-2",

        dealSessionId:
          session.id,

        actor:
          "MERCHANT_AGENT",

        price:
          115000,

        quantity:
          1,

        currency:
          "INR",

        status:
          "PENDING",

        round:
          2,

        createdAt:
          new Date().toISOString(),
      },

      {
        id:
          "offer-3",

        dealSessionId:
          session.id,

        actor:
          "BUYER_AGENT",

        price:
          108000,

        quantity:
          1,

        currency:
          "INR",

        status:
          "PENDING",

        round:
          3,

        createdAt:
          new Date().toISOString(),
      },
    ];

    it(
      "calculates savings and discount from the current price",
      () => {
        const analytics =
          service.calculate(
            session,
            offers,
            []
          );

        expect(
          analytics.startingPrice
        ).toBe(120000);

        expect(
          analytics.currentPrice
        ).toBe(108000);

        expect(
          analytics.buyerSavings
        ).toBe(12000);

        expect(
          analytics.buyerSavingsPercent
        ).toBe(10);

        expect(
          analytics.merchantDiscount
        ).toBe(12000);

        expect(
          analytics.merchantDiscountPercent
        ).toBe(10);
      }
    );

    it(
      "counts buyer and merchant offers",
      () => {
        const analytics =
          service.calculate(
            session,
            offers,
            []
          );

        expect(
          analytics.offerCount
        ).toBe(3);

        expect(
          analytics.buyerOfferCount
        ).toBe(2);

        expect(
          analytics.merchantOfferCount
        ).toBe(1);
      }
    );

    it(
      "reports round progress",
      () => {
        const analytics =
          service.calculate(
            session,
            offers,
            []
          );

        expect(
          analytics.roundsUsed
        ).toBe(3);

        expect(
          analytics.maximumRounds
        ).toBe(5);
      }
    );

    it(
      "counts deterministic policy blocks",
      () => {
        const auditEvents: AuditEvent[] = [
          {
            id:
              "audit-1",

            dealSessionId:
              session.id,

            actor:
              "SYSTEM",

            type:
              "POLICY_CHECKED",

            description:
              "Offer blocked by merchant policy.",

            metadata: {
              allowed: false,
              blocked: true,
              decision: "REJECT",
            },

            createdAt:
              new Date().toISOString(),
          },

          {
            id:
              "audit-2",

            dealSessionId:
              session.id,

            actor:
              "SYSTEM",

            type:
              "POLICY_CHECKED",

            description:
              "Offer passed merchant policy.",

            metadata: {
              allowed: true,
              blocked: false,
              decision: "ALLOW",
            },

            createdAt:
              new Date().toISOString(),
          },
        ];

        const analytics =
          service.calculate(
            session,
            offers,
            auditEvents
          );

        expect(
          analytics.policyBlockCount
        ).toBe(1);
      }
    );

    it(
      "uses accepted price after a deal is accepted",
      () => {
        const acceptedSession: DealSession = {
          ...session,

          state:
            "ACCEPTED",

          currentPrice:
            110000,

          acceptedPrice:
            108000,
        };

        const analytics =
          service.calculate(
            acceptedSession,
            offers,
            []
          );

        expect(
          analytics.finalPrice
        ).toBe(108000);

        expect(
          analytics.buyerSavings
        ).toBe(12000);

        expect(
          analytics.buyerSavingsPercent
        ).toBe(10);
      }
    );

    it(
      "reports payment status from the Razorpay order",
      () => {
        const order: RazorpayOrder = {
          id:
            "order-1",

          dealSessionId:
            session.id,

          razorpayOrderId:
            "razorpay-order-1",

          amount:
            108000,

          currency:
            "INR",

          status:
            "PAID",

          paymentId:
            "payment-1",

          createdAt:
            new Date().toISOString(),

          updatedAt:
            new Date().toISOString(),
        };

        const analytics =
          service.calculate(
            session,
            offers,
            [],
            order
          );

        expect(
          analytics.paymentStatus
        ).toBe("PAID");
      }
    );
  }
);