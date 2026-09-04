import { describe, expect, it } from "vitest";

import {
  canTransition,
  transitionDeal,
} from "@/state-machine/deal-state-machine";

describe("Deal State Machine", () => {
  describe("valid transitions", () => {
    it("allows CREATED → NEGOTIATING", () => {
      expect(
        canTransition("CREATED", "NEGOTIATING")
      ).toBe(true);
    });

    it("allows NEGOTIATING → OFFER_RECEIVED", () => {
      expect(
        canTransition(
          "NEGOTIATING",
          "OFFER_RECEIVED"
        )
      ).toBe(true);
    });

    it("allows OFFER_RECEIVED → POLICY_CHECK", () => {
      expect(
        canTransition(
          "OFFER_RECEIVED",
          "POLICY_CHECK"
        )
      ).toBe(true);
    });

    it("allows POLICY_CHECK → ACCEPTED", () => {
      expect(
        canTransition(
          "POLICY_CHECK",
          "ACCEPTED"
        )
      ).toBe(true);
    });

    it("allows ACCEPTED → PAYMENT_PENDING", () => {
      expect(
        canTransition(
          "ACCEPTED",
          "PAYMENT_PENDING"
        )
      ).toBe(true);
    });

    it("allows PAYMENT_PENDING → PAID", () => {
      expect(
        canTransition(
          "PAYMENT_PENDING",
          "PAID"
        )
      ).toBe(true);
    });

    it("allows PAID → COMPLETED", () => {
      expect(
        canTransition("PAID", "COMPLETED")
      ).toBe(true);
    });
  });

  describe("invalid transitions", () => {
    it("rejects NEGOTIATING → PAID", () => {
      expect(
        canTransition("NEGOTIATING", "PAID")
      ).toBe(false);
    });

    it("rejects CREATED → COMPLETED", () => {
      expect(
        canTransition("CREATED", "COMPLETED")
      ).toBe(false);
    });

    it("rejects OFFER_RECEIVED → PAID", () => {
      expect(
        canTransition(
          "OFFER_RECEIVED",
          "PAID"
        )
      ).toBe(false);
    });

    it("rejects COMPLETED → NEGOTIATING", () => {
      expect(
        canTransition(
          "COMPLETED",
          "NEGOTIATING"
        )
      ).toBe(false);
    });
  });

  describe("transitionDeal", () => {
    it("returns an allowed transition", () => {
      const result = transitionDeal(
        "CREATED",
        "NEGOTIATING"
      );

      expect(result.allowed).toBe(true);
      expect(result.from).toBe("CREATED");
      expect(result.to).toBe("NEGOTIATING");
      expect(result.reason).toBeUndefined();
    });

    it("returns a rejected transition with a reason", () => {
      const result = transitionDeal(
        "NEGOTIATING",
        "PAID"
      );

      expect(result.allowed).toBe(false);
      expect(result.from).toBe("NEGOTIATING");
      expect(result.to).toBe("PAID");
      expect(result.reason).toBe(
        "Invalid deal state transition: NEGOTIATING → PAID"
      );
    });
  });
});