import { NextResponse } from "next/server";

import {
  persistence,
} from "@/services/persistence-instance";

import {
  HumanApprovalService,
} from "@/services/human-approval-service";

import type {
  HumanApprovalDecision,
} from "@/models/human-approval";

import type {
  AuditEvent,
} from "@/models/audit-event";

interface RouteContext {
  params: Promise<{
    dealId: string;
  }>;
}

const humanApprovalService =
  new HumanApprovalService();

/*
 * =========================================================
 * GET
 *
 * Retrieve the current human approval request for a deal.
 * =========================================================
 */

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { dealId } =
      await context.params;

    if (
      typeof dealId !== "string" ||
      dealId.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "dealId is required",
        },
        { status: 400 }
      );
    }

    const session =
      persistence.getDeal(dealId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Deal not found",
        },
        { status: 404 }
      );
    }

    const approval =
      persistence.getHumanApproval(
        dealId
      );

    return NextResponse.json(
      {
        success: true,
        session,
        approval:
          approval ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Failed to retrieve human approval:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to retrieve human approval",
      },
      { status: 500 }
    );
  }
}

/*
 * =========================================================
 * POST
 *
 * Create a new PENDING human approval request.
 *
 * IMPORTANT:
 * This endpoint creates the approval gate.
 * It does NOT approve anything.
 * It does NOT change deal state.
 * It does NOT create payment.
 * =========================================================
 */

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { dealId } =
      await context.params;

    if (
      typeof dealId !== "string" ||
      dealId.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "dealId is required",
        },
        { status: 400 }
      );
    }

    /*
     * =======================================================
     * 1. LOAD DEAL
     * =======================================================
     */

    const session =
      persistence.getDeal(dealId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Deal not found",
        },
        { status: 404 }
      );
    }

    /*
     * =======================================================
     * 2. DO NOT CREATE APPROVAL FOR TERMINAL DEALS
     * =======================================================
     */

    if (
      session.state === "COMPLETED" ||
      session.state === "CANCELLED" ||
      session.state === "EXPIRED" ||
      session.state === "FAILED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Cannot create approval for a ${session.state.toLowerCase()} deal`,
        },
        { status: 409 }
      );
    }

    /*
     * =======================================================
     * 3. READ REQUEST
     * =======================================================
     */

    const body =
      await request.json();

    const {
      requestedBy,
      requestedPrice,
      reason,
    } = body;

    /*
     * =======================================================
     * 4. VALIDATE REQUESTER
     * =======================================================
     */

    if (
      requestedBy !== "BUYER_AGENT" &&
      requestedBy !== "MERCHANT_AGENT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid approval requester",
        },
        { status: 400 }
      );
    }

    /*
     * =======================================================
     * 5. VALIDATE REQUESTED PRICE
     * =======================================================
     */

    if (
      requestedPrice !== undefined &&
      (
        typeof requestedPrice !== "number" ||
        !Number.isFinite(requestedPrice) ||
        requestedPrice <= 0
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "requestedPrice must be a positive number",
        },
        { status: 400 }
      );
    }

    /*
     * =======================================================
     * 6. PREVENT DUPLICATE APPROVAL REQUEST
     * =======================================================
     */

    const existingApproval =
      persistence.getHumanApproval(
        dealId
      );

    if (existingApproval) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A human approval request already exists for this deal",
          approval:
            existingApproval,
        },
        { status: 409 }
      );
    }

    /*
     * =======================================================
     * 7. CREATE APPROVAL REQUEST
     * =======================================================
     */

    const approval =
      humanApprovalService.createRequest(
        session,
        requestedBy,
        requestedPrice,
        typeof reason === "string"
          ? reason.trim()
          : undefined
      );

    /*
     * =======================================================
     * 8. PERSIST APPROVAL
     * =======================================================
     */

    persistence.createHumanApproval(
      approval
    );

    /*
     * =======================================================
     * 9. AUDIT
     *
     * Use the shared persistence instance so
     * the event is visible to the rest of
     * the application.
     * =======================================================
     */

    const auditEvent:
      AuditEvent = {
      id:
        `audit-${crypto.randomUUID()}`,

      dealSessionId:
        dealId,

      actor:
        "SYSTEM",

      type:
        "STATE_CHANGED",

      description:
        "Human approval requested.",

      metadata: {
        approvalId:
          approval.id,

        requestedBy:
          approval.requestedBy,

        requestedPrice:
          approval.requestedPrice,

        reason:
          approval.reason,

        status:
          approval.status,
      },

      createdAt:
        new Date().toISOString(),
    };

    persistence.createAuditEvent(
      auditEvent
    );

    /*
     * =======================================================
     * 10. RETURN
     * =======================================================
     */

    return NextResponse.json(
      {
        success: true,
        approval,
        session,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to create human approval:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create human approval",
      },
      { status: 500 }
    );
  }
}

