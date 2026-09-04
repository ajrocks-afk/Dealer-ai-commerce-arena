import { describe, expect, it } from "vitest";

import {
  validateOffer,
} from "@/validators/offer-validator";

import type { Offer } from "@/models/offer";

const validOffer: Offer = {
  id: "offer-001",

  dealSessionId: "deal-001",

  actor: "BUYER_AGENT",

  price: 7500000,

  quantity: 1,

  currency: "INR",

  status: "PENDING",

  round: 1,

  createdAt: new Date().toISOString(),
};

describe("Offer Validator", () => {
  it("accepts a valid offer", () => {
    const result = validateOffer(validOffer);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects zero price", () => {
    const offer: Offer = {
      ...validOffer,
      price: 0,
    };

    const result = validateOffer(offer);

    expect(result.valid).toBe(false);

    expect(result.errors).toContain(
      "Offer price must be greater than zero"
    );
  });

  it("rejects zero quantity", () => {
    const offer: Offer = {
      ...validOffer,
      quantity: 0,
    };

    const result = validateOffer(offer);

    expect(result.valid).toBe(false);

    expect(result.errors).toContain(
      "Offer quantity must be greater than zero"
    );
  });

  it("rejects invalid round", () => {
    const offer: Offer = {
      ...validOffer,
      round: 0,
    };

    const result = validateOffer(offer);

    expect(result.valid).toBe(false);

    expect(result.errors).toContain(
      "Offer round must be greater than zero"
    );
  });

  it("rejects empty deal session ID", () => {
    const offer: Offer = {
      ...validOffer,
      dealSessionId: "",
    };

    const result = validateOffer(offer);

    expect(result.valid).toBe(false);

    expect(result.errors).toContain(
      "Deal session ID is required"
    );
  });
});