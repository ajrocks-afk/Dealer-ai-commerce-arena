import type { AgentDecisionResult } from "@/agents/agent-types";

export interface AgentValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateAgentDecision(
  result: AgentDecisionResult
): AgentValidationResult {
  const errors: string[] = [];

  if (!result.agent) {
    errors.push("Agent type is required");
  }

  if (!result.decision) {
    errors.push("Agent decision is required");
  }

  if (!result.reasoning.trim()) {
    errors.push("Agent reasoning is required");
  }

  if (
    result.decision === "MAKE_OFFER" ||
    result.decision === "COUNTER"
  ) {
    if (
      result.offerPrice === undefined ||
      result.offerPrice <= 0
    ) {
      errors.push(
        "Offer price must be greater than zero"
      );
    }

    if (
      result.quantity === undefined ||
      result.quantity <= 0
    ) {
      errors.push(
        "Offer quantity must be greater than zero"
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}