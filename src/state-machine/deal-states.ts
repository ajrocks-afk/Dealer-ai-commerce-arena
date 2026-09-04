export const DEAL_STATES = [
  "CREATED",
  "NEGOTIATING",
  "OFFER_RECEIVED",
  "POLICY_CHECK",
  "COUNTERED",
  "ACCEPTED",
  "PAYMENT_PENDING",
  "PAID",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "FAILED",
] as const;

export type DealState = (typeof DEAL_STATES)[number];