import type { MerchantPolicy } from "@/models/merchant-policy";

export function validateMerchantPolicy(
  policy: MerchantPolicy
): string[] {
  const errors: string[] = [];

  if (!policy.id.trim()) {
    errors.push("Policy ID is required.");
  }

  if (!policy.merchantId.trim()) {
    errors.push("Merchant ID is required.");
  }

  if (
    policy.maxDiscountPercent < 0 ||
    policy.maxDiscountPercent > 100
  ) {
    errors.push(
      "Maximum discount must be between 0 and 100 percent."
    );
  }

  if (policy.minimumSellingPrice < 0) {
    errors.push(
      "Minimum selling price cannot be negative."
    );
  }

  if (!Number.isSafeInteger(policy.minimumSellingPrice)) {
    errors.push(
      "Minimum selling price must be represented as an integer."
    );
  }

  if (policy.minimumMargin < 0) {
    errors.push("Minimum margin cannot be negative.");
  }

  if (!Number.isSafeInteger(policy.minimumMargin)) {
    errors.push(
      "Minimum margin must be represented as an integer."
    );
  }

  if (
    !Number.isInteger(policy.maxNegotiationRounds) ||
    policy.maxNegotiationRounds < 1
  ) {
    errors.push(
      "Maximum negotiation rounds must be a positive integer."
    );
  }

  if (policy.bundleRules.allowed) {
    if (
      policy.bundleRules.minimumQuantity !== undefined &&
      (!Number.isInteger(policy.bundleRules.minimumQuantity) ||
        policy.bundleRules.minimumQuantity < 1)
    ) {
      errors.push(
        "Bundle minimum quantity must be a positive integer."
      );
    }

    if (
      policy.bundleRules.additionalDiscountPercent !== undefined &&
      (policy.bundleRules.additionalDiscountPercent < 0 ||
        policy.bundleRules.additionalDiscountPercent > 100)
    ) {
      errors.push(
        "Bundle discount must be between 0 and 100 percent."
      );
    }
  }

  if (policy.approval.level === "HUMAN_REQUIRED") {
    if (
      policy.approval.threshold !== undefined &&
      policy.approval.threshold < 0
    ) {
      errors.push(
        "Approval threshold cannot be negative."
      );
    }
  }

  if (policy.currency !== "INR") {
    errors.push("Only INR is currently supported.");
  }

  if (!policy.createdAt.trim()) {
    errors.push("Policy creation timestamp is required.");
  }

  if (!policy.updatedAt.trim()) {
    errors.push("Policy update timestamp is required.");
  }

  return errors;
}

export function isValidMerchantPolicy(
  policy: MerchantPolicy
): boolean {
  return validateMerchantPolicy(policy).length === 0;
}