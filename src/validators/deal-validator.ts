import type { DealSession } from "@/models/deal-session";
import type { DealState } from "@/state-machine/deal-states";

export interface DealValidationResult {
  valid: boolean;
  errors: string[];
}

const validStates: DealState[] = [
  "CREATED",
  "NEGOTIATING",
  "OFFER_RECEIVED",
  "POLICY_CHECK",
  "COUNTERED",
  "ACCEPTED",
  "PAYMENT_PENDING",
  "PAID",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "FAILED",
];

export function validateDeal(
  deal: DealSession
): DealValidationResult {
  const errors: string[] = [];

  if (!deal.id.trim()) {
    errors.push("Deal ID is required");
  }

  if (!deal.productId.trim()) {
    errors.push("Product ID is required");
  }

  if (!deal.merchantId.trim()) {
    errors.push("Merchant ID is required");
  }

  if (!deal.buyerId.trim()) {
    errors.push("Buyer ID is required");
  }

  if (!validStates.includes(deal.state)) {
    errors.push("Deal state is invalid");
  }

  if (
    !Number.isInteger(deal.currentRound) ||
    deal.currentRound < 0
  ) {
    errors.push(
      "Current round must be a non-negative integer"
    );
  }

  if (
    !Number.isInteger(deal.maxRounds) ||
    deal.maxRounds < 1
  ) {
    errors.push(
      "Maximum rounds must be at least 1"
    );
  }

  if (deal.currentRound > deal.maxRounds) {
    errors.push(
      "Current round cannot exceed maximum rounds"
    );
  }

  if (deal.initialPrice <= 0) {
    errors.push(
      "Initial price must be greater than zero"
    );
  }

  if (!Number.isSafeInteger(deal.initialPrice)) {
    errors.push(
      "Initial price must be stored as an integer"
    );
  }

  if (deal.currentPrice <= 0) {
    errors.push(
      "Current price must be greater than zero"
    );
  }

  if (!Number.isSafeInteger(deal.currentPrice)) {
    errors.push(
      "Current price must be stored as an integer"
    );
  }

  if (
    deal.acceptedPrice !== undefined &&
    deal.acceptedPrice <= 0
  ) {
    errors.push(
      "Accepted price must be greater than zero"
    );
  }

  if (
    deal.acceptedPrice !== undefined &&
    !Number.isSafeInteger(deal.acceptedPrice)
  ) {
    errors.push(
      "Accepted price must be stored as an integer"
    );
  }

  if (deal.currency !== "INR") {
    errors.push("Unsupported currency");
  }

  if (!deal.createdAt.trim()) {
    errors.push("Created timestamp is required");
  }

  if (!deal.updatedAt.trim()) {
    errors.push("Updated timestamp is required");
  }

  if (!deal.expiresAt.trim()) {
    errors.push("Expiry timestamp is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}