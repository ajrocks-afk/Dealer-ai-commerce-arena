import type { DealState } from "./deal-states";

/**
 * Deterministic DEAL state transition map.
 *
 * Agents propose decisions.
 * The state machine is the final authority.
 */
export const DEAL_TRANSITIONS: Record<
  DealState,
  DealState[]
> = {
  CREATED: [
    "NEGOTIATING",
    "CANCELLED",
    "EXPIRED",
  ],

  NEGOTIATING: [
    "OFFER_RECEIVED",
    "POLICY_CHECK",
    "COUNTERED",
    "CANCELLED",
    "EXPIRED",
  ],

  OFFER_RECEIVED: [
    "POLICY_CHECK",
    "NEGOTIATING",
    "COUNTERED",
    "ACCEPTED",
    "REJECTED",
    "CANCELLED",
    "EXPIRED",
  ],

  POLICY_CHECK: [
    "ACCEPTED",
    "REJECTED",
    "COUNTERED",
    "NEGOTIATING",
    "CANCELLED",
    "EXPIRED",
  ],

  COUNTERED: [
    "OFFER_RECEIVED",
    "POLICY_CHECK",
    "NEGOTIATING",
    "ACCEPTED",
    "REJECTED",
    "CANCELLED",
    "EXPIRED",
  ],

  ACCEPTED: [
    "PAYMENT_PENDING",
    "CANCELLED",
  ],

  PAYMENT_PENDING: [
    "PAID",
    "FAILED",
    "CANCELLED",
  ],

  PAID: [
    "COMPLETED",
  ],

  FAILED: [
    "PAYMENT_PENDING",
    "CANCELLED",
  ],

  REJECTED: [],

  COMPLETED: [],

  CANCELLED: [],

  EXPIRED: [],
};