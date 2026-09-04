import {
  InMemoryPersistenceService,
} from "@/services/persistence-service";

declare global {
  // eslint-disable-next-line no-var
  var dealerPersistence:
    | InMemoryPersistenceService
    | undefined;
}

/**
 * Keep one persistence instance per Node.js process.
 *
 * This is still an in-memory adapter and is therefore not a production
 * database. The global reference is important, however, because Next.js
 * can evaluate route modules separately. Without it, one route could create
 * a deal in one store while another route reads from a different store.
 *
 * Firestore will replace this adapter for durable multi-instance storage.
 */
export const persistence =
  globalThis.dealerPersistence ??
  new InMemoryPersistenceService();

globalThis.dealerPersistence = persistence;
