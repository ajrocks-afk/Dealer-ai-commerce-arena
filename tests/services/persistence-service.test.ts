import {
  describe,
  expect,
  it,
} from "vitest";

import {
  InMemoryPersistenceService,
} from "@/services/persistence-service";

import type {
  DealSession,
} from "@/models/deal-session";

import type {
  Offer,
} from "@/models/offer";

import type {
  AuditEvent,
} from "@/models/audit-event";

describe(
  "InMemoryPersistenceService",
  () => {
    const createSession = (
      id = "deal-001"
    ): DealSession => ({
      id,

      productId: "prod-001",
      merchantId: "merchant-001",
      buyerId: "buyer-001",

      state: "CREATED",

      currentRound: 1,
      maxRounds: 5,

      currency: "INR",

      initialPrice: 5000000,
      currentPrice: 5000000,

      createdAt:
        "2026-08-24T00:00:00.000Z",

      updatedAt:
        "2026-08-24T00:00:00.000Z",

      expiresAt:
        "2026-08-25T00:00:00.000Z",
    });

    const createOffer = (
      id = "offer-001"
    ): Offer => ({
      id,

      dealSessionId: "deal-001",

      actor: "BUYER_AGENT",

      price: 4800000,

      quantity: 1,

      currency: "INR",

      status: "PENDING",

      round: 1,

      createdAt:
        "2026-08-24T00:00:00.000Z",
    });

    const createAuditEvent = (
      id = "audit-001"
    ): AuditEvent => ({
      id,

      dealSessionId: "deal-001",

      actor: "SYSTEM",

      type: "DEAL_CREATED",

      description:
        "Deal created",

      createdAt:
        "2026-08-24T00:00:00.000Z",
    });

    it(
      "creates and retrieves a deal",
      () => {
        const service =
          new InMemoryPersistenceService();

        const session =
          createSession();

        service.createDeal(session);

        const result =
          service.getDeal(
            "deal-001"
          );

        expect(result).toEqual(
          session
        );
      }
    );

    it(
      "returns undefined for an unknown deal",
      () => {
        const service =
          new InMemoryPersistenceService();

        expect(
          service.getDeal(
            "missing-deal"
          )
        ).toBeUndefined();
      }
    );

    it(
      "updates an existing deal",
      () => {
        const service =
          new InMemoryPersistenceService();

        const session =
          createSession();

        service.createDeal(session);

        const updated: DealSession = {
          ...session,
          state: "NEGOTIATING",
          currentRound: 2,
          currentPrice: 4900000,
        };

        service.updateDeal(updated);

        const result =
          service.getDeal(
            "deal-001"
          );

        expect(result?.state).toBe(
          "NEGOTIATING"
        );

        expect(
          result?.currentRound
        ).toBe(2);

        expect(
          result?.currentPrice
        ).toBe(4900000);
      }
    );

    it(
      "rejects duplicate deals",
      () => {
        const service =
          new InMemoryPersistenceService();

        const session =
          createSession();

        service.createDeal(session);

        expect(() =>
          service.createDeal(
            session
          )
        ).toThrow(
          "Deal already exists"
        );
      }
    );

    it(
      "rejects updating a missing deal",
      () => {
        const service =
          new InMemoryPersistenceService();

        expect(() =>
          service.updateDeal(
            createSession()
          )
        ).toThrow(
          "Deal not found"
        );
      }
    );

    it(
      "creates and retrieves offers",
      () => {
        const service =
          new InMemoryPersistenceService();

        const offer =
          createOffer();

        service.createOffer(
          offer
        );

        const result =
          service.getOffers(
            "deal-001"
          );

        expect(result).toEqual([
          offer,
        ]);
      }
    );

    it(
      "returns only offers belonging to the requested deal",
      () => {
        const service =
          new InMemoryPersistenceService();

        service.createOffer(
          createOffer(
            "offer-001"
          )
        );

        const secondOffer: Offer = {
          ...createOffer(
            "offer-002"
          ),
          dealSessionId:
            "deal-002",
        };

        service.createOffer(
          secondOffer
        );

        const result =
          service.getOffers(
            "deal-001"
          );

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(
          "offer-001"
        );
      }
    );

    it(
      "creates and retrieves audit events",
      () => {
        const service =
          new InMemoryPersistenceService();

        const event =
          createAuditEvent();

        service.createAuditEvent(
          event
        );

        const result =
          service.getAuditEvents(
            "deal-001"
          );

        expect(result).toEqual([
          event,
        ]);
      }
    );

    it(
      "returns only audit events for the requested deal",
      () => {
        const service =
          new InMemoryPersistenceService();

        service.createAuditEvent(
          createAuditEvent(
            "audit-001"
          )
        );

        const secondEvent: AuditEvent = {
          ...createAuditEvent(
            "audit-002"
          ),
          dealSessionId:
            "deal-002",
        };

        service.createAuditEvent(
          secondEvent
        );

        const result =
          service.getAuditEvents(
            "deal-001"
          );

        expect(result).toHaveLength(1);

        expect(result[0].id).toBe(
          "audit-001"
        );
      }
    );

    it(
      "does not expose mutable internal deal state",
      () => {
        const service =
          new InMemoryPersistenceService();

        const session =
          createSession();

        service.createDeal(session);

        const retrieved =
          service.getDeal(
            "deal-001"
          );

        if (!retrieved) {
          throw new Error(
            "Deal was not retrieved"
          );
        }

        retrieved.state =
          "NEGOTIATING";

        const stored =
          service.getDeal(
            "deal-001"
          );

        expect(stored?.state).toBe(
          "CREATED"
        );
      }
    );
  }
);