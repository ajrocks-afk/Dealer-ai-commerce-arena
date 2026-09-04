import { describe, expect, it } from "vitest";

import {
  NegotiationEngine,
} from "@/engine/negotiation-engine";

import {
  InMemoryPersistenceService,
} from "@/services/persistence-service";

import {
  AuditService,
} from "@/services/audit-service";

import {
  HumanApprovalService,
} from "@/services/human-approval-service";

import {
  DealController,
} from "@/controllers/deal-controller";

import type {
  DealSession,
} from "@/models/deal-session";

import type {
  Offer,
} from "@/models/offer";

import type {
  PolicyEvaluationContext,
} from "@/engine/policy-types";

describe(
  "NegotiationEngine human approval",
  () => {
    function createSession(): DealSession {
      return {
        id: "deal-human-approval",
        productId: "product-1",
        merchantId: "merchant-1",
        buyerId: "buyer-1",
        state: "CREATED",
        currentRound: 0,
        maxRounds: 5,
        currency: "INR",
        initialPrice: 100000,
        currentPrice: 100000,
        createdAt:
          new Date().toISOString(),
        updatedAt:
          new Date().toISOString(),
        expiresAt:
          new Date(
            Date.now() + 3600000
          ).toISOString(),
      };
    }

    function createOffer(): Offer {
      return {
        id: "offer-human-approval",
        dealSessionId:
          "deal-human-approval",
        actor:
          "MERCHANT_AGENT",
        price: 80000,
        quantity: 1,
        currency: "INR",
        status: "PENDING",
        round: 1,
        createdAt:
          new Date().toISOString(),
      };
    }

    function createContext(
      session: DealSession,
      offer: Offer
    ): PolicyEvaluationContext {
      return {
        product: {
          id: session.productId,
          name: "Test Product",
          description:
            "Test product",
          category:
            "Electronics",
          currency:
            "INR",
          price:
            session.initialPrice,
          inventory: {
            available: 100,
            reserved: 0,
          },
          status:
            "ACTIVE",
          merchantId:
            session.merchantId,
          createdAt:
            session.createdAt,
          updatedAt:
            session.updatedAt,
        },

        policy: {
          id:
            "policy-human-approval",

          merchantId:
            session.merchantId,

          maxDiscountPercent:
            30,

          minimumSellingPrice:
            70000,

          minimumMargin:
            10000,

          maxNegotiationRounds:
            session.maxRounds,

          bundleRules: {
            allowed: false,
          },

          approval: {
            level:
              "HUMAN_REQUIRED",

            threshold:
              85000,
          },

          currency:
            "INR",

          active:
            true,

          createdAt:
            session.createdAt,

          updatedAt:
            session.updatedAt,
        },

        offer,

        currentRound:
          session.currentRound,
      };
    }

    it(
      "creates a pending approval request",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const auditService =
          new AuditService(
            persistence
          );

        const approvalService =
          new HumanApprovalService();

        const engine =
          new NegotiationEngine(
            new DealController(),
            auditService,
            approvalService,
            persistence
          );

        const session =
          createSession();

        const offer =
          createOffer();

        const result =
          engine.processOffer(
            session,
            offer,
            createContext(
              session,
              offer
            )
          );

        expect(
          result.success
        ).toBe(true);

        expect(
          result.decision
        ).toBe(
          "REQUIRE_HUMAN_APPROVAL"
        );

        expect(
          result.approvalRequired
        ).toBe(true);

        expect(
          result.session.state
        ).toBe(
          "POLICY_CHECK"
        );

        const approval =
          persistence.getHumanApproval(
            session.id
          );

        expect(
          approval
        ).toBeDefined();

        expect(
          approval?.status
        ).toBe("PENDING");

        expect(
          approval?.requestedPrice
        ).toBe(
          offer.price
        );
      }
    );

    it(
      "records a human approval audit event",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const auditService =
          new AuditService(
            persistence
          );

        const approvalService =
          new HumanApprovalService();

        const engine =
          new NegotiationEngine(
            new DealController(),
            auditService,
            approvalService,
            persistence
          );

        const session =
          createSession();

        const offer =
          createOffer();

        engine.processOffer(
          session,
          offer,
          createContext(
            session,
            offer
          )
        );

        const audit =
          persistence.getAuditEvents(
            session.id
          );

        expect(
          audit.some(
            (event) =>
              event.type ===
              "HUMAN_APPROVAL_REQUESTED"
          )
        ).toBe(true);
      }
    );

    it(
      "does not accept the deal automatically",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const auditService =
          new AuditService(
            persistence
          );

        const approvalService =
          new HumanApprovalService();

        const engine =
          new NegotiationEngine(
            new DealController(),
            auditService,
            approvalService,
            persistence
          );

        const session =
          createSession();

        const offer =
          createOffer();

        const result =
          engine.processOffer(
            session,
            offer,
            createContext(
              session,
              offer
            )
          );

        expect(
          result.session.state
        ).not.toBe(
          "ACCEPTED"
        );

        expect(
          result.session.state
        ).toBe(
          "POLICY_CHECK"
        );

        expect(
          result.session.acceptedPrice
        ).toBeUndefined();
      }
    );
  }
);