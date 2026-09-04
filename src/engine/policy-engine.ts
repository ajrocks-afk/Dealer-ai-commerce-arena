import type {
  PolicyEvaluation,
  PolicyEvaluationContext,
  PolicyViolation,
} from "./policy-types";

import {
  checkMaximumDiscount,
  checkMaximumNegotiationRounds,
  checkMinimumMargin,
  checkMinimumSellingPrice,
} from "./policy-rules";

export function evaluatePolicy(
  context: PolicyEvaluationContext
): PolicyEvaluation {
  const violations: PolicyViolation[] = [];

  const rules = [
    checkMinimumSellingPrice,
    checkMaximumDiscount,
    checkMinimumMargin,
    checkMaximumNegotiationRounds,
  ];

  for (const rule of rules) {
    const violation = rule(context);

    if (violation) {
      violations.push(violation);
    }
  }

  const approval = context.policy.approval ?? {
    level: "NONE" as const,
  };

  const requiresHumanApproval =
    approval.level === "HUMAN_REQUIRED" &&
    approval.threshold !== undefined &&
    context.offer.price <=
      approval.threshold;

  if (requiresHumanApproval) {
    violations.push({
      code: "HUMAN_APPROVAL_REQUIRED",
      message:
        "This offer requires human approval.",
      severity: "WARNING",
    });
  }

  const hasErrors = violations.some(
    (violation) => violation.severity === "ERROR"
  );

  const hasApprovalRequirement = violations.some(
    (violation) =>
      violation.code === "HUMAN_APPROVAL_REQUIRED"
  );

  let decision: PolicyEvaluation["decision"];

  if (hasErrors) {
    decision = "REJECT";
  } else if (hasApprovalRequirement) {
    decision = "REQUIRE_HUMAN_APPROVAL";
  } else {
    decision = "ALLOW";
  }

  return {
    decision,

    passed: decision === "ALLOW",

    violations,

    evaluatedAt: new Date().toISOString(),

    offerId: context.offer.id,

    dealSessionId: context.offer.dealSessionId,
  };
}