import type { DealSession } from "@/models/deal-session";
import type { Offer } from "@/models/offer";
import type { AuditEvent } from "@/models/audit-event";
import type { RazorpayOrder } from "@/models/razorpay-order";
import type { HumanApprovalRequest } from "@/models/human-approval";

export interface PersistenceService {
  createDeal(
    session: DealSession
  ): DealSession;

  getDeal(
    dealId: string
  ): DealSession | undefined;

  getAllDeals(): DealSession[];

  updateDeal(
    session: DealSession
  ): DealSession;

  createOffer(
    offer: Offer
  ): Offer;

  getOffers(
    dealSessionId: string
  ): Offer[];

  createAuditEvent(
    event: AuditEvent
  ): AuditEvent;

  getAuditEvents(
    dealSessionId: string
  ): AuditEvent[];

  getAllAuditEvents(): AuditEvent[];

  createRazorpayOrder(
    order: RazorpayOrder
  ): RazorpayOrder;

  getRazorpayOrder(
    dealSessionId: string
  ): RazorpayOrder | undefined;

  updateRazorpayOrder(
    order: RazorpayOrder
  ): RazorpayOrder;

  createHumanApproval(
    request: HumanApprovalRequest
  ): HumanApprovalRequest;

  getHumanApproval(
    dealSessionId: string
  ): HumanApprovalRequest | undefined;

  updateHumanApproval(
    request: HumanApprovalRequest
  ): HumanApprovalRequest;
}

/**
 * In-memory persistence implementation.
 *
 * This intentionally does not depend on Firebase yet.
 * It gives us a deterministic persistence layer that
 * can be fully tested before connecting Firestore.
 */
export class InMemoryPersistenceService
  implements PersistenceService
{
  private readonly deals =
    new Map<string, DealSession>();

  private readonly offers =
    new Map<string, Offer>();

  private readonly auditEvents =
    new Map<string, AuditEvent>();

  private readonly razorpayOrders =
    new Map<string, RazorpayOrder>();

  private readonly humanApprovals =
    new Map<
      string,
      HumanApprovalRequest
    >();

  createDeal(
    session: DealSession
  ): DealSession {
    if (
      this.deals.has(
        session.id
      )
    ) {
      throw new Error(
        `Deal already exists: ${session.id}`
      );
    }

    const stored = {
      ...session,
    };

    this.deals.set(
      session.id,
      stored
    );

    return {
      ...stored,
    };
  }

  getDeal(
    dealId: string
  ): DealSession | undefined {
    const session =
      this.deals.get(dealId);

    return session
      ? {
          ...session,
        }
      : undefined;
  }

  getAllDeals(): DealSession[] {
    return Array.from(
      this.deals.values()
    ).map(
      (session) => ({
        ...session,
      })
    );
  }

  updateDeal(
    session: DealSession
  ): DealSession {
    if (
      !this.deals.has(
        session.id
      )
    ) {
      throw new Error(
        `Deal not found: ${session.id}`
      );
    }

    const stored = {
      ...session,
    };

    this.deals.set(
      session.id,
      stored
    );

    return {
      ...stored,
    };
  }

  createOffer(
    offer: Offer
  ): Offer {
    if (
      this.offers.has(
        offer.id
      )
    ) {
      throw new Error(
        `Offer already exists: ${offer.id}`
      );
    }

    const stored = {
      ...offer,
    };

    this.offers.set(
      offer.id,
      stored
    );

    return {
      ...stored,
    };
  }

  getOffers(
    dealSessionId: string
  ): Offer[] {
    return Array.from(
      this.offers.values()
    )
      .filter(
        (offer) =>
          offer.dealSessionId ===
          dealSessionId
      )
      .map(
        (offer) => ({
          ...offer,
        })
      );
  }

  createAuditEvent(
    event: AuditEvent
  ): AuditEvent {
    if (
      this.auditEvents.has(
        event.id
      )
    ) {
      throw new Error(
        `Audit event already exists: ${event.id}`
      );
    }

    const stored = {
      ...event,
    };

    this.auditEvents.set(
      event.id,
      stored
    );

    return {
      ...stored,
    };
  }

  getAuditEvents(
    dealSessionId: string
  ): AuditEvent[] {
    return Array.from(
      this.auditEvents.values()
    )
      .filter(
        (event) =>
          event.dealSessionId ===
          dealSessionId
      )
      .map(
        (event) => ({
          ...event,
        })
      );
  }

  getAllAuditEvents(): AuditEvent[] {
    return Array.from(
      this.auditEvents.values()
    ).map(
      (event) => ({
        ...event,
      })
    );
  }

  createRazorpayOrder(
    order: RazorpayOrder
  ): RazorpayOrder {
    if (
      this.razorpayOrders.has(
        order.dealSessionId
      )
    ) {
      throw new Error(
        `Razorpay order already exists for deal: ${order.dealSessionId}`
      );
    }

    const stored = {
      ...order,
    };

    this.razorpayOrders.set(
      order.dealSessionId,
      stored
    );

    return {
      ...stored,
    };
  }

  getRazorpayOrder(
    dealSessionId: string
  ): RazorpayOrder | undefined {
    const order =
      this.razorpayOrders.get(
        dealSessionId
      );

    return order
      ? {
          ...order,
        }
      : undefined;
  }

  updateRazorpayOrder(
    order: RazorpayOrder
  ): RazorpayOrder {
    if (
      !this.razorpayOrders.has(
        order.dealSessionId
      )
    ) {
      throw new Error(
        `Razorpay order not found for deal: ${order.dealSessionId}`
      );
    }

    const stored = {
      ...order,
    };

    this.razorpayOrders.set(
      order.dealSessionId,
      stored
    );

    return {
      ...stored,
    };
  }

  createHumanApproval(
    request: HumanApprovalRequest
  ): HumanApprovalRequest {
    if (
      this.humanApprovals.has(
        request.dealSessionId
      )
    ) {
      throw new Error(
        `Human approval already exists for deal: ${request.dealSessionId}`
      );
    }

    const stored = {
      ...request,
    };

    this.humanApprovals.set(
      request.dealSessionId,
      stored
    );

    return {
      ...stored,
    };
  }

  getHumanApproval(
    dealSessionId: string
  ): HumanApprovalRequest | undefined {
    const request =
      this.humanApprovals.get(
        dealSessionId
      );

    return request
      ? {
          ...request,
        }
      : undefined;
  }

  updateHumanApproval(
    request: HumanApprovalRequest
  ): HumanApprovalRequest {
    if (
      !this.humanApprovals.has(
        request.dealSessionId
      )
    ) {
      throw new Error(
        `Human approval not found for deal: ${request.dealSessionId}`
      );
    }

    const stored = {
      ...request,
    };

    this.humanApprovals.set(
      request.dealSessionId,
      stored
    );

    return {
      ...stored,
    };
  }
}