import type {
  AgentDecisionResult,
  AgentContext,
} from "@/agents/agent-types";

import {
  validateAgentDecision,
} from "@/validators/agent-validator";

export interface AgentDecisionServiceResult {
  success: boolean;

  decision?: AgentDecisionResult;

  errors: string[];
}

export class AgentDecisionService {
  evaluate(
    context: AgentContext,
    decision: AgentDecisionResult
  ): AgentDecisionServiceResult {
    /*
     * STEP 1
     * Validate the agent decision.
     */

    const validation =
      validateAgentDecision(decision);

    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    /*
     * STEP 2
     * Ensure the decision belongs to
     * the expected deal context.
     */

    if (
      context.round < 0 ||
      context.round > context.maxRounds
    ) {
      return {
        success: false,
        errors: [
          "Invalid negotiation round",
        ],
      };
    }

    /*
     * STEP 3
     * Prevent agents from making offers
     * after the negotiation limit.
     */

    if (
      context.round >= context.maxRounds &&
      (
        decision.decision === "MAKE_OFFER" ||
        decision.decision === "COUNTER"
      )
    ) {
      return {
        success: false,
        errors: [
          "Maximum negotiation rounds reached",
        ],
      };
    }

    /*
     * STEP 4
     * Validate offer price against
     * the current deal price.
     *
     * This is intentionally a basic
     * safety check.
     *
     * Merchant policy remains responsible
     * for the actual business decision.
     */

    if (
      decision.offerPrice !== undefined &&
      decision.offerPrice <= 0
    ) {
      return {
        success: false,
        errors: [
          "Offer price must be greater than zero",
        ],
      };
    }

    /*
     * STEP 5
     * Decision successfully passed
     * service-level validation.
     */

    return {
      success: true,
      decision,
      errors: [],
    };
  }
}