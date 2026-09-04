import { describe, expect, it } from "vitest";

import { AuditService } from "@/services/audit-service";
import type { AuditEvent } from "@/models/audit-event";

describe("AuditService", () => {
  it("records an audit event", () => {
    const service = new AuditService();

    const event: AuditEvent = {
      id: "audit-001",
      dealSessionId: "deal-001",
      actor: "BUYER_AGENT",
      type: "OFFER_CREATED",
      description: "Buyer submitted an offer",
      metadata: {
        price: 7500000,
      },
      createdAt: new Date().toISOString(),
    };

    const result = service.record(event);

    expect(result).toEqual(event);
    expect(service.getAll()).toHaveLength(1);
  });

  it("returns events for a specific deal", () => {
    const service = new AuditService();

    const event1: AuditEvent = {
      id: "audit-001",
      dealSessionId: "deal-001",
      actor: "BUYER_AGENT",
      type: "OFFER_CREATED",
      description: "Buyer submitted an offer",
      createdAt: new Date().toISOString(),
    };

    const event2: AuditEvent = {
      id: "audit-002",
      dealSessionId: "deal-002",
      actor: "SYSTEM",
      type: "DEAL_CREATED",
      description: "Deal created",
      createdAt: new Date().toISOString(),
    };

    service.record(event1);
    service.record(event2);

    const result =
      service.getByDealSession("deal-001");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("audit-001");
  });

  it("does not expose the internal event array", () => {
    const service = new AuditService();

    const event: AuditEvent = {
      id: "audit-001",
      dealSessionId: "deal-001",
      actor: "SYSTEM",
      type: "DEAL_CREATED",
      description: "Deal created",
      createdAt: new Date().toISOString(),
    };

    service.record(event);

    const events = service.getAll();

    events.pop();

    expect(service.getAll()).toHaveLength(1);
  });
});