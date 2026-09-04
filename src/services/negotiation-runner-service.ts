import type { DealSession } from "@/models/deal-session";
import type { Offer } from "@/models/offer";
import type { Product } from "@/models/product";
import type { MerchantPolicy } from "@/models/merchant-policy";

import type {
  AgentContext,
  AgentDecisionResult,
} from "@/agents/agent-types";

import type {
  PolicyEvaluationContext,
} from "@/engine/policy-types";

import { BuyerAgent } from "@/agents/buyer-agent";
import { MerchantAgent } from "@/agents/merchant-agent";
import { NegotiationOrchestrator } from "@/orchestrator/negotiation-orchestrator";
import { DealController } from "@/controllers/deal-controller";
import { evaluatePolicy } from "@/engine/policy-engine";
import { persistence } from "@/services/persistence-instance";


export interface NegotiationRunnerResult {
  success: boolean;
  session: DealSession;
  offers: Offer[];
  decisions: AgentDecisionResult[];
  errors: string[];
}

type NegotiatingAgent =
  | "BUYER_AGENT"
  | "MERCHANT_AGENT";

export class NegotiationRunnerService {
  private readonly buyerAgent = new BuyerAgent();

  private readonly merchantAgent = new MerchantAgent();

  private readonly orchestrator =
    new NegotiationOrchestrator();

