import type { DealSession } from "@/models/deal-session";
import type { Offer } from "@/models/offer";

import { validateOffer } from "@/validators/offer-validator";
import { randomUUID } from "node:crypto";

import {
  evaluatePolicy,
} from "@/engine/policy-engine";

import type {
  PolicyEvaluationContext,
} from "@/engine/policy-types";

import {
  DealController,
} from "@/controllers/deal-controller";

import {
  AuditService,
} from "@/services/audit-service";

import {
  HumanApprovalService,
} from "@/services/human-approval-service";

import type {
  PersistenceService,
} from "@/services/persistence-service";

import {
  persistence as defaultPersistence,
} from "@/services/persistence-instance";

export interface NegotiationResult {
  success: boolean;

  decision:
    | "ALLOW"
    | "REJECT"
    | "REQUIRE_HUMAN_APPROVAL";

  session: DealSession;

  offer: Offer;

  approvalRequired?: boolean;

  errors: string[];
}

export class NegotiationEngine {
  private readonly controller: DealController;

  private readonly auditService: AuditService;

  private readonly humanApprovalService:
    HumanApprovalService;

  private readonly persistence:
    PersistenceService;

  constructor(
    controller = new DealController(),
    auditService = new AuditService(),
    humanApprovalService =
      new HumanApprovalService(),
    persistenceService:
      PersistenceService =
        defaultPersistence
  ) {
    this.controller =
      controller;

    this.auditService =
      auditService;

    this.humanApprovalService =
      humanApprovalService;

    this.persistence =
      persistenceService;
  }

