import type {
  AgentDecisionResult,
} from "@/agents/agent-types";

import type {
  DealSession,
} from "@/models/deal-session";

import type {
  Offer,
} from "@/models/offer";

import type {
  PolicyEvaluationContext,
} from "@/engine/policy-types";

import {
  validateAgentDecision,
} from "@/validators/agent-validator";

import {
  NegotiationEngine,
  type NegotiationResult,
} from "@/engine/negotiation-engine";

import {
  DealController,
} from "@/controllers/deal-controller";

import {
  persistence as defaultPersistence,
} from "@/services/persistence-instance";

import type {
  PersistenceService,
} from "@/services/persistence-service";

import type {
  NegotiationInsight,
} from "@/models/negotiation-insight";

import {
  NegotiationInsightService,
} from "@/services/negotiation-insight-service";

export interface OrchestrationResult {
  success: boolean;

  action:
    | "PROCESSED_OFFER"
    | "ACCEPTED"
    | "REJECTED"
    | "STOPPED"
    | "INVALID_DECISION";

  session: DealSession;

  offer?: Offer;

  negotiationResult?: NegotiationResult;

  insight?: NegotiationInsight;

  errors: string[];
}

export class NegotiationOrchestrator {
  private readonly insightService =
    new NegotiationInsightService();

  constructor(
    private readonly negotiationEngine =
      new NegotiationEngine(),

    private readonly controller =
      new DealController(),

    private readonly persistence:
      PersistenceService =
        defaultPersistence
  ) {}

  processAgentDecision(
    session: DealSession,
    decision: AgentDecisionResult,
    offer: Offer | undefined,
    policyContext: PolicyEvaluationContext
  ): OrchestrationResult {
    /*
     * ============================================================
     * STEP 1 — VALIDATE AGENT DECISION
     * ============================================================
     */

    const validation =
      validateAgentDecision(decision);

    if (!validation.valid) {
      return {
        success: false,
        action: "INVALID_DECISION",
        session,
        offer,
        errors: validation.errors,
      };
    }

    /*
     * ============================================================
     * STEP 2 — PROCESS OFFER-PRODUCING DECISIONS
     * ============================================================
     */

    if (
      decision.decision === "MAKE_OFFER" ||
      decision.decision === "COUNTER"
    ) {
      if (!offer) {
        return {
          success: false,
          action: "INVALID_DECISION",
          session,
          errors: [
            "An offer is required for this agent decision.",
          ],
        };
      }

      const result =
        this.negotiationEngine.processOffer(
          session,
          offer,
          policyContext
        );

      const insight =
        this.insightService.createInsight(
          result.session,
          decision,
          result.offer,
          policyContext
        );

      return {
        success: result.success,
        action: "PROCESSED_OFFER",
        session: result.session,
        offer: result.offer,
        negotiationResult: result,
        insight,
        errors: result.errors,
      };
    }

    /*
     * ============================================================
     * STEP 3 — ACCEPT
     * ============================================================
     *
     * ACCEPT is only allowed from POLICY_CHECK.
     *
     * If human approval exists, it must be APPROVED.
     *
     * Only the deterministic state machine may perform:
     *
     * POLICY_CHECK → ACCEPTED
     */

    if (
      decision.decision === "ACCEPT"
    ) {
      if (
        session.state !== "POLICY_CHECK"
      ) {
        return {
          success: false,
          action: "INVALID_DECISION",
          session,
          offer,
          errors: [
            `ACCEPT is only allowed from POLICY_CHECK. Current state: ${session.state}`,
          ],
        };
      }

      /*
       * ==========================================================
       * HUMAN APPROVAL GATE
       * ==========================================================
       */

      const approval =
        this.persistence.getHumanApproval(
          session.id
        );

      if (
        approval &&
        approval.status !== "APPROVED"
      ) {
        return {
          success: false,
          action: "INVALID_DECISION",
          session,
          offer,
          errors: [
            approval.status === "PENDING"
              ? "Human approval is required before the deal can be accepted."
              : "Human approval was rejected. The deal cannot be accepted.",
          ],
        };
      }

      /*
       * ==========================================================
       * STATE MACHINE ACCEPTANCE
       * ==========================================================
       */

      const acceptanceTransition =
        this.controller.transition(
          session,
          "ACCEPTED"
        );

      if (
        !acceptanceTransition.success
      ) {
        return {
          success: false,
          action: "INVALID_DECISION",
          session,
          offer,
          errors: [
            acceptanceTransition.error ??
              "Unable to accept deal.",
          ],
        };
      }

      const insight =
        this.insightService.createInsight(
          acceptanceTransition.session,
          decision,
          offer,
          policyContext
        );

      return {
        success: true,
        action: "ACCEPTED",
        session:
          acceptanceTransition.session,
        offer,
        insight,
        errors: [],
      };
    }

    /*
     * ============================================================
     * STEP 4 — REJECT
     * ============================================================
     *
     * REJECT is only allowed from POLICY_CHECK.
     */

    if (
      decision.decision === "REJECT"
    ) {
      if (
        session.state !== "POLICY_CHECK"
      ) {
        return {
          success: false,
          action: "INVALID_DECISION",
          session,
          offer,
          errors: [
            `REJECT is only allowed from POLICY_CHECK. Current state: ${session.state}`,
          ],
        };
      }

      const rejectionTransition =
        this.controller.transition(
          session,
          "REJECTED"
        );

      if (
        !rejectionTransition.success
      ) {
        return {
          success: false,
          action: "INVALID_DECISION",
          session,
          offer,
          errors: [
            rejectionTransition.error ??
              "Unable to reject deal.",
          ],
        };
      }

      const insight =
        this.insightService.createInsight(
          rejectionTransition.session,
          decision,
          offer,
          policyContext
        );

      return {
        success: true,
        action: "REJECTED",
        session:
          rejectionTransition.session,
        offer,
        insight,
        errors: [],
      };
    }

    /*
     * ============================================================
     * STEP 5 — STOP
     * ============================================================
     *
     * STOP maps to CANCELLED.
     *
     * This remains controlled by the state machine.
     */

    const cancellationTransition =
      this.controller.transition(
        session,
        "CANCELLED"
      );

    if (
      !cancellationTransition.success
    ) {
      return {
        success: false,
        action: "INVALID_DECISION",
        session,
        offer,
        errors: [
          cancellationTransition.error ??
            "Unable to cancel deal.",
        ],
      };
    }

    const insight =
      this.insightService.createInsight(
        cancellationTransition.session,
        decision,
        offer,
        policyContext
      );

    return {
      success: true,
      action: "STOPPED",
      session:
        cancellationTransition.session,
      offer,
      insight,
      errors: [],
    };
  }
}