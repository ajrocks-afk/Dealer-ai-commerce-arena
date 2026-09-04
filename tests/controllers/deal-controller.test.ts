import { describe, expect, it } from "vitest";

import { DealController } from "@/controllers/deal-controller";
import type { DealSession } from "@/models/deal-session";

describe("DealController", () => {
  const controller = new DealController();

  const session: DealSession = {
    id: "deal-001",

    productId: "prod-001",
    merchantId: "merchant-001",
    buyerId: "buyer-001",

    state: "CREATED",

    currentRound: 1,
    maxRounds: 5,

    currency: "INR",

    initialPrice: 5000000,
    currentPrice: 5000000,

    createdAt: "2026-08-23T00:00:00.000Z",
    updatedAt: "2026-08-23T00:00:00.000Z",
    expiresAt: "2026-08-24T00:00:00.000Z",
  };

  it("allows a valid state transition", () => {
    const result = controller.transition(
      session,
      "NEGOTIATING"
    );

    expect(result.success).toBe(true);
    expect(result.session.state).toBe(
      "NEGOTIATING"
    );
  });

  it("rejects an invalid state transition", () => {
    const result = controller.transition(
      session,
      "PAID"
    );

    expect(result.success).toBe(false);
    expect(result.session.state).toBe(
      "CREATED"
    );
    expect(result.error).toContain(
      "Invalid deal state transition"
    );
  });

  it("increments the negotiation round", () => {
    const result = controller.incrementRound(
      session
    );

    expect(result.currentRound).toBe(2);
    expect(result.id).toBe("deal-001");
    expect(result.state).toBe("CREATED");
  });

  it("does not mutate the original session", () => {
    const result = controller.transition(
      session,
      "NEGOTIATING"
    );

    expect(session.state).toBe("CREATED");
    expect(result.session.state).toBe(
      "NEGOTIATING"
    );
  });
});