  processOffer(
    session: DealSession,
    offer: Offer,
    policyContext: PolicyEvaluationContext
  ): NegotiationResult {
    /*
     * =====================================================
     * 1. VALIDATE OFFER
     * =====================================================
     */

    const validation =
      validateOffer(offer);

    if (!validation.valid) {
      this.auditService.record({
        id: `audit-${randomUUID()}`,
        dealSessionId: session.id,
        actor: "SYSTEM",
        type: "OFFER_REJECTED",
        description:
          "Offer failed validation",
        metadata: {
          errors:
            validation.errors,
        },
        createdAt:
          new Date().toISOString(),
      });

      return {
        success: false,
        decision: "REJECT",
        session,
        offer,
        errors:
          validation.errors,
      };
    }

    /*
     * =====================================================
     * 2. VERIFY DEAL SESSION
     * =====================================================
     */

    if (
      offer.dealSessionId !==
      session.id
    ) {
      const error =
        "Offer does not belong to this deal session.";

      this.auditService.record({
        id: `audit-${randomUUID()}`,
        dealSessionId: session.id,
        actor: "SYSTEM",
        type: "OFFER_REJECTED",
        description: error,
        metadata: {
          offerDealSessionId:
            offer.dealSessionId,
        },
        createdAt:
          new Date().toISOString(),
      });

      return {
        success: false,
        decision: "REJECT",
        session,
        offer,
        errors: [error],
      };
    }

    /*
     * =====================================================
     * 3. VALIDATE ROUND
     * =====================================================
     */

    const expectedRound =
      session.currentRound + 1;

    if (
      offer.round !==
      expectedRound
    ) {
      const error =
        `Invalid negotiation round. Expected round ${expectedRound}, received ${offer.round}.`;

      this.auditService.record({
        id: `audit-${randomUUID()}`,
        dealSessionId: session.id,
        actor: "SYSTEM",
        type: "OFFER_REJECTED",
        description:
          "Offer submitted for an invalid negotiation round",
        metadata: {
          expectedRound,
          receivedRound:
            offer.round,
        },
        createdAt:
          new Date().toISOString(),
      });

      return {
        success: false,
        decision: "REJECT",
        session,
        offer,
        errors: [error],
      };
    }

    /*
     * =====================================================
     * 4. ENFORCE MAXIMUM ROUNDS
     * =====================================================
     */

    if (
      offer.round >
      session.maxRounds
    ) {
      const error =
        `Maximum negotiation rounds reached. Limit is ${session.maxRounds}.`;

      this.auditService.record({
        id: `audit-${randomUUID()}`,
        dealSessionId: session.id,
        actor: "SYSTEM",
        type: "OFFER_REJECTED",
        description:
          "Offer rejected because maximum negotiation rounds were reached",
        metadata: {
          currentRound:
            session.currentRound,
          maxRounds:
            session.maxRounds,
        },
        createdAt:
          new Date().toISOString(),
      });

      return {
        success: false,
        decision: "REJECT",
        session,
        offer,
        errors: [error],
      };
    }

    /*
     * =====================================================
     * 5. DETERMINISTIC POLICY EVALUATION
     * =====================================================
     *
     * AI does not decide whether the offer is allowed.
     *
     * The deterministic policy engine decides.
     */

    const policyResult =
      evaluatePolicy(
        policyContext
      );

    this.auditService.record({
      id: `audit-${randomUUID()}`,
      dealSessionId: session.id,
      actor: "SYSTEM",
      type: "POLICY_CHECKED",
      description:
        "Offer evaluated against merchant policy",
      metadata: {
        decision:
          policyResult.decision,
        violations:
          policyResult.violations,
      },
      createdAt:
        new Date().toISOString(),
    });

    /*
     * =====================================================
     * 6. FIRST OFFER:
     *    CREATED → NEGOTIATING
     * =====================================================
     */

    let negotiationSession =
      session;

    if (
      session.state ===
      "CREATED"
    ) {
      const transition =
        this.controller.transition(
          session,
          "NEGOTIATING"
        );

      if (
        !transition.success
      ) {
        return {
          success: false,
          decision: "REJECT",
          session,
          offer,
          errors: [
            transition.error ??
              "Unable to transition deal to NEGOTIATING.",
          ],
        };
      }

      negotiationSession =
        transition.session;

      this.auditService.record({
        id: `audit-${randomUUID()}`,
        dealSessionId: session.id,
        actor: "SYSTEM",
        type: "STATE_CHANGED",
        description:
          "Deal entered negotiation.",
        metadata: {
          from: "CREATED",
          to: "NEGOTIATING",
        },
        createdAt:
          new Date().toISOString(),
      });
    } else if (
      session.state !==
      "NEGOTIATING"
    ) {
      const error =
        `Cannot submit an offer while deal is in ${session.state} state.`;

      this.auditService.record({
        id: `audit-${randomUUID()}`,
        dealSessionId: session.id,
        actor: "SYSTEM",
        type: "OFFER_REJECTED",
        description: error,
        metadata: {
          state:
            session.state,
        },
        createdAt:
          new Date().toISOString(),
      });

      return {
        success: false,
        decision: "REJECT",
        session,
        offer,
        errors: [error],
      };
    }

    /*
     * =====================================================
     * 7. HARD POLICY REJECTION
     * =====================================================
     *
     * AI cannot override this.
     */

    if (
      policyResult.decision ===
      "REJECT"
    ) {
      const errors =
        policyResult.violations
          .map(
            (violation) =>
              violation.message
          );

      this.auditService.record({
        id: `audit-${randomUUID()}`,
        dealSessionId: session.id,
        actor: "SYSTEM",
        type: "OFFER_REJECTED",
        description:
          "Offer rejected by deterministic merchant policy",
        metadata: {
          violations:
            policyResult.violations,
        },
        createdAt:
          new Date().toISOString(),
      });

      return {
        success: false,
        decision: "REJECT",
        session:
          negotiationSession,
        offer,
        errors:
          errors.length > 0
            ? errors
            : [
                "Offer rejected by merchant policy.",
              ],
      };
    }

    /*
     * =====================================================
     * 8. HUMAN APPROVAL GATE
     * =====================================================
     *
     * NEGOTIATING
     *      ↓
     * POLICY_CHECK
     *      ↓
     * HUMAN APPROVAL
     *
     * The AI cannot approve this.
     */

    if (
      policyResult.decision ===
      "REQUIRE_HUMAN_APPROVAL"
    ) {
      const policyTransition =
        this.controller.transition(
          negotiationSession,
          "POLICY_CHECK"
        );

      if (
        !policyTransition.success
      ) {
        return {
          success: false,
          decision:
            "REQUIRE_HUMAN_APPROVAL",
          session:
            negotiationSession,
          offer,
          approvalRequired: true,
          errors: [
            policyTransition.error ??
              "Unable to move deal to POLICY_CHECK.",
          ],
        };
      }

      const policySession =
        policyTransition.session;

      /*
       * Look for an existing approval request.
       *
       * This prevents duplicate requests.
       */

      let approval =
        this.persistence.getHumanApproval(
          session.id
        );

      if (
        !approval ||
        approval.status !==
          "PENDING"
      ) {
        approval =
          this.humanApprovalService.createRequest(
            policySession,
            offer.actor,
            offer.price,
            "This offer requires human approval."
          );

        this.persistence.createHumanApproval(
          approval
        );

        /*
         * IMPORTANT:
         *
         * This is the audit event the test
         * is looking for.
         */

        this.auditService.record({
          id: `audit-${randomUUID()}`,
          dealSessionId:
            session.id,
          actor: "SYSTEM",
          type:
            "HUMAN_APPROVAL_REQUESTED",
          description:
            "Human approval requested for offer.",
          metadata: {
            approvalId:
              approval.id,
            offerId:
              offer.id,
            requestedPrice:
              offer.price,
            currency:
              offer.currency,
          },
          createdAt:
            new Date().toISOString(),
        });
      }

      /*
       * Record the state transition.
       */

      this.auditService.record({
        id: `audit-${randomUUID()}`,
        dealSessionId:
          session.id,
        actor: "SYSTEM",
        type: "STATE_CHANGED",
        description:
          "Deal moved to POLICY_CHECK pending human approval.",
        metadata: {
          from: "NEGOTIATING",
          to: "POLICY_CHECK",
        },
        createdAt:
          new Date().toISOString(),
      });

      /*
       * IMPORTANT:
       *
       * The negotiation result reports that
       * human approval is required.
       *
       * success remains TRUE because the offer
       * was successfully processed into the
       * controlled approval workflow.
       *
       * The deal itself is NOT accepted.
       */

      return {
        success: true,

        decision:
          "REQUIRE_HUMAN_APPROVAL",

        session:
          policySession,

        offer,

        approvalRequired:
          true,

        errors: [],
      };
    }

    /*
     * =====================================================
     * 9. POLICY ALLOWED
     * =====================================================
     */

    const updatedSession:
      DealSession = {
        ...negotiationSession,

        currentRound:
          offer.round,

        currentPrice:
          offer.price,

        updatedAt:
          new Date().toISOString(),
      };

    /*
     * =====================================================
     * 10. RECORD OFFER
     * =====================================================
     */

    this.auditService.record({
      id: `audit-${randomUUID()}`,
      dealSessionId:
        session.id,
      actor: offer.actor,
      type: "OFFER_CREATED",
      description:
        "Offer accepted into negotiation flow.",
      metadata: {
        offerId:
          offer.id,
        price:
          offer.price,
        quantity:
          offer.quantity,
        round:
          offer.round,
      },
      createdAt:
        new Date().toISOString(),
    });

    /*
     * =====================================================
     * 11. NORMAL SUCCESS
     * =====================================================
     */

    return {
      success: true,
      decision: "ALLOW",
      session:
        updatedSession,
      offer,
      approvalRequired:
        false,
      errors: [],
    };
  }

  getAuditTrail(
    dealSessionId: string
  ) {
    return this.auditService.getByDealSession(
      dealSessionId
    );
  }
}