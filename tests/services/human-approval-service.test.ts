import {
  describe,
  expect,
  it,
} from "vitest";

import {
  HumanApprovalService,
} from "@/services/human-approval-service";

import type {
  DealSession,
} from "@/models/deal-session";

describe(
  "HumanApprovalService",
  () => {
    const service =
      new HumanApprovalService();

    const session: DealSession = {
      id:
        "deal-human-approval-test",

      productId:
        "product-1",

      merchantId:
        "merchant-1",

      buyerId:
        "buyer-1",

      state:
        "POLICY_CHECK",

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

    it(
      "creates a pending approval request",
      () => {
        const request =
          service.createRequest(
            session,
            "MERCHANT_AGENT",
            108000,
            "Human approval required before final acceptance."
          );

        expect(
          request.dealSessionId
        ).toBe(session.id);

        expect(
          request.status
        ).toBe("PENDING");

        expect(
          request.requestedBy
        ).toBe(
          "MERCHANT_AGENT"
        );

        expect(
          request.requestedPrice
        ).toBe(108000);

        expect(
          request.currency
        ).toBe("INR");

        expect(
          request.reason
        ).toContain(
          "Human approval"
        );

        expect(
          request.requestedAt
        ).toBeTruthy();
      }
    );

    it(
      "approves a pending request",
      () => {
        const request =
          service.createRequest(
            session,
            "MERCHANT_AGENT",
            108000
          );

        const approved =
          service.approve(
            request,
            "merchant-reviewer"
          );

        expect(
          approved.status
        ).toBe("APPROVED");

        expect(
          approved.decision
        ).toBe("APPROVE");

        expect(
          approved.reviewedBy
        ).toBe(
          "merchant-reviewer"
        );

        expect(
          approved.reviewedAt
        ).toBeTruthy();

        expect(
          service.isApproved(
            approved
          )
        ).toBe(true);
      }
    );

    it(
      "rejects a pending request",
      () => {
        const request =
          service.createRequest(
            session,
            "MERCHANT_AGENT",
            108000
          );

        const rejected =
          service.reject(
            request,
            "merchant-reviewer",
            "Price is below the approved human threshold."
          );

        expect(
          rejected.status
        ).toBe("REJECTED");

        expect(
          rejected.decision
        ).toBe("REJECT");

        expect(
          rejected.reviewedBy
        ).toBe(
          "merchant-reviewer"
        );

        expect(
          rejected.reason
        ).toContain(
          "approved human threshold"
        );

        expect(
          service.isApproved(
            rejected
          )
        ).toBe(false);
      }
    );

    it(
      "does not allow approval of an already approved request",
      () => {
        const request =
          service.createRequest(
            session,
            "MERCHANT_AGENT",
            108000
          );

        const approved =
          service.approve(
            request,
            "reviewer-1"
          );

        expect(() =>
          service.approve(
            approved,
            "reviewer-2"
          )
        ).toThrow(
          "Only pending approval requests can be approved."
        );
      }
    );

    it(
      "requires reviewer identity",
      () => {
        const request =
          service.createRequest(
            session,
            "MERCHANT_AGENT"
          );

        expect(() =>
          service.approve(
            request,
            "   "
          )
        ).toThrow(
          "A reviewer identity is required."
        );

        expect(() =>
          service.reject(
            request,
            ""
          )
        ).toThrow(
          "A reviewer identity is required."
        );
      }
    );

    it(
      "correctly reports pending status and decision",
      () => {
        const request =
          service.createRequest(
            session,
            "BUYER_AGENT"
          );

        expect(
          service.isPending(
            request
          )
        ).toBe(true);

        expect(
          service.getDecision(
            request
          )
        ).toBeUndefined();
      }
    );
  }
);