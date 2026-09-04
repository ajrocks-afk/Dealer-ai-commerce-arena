import type { DealSession } from "@/models/deal-session";

import type {
  HumanApprovalDecision,
  HumanApprovalRequest,
} from "@/models/human-approval";

export class HumanApprovalService {
  createRequest(
    session: DealSession,
    requestedBy:
      | "BUYER_AGENT"
      | "MERCHANT_AGENT",
    requestedPrice?: number,
    reason?: string
  ): HumanApprovalRequest {
    return {
      id: this.createId(),
      dealSessionId: session.id,
      status: "PENDING",
      requestedBy,
      requestedAt:
        new Date().toISOString(),
      requestedPrice,
      currency: session.currency,
      reason:
        reason?.trim() ||
        "This offer requires human approval.",
    };
  }

  approve(
    request: HumanApprovalRequest,
    reviewerId: string
  ): HumanApprovalRequest {
    if (!reviewerId.trim()) {
      throw new Error(
        "A reviewer identity is required."
      );
    }

    if (request.status !== "PENDING") {
      throw new Error(
        "Only pending approval requests can be approved."
      );
    }

    return {
      ...request,
      status: "APPROVED",
      reviewedAt:
        new Date().toISOString(),
      reviewedBy:
        reviewerId.trim(),
      decision: "APPROVE",
    };
  }

  reject(
    request: HumanApprovalRequest,
    reviewerId: string,
    reason?: string
  ): HumanApprovalRequest {
    if (!reviewerId.trim()) {
      throw new Error(
        "A reviewer identity is required."
      );
    }

    if (request.status !== "PENDING") {
      throw new Error(
        "Only pending approval requests can be rejected."
      );
    }

    return {
      ...request,
      status: "REJECTED",
      reviewedAt:
        new Date().toISOString(),
      reviewedBy:
        reviewerId.trim(),
      decision: "REJECT",
      reason:
        reason?.trim() ||
        "Human reviewer rejected the approval request.",
    };
  }

  isApproved(
    request:
      | HumanApprovalRequest
      | undefined
  ): boolean {
    return request?.status === "APPROVED";
  }

  isPending(
    request:
      | HumanApprovalRequest
      | undefined
  ): boolean {
    return request?.status === "PENDING";
  }

  getDecision(
    request:
      | HumanApprovalRequest
      | undefined
  ): HumanApprovalDecision | undefined {
    return request?.decision;
  }

  private createId(): string {
    return `approval-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;
  }
}