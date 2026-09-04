export type AuditActor =
  | "BUYER_AGENT"
  | "MERCHANT_AGENT"
  | "SYSTEM"
  | "HUMAN";

export type AuditEventType =
  | "DEAL_CREATED"
  | "OFFER_CREATED"
  | "POLICY_CHECKED"
  | "STATE_CHANGED"
  | "OFFER_ACCEPTED"
  | "OFFER_REJECTED"
  | "HUMAN_APPROVAL_REQUESTED"
  | "PAYMENT_CREATED"
  | "PAYMENT_COMPLETED"
  | "DEAL_COMPLETED"
  | "DEAL_CANCELLED"
  | "DEAL_FAILED";
  
export interface AuditEvent {
  id: string;

  dealSessionId: string;

  actor: AuditActor;

  type: AuditEventType;

  description: string;

  metadata?: Record<string, unknown>;

  createdAt: string;
}