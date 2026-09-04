import type {
  AgentDecisionResult,
} from "@/agents/agent-types";

export interface AIDecisionValidationResult {
  valid: boolean;
  decision?: AgentDecisionResult;
  errors: string[];
}

export function validateAIDecision(
  value: unknown
): AIDecisionValidationResult {
  const errors: string[] = [];

  if (
    typeof value !== "object" ||
    value === null
  ) {
    return {
      valid: false,
      errors: [
        "AI decision must be an object",
      ],
    };
  }

  const data =
    value as Record<string, unknown>;

  if (
    data.agent !== "BUYER_AGENT" &&
    data.agent !== "MERCHANT_AGENT"
  ) {
    errors.push(
      "Invalid or missing agent"
    );
  }

  const validDecisions = [
    "MAKE_OFFER",
    "ACCEPT",
    "REJECT",
    "COUNTER",
    "STOP",
  ];

  if (
    typeof data.decision !== "string" ||
    !validDecisions.includes(
      data.decision
    )
  ) {
    errors.push(
      "Invalid or missing decision"
    );
  }

  if (
    typeof data.reasoning !== "string" ||
    data.reasoning.trim().length === 0
  ) {
    errors.push(
      "Reasoning is required"
    );
  }

  if (
    data.offerPrice !== undefined &&
    (
      typeof data.offerPrice !== "number" ||
      !Number.isFinite(
        data.offerPrice
      ) ||
      data.offerPrice <= 0
    )
  ) {
    errors.push(
      "offerPrice must be a positive number"
    );
  }

  if (
    data.quantity !== undefined &&
    (
      typeof data.quantity !== "number" ||
      !Number.isInteger(
        data.quantity
      ) ||
      data.quantity <= 0
    )
  ) {
    errors.push(
      "quantity must be a positive integer"
    );
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
    };
  }

  return {
    valid: true,
    errors: [],
    decision:
      data as unknown as AgentDecisionResult,
  };
}