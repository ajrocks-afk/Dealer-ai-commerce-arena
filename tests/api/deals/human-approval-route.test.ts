import { describe, expect, it, beforeEach } from "vitest";

import { POST, GET, PATCH } from "@/app/api/deals/[dealId]/approval/route";

import { persistence } from "@/services/persistence-instance";

import type { DealSession } from "@/models/deal-session";

function createDeal(
  id: string
): DealSession {
  const now =
    new Date().toISOString();

  const session: DealSession = {
    id,

    productId:
      "iphone-15",

    merchantId:
      "merchant-1",

    buyerId:
      "buyer-1",

    state:
      "NEGOTIATING",

    currentRound:
      2,

    maxRounds:
      5,

    currency:
      "INR",

    initialPrice:
      80000,

    currentPrice:
      70000,

    createdAt:
      now,

    updatedAt:
      now,

    expiresAt:
      new Date(
        Date.now() + 3600000
      ).toISOString(),
  };

  persistence.createDeal(
    session
  );

  return session;
}

function context(
  dealId: string
) {
  return {
    params: Promise.resolve({
      dealId,
    }),
  };
}

describe(
  "Human Approval API",
  () => {
    beforeEach(() => {
      /*
       * The persistence implementation is
       * intentionally shared globally.
       *
       * Use unique deal IDs for every test
       * so tests remain isolated.
       */
    });

    it(
      "GET returns an existing approval request",
      async () => {
        const dealId =
          `approval-get-${crypto.randomUUID()}`;

        const session =
          createDeal(dealId);

        const approval = {
          id:
            `approval-${crypto.randomUUID()}`,

          dealSessionId:
            dealId,

          status:
            "PENDING" as const,

          requestedBy:
            "BUYER_AGENT" as const,

          requestedAt:
            new Date().toISOString(),

          requestedPrice:
            65000,

          currency:
            session.currency,

          reason:
            "Discount exceeds autonomous approval threshold.",
        };

        persistence.createHumanApproval(
          approval
        );

        const response =
          await GET(
            new Request(
              "http://localhost/api/deals/" +
                dealId +
                "/approval"
            ),
            context(dealId)
          );

        expect(
          response.status
        ).toBe(200);

        const body =
          await response.json();

        expect(
          body.success
        ).toBe(true);

        expect(
          body.approval.id
        ).toBe(approval.id);

        expect(
          body.approval.status
        ).toBe("PENDING");
      }
    );

    it(
      "GET returns 404 when deal does not exist",
      async () => {
        const dealId =
          `approval-missing-${crypto.randomUUID()}`;

        const response =
          await GET(
            new Request(
              "http://localhost/api/deals/" +
                dealId +
                "/approval"
            ),
            context(dealId)
          );

        expect(
          response.status
        ).toBe(404);

        const body =
          await response.json();

        expect(
          body.success
        ).toBe(false);

        expect(
          body.error
        ).toBe("Deal not found");
      }
    );

    it(
      "POST creates a pending approval request",
      async () => {
        const dealId =
          `approval-create-${crypto.randomUUID()}`;

        createDeal(dealId);

        const request =
          new Request(
            "http://localhost/api/deals/" +
              dealId +
              "/approval",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  requestedBy:
                    "BUYER_AGENT",

                  requestedPrice:
                    65000,

                  reason:
                    "Offer requires merchant review.",
                }),
            }
          );

        const response =
          await POST(
            request,
            context(dealId)
          );

        expect(
          response.status
        ).toBe(201);

        const body =
          await response.json();

        expect(
          body.success
        ).toBe(true);

        expect(
          body.approval.status
        ).toBe("PENDING");

        expect(
          body.approval.requestedBy
        ).toBe("BUYER_AGENT");

        expect(
          body.approval.requestedPrice
        ).toBe(65000);

        const stored =
          persistence.getHumanApproval(
            dealId
          );

        expect(
          stored
        ).toBeDefined();

        expect(
          stored?.status
        ).toBe("PENDING");
      }
    );

    it(
      "POST rejects a duplicate approval request",
      async () => {
        const dealId =
          `approval-duplicate-${crypto.randomUUID()}`;

        createDeal(dealId);

        const firstRequest =
          new Request(
            "http://localhost/api/deals/" +
              dealId +
              "/approval",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  requestedBy:
                    "BUYER_AGENT",

                  requestedPrice:
                    65000,
                }),
            }
          );

        const firstResponse =
          await POST(
            firstRequest,
            context(dealId)
          );

        expect(
          firstResponse.status
        ).toBe(201);

        const secondRequest =
          new Request(
            "http://localhost/api/deals/" +
              dealId +
              "/approval",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  requestedBy:
                    "MERCHANT_AGENT",

                  requestedPrice:
                    66000,
                }),
            }
          );

        const secondResponse =
          await POST(
            secondRequest,
            context(dealId)
          );

        expect(
          secondResponse.status
        ).toBe(409);

        const body =
          await secondResponse.json();

        expect(
          body.success
        ).toBe(false);

        expect(
          body.error
        ).toBe(
          "A human approval request already exists for this deal"
        );
      }
    );

    it(
      "PATCH approves a pending request",
      async () => {
        const dealId =
          `approval-approve-${crypto.randomUUID()}`;

        createDeal(dealId);

        const createRequest =
          new Request(
            "http://localhost/api/deals/" +
              dealId +
              "/approval",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  requestedBy:
                    "BUYER_AGENT",

                  requestedPrice:
                    65000,
                }),
            }
          );

        const createResponse =
          await POST(
            createRequest,
            context(dealId)
          );

        expect(
          createResponse.status
        ).toBe(201);

        const patchRequest =
          new Request(
            "http://localhost/api/deals/" +
              dealId +
              "/approval",
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  decision:
                    "APPROVE",

                  reviewerId:
                    "merchant-human-1",
                }),
            }
          );

        const response =
          await PATCH(
            patchRequest,
            context(dealId)
          );

        expect(
          response.status
        ).toBe(200);

        const body =
          await response.json();

        expect(
          body.success
        ).toBe(true);

        expect(
          body.approval.status
        ).toBe("APPROVED");

        expect(
          body.approval.decision
        ).toBe("APPROVE");

        expect(
          body.approval.reviewedBy
        ).toBe(
          "merchant-human-1"
        );
      }
    );

    it(
      "PATCH rejects a pending request",
      async () => {
        const dealId =
          `approval-reject-${crypto.randomUUID()}`;

        createDeal(dealId);

        const createRequest =
          new Request(
            "http://localhost/api/deals/" +
              dealId +
              "/approval",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  requestedBy:
                    "MERCHANT_AGENT",

                  requestedPrice:
                    60000,
                }),
            }
          );

        await POST(
          createRequest,
          context(dealId)
        );

        const patchRequest =
          new Request(
            "http://localhost/api/deals/" +
              dealId +
              "/approval",
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  decision:
                    "REJECT",

                  reviewerId:
                    "merchant-human-1",

                  reason:
                    "Price is below acceptable commercial terms.",
                }),
            }
          );

        const response =
          await PATCH(
            patchRequest,
            context(dealId)
          );

        expect(
          response.status
        ).toBe(200);

        const body =
          await response.json();

        expect(
          body.success
        ).toBe(true);

        expect(
          body.approval.status
        ).toBe("REJECTED");

        expect(
          body.approval.decision
        ).toBe("REJECT");

        expect(
          body.approval.reviewedBy
        ).toBe(
          "merchant-human-1"
        );

        expect(
          body.approval.reason
        ).toBe(
          "Price is below acceptable commercial terms."
        );
      }
    );

    it(
      "PATCH rejects a missing reviewer",
      async () => {
        const dealId =
          `approval-reviewer-${crypto.randomUUID()}`;

        createDeal(dealId);

        const createRequest =
          new Request(
            "http://localhost/api/deals/" +
              dealId +
              "/approval",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  requestedBy:
                    "BUYER_AGENT",
                }),
            }
          );

        await POST(
          createRequest,
          context(dealId)
        );

        const patchRequest =
          new Request(
            "http://localhost/api/deals/" +
              dealId +
              "/approval",
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  decision:
                    "APPROVE",
                }),
            }
          );

        const response =
          await PATCH(
            patchRequest,
            context(dealId)
          );

        expect(
          response.status
        ).toBe(400);

        const body =
          await response.json();

        expect(
          body.success
        ).toBe(false);

        expect(
          body.error
        ).toBe(
          "A reviewer identity is required."
        );
      }
    );

    it(
      "PATCH rejects an already reviewed request",
      async () => {
        const dealId =
          `approval-reviewed-${crypto.randomUUID()}`;

        createDeal(dealId);

        const createRequest =
          new Request(
            "http://localhost/api/deals/" +
              dealId +
              "/approval",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  requestedBy:
                    "BUYER_AGENT",
                }),
            }
          );

        await POST(
          createRequest,
          context(dealId)
        );

        const approveRequest =
          new Request(
            "http://localhost/api/deals/" +
              dealId +
              "/approval",
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  decision:
                    "APPROVE",

                  reviewerId:
                    "human-reviewer-1",
                }),
            }
          );

        const firstResponse =
          await PATCH(
            approveRequest,
            context(dealId)
          );

        expect(
          firstResponse.status
        ).toBe(200);

        const secondRequest =
          new Request(
            "http://localhost/api/deals/" +
              dealId +
              "/approval",
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  decision:
                    "REJECT",

                  reviewerId:
                    "human-reviewer-2",
                }),
            }
          );

        const secondResponse =
          await PATCH(
            secondRequest,
            context(dealId)
          );

        expect(
          secondResponse.status
        ).toBe(409);

        const body =
          await secondResponse.json();

        expect(
          body.success
        ).toBe(false);

        expect(
          body.error
        ).toBe(
          "Only pending approval requests can be reviewed."
        );
      }
    );

    it(
      "PATCH rejects an invalid decision",
      async () => {
        const dealId =
          `approval-invalid-${crypto.randomUUID()}`;

        createDeal(dealId);

        const createRequest =
          new Request(
            "http://localhost/api/deals/" +
              dealId +
              "/approval",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  requestedBy:
                    "BUYER_AGENT",
                }),
            }
          );

        await POST(
          createRequest,
          context(dealId)
        );

        const patchRequest =
          new Request(
            "http://localhost/api/deals/" +
              dealId +
              "/approval",
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  decision:
                    "MAYBE",

                  reviewerId:
                    "human-reviewer-1",
                }),
            }
          );

        const response =
          await PATCH(
            patchRequest,
            context(dealId)
          );

        expect(
          response.status
        ).toBe(400);

        const body =
          await response.json();

        expect(
          body.success
        ).toBe(false);

        expect(
          body.error
        ).toBe(
          "Invalid approval decision"
        );
      }
    );
  }
);