import type { AuditEvent } from "@/models/audit-event";
import type { PersistenceService } from "@/services/persistence-service";
import { InMemoryPersistenceService } from "@/services/persistence-service";

export class AuditService {
  private readonly persistence: PersistenceService;

  constructor(
    persistenceService?: PersistenceService
  ) {
    this.persistence =
      persistenceService ??
      new InMemoryPersistenceService();
  }

  record(
    event: AuditEvent
  ): AuditEvent {
    return this.persistence.createAuditEvent(
      event
    );
  }

  getByDealSession(
    dealSessionId: string
  ): AuditEvent[] {
    return this.persistence.getAuditEvents(
      dealSessionId
    );
  }

  getAll(): AuditEvent[] {
    return this.persistence.getAllAuditEvents();
  }
}