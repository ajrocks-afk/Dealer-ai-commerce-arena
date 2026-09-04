"use client";

import {
  CheckCircle2,
  Clock3,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";

import type {
  HumanApprovalRequest,
} from "@/models/human-approval";

interface HumanApprovalCardProps {
  approval: HumanApprovalRequest | null;
  loading: boolean;
  submitting: boolean;
  reviewerId: string;
  rejectionReason: string;
  onReviewerIdChange: (
    value: string
  ) => void;
  onRejectionReasonChange: (
    value: string
  ) => void;
  onApprove: () => void;
  onReject: () => void;
}

export default function HumanApprovalCard({
  approval,
  loading,
  submitting,
  reviewerId,
  rejectionReason,
  onReviewerIdChange,
  onRejectionReasonChange,
  onApprove,
  onReject,
}: HumanApprovalCardProps) {
  if (loading) {
    return (
      <section className="dealer-glass mt-6 overflow-hidden border-[#F5A623]/15 p-6">
        <div className="flex items-center gap-3">
          <Clock3
            size={16}
            className="text-[#F5A623]"
          />

          <div>
            <p className="text-[9px] font-bold tracking-[0.16em] text-[#F5A623]">
              HUMAN APPROVAL
            </p>

            <p className="mt-1 text-xs text-[#71717A]">
              Checking approval status...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!approval) {
    return null;
  }

  const isPending =
    approval.status === "PENDING";

  const isApproved =
    approval.status === "APPROVED";

  const isRejected =
    approval.status === "REJECTED";

  return (
    <section className="dealer-glass mt-6 overflow-hidden border-[#F5A623]/15">
      <div className="border-b border-white/[0.06] px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#F5A623]/20 bg-[#F5A623]/[0.06]">
              {isApproved ? (
                <CheckCircle2
                  size={18}
                  className="text-[#22C55E]"
                />
              ) : isRejected ? (
                <XCircle
                  size={18}
                  className="text-[#EF4444]"
                />
              ) : (
                <ShieldCheck
                  size={18}
                  className="text-[#F5A623]"
                />
              )}
            </div>

            <div>
              <p className="text-[9px] font-bold tracking-[0.16em] text-[#F5A623]">
                HUMAN APPROVAL GATE
              </p>

              <h3 className="mt-1 text-base font-semibold text-white">
                {isPending
                  ? "Human review required"
                  : isApproved
                    ? "Human approval granted"
                    : "Human approval rejected"}
              </h3>

              <p className="mt-1 text-xs leading-5 text-[#71717A]">
                AI can request approval, but it
                cannot approve its own transaction.
              </p>
            </div>
          </div>

          <span
            className={`rounded-full border px-3 py-1.5 text-[8px] font-black tracking-[0.12em] ${
              isPending
                ? "border-[#F5A623]/20 bg-[#F5A623]/[0.05] text-[#F5A623]"
                : isApproved
                  ? "border-[#22C55E]/20 bg-[#22C55E]/[0.05] text-[#22C55E]"
                  : "border-[#EF4444]/20 bg-[#EF4444]/[0.05] text-[#EF4444]"
            }`}
          >
            {approval.status}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[8px] font-bold tracking-[0.14em] text-[#52525B]">
              REQUESTED BY
            </p>

            <p className="dealer-mono mt-2 text-[10px] font-semibold text-white">
              {approval.requestedBy}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[8px] font-bold tracking-[0.14em] text-[#52525B]">
              REQUESTED PRICE
            </p>

            <p className="dealer-mono mt-2 text-[10px] font-semibold text-[#F5A623]">
              {approval.requestedPrice !==
              undefined
                ? `₹${approval.requestedPrice.toLocaleString(
                    "en-IN"
                  )}`
                : "—"}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[8px] font-bold tracking-[0.14em] text-[#52525B]">
              REVIEWER
            </p>

            <p className="dealer-mono mt-2 text-[10px] font-semibold text-white">
              {approval.reviewedBy ??
                "PENDING"}
            </p>
          </div>
        </div>

        {approval.reason && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[8px] font-bold tracking-[0.14em] text-[#52525B]">
              REASON
            </p>

            <p className="mt-2 text-xs leading-5 text-[#A1A1AA]">
              {approval.reason}
            </p>
          </div>
        )}

        {isPending && (
          <>
            <div>
              <label className="mb-2 block text-[8px] font-bold tracking-[0.14em] text-[#71717A]">
                REVIEWER ID
              </label>

              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0A0A0B]/60 px-3.5">
                <UserCheck
                  size={14}
                  className="shrink-0 text-[#71717A]"
                />

                <input
                  value={reviewerId}
                  onChange={(event) =>
                    onReviewerIdChange(
                      event.target.value
                    )
                  }
                  disabled={submitting}
                  className="w-full bg-transparent py-3 text-xs text-white outline-none placeholder:text-[#52525B] disabled:opacity-50"
                  placeholder="Reviewer identity"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[8px] font-bold tracking-[0.14em] text-[#71717A]">
                REJECTION REASON
                <span className="ml-1 font-normal text-[#52525B]">
                  optional for approval
                </span>
              </label>

              <textarea
                value={rejectionReason}
                onChange={(event) =>
                  onRejectionReasonChange(
                    event.target.value
                  )
                }
                disabled={submitting}
                rows={3}
                className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#0A0A0B]/60 px-3.5 py-3 text-xs text-white outline-none placeholder:text-[#52525B] disabled:opacity-50"
                placeholder="Required when rejecting..."
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={
                  submitting ||
                  !reviewerId.trim()
                }
                onClick={onApprove}
                className="dealer-interactive flex items-center justify-center gap-2 rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/[0.05] px-4 py-3 text-[9px] font-black tracking-[0.12em] text-[#22C55E] hover:bg-[#22C55E]/[0.1] disabled:opacity-40"
              >
                <CheckCircle2
                  size={13}
                />

                {submitting
                  ? "PROCESSING..."
                  : "APPROVE DEAL"}
              </button>

              <button
                type="button"
                disabled={
                  submitting ||
                  !reviewerId.trim() ||
                  !rejectionReason.trim()
                }
                onClick={onReject}
                className="dealer-interactive flex items-center justify-center gap-2 rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/[0.05] px-4 py-3 text-[9px] font-black tracking-[0.12em] text-[#EF4444] hover:bg-[#EF4444]/[0.1] disabled:opacity-40"
              >
                <XCircle size={13} />

                {submitting
                  ? "PROCESSING..."
                  : "REJECT DEAL"}
              </button>
            </div>
          </>
        )}

        {isApproved && (
          <div className="flex items-start gap-3 rounded-xl border border-[#22C55E]/15 bg-[#22C55E]/[0.04] p-4">
            <CheckCircle2
              size={15}
              className="mt-0.5 shrink-0 text-[#22C55E]"
            />

            <div>
              <p className="text-xs font-semibold text-white">
                Human approval recorded.
              </p>

              <p className="mt-1 text-xs leading-5 text-[#71717A]">
                The approval gate is satisfied.
                The state machine still controls
                deal execution.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="flex items-start gap-3 rounded-xl border border-[#EF4444]/15 bg-[#EF4444]/[0.04] p-4">
            <XCircle
              size={15}
              className="mt-0.5 shrink-0 text-[#EF4444]"
            />

            <div>
              <p className="text-xs font-semibold text-white">
                Human approval was rejected.
              </p>

              <p className="mt-1 text-xs leading-5 text-[#71717A]">
                The approval gate remains
                unsatisfied. DEALER will not
                treat this review as transaction
                authorization.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}