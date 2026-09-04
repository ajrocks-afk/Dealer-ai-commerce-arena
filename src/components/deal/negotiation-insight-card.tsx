"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import type {
  NegotiationInsight,
} from "@/models/negotiation-insight";

interface NegotiationInsightCardProps {
  insight: NegotiationInsight | null;
}

function formatAmount(
  value: number,
  currency: string
) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `₹${value.toLocaleString("en-IN")}`;
  }
}

function getSeverityConfig(
  severity: NegotiationInsight["severity"]
) {
  switch (severity) {
    case "BLOCKED":
      return {
        icon: ShieldAlert,
        label: "BLOCKED",
        border:
          "border-[#EF4444]/20",
        background:
          "bg-[#EF4444]/[0.04]",
        text: "text-[#EF4444]",
        iconBackground:
          "bg-[#EF4444]/[0.08]",
      };

    case "WARNING":
      return {
        icon: AlertTriangle,
        label: "WARNING",
        border:
          "border-[#F5A623]/20",
        background:
          "bg-[#F5A623]/[0.04]",
        text: "text-[#F5A623]",
        iconBackground:
          "bg-[#F5A623]/[0.08]",
      };

    case "SUCCESS":
      return {
        icon: CheckCircle2,
        label: "ALLOWED",
        border:
          "border-[#22C55E]/20",
        background:
          "bg-[#22C55E]/[0.04]",
        text: "text-[#22C55E]",
        iconBackground:
          "bg-[#22C55E]/[0.08]",
      };

    case "INFO":
    default:
      return {
        icon: Info,
        label: "INFO",
        border:
          "border-white/[0.08]",
        background:
          "bg-white/[0.02]",
        text: "text-[#A1A1AA]",
        iconBackground:
          "bg-white/[0.04]",
      };
  }
}

