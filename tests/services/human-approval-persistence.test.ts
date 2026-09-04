import {
  describe,
  expect,
  it,
} from "vitest";

import {
  InMemoryPersistenceService,
} from "@/services/persistence-service";

import type {
  HumanApprovalRequest,
} from "@/models/human-approval";

describe(
  "Human approval persistence",
  () => {
    it(
      "creates and retrieves an approval request",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const request: HumanApprovalRequest = {
          id:
            "approval-1",

          dealSessionId:
            "deal-1",

          status:
            "PENDING",

          requestedBy:
            "MERCHANT_AGENT",

          requestedAt:
            new Date().toISOString(),

          requestedPrice:
            108000,

          currency:
            "INR",

          reason:
            "Human approval required.",
        };

        const created =
          persistence.createHumanApproval(
            request
          );

        expect(
          created.id
        ).toBe("approval-1");

        const retrieved =
          persistence.getHumanApproval(
            "deal-1"
          );

        expect(
          retrieved
        ).toEqual(
          request
        );
      }
    );

    it(
      "prevents duplicate approval requests for the same deal",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const request: HumanApprovalRequest = {
          id:
            "approval-1",

          dealSessionId:
            "deal-1",

          status:
            "PENDING",

          requestedBy:
            "MERCHANT_AGENT",

          requestedAt:
            new Date().toISOString(),

          currency:
            "INR",
        };

        persistence.createHumanApproval(
          request
        );

        expect(() =>
          persistence.createHumanApproval(
            {
              ...request,

              id:
                "approval-2",
            }
          )
        ).toThrow(
          "Human approval already exists for deal: deal-1"
        );
      }
    );

    it(
      "updates an existing approval request",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const request: HumanApprovalRequest = {
          id:
            "approval-1",

          dealSessionId:
            "deal-1",

          status:
            "PENDING",

          requestedBy:
            "MERCHANT_AGENT",

          requestedAt:
            new Date().toISOString(),

          currency:
            "INR",
        };

        persistence.createHumanApproval(
          request
        );

        const updated =
          persistence.updateHumanApproval(
            {
              ...request,

              status:
                "APPROVED",

              decision:
                "APPROVE",

              reviewedBy:
                "reviewer-1",

              reviewedAt:
                new Date().toISOString(),
            }
          );

        expect(
          updated.status
        ).toBe("APPROVED");

        expect(
          updated.decision
        ).toBe("APPROVE");

        expect(
          updated.reviewedBy
        ).toBe("reviewer-1");

        const stored =
          persistence.getHumanApproval(
            "deal-1"
          );

        expect(
          stored?.status
        ).toBe("APPROVED");
      }
    );

    it(
      "returns undefined for an unknown deal",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        expect(
          persistence.getHumanApproval(
            "missing-deal"
          )
        ).toBeUndefined();
      }
    );

    it(
      "does not allow updating a missing approval",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const request: HumanApprovalRequest = {
          id:
            "approval-1",

          dealSessionId:
            "missing-deal",

          status:
            "PENDING",

          requestedBy:
            "BUYER_AGENT",

          requestedAt:
            new Date().toISOString(),

          currency:
            "INR",
        };

        expect(() =>
          persistence.updateHumanApproval(
            request
          )
        ).toThrow(
          "Human approval not found for deal: missing-deal"
        );
      }
    );
  }
);