/*
 * =========================================================
 * PATCH
 *
 * Approve or reject an existing PENDING request.
 *
 * IMPORTANT:
 * - Reviewer identity is mandatory.
 * - Only PENDING requests may be reviewed.
 * - AI cannot approve itself.
 * - This endpoint does NOT move the deal to ACCEPTED.
 * - This endpoint does NOT create payment.
 * =========================================================
 */

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { dealId } =
      await context.params;

    if (
      typeof dealId !== "string" ||
      dealId.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "dealId is required",
        },
        { status: 400 }
      );
    }

    /*
     * =======================================================
     * 1. LOAD DEAL
     * =======================================================
     */

    const session =
      persistence.getDeal(dealId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Deal not found",
        },
        { status: 404 }
      );
    }

    /*
     * =======================================================
     * 2. READ REQUEST
     * =======================================================
     */

    const body =
      await request.json();

    const {
      decision,
      reviewerId,
      reason,
    } = body;

    /*
     * =======================================================
     * 3. VALIDATE DECISION
     * =======================================================
     */

    if (
      decision !== "APPROVE" &&
      decision !== "REJECT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid approval decision",
        },
        { status: 400 }
      );
    }

    /*
     * =======================================================
     * 4. VALIDATE REVIEWER
     * =======================================================
     */

    if (
      typeof reviewerId !== "string" ||
      !reviewerId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A reviewer identity is required.",
        },
        { status: 400 }
      );
    }

    /*
     * =======================================================
     * 5. LOAD APPROVAL
     * =======================================================
     */

    const approval =
      persistence.getHumanApproval(
        dealId
      );

    if (!approval) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Human approval request not found",
        },
        { status: 404 }
      );
    }

    /*
     * =======================================================
     * 6. ONLY PENDING REQUESTS MAY BE REVIEWED
     * =======================================================
     */

    if (
      !humanApprovalService.isPending(
        approval
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only pending approval requests can be reviewed.",
          approval,
        },
        { status: 409 }
      );
    }

    /*
     * =======================================================
     * 7. APPLY HUMAN DECISION
     * =======================================================
     */

    let updatedApproval;

    const typedDecision:
      HumanApprovalDecision =
      decision;

    if (
      typedDecision === "APPROVE"
    ) {
      updatedApproval =
        humanApprovalService.approve(
          approval,
          reviewerId.trim()
        );
    } else {
      updatedApproval =
        humanApprovalService.reject(
          approval,
          reviewerId.trim(),
          typeof reason === "string"
            ? reason.trim()
            : undefined
        );
    }

    /*
     * =======================================================
     * 8. PERSIST REVIEW RESULT
     * =======================================================
     */

    persistence.updateHumanApproval(
      updatedApproval
    );

    /*
     * =======================================================
     * 9. AUDIT
     * =======================================================
     */

    const auditEvent:
      AuditEvent = {
      id:
        `audit-${crypto.randomUUID()}`,

      dealSessionId:
        dealId,

      actor:
        "HUMAN",

      type:
        "STATE_CHANGED",

      description:
        decision === "APPROVE"
          ? "Human approval granted."
          : "Human approval rejected.",

      metadata: {
        approvalId:
          updatedApproval.id,

        decision,

        reviewerId:
          reviewerId.trim(),

        reason:
          updatedApproval.reason,

        requestedPrice:
          updatedApproval.requestedPrice,

        status:
          updatedApproval.status,
      },

      createdAt:
        new Date().toISOString(),
    };

    persistence.createAuditEvent(
      auditEvent
    );

    /*
     * =======================================================
     * 10. IMPORTANT SAFETY RULE
     *
     * Human approval alone does NOT authorize
     * payment or directly mutate the deal state.
     *
     * The existing state machine / orchestrator
     * remains responsible for execution.
     * =======================================================
     */

    return NextResponse.json(
      {
        success: true,
        approval:
          updatedApproval,
        session,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Failed to process human approval:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to process human approval",
      },
      { status: 500 }
    );
  }
}