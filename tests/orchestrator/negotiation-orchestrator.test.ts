import {
  describe,
  expect,
  it,
} from "vitest";

import {
  NegotiationOrchestrator,
} from "@/orchestrator/negotiation-orchestrator";

import {
  NegotiationEngine,
} from "@/engine/negotiation-engine";

import {
  DealController,
} from "@/controllers/deal-controller";

import {
  HumanApprovalService,
} from "@/services/human-approval-service";

import {
  InMemoryPersistenceService,
} from "@/services/persistence-service";

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
  AgentDecisionResult,
} from "@/agents/agent-types";

const createSession = (
  state: DealSession["state"] = "CREATED"
): DealSession => ({
  id: "deal-001",
  productId: "prod-001",
  merchantId: "merchant-001",
  buyerId: "buyer-001",
  state,
  currentRound: 0,
  maxRounds: 5,
  currency: "INR",
  initialPrice: 5000000,
  currentPrice: 5000000,
  createdAt:
    new Date().toISOString(),
  updatedAt:
    new Date().toISOString(),
  expiresAt:
    new Date(
      Date.now() + 3600000
    ).toISOString(),
});

const offer: Offer = {
  id: "offer-001",
  dealSessionId: "deal-001",
  actor: "BUYER_AGENT",
  price: 4800000,
  quantity: 1,
  currency: "INR",
  status: "PENDING",
  round: 1,
  createdAt:
    new Date().toISOString(),
};

const policyContext: PolicyEvaluationContext = {
  product: {
    id: "prod-001",
    name: "Test Laptop",
    description: "Test product",
    category: "Electronics",
    currency: "INR",
    price: 5000000,
    inventory: {
      available: 10,
      reserved: 0,
    },
    status: "ACTIVE",
    merchantId: "merchant-001",
    createdAt:
      new Date().toISOString(),
    updatedAt:
      new Date().toISOString(),
  },

  policy: {
    id: "policy-001",
    merchantId: "merchant-001",
    maxDiscountPercent: 10,
    minimumSellingPrice: 4500000,
    minimumMargin: 0,
    maxNegotiationRounds: 5,

    bundleRules: {
      allowed: false,
    },

    approval: {
      level: "NONE",
    },

    currency: "INR",
    active: true,
    createdAt:
      new Date().toISOString(),
    updatedAt:
      new Date().toISOString(),
  },

  offer,

  currentRound: 1,
};

