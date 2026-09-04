import type { Offer } from "@/models/offer";

export interface OfferValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateOffer(
  offer: Offer
): OfferValidationResult {
  const errors: string[] = [];

  if (!offer.id.trim()) {
    errors.push("Offer ID is required");
  }

  if (!offer.dealSessionId.trim()) {
    errors.push("Deal session ID is required");
  }

  if (offer.price <= 0) {
    errors.push("Offer price must be greater than zero");
  }

  if (!Number.isInteger(offer.quantity)) {
    errors.push("Offer quantity must be an integer");
  }

  if (offer.quantity <= 0) {
    errors.push("Offer quantity must be greater than zero");
  }

  if (offer.round <= 0) {
    errors.push("Offer round must be greater than zero");
  }

  if (offer.currency !== "INR") {
    errors.push("Unsupported currency");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}