  run(
    initialSession: DealSession,
    product: Product,
    policy: MerchantPolicy
  ): NegotiationRunnerResult {
    let session: DealSession = {
      ...initialSession,
    };

    const offers: Offer[] = [];

    const decisions: AgentDecisionResult[] = [];

    let currentAgent: NegotiatingAgent =
      "BUYER_AGENT";

    /*
     * Every iteration represents ONE agent action.
     *
     * currentRound represents the number of
     * COMPLETED negotiation rounds.
     *
     * A complete round is:
     *
     * BUYER -> MERCHANT
     */

    while (
      session.currentRound < session.maxRounds &&
      !this.isTerminal(session)
    ) {
      const actionRound =
        session.currentRound + 1;

      /*
       * Read the complete offer history before
       * asking the current agent to decide.
       */
      const previousOffers =
        persistence.getOffers(session.id);

      const context: AgentContext = {
        dealSessionId: session.id,

        round: actionRound,

        maxRounds: session.maxRounds,

        currentPrice: session.currentPrice,

        initialPrice: session.initialPrice,

        currency: "INR",

        previousOffers,
      };

      /*
       * Ask the appropriate agent to decide.
       */
      const decision =
        currentAgent === "BUYER_AGENT"
          ? this.buyerAgent.decide(context)
          : this.merchantAgent.decide(context);

      decisions.push(decision);

      /*
       * Build an offer only for decisions that
       * actually produce an offer.
       */
      let offer: Offer | undefined;

      const createsOffer =
        decision.decision === "MAKE_OFFER" ||
        decision.decision === "COUNTER";

      if (createsOffer) {
        if (decision.offerPrice === undefined) {
          return {
            success: false,
            session,
            offers,
            decisions,
            errors: [
              "Agent decision did not include an offer price",
            ],
          };
        }

        offer = {
          id: `offer-${crypto.randomUUID()}`,

          dealSessionId: session.id,

          actor: decision.agent,

          price: decision.offerPrice,

          quantity: decision.quantity ?? 1,

          currency: "INR",

          status: "PENDING",

          round: actionRound,

          createdAt: new Date().toISOString(),
        };
      }

      /*
       * The policy context requires an offer even
       * when the agent chooses ACCEPT / REJECT / STOP.
       *
       * The fallback offer is NEVER persisted.
       */
      const policyOffer: Offer =
        offer ?? {
          id: `offer-${crypto.randomUUID()}`,

          dealSessionId: session.id,

          actor: decision.agent,

          price: session.currentPrice,

          quantity: 1,

          currency: "INR",

          status: "PENDING",

          round: actionRound,

          createdAt: new Date().toISOString(),
        };

      const policyContext: PolicyEvaluationContext = {
        product,

        policy,

        offer: policyOffer,

        currentRound: actionRound,
      };

      /*
       * Send the decision through the orchestration
       * layer.
       */
      const result =
        this.orchestrator.processAgentDecision(
          session,
          decision,
          offer,
          policyContext
        );

      /*
       * Defensive handling.
       *
       * This prevents a malformed mocked dependency
       * from leaving the runner in an unusable state.
       */
      if (!result) {
        return {
          success: false,
          session,
          offers,
          decisions,
          errors: [
            "Negotiation orchestrator returned no result",
          ],
        };
      }

      /*
       * The orchestrator is authoritative for the
       * state transition.
       */
      session = result.session;

      /*
       * If orchestration failed, stop immediately.
       */
      if (!result.success) {
        return {
          success: false,
          session,
          offers,
          decisions,
          errors: result.errors,
        };
      }

      /*
       * Persist the current deal state.
       */
      persistence.updateDeal(session);

      /*
       * Persist successful offers.
       */
      if (
        result.action === "PROCESSED_OFFER" &&
        result.offer
      ) {
        persistence.createOffer(result.offer);

        offers.push(result.offer);

        /*
         * Keep currentPrice synchronized even when
         * a mocked/custom orchestrator does not do it.
         */
        session = {
          ...session,

          currentPrice:
            result.offer.price,

          updatedAt:
            new Date().toISOString(),
        };

        persistence.updateDeal(session);
      }

      /*
       * TERMINAL STATE CHECK
       *
       * This check MUST happen before switching
       * agents or advancing the round.
       */
      if (this.isTerminal(session)) {
        break;
      }

      /*
       * If the agent itself selected ACCEPT,
       * the deal must be accepted.
       *
       * In production this normally happens inside
       * NegotiationOrchestrator. This fallback keeps
       * the runner deterministic and protects against
       * an orchestrator adapter/mock returning only
       * a non-terminal session.
       */
      if (decision.decision === "ACCEPT") {
        session = {
          ...session,

          state: "ACCEPTED",

          updatedAt:
            new Date().toISOString(),
        };

        persistence.updateDeal(session);

        break;
      }

      /*
       * REJECT immediately terminates the deal.
       */
      if (decision.decision === "REJECT") {
        session = {
          ...session,

          state: "REJECTED",

          updatedAt:
            new Date().toISOString(),
        };

        persistence.updateDeal(session);

        break;
      }

      /*
       * STOP immediately terminates the deal.
       */
      if (decision.decision === "STOP") {
        session = {
          ...session,

          state: "CANCELLED",

          updatedAt:
            new Date().toISOString(),
        };

        persistence.updateDeal(session);

        break;
      }

      /*
       * Only the MERCHANT action completes a full
       * buyer -> merchant negotiation round.
       */
      if (
        currentAgent === "MERCHANT_AGENT"
      ) {
        session = {
          ...session,

          currentRound: actionRound,

          updatedAt:
            new Date().toISOString(),
        };

        persistence.updateDeal(session);
      }

      /*
       * Switch to the other agent.
       */
      currentAgent =
        currentAgent === "BUYER_AGENT"
          ? "MERCHANT_AGENT"
          : "BUYER_AGENT";
    }

    /*
     * If maximum rounds were reached without
     * reaching a terminal state, expire the deal.
     */
    if (
      session.currentRound >=
        session.maxRounds &&
      !this.isTerminal(session)
    ) {
      session = {
        ...session,

        state: "EXPIRED",

        updatedAt:
          new Date().toISOString(),
      };

      persistence.updateDeal(session);
    }

    const accepted =
      session.state === "ACCEPTED";

    return {
      success: accepted,

      session,

      offers,

      decisions,

      errors: accepted
        ? []
        : [
            session.state === "EXPIRED"
              ? "Negotiation ended because maximum rounds were reached"
              : "Negotiation ended without an accepted deal",
          ],
    };
  }
    /**
   * Runs a complete negotiation using real AI agents.
   *
   * The AI layer only produces AgentDecisionResult.
   * Every decision still passes through:
   *
   * Agent Validator
   *        ↓
   * Negotiation Engine
   *        ↓
   * Policy Engine
   *        ↓
   * State Machine
   */
  async runWithAI(
    initialSession: DealSession,
    product: Product,
    policy: MerchantPolicy
  ): Promise<NegotiationRunnerResult> {
    let session: DealSession = {
      ...initialSession,
    };

    const offers: Offer[] = [];

    const decisions: AgentDecisionResult[] = [];

    let currentAgent: NegotiatingAgent =
      "BUYER_AGENT";

    while (
      session.currentRound <
        session.maxRounds &&
      !this.isTerminal(session)
    ) {
      const actionRound =
        session.currentRound + 1;

      const previousOffers =
        persistence.getOffers(
          session.id
        );

      const context: AgentContext = {
        dealSessionId:
          session.id,

        round:
          actionRound,

        maxRounds:
          session.maxRounds,

        currentPrice:
          session.currentPrice,

        initialPrice:
          session.initialPrice,

        currency:
          "INR",

        previousOffers,

        agentRole:
          currentAgent,

        productName:
          product.name,

        productPrice:
          product.price,

        minimumSellingPrice:
          policy.minimumSellingPrice,

        minimumMargin:
          policy.minimumMargin,

        maxDiscountPercent:
          policy.maxDiscountPercent,

        approvalThreshold:
          policy.approval.threshold,
      };

      /*
       * REAL AI DECISION
       */
      let decision: AgentDecisionResult;

      try {
        decision =
          currentAgent === "BUYER_AGENT"
            ? await this.buyerAgent.decideWithAI(
                context
              )
            : await this.merchantAgent.decideWithAI(
                context
              );
      } catch (error) {
        console.error(
          "AI decision failed:",
          error
        );

        return {
          success: false,
          session,
          offers,
          decisions,
          errors: [
            error instanceof Error
              ? error.message
              : "AI decision failed",
          ],
        };
      }

      decisions.push(decision);

      const createsOffer =
        decision.decision ===
          "MAKE_OFFER" ||
        decision.decision ===
          "COUNTER";

      let offer:
        | Offer
        | undefined;

      if (createsOffer) {
        if (
          decision.offerPrice ===
          undefined
        ) {
          return {
            success: false,
            session,
            offers,
            decisions,
            errors: [
              "AI decision did not include an offer price",
            ],
          };
        }

        offer = {
          id: `offer-${crypto.randomUUID()}`,

          dealSessionId:
            session.id,

          actor:
            decision.agent,

          price:
            decision.offerPrice,

          quantity:
            decision.quantity ?? 1,

          currency:
            "INR",

          status:
            "PENDING",

          round:
            actionRound,

          createdAt:
            new Date().toISOString(),
        };
      }

      /*
       * Policy requires an offer-shaped context.
       * For ACCEPT / REJECT / STOP this fallback
       * is NOT persisted.
       */
      const policyOffer: Offer =
        offer ?? {
          id: `offer-${crypto.randomUUID()}`,

          dealSessionId:
            session.id,

          actor:
            decision.agent,

          price:
            session.currentPrice,

          quantity: 1,

          currency:
            "INR",

          status:
            "PENDING",

          round:
            actionRound,

          createdAt:
            new Date().toISOString(),
        };

      const policyContext:
        PolicyEvaluationContext = {
        product,

        policy,

        offer:
          policyOffer,

        currentRound:
          actionRound,
      };

      /*
       * ============================================================
       * AI ACCEPTANCE GATE
       * ============================================================
       *
       * Gemini is allowed to decide that the current price is
       * acceptable, but Gemini is NOT allowed to execute the
       * acceptance itself.
       *
       * The deterministic control flow is:
       *
       * AI ACCEPT
       *      ↓
       * DETERMINISTIC POLICY EVALUATION
       *      ↓
       * POLICY_CHECK
       *      ↓
       * ORCHESTRATOR
       *      ↓
       * STATE MACHINE
       *      ↓
       * ACCEPTED
       *
       * The orchestrator intentionally accepts only from
       * POLICY_CHECK. Therefore an AI ACCEPT generated while
       * the session is still NEGOTIATING must first enter the
       * deterministic policy gate.
       */
      if (
        decision.decision === "ACCEPT" &&
        session.state === "NEGOTIATING"
      ) {
        const acceptancePolicy =
          evaluatePolicy(policyContext);

        /*
         * The policy engine remains authoritative.
         *
         * If the current deal value violates deterministic
         * merchant policy, the AI cannot override it.
         */
        if (
          acceptancePolicy.decision ===
          "REJECT"
        ) {
          return {
            success: false,

            session,

            offers,

            decisions,

            errors:
              acceptancePolicy.violations.map(
                (violation) =>
                  violation.message
              ),
          };
        }

        /*
         * Autonomous negotiation cannot silently approve a
         * human-only policy requirement.
         */
        if (
          acceptancePolicy.decision ===
          "REQUIRE_HUMAN_APPROVAL"
        ) {
          return {
            success: false,

            session,

            offers,

            decisions,

            errors: [
              "Human approval is required before the AI can accept this deal.",
            ],
          };
        }

        /*
         * Enter the deterministic policy gate.
         *
         * This is deliberately done through DealController,
         * which delegates transition validation to the state
         * machine.
         */
        const policyController =
          new DealController();

        const policyTransition =
          policyController.transition(
            session,
            "POLICY_CHECK"
          );

        if (
          !policyTransition.success
        ) {
          return {
            success: false,

            session,

            offers,

            decisions,

            errors: [
              policyTransition.error ??
                "Unable to enter the deterministic policy check.",
            ],
          };
        }

        session =
          policyTransition.session;

        persistence.updateDeal(
          session
        );
      }

      /*
       * ============================================================
       * DETERMINISTIC CONTROL LAYER
       * ============================================================
       */
      const result =
        this.orchestrator.processAgentDecision(
          session,
          decision,
          offer,
          policyContext
        );

      if (!result) {
        return {
          success: false,
          session,
          offers,
          decisions,
          errors: [
            "Negotiation orchestrator returned no result",
          ],
        };
      }

      session =
        result.session;

      /*
       * IMPORTANT:
       *
       * A rejected AI proposal terminates this
       * runner execution. The AI never gets to
       * bypass the policy engine.
       */
      if (!result.success) {
        return {
          success: false,
          session,
          offers,
          decisions,
          errors:
            result.errors,
        };
      }

      persistence.updateDeal(
        session
      );

      if (
        result.action ===
          "PROCESSED_OFFER" &&
        result.offer
      ) {
        persistence.createOffer(
          result.offer
        );

        offers.push(
          result.offer
        );

        session = {
          ...session,

          currentPrice:
            result.offer.price,

          updatedAt:
            new Date().toISOString(),
        };

        persistence.updateDeal(
          session
        );
      }

      /*
       * Terminal state always wins.
       */
      if (
        this.isTerminal(session)
      ) {
        break;
      }

      /*
       * ACCEPT
       *
       * The orchestrator/state machine is authoritative.
       * Do not manually mutate NEGOTIATING -> ACCEPTED here.
       */
      if (decision.decision === "ACCEPT") {
        if (session.state === "ACCEPTED") {
          break;
        }

        return {
          success: false,
          session,
          offers,
          decisions,
          errors: [
            `AI requested ACCEPT but the deterministic control layer left the deal in ${session.state}.`,
          ],
        };
      }

      /*
       * REJECT
       *
       * The deterministic control layer owns state transitions.
       */
      if (decision.decision === "REJECT") {
        if (session.state === "REJECTED") {
          break;
        }

        return {
          success: false,
          session,
          offers,
          decisions,
          errors: [
            `AI requested REJECT but the deterministic control layer left the deal in ${session.state}.`,
          ],
        };
      }

      /*
       * STOP
       *
       * The deterministic control layer owns state transitions.
       */
      if (decision.decision === "STOP") {
        if (session.state === "CANCELLED") {
          break;
        }

        return {
          success: false,
          session,
          offers,
          decisions,
          errors: [
            `AI requested STOP but the deterministic control layer left the deal in ${session.state}.`,
          ],
        };
      }

      /*
       * A complete round is BUYER → MERCHANT.
       */
      if (
        currentAgent ===
        "MERCHANT_AGENT"
      ) {
        session = {
          ...session,

          currentRound:
            actionRound,

          updatedAt:
            new Date().toISOString(),
        };

        persistence.updateDeal(
          session
        );
      }

      currentAgent =
        currentAgent ===
        "BUYER_AGENT"
          ? "MERCHANT_AGENT"
          : "BUYER_AGENT";
    }

    /*
     * Maximum round protection.
     */
    if (
      session.currentRound >=
        session.maxRounds &&
      !this.isTerminal(session)
    ) {
      session = {
        ...session,

        state:
          "EXPIRED",

        updatedAt:
          new Date().toISOString(),
      };

      persistence.updateDeal(
        session
      );
    }

    const accepted =
      session.state ===
      "ACCEPTED";

    return {
      success:
        accepted,

      session,

      offers,

      decisions,

      errors:
        accepted
          ? []
          : [
              session.state ===
              "EXPIRED"
                ? "Negotiation ended because maximum rounds were reached"
                : "Negotiation ended without an accepted deal",
            ],
    };
  }
  
  private isTerminal(
    session: DealSession
  ): boolean {
    return (
      session.state === "ACCEPTED" ||
      session.state === "REJECTED" ||
      session.state === "CANCELLED" ||
      session.state === "EXPIRED"
    );
  }
}