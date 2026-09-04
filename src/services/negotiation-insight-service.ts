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

import type {
  NegotiationInsight,
  NegotiationInsightSeverity,
} from "@/models/negotiation-insight";

export class NegotiationInsightService {
  createInsight(
    session: DealSession,
    decision: AgentDecisionResult,
    offer: Offer | undefined,
    policyContext: PolicyEvaluationContext
  ): NegotiationInsight {
    const proposedPrice =
      offer?.price ?? decision.offerPrice;

    const currentPrice =
      session.currentPrice;

    const initialPrice =
      session.initialPrice;

    const policyFloor =
      policyContext.policy.minimumSellingPrice;

    const currency =
      session.currency;

    const facts: string[] = [];

    let severity: NegotiationInsightSeverity =
      "INFO";

    let title = "Negotiation action";

    let summary =
      "The agent proposed the next negotiation action.";

    /*
     * ------------------------------------------------------------
     * COMMON FACTS
     * ------------------------------------------------------------
     */

    if (
      proposedPrice !== undefined &&
      proposedPrice !== null
    ) {
      facts.push(
        `Proposed price: ${currency} ${this.formatAmount(
          proposedPrice
        )}`
      );
    }

    facts.push(
      `Current deal price: ${currency} ${this.formatAmount(
        currentPrice
      )}`
    );

    facts.push(
      `Merchant policy floor: ${currency} ${this.formatAmount(
        policyFloor
      )}`
    );

    facts.push(
      `Round: ${session.currentRound} / ${session.maxRounds}`
    );

    /*
     * ------------------------------------------------------------
     * ACTION-SPECIFIC EXPLANATION
     * ------------------------------------------------------------
     */

    switch (decision.decision) {
      case "MAKE_OFFER": {
        title =
          decision.agent === "BUYER_AGENT"
            ? "Buyer made an offer"
            : "Merchant made an offer";

        summary =
          decision.agent === "BUYER_AGENT"
            ? "The buyer agent proposed a price for consideration."
            : "The merchant agent proposed a price for consideration.";

        if (
          proposedPrice !== undefined &&
          proposedPrice < policyFloor
        ) {
          severity = "BLOCKED";

          facts.push(
            `Policy floor violation: proposed price is below ${currency} ${this.formatAmount(
              policyFloor
            )}.`
          );

          facts.push(
            "The deterministic policy layer must block this offer."
          );
        } else {
          severity = "SUCCESS";

          facts.push(
            "The proposed price is at or above the merchant policy floor."
          );

          facts.push(
            "The deterministic policy layer confirms that the price is within the configured merchant boundary."
          );
        }

        break;
      }

      case "COUNTER": {
        title =
          decision.agent === "BUYER_AGENT"
            ? "Buyer countered the offer"
            : "Merchant countered the offer";

        summary =
          "A counter-offer was proposed to continue the negotiation.";

        if (
          proposedPrice !== undefined &&
          proposedPrice < policyFloor
        ) {
          severity = "BLOCKED";

          facts.push(
            `Counter price is below the merchant floor of ${currency} ${this.formatAmount(
              policyFloor
            )}.`
          );

          facts.push(
            "The deterministic policy layer remains authoritative."
          );
        } else {
          severity = "SUCCESS";

          facts.push(
            "Counter-offer is within the configured merchant price boundary."
          );

          facts.push(
            "The deterministic policy layer confirms that the counter-offer is within the configured price boundary."
          );
        }

        break;
      }

      case "ACCEPT": {
        title = "Deal accepted";

        summary =
          "The agent requested acceptance after the deterministic policy gate.";

        severity = "SUCCESS";

        facts.push(
          "Acceptance is only executable after POLICY_CHECK."
        );

        facts.push(
          "The deterministic policy layer remains authoritative for acceptance eligibility."
        );

        facts.push(
          "The state machine controls the final ACCEPTED transition."
        );

        break;
      }

      case "REJECT": {
        title = "Deal rejected";

        summary =
          "The agent requested rejection after the deterministic policy gate.";

        severity = "WARNING";

        facts.push(
          "Rejection is controlled by the deterministic state machine."
        );

        facts.push(
          "The deterministic policy layer remains authoritative for business-rule enforcement."
        );

        break;
      }

      case "STOP": {
        title = "Negotiation stopped";

        summary =
          "The agent requested cancellation of the negotiation.";

        severity = "WARNING";

        facts.push(
          "The state machine controls whether cancellation is allowed."
        );

        facts.push(
          "The deterministic execution layer remains authoritative over the final deal state."
        );

        break;
      }

      default: {
        break;
      }
    }

    /*
     * ------------------------------------------------------------
     * PRICE MOVEMENT
     * ------------------------------------------------------------
     */

    if (
      proposedPrice !== undefined &&
      proposedPrice !== null
    ) {
      if (proposedPrice < currentPrice) {
        facts.push(
          `Price movement: ${currency} ${this.formatAmount(
            currentPrice - proposedPrice
          )} lower than the current price.`
        );
      } else if (proposedPrice > currentPrice) {
        facts.push(
          `Price movement: ${currency} ${this.formatAmount(
            proposedPrice - currentPrice
          )} higher than the current price.`
        );
      } else {
        facts.push(
          "Price movement: no change from the current deal price."
        );
      }
    }

    /*
     * ------------------------------------------------------------
     * STARTING PRICE COMPARISON
     * ------------------------------------------------------------
     */

    if (
      proposedPrice !== undefined &&
      proposedPrice !== null &&
      initialPrice > 0
    ) {
      const percentage =
        ((initialPrice - proposedPrice) /
          initialPrice) *
        100;

      if (percentage > 0) {
        facts.push(
          `Price is ${percentage.toFixed(
            1
          )}% below the starting price.`
        );
      } else if (percentage < 0) {
        facts.push(
          `Price is ${Math.abs(
            percentage
          ).toFixed(
            1
          )}% above the starting price.`
        );
      }
    }

    /*
     * ------------------------------------------------------------
     * POLICY SUMMARY
     * ------------------------------------------------------------
     */

    const policyAllowed =
      proposedPrice === undefined ||
      proposedPrice >= policyFloor;

    const policyReason =
      proposedPrice !== undefined &&
      proposedPrice < policyFloor
        ? `Proposed price is below the merchant minimum selling price of ${currency} ${this.formatAmount(
            policyFloor
          )}.`
        : undefined;

    return {
      actor: decision.agent,

      action: decision.decision,

      severity,

      title,

      summary,

      facts,

      price: {
        proposed: proposedPrice,
        current: currentPrice,
        initial: initialPrice,
        policyFloor,
        currency,
      },

      round: {
        current: session.currentRound,
        maximum: session.maxRounds,
      },

      policy: {
        /*
         * The insight service describes the policy context.
         * It does NOT perform the authoritative policy decision.
         *
         * Actual business-rule enforcement remains inside the
         * deterministic policy / negotiation layer.
         */
        evaluated:
          decision.decision === "ACCEPT" ||
          decision.decision === "REJECT" ||
          proposedPrice !== undefined,

        allowed: policyAllowed,

        reason: policyReason,
      },

      generatedAt:
        new Date().toISOString(),
    };
  }

  private formatAmount(
    amount: number
  ): string {
    return amount.toLocaleString("en-IN");
  }
}