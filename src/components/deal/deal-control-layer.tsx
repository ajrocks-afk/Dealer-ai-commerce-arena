"use client";

import type { ReactNode } from "react";
import { Activity, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";

interface DealControlLayerProps {
  status: string;
  dealState?: string;
}

interface StatusCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  good: boolean;
}

function StatusCard({
  icon,
  label,
  value,
  good,
}: StatusCardProps) {
  return (
    <div className="dealer-glass flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            good
              ? "border border-[#22C55E]/15 bg-[#22C55E]/[0.04] text-[#22C55E]"
              : "border border-[#EF4444]/15 bg-[#EF4444]/[0.04] text-[#EF4444]"
          }`}
        >
          {icon}
        </div>

        <span className="text-[9px] font-bold tracking-[0.12em] text-[#71717A]">
          {label}
        </span>
      </div>

      <span
        className={`dealer-mono text-[9px] font-semibold ${
          good
            ? "text-[#22C55E]"
            : "text-[#EF4444]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function DealControlLayer({
  status,
  dealState,
}: DealControlLayerProps) {
  const hasError = status === "error";

  return (
    <section className="pt-16">
      <div className="mb-6">
        <p className="text-[9px] font-bold tracking-[0.2em] text-[#F5A623]">
          CONTROL LAYER
        </p>

        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
          Every decision is validated.
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71717A]">
          AI agents can propose actions, but deterministic
          systems decide whether those actions are allowed.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatusCard
          icon={
            hasError ? (
              <XCircle size={15} />
            ) : (
              <CheckCircle2 size={15} />
            )
          }
          label="AGENT VALIDATION"
          value={hasError ? "FAILED" : "PASS"}
          good={!hasError}
        />

        <StatusCard
          icon={
            hasError ? (
              <XCircle size={15} />
            ) : (
              <ShieldCheck size={15} />
            )
          }
          label="POLICY ENGINE"
          value={hasError ? "BLOCKED" : "READY"}
          good={!hasError}
        />

        <StatusCard
          icon={<Activity size={15} />}
          label="STATE MACHINE"
          value={dealState ?? "LOADING"}
          good={!hasError}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[8px] font-bold tracking-[0.16em] text-[#52525B]">
            EXECUTION GUARANTEE
          </p>

          <p className="mt-1 text-xs text-[#71717A]">
            AI proposes. Deterministic controls authorize.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.1em] text-[#22C55E]">
          <ShieldCheck size={13} />
          CONTROLLED EXECUTION
        </div>
      </div>
    </section>
  );
}