describe(
  "Negotiation Orchestrator",
  () => {
    it(
      "processes a valid offer decision",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const orchestrator =
          new NegotiationOrchestrator(
            new NegotiationEngine(
              new DealController(),
              undefined,
              undefined,
              persistence
            ),
            new DealController(),
            persistence
          );

        const session =
          createSession();

        const decision:
          AgentDecisionResult = {
            agent: "BUYER_AGENT",
            decision: "MAKE_OFFER",
            offerPrice: 4800000,
            quantity: 1,
            reasoning:
              "Buyer proposes a reasonable price.",
          };

        const result =
          orchestrator.processAgentDecision(
            session,
            decision,
            offer,
            policyContext
          );

        expect(
          result.success
        ).toBe(true);

        expect(
          result.action
        ).toBe("PROCESSED_OFFER");

        expect(
          result.errors
        ).toHaveLength(0);

        expect(
          result.insight
        ).toBeDefined();
      }
    );

    it(
      "rejects an invalid agent decision",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const orchestrator =
          new NegotiationOrchestrator(
            new NegotiationEngine(
              new DealController(),
              undefined,
              undefined,
              persistence
            ),
            new DealController(),
            persistence
          );

        const session =
          createSession();

        const decision = {
          agent: "BUYER_AGENT",
          decision: "MAKE_OFFER",
          reasoning: "",
        } as AgentDecisionResult;

        const result =
          orchestrator.processAgentDecision(
            session,
            decision,
            undefined,
            policyContext
          );

        expect(
          result.success
        ).toBe(false);

        expect(
          result.action
        ).toBe("INVALID_DECISION");

        expect(
          result.errors.length
        ).toBeGreaterThan(0);
      }
    );

    it(
      "rejects an offer decision without an offer",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const orchestrator =
          new NegotiationOrchestrator(
            new NegotiationEngine(
              new DealController(),
              undefined,
              undefined,
              persistence
            ),
            new DealController(),
            persistence
          );

        const session =
          createSession();

        const decision:
          AgentDecisionResult = {
            agent: "BUYER_AGENT",
            decision: "MAKE_OFFER",
            offerPrice: 4800000,
            quantity: 1,
            reasoning:
              "Buyer wants to make an offer.",
          };

        const result =
          orchestrator.processAgentDecision(
            session,
            decision,
            undefined,
            policyContext
          );

        expect(
          result.success
        ).toBe(false);

        expect(
          result.action
        ).toBe("INVALID_DECISION");
      }
    );

    it(
      "handles an accept decision and transitions to ACCEPTED",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const orchestrator =
          new NegotiationOrchestrator(
            new NegotiationEngine(
              new DealController(),
              undefined,
              undefined,
              persistence
            ),
            new DealController(),
            persistence
          );

        const session =
          createSession(
            "POLICY_CHECK"
          );

        const decision:
          AgentDecisionResult = {
            agent: "MERCHANT_AGENT",
            decision: "ACCEPT",
            reasoning:
              "The offer satisfies merchant policy.",
          };

        const result =
          orchestrator.processAgentDecision(
            session,
            decision,
            offer,
            policyContext
          );

        expect(
          result.success
        ).toBe(true);

        expect(
          result.action
        ).toBe("ACCEPTED");

        expect(
          result.session.state
        ).toBe("ACCEPTED");

        expect(
          result.insight
        ).toBeDefined();
      }
    );

    it(
      "handles a reject decision and transitions to REJECTED",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const orchestrator =
          new NegotiationOrchestrator(
            new NegotiationEngine(
              new DealController(),
              undefined,
              undefined,
              persistence
            ),
            new DealController(),
            persistence
          );

        const session =
          createSession(
            "POLICY_CHECK"
          );

        const decision:
          AgentDecisionResult = {
            agent: "MERCHANT_AGENT",
            decision: "REJECT",
            reasoning:
              "The offer is outside acceptable limits.",
          };

        const result =
          orchestrator.processAgentDecision(
            session,
            decision,
            offer,
            policyContext
          );

        expect(
          result.success
        ).toBe(true);

        expect(
          result.action
        ).toBe("REJECTED");

        expect(
          result.session.state
        ).toBe("REJECTED");

        expect(
          result.insight
        ).toBeDefined();
      }
    );

    it(
      "handles a stop decision and transitions to CANCELLED",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const orchestrator =
          new NegotiationOrchestrator(
            new NegotiationEngine(
              new DealController(),
              undefined,
              undefined,
              persistence
            ),
            new DealController(),
            persistence
          );

        const session =
          createSession(
            "NEGOTIATING"
          );

        const decision:
          AgentDecisionResult = {
            agent: "BUYER_AGENT",
            decision: "STOP",
            reasoning:
              "Buyer no longer wishes to negotiate.",
          };

        const result =
          orchestrator.processAgentDecision(
            session,
            decision,
            undefined,
            policyContext
          );

        expect(
          result.success
        ).toBe(true);

        expect(
          result.action
        ).toBe("STOPPED");

        expect(
          result.session.state
        ).toBe("CANCELLED");

        expect(
          result.insight
        ).toBeDefined();
      }
    );

    it(
      "rejects ACCEPT when the current state cannot transition to ACCEPTED",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const orchestrator =
          new NegotiationOrchestrator(
            new NegotiationEngine(
              new DealController(),
              undefined,
              undefined,
              persistence
            ),
            new DealController(),
            persistence
          );

        const session =
          createSession(
            "NEGOTIATING"
          );

        const decision:
          AgentDecisionResult = {
            agent: "MERCHANT_AGENT",
            decision: "ACCEPT",
            reasoning:
              "Merchant attempts to accept too early.",
          };

        const result =
          orchestrator.processAgentDecision(
            session,
            decision,
            offer,
            policyContext
          );

        expect(
          result.success
        ).toBe(false);

        expect(
          result.action
        ).toBe("INVALID_DECISION");

        expect(
          result.session.state
        ).toBe("NEGOTIATING");

        expect(
          result.errors.length
        ).toBeGreaterThan(0);
      }
    );

    it(
      "rejects REJECT when the current state cannot transition to REJECTED",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const orchestrator =
          new NegotiationOrchestrator(
            new NegotiationEngine(
              new DealController(),
              undefined,
              undefined,
              persistence
            ),
            new DealController(),
            persistence
          );

        const session =
          createSession(
            "NEGOTIATING"
          );

        const decision:
          AgentDecisionResult = {
            agent: "MERCHANT_AGENT",
            decision: "REJECT",
            reasoning:
              "Merchant attempts to reject too early.",
          };

        const result =
          orchestrator.processAgentDecision(
            session,
            decision,
            offer,
            policyContext
          );

        expect(
          result.success
        ).toBe(false);

        expect(
          result.action
        ).toBe("INVALID_DECISION");

        expect(
          result.session.state
        ).toBe("NEGOTIATING");

        expect(
          result.errors.length
        ).toBeGreaterThan(0);
      }
    );

    it(
      "rejects STOP when the current state cannot transition to CANCELLED",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const orchestrator =
          new NegotiationOrchestrator(
            new NegotiationEngine(
              new DealController(),
              undefined,
              undefined,
              persistence
            ),
            new DealController(),
            persistence
          );

        const session =
          createSession(
            "COMPLETED"
          );

        const decision:
          AgentDecisionResult = {
            agent: "BUYER_AGENT",
            decision: "STOP",
            reasoning:
              "Buyer attempts to stop a completed deal.",
          };

        const result =
          orchestrator.processAgentDecision(
            session,
            decision,
            undefined,
            policyContext
          );

        expect(
          result.success
        ).toBe(false);

        expect(
          result.action
        ).toBe("INVALID_DECISION");

        expect(
          result.session.state
        ).toBe("COMPLETED");

        expect(
          result.errors.length
        ).toBeGreaterThan(0);
      }
    );

    it(
      "moves an approval-required offer into POLICY_CHECK",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const orchestrator =
          new NegotiationOrchestrator(
            new NegotiationEngine(
              new DealController(),
              undefined,
              new HumanApprovalService(),
              persistence
            ),
            new DealController(),
            persistence
          );

        const session =
          createSession();

        const decision:
          AgentDecisionResult = {
            agent: "BUYER_AGENT",
            decision: "MAKE_OFFER",
            offerPrice: 4800000,
            quantity: 1,
            reasoning:
              "Buyer proposes an offer requiring human approval.",
          };

        const approvalPolicyContext:
          PolicyEvaluationContext = {
            ...policyContext,

            policy: {
              ...policyContext.policy,

              approval: {
                level:
                  "HUMAN_REQUIRED",
                threshold: 4800000,
              },
            },
          };

        const result =
          orchestrator.processAgentDecision(
            session,
            decision,
            offer,
            approvalPolicyContext
          );

        expect(
          result.success
        ).toBe(true);

        expect(
          result.action
        ).toBe("PROCESSED_OFFER");

        expect(
          result.negotiationResult?.decision
        ).toBe(
          "REQUIRE_HUMAN_APPROVAL"
        );

        expect(
          result.negotiationResult?.approvalRequired
        ).toBe(true);

        expect(
          result.session.state
        ).toBe("POLICY_CHECK");

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
          result.insight
        ).toBeDefined();
      }
    );

    it(
      "blocks ACCEPT while human approval is pending",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const humanApprovalService =
          new HumanApprovalService();

        const negotiationEngine =
          new NegotiationEngine(
            new DealController(),
            undefined,
            humanApprovalService,
            persistence
          );

        const orchestrator =
          new NegotiationOrchestrator(
            negotiationEngine,
            new DealController(),
            persistence
          );

        const session =
          createSession();

        const offerDecision:
          AgentDecisionResult = {
            agent: "BUYER_AGENT",
            decision: "MAKE_OFFER",
            offerPrice: 4800000,
            quantity: 1,
            reasoning:
              "Buyer proposes an offer requiring approval.",
          };

        const approvalPolicyContext:
          PolicyEvaluationContext = {
            ...policyContext,

            policy: {
              ...policyContext.policy,

              approval: {
                level:
                  "HUMAN_REQUIRED",
                threshold: 4800000,
              },
            },
          };

        const offerResult =
          orchestrator.processAgentDecision(
            session,
            offerDecision,
            offer,
            approvalPolicyContext
          );

        expect(
          offerResult.session.state
        ).toBe("POLICY_CHECK");

        const approval =
          persistence.getHumanApproval(
            session.id
          );

        expect(
          approval?.status
        ).toBe("PENDING");

        const acceptDecision:
          AgentDecisionResult = {
            agent: "MERCHANT_AGENT",
            decision: "ACCEPT",
            reasoning:
              "Merchant attempts to accept before human approval.",
          };

        const acceptResult =
          orchestrator.processAgentDecision(
            offerResult.session,
            acceptDecision,
            offer,
            approvalPolicyContext
          );

        expect(
          acceptResult.success
        ).toBe(false);

        expect(
          acceptResult.action
        ).toBe("INVALID_DECISION");

        expect(
          acceptResult.session.state
        ).toBe("POLICY_CHECK");

        expect(
          acceptResult.errors
        ).toContain(
          "Human approval is required before the deal can be accepted."
        );
      }
    );

    it(
      "allows ACCEPT after human approval",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const humanApprovalService =
          new HumanApprovalService();

        const negotiationEngine =
          new NegotiationEngine(
            new DealController(),
            undefined,
            humanApprovalService,
            persistence
          );

        const orchestrator =
          new NegotiationOrchestrator(
            negotiationEngine,
            new DealController(),
            persistence
          );

        const session =
          createSession();

        const offerDecision:
          AgentDecisionResult = {
            agent: "BUYER_AGENT",
            decision: "MAKE_OFFER",
            offerPrice: 4800000,
            quantity: 1,
            reasoning:
              "Buyer proposes an offer requiring approval.",
          };

        const approvalPolicyContext:
          PolicyEvaluationContext = {
            ...policyContext,

            policy: {
              ...policyContext.policy,

              approval: {
                level:
                  "HUMAN_REQUIRED",
                threshold: 4800000,
              },
            },
          };

        const offerResult =
          orchestrator.processAgentDecision(
            session,
            offerDecision,
            offer,
            approvalPolicyContext
          );

        expect(
          offerResult.session.state
        ).toBe("POLICY_CHECK");

        const approval =
          persistence.getHumanApproval(
            session.id
          );

        expect(
          approval
        ).toBeDefined();

        const approvedRequest =
          humanApprovalService.approve(
            approval!,
            "TEST_REVIEWER"
          );

        persistence.updateHumanApproval(
          approvedRequest
        );

        const acceptDecision:
          AgentDecisionResult = {
            agent: "MERCHANT_AGENT",
            decision: "ACCEPT",
            reasoning:
              "Human approval has been granted and the offer can be accepted.",
          };

        const acceptResult =
          orchestrator.processAgentDecision(
            offerResult.session,
            acceptDecision,
            offer,
            approvalPolicyContext
          );

        expect(
          acceptResult.success
        ).toBe(true);

        expect(
          acceptResult.action
        ).toBe("ACCEPTED");

        expect(
          acceptResult.session.state
        ).toBe("ACCEPTED");

        expect(
          acceptResult.insight
        ).toBeDefined();
      }
    );

    it(
      "blocks ACCEPT after human approval is rejected",
      () => {
        const persistence =
          new InMemoryPersistenceService();

        const humanApprovalService =
          new HumanApprovalService();

        const negotiationEngine =
          new NegotiationEngine(
            new DealController(),
            undefined,
            humanApprovalService,
            persistence
          );

        const orchestrator =
          new NegotiationOrchestrator(
            negotiationEngine,
            new DealController(),
            persistence
          );

        const session =
          createSession();

        const offerDecision:
          AgentDecisionResult = {
            agent: "BUYER_AGENT",
            decision: "MAKE_OFFER",
            offerPrice: 4800000,
            quantity: 1,
            reasoning:
              "Buyer proposes an offer requiring approval.",
          };

        const approvalPolicyContext:
          PolicyEvaluationContext = {
            ...policyContext,

            policy: {
              ...policyContext.policy,

              approval: {
                level:
                  "HUMAN_REQUIRED",
                threshold: 4800000,
              },
            },
          };

        const offerResult =
          orchestrator.processAgentDecision(
            session,
            offerDecision,
            offer,
            approvalPolicyContext
          );

        const approval =
          persistence.getHumanApproval(
            session.id
          );

        expect(
          approval?.status
        ).toBe("PENDING");

        const rejectedRequest =
          humanApprovalService.reject(
            approval!,
            "TEST_REVIEWER",
            "Offer is not acceptable."
          );

        persistence.updateHumanApproval(
          rejectedRequest
        );

        const acceptDecision:
          AgentDecisionResult = {
            agent: "MERCHANT_AGENT",
            decision: "ACCEPT",
            reasoning:
              "Merchant attempts to accept a rejected approval request.",
          };

        const acceptResult =
          orchestrator.processAgentDecision(
            offerResult.session,
            acceptDecision,
            offer,
            approvalPolicyContext
          );

        expect(
          acceptResult.success
        ).toBe(false);

        expect(
          acceptResult.action
        ).toBe("INVALID_DECISION");

        expect(
          acceptResult.session.state
        ).toBe("POLICY_CHECK");

        expect(
          acceptResult.errors
        ).toContain(
          "Human approval was rejected. The deal cannot be accepted."
        );
      }
    );
  }
);