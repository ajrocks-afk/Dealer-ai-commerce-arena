import { describe, expect, it } from "vitest";

import { evaluatePolicy } from "@/engine/policy-engine";
import type { PolicyEvaluationContext } from "@/engine/policy-types";

const baseContext = {
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  policy: {
    id: "policy-001",
    merchantId: "merchant-001",
    currency: "INR",
    minimumSellingPrice: 4500000,
    maxDiscountPercent: 10,
    minimumMargin: 0,
    maxNegotiationRounds: 5,

    bundleRules: {
      allowed: false,
    },

    approval: {
      level: "NONE",
    },
    
    active: true,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  offer: {
    id: "offer-001",
    dealSessionId: "deal-001",
    actor: "BUYER_AGENT",
    price: 4800000,
    quantity: 1,
    currency: "INR",
    status: "PENDING",
    round: 1,
    createdAt: new Date().toISOString(),
  },

  currentRound: 1,
} satisfies PolicyEvaluationContext;

describe("Policy Engine", () => {
  it("allows an offer within policy", () => {
    const result = evaluatePolicy(baseContext);

    expect(result.decision).toBe("ALLOW");
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("rejects an offer below minimum selling price", () => {
    const context = {
      ...baseContext,
      offer: {
        ...baseContext.offer,
        price: 4000000,
      },
    };

    const result = evaluatePolicy(context);

    expect(result.decision).toBe("REJECT");
    expect(result.passed).toBe(false);

    expect(
      result.violations.some(
        (violation) =>
          violation.code === "MINIMUM_SELLING_PRICE"
      )
    ).toBe(true);
  });

  it("rejects an offer exceeding maximum discount", () => {
    const context = {
      ...baseContext,
      offer: {
        ...baseContext.offer,
        price: 4000000,
      },
    };

    const result = evaluatePolicy(context);

    expect(result.decision).toBe("REJECT");

    expect(
      result.violations.some(
        (violation) =>
          violation.code === "MAXIMUM_DISCOUNT"
      )
    ).toBe(true);
  });

  it("rejects when negotiation rounds are exceeded", () => {
    const context = {
      ...baseContext,
      currentRound: 6,
    };

    const result = evaluatePolicy(context);

    expect(result.decision).toBe("REJECT");

    expect(
      result.violations.some(
        (violation) =>
          violation.code === "MAX_NEGOTIATION_ROUNDS"
      )
    ).toBe(true);
  });

  it("requires human approval when threshold is triggered", () => {
    const context: PolicyEvaluationContext = {
      ...baseContext,
      policy: {
        ...baseContext.policy,
        approval: {
          level: "HUMAN_REQUIRED",
          threshold: 4800000,
        },
      },
    };

    const result = evaluatePolicy(context);

    expect(result.decision).toBe(
      "REQUIRE_HUMAN_APPROVAL"
    );

    expect(result.passed).toBe(false);

    expect(
      result.violations.some(
        (violation) =>
          violation.code === "HUMAN_APPROVAL_REQUIRED"
      )
    ).toBe(true);
  });
});