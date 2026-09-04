export type HumanApprovalStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type HumanApprovalDecision =
  | "APPROVE"
  | "REJECT";

export interface HumanApprovalRequest {
  id: string;

  dealSessionId: string;

  status: HumanApprovalStatus;

  requestedBy:
    | "BUYER_AGENT"
    | "MERCHANT_AGENT";

  requestedAt: string;

  reviewedAt?: string;

  reviewedBy?: string;

  decision?: HumanApprovalDecision;

  reason?: string;

  requestedPrice?: number;

  currency: string;
}