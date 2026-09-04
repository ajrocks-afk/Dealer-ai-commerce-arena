import type {
  PolicyEvaluationContext,
  PolicyViolation,
} from "./policy-types";

import {
  calculateDiscountPercent,
} from "@/lib/money";

export function checkMinimumSellingPrice(
  context: PolicyEvaluationContext
): PolicyViolation | null {
  if (
    context.offer.price <
    context.policy.minimumSellingPrice
  ) {
    return {
      code: "MINIMUM_SELLING_PRICE",
      message:
        "Offer price is below the merchant's minimum selling price.",
      severity: "ERROR",
    };
  }

  return null;
}

export function checkMaximumDiscount(
  context: PolicyEvaluationContext
): PolicyViolation | null {
  const discountPercent = calculateDiscountPercent(
    context.product.price,
    context.offer.price
  );

  if (
    discountPercent >
    context.policy.maxDiscountPercent
  ) {
    return {
      code: "MAXIMUM_DISCOUNT",
      message:
        "Offer exceeds the merchant's maximum allowed discount.",
      severity: "ERROR",
    };
  }

  return null;
}

export function checkMinimumMargin(
  context: PolicyEvaluationContext
): PolicyViolation | null {
  // Minimum selling price is enforced separately by
  // checkMinimumSellingPrice().
  //
  // The current policy context does not contain a
  // merchant cost/basis price, so an actual profit
  // margin cannot be calculated reliably here.

  return null;
}

export function checkMaximumNegotiationRounds(
  context: PolicyEvaluationContext
): PolicyViolation | null {
  if (
    context.currentRound >
    context.policy.maxNegotiationRounds
  ) {
    return {
      code: "MAX_NEGOTIATION_ROUNDS",
      message:
        "Maximum negotiation rounds have been exceeded.",
      severity: "ERROR",
    };
  }

  return null;
}