export default function NegotiationInsightCard({
  insight,
}: NegotiationInsightCardProps) {
  if (!insight) {
    return null;
  }

  const severity =
    getSeverityConfig(
      insight.severity
    );

  const SeverityIcon =
    severity.icon;

  const proposedPrice =
    insight.price?.proposed;

  const currentPrice =
    insight.price?.current;

  const priceMovement =
    proposedPrice !== undefined &&
    currentPrice !== undefined
      ? proposedPrice - currentPrice
      : undefined;

  return (
    <section className="mt-6">
      <div
        className={`overflow-hidden rounded-2xl border ${severity.border} ${severity.background}`}
      >
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          {/* HEADER */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${severity.border} ${severity.iconBackground} ${severity.text}`}
              >
                <SeverityIcon size={17} />
              </div>

              <div>
                <p className="text-[8px] font-bold tracking-[0.18em] text-[#52525B]">
                  NEGOTIATION INSIGHT
                </p>

                <h3 className="mt-1 text-sm font-semibold tracking-[-0.01em] text-white">
                  {insight.title}
                </h3>

                <p className="mt-2 max-w-2xl text-xs leading-5 text-[#A1A1AA]">
                  {insight.summary}
                </p>
              </div>
            </div>

            <span
              className={`shrink-0 self-start rounded-full border px-2.5 py-1 text-[7px] font-black tracking-[0.14em] ${severity.border} ${severity.iconBackground} ${severity.text}`}
            >
              {severity.label}
            </span>
          </div>

          {/* DECISION CONTEXT */}

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <p className="text-[7px] font-bold tracking-[0.14em] text-[#52525B]">
                ACTOR
              </p>

              <p className="mt-1 text-[10px] font-semibold text-white">
                {insight.actor ===
                "BUYER_AGENT"
                  ? "BUYER AGENT"
                  : "MERCHANT AGENT"}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <p className="text-[7px] font-bold tracking-[0.14em] text-[#52525B]">
                ACTION
              </p>

              <p className="mt-1 text-[10px] font-semibold text-white">
                {insight.action}
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <p className="text-[7px] font-bold tracking-[0.14em] text-[#52525B]">
                ROUND
              </p>

              <p className="dealer-mono mt-1 text-[10px] font-semibold text-white">
                {String(
                  insight.round.current
                ).padStart(2, "0")}{" "}
                /{" "}
                {String(
                  insight.round.maximum
                ).padStart(2, "0")}
              </p>
            </div>
          </div>

          {/* PRICE CONTEXT */}

          {insight.price && (
            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[7px] font-bold tracking-[0.14em] text-[#52525B]">
                    PRICE CONTEXT
                  </p>

                  <p className="mt-1 text-xs text-[#A1A1AA]">
                    Deterministic pricing
                    boundary for this
                    decision.
                  </p>
                </div>

                {priceMovement !==
                  undefined && (
                  <div
                    className={`flex items-center gap-1.5 text-[9px] font-bold ${
                      priceMovement < 0
                        ? "text-[#EF4444]"
                        : priceMovement > 0
                          ? "text-[#22C55E]"
                          : "text-[#71717A]"
                    }`}
                  >
                    {priceMovement < 0 ? (
                      <TrendingDown
                        size={13}
                      />
                    ) : priceMovement > 0 ? (
                      <TrendingUp
                        size={13}
                      />
                    ) : null}

                    {priceMovement !==
                    0
                      ? `${priceMovement > 0 ? "+" : ""}${formatAmount(
                          priceMovement,
                          insight.price.currency
                        )}`
                      : "NO CHANGE"}
                  </div>
                )}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[7px] font-bold tracking-[0.12em] text-[#52525B]">
                    PROPOSED
                  </p>

                  <p className="dealer-mono mt-1 text-sm font-semibold text-white">
                    {proposedPrice !==
                    undefined
                      ? formatAmount(
                          proposedPrice,
                          insight.price
                            .currency
                        )
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[7px] font-bold tracking-[0.12em] text-[#52525B]">
                    CURRENT
                  </p>

                  <p className="dealer-mono mt-1 text-sm font-semibold text-white">
                    {insight.price.current !== undefined
                        ? formatAmount(
                            insight.price.current,
                            insight.price.currency
                          )
                        : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[7px] font-bold tracking-[0.12em] text-[#52525B]">
                    POLICY FLOOR
                  </p>

                  <p className="dealer-mono mt-1 text-sm font-semibold text-[#F5A623]">
                    {formatAmount(
                      insight.price.policyFloor,
                      insight.price.currency
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* FACTS */}

          {insight.facts.length >
            0 && (
            <div>
              <p className="text-[7px] font-bold tracking-[0.16em] text-[#52525B]">
                DECISION FACTS
              </p>

              <div className="mt-3 space-y-2">
                {insight.facts.map(
                  (fact, index) => (
                    <div
                      key={`${fact}-${index}`}
                      className="flex items-start gap-2.5"
                    >
                      <span
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${severity.text.replace(
                          "text-",
                          "bg-"
                        )}`}
                      />

                      <p className="text-xs leading-5 text-[#A1A1AA]">
                        {fact}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* POLICY RESULT */}

          <div className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[7px] font-bold tracking-[0.14em] text-[#52525B]">
                DETERMINISTIC POLICY
              </p>

              <p className="mt-1 text-xs text-[#A1A1AA]">
                {insight.policy.reason ??
                  "Policy evaluation completed without a reported violation."}
              </p>
            </div>

            <div
              className={`flex items-center gap-2 text-[8px] font-black tracking-[0.12em] ${
                insight.policy.allowed
                  ? "text-[#22C55E]"
                  : "text-[#EF4444]"
              }`}
            >
              {insight.policy.allowed ? (
                <CheckCircle2 size={13} />
              ) : (
                <ShieldAlert size={13} />
              )}

              {insight.policy.allowed
                ? "POLICY ALLOWED"
                : "POLICY BLOCKED"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}