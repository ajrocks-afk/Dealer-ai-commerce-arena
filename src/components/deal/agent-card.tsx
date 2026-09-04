"use client";

import {
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Cpu,
  Handshake,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  XCircle,
  Zap,
} from "lucide-react";

export type AgentCardType =
  | "BUYER_AGENT"
  | "MERCHANT_AGENT";

export type AgentCardStatus =
  | "READY"
  | "PROCESSING"
  | "SUCCESS"
  | "ERROR"
  | "IDLE";

interface AgentCardProps {
  agent: AgentCardType;
  status?: AgentCardStatus;
  price?: number;
  currency?: string;
  objective?: string;
  description?: string;
  lastAction?: string;
  disabled?: boolean;
}

function formatCurrency(
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

function getAgentConfig(agent: AgentCardType) {
  if (agent === "BUYER_AGENT") {
    return {
      name: "Buyer Agent",
      shortName: "BUYER",
      role: "Demand Intelligence",
      description:
        "Optimizes the buyer objective while participating in controlled negotiation.",
      icon: UserRound,
      accent: "#3B82F6",
      border: "border-[#3B82F6]/20",
      background: "bg-[#3B82F6]/[0.04]",
      text: "text-[#3B82F6]",
      badge: "bg-[#3B82F6]/10 text-[#60A5FA]",
    };
  }

  return {
    name: "Merchant Agent",
    shortName: "MERCHANT",
    role: "Supply Intelligence",
    description:
      "Protects merchant economics while responding to buyer proposals.",
    icon: Bot,
    accent: "#8B5CF6",
    border: "border-[#8B5CF6]/20",
    background: "bg-[#8B5CF6]/[0.04]",
    text: "text-[#8B5CF6]",
    badge: "bg-[#8B5CF6]/10 text-[#A78BFA]",
  };
}

function getStatusConfig(status: AgentCardStatus) {
  switch (status) {
    case "PROCESSING":
      return {
        label: "PROCESSING",
        className:
          "border-[#F5A623]/20 bg-[#F5A623]/10 text-[#F5A623]",
        dot: "bg-[#F5A623]",
      };

    case "SUCCESS":
      return {
        label: "ACTIVE",
        className:
          "border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]",
        dot: "bg-[#22C55E]",
      };

    case "ERROR":
      return {
        label: "BLOCKED",
        className:
          "border-[#EF4444]/20 bg-[#EF4444]/10 text-[#EF4444]",
        dot: "bg-[#EF4444]",
      };

    case "IDLE":
      return {
        label: "IDLE",
        className:
          "border-white/[0.08] bg-white/[0.03] text-[#71717A]",
        dot: "bg-[#52525B]",
      };

    case "READY":
    default:
      return {
        label: "READY",
        className:
          "border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]",
        dot: "bg-[#22C55E]",
      };
  }
}

export default function AgentCard({
  agent,
  status = "READY",
  price,
  currency = "INR",
  objective,
  description,
  lastAction,
  disabled = false,
}: AgentCardProps) {
  const config = getAgentConfig(agent);
  const statusConfig = getStatusConfig(status);
  const AgentIcon = config.icon;

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111214] transition-all duration-300 ${
        disabled
          ? "opacity-60"
          : "hover:border-white/[0.12]"
      }`}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent, ${config.accent}, transparent)`,
        }}
      />

      <div className="p-5">
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl border ${config.border} ${config.background} ${config.text}`}
            >
              <AgentIcon size={20} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-[-0.01em] text-white">
                  {config.name}
                </h3>

                <span
                  className={`rounded-full px-2 py-0.5 text-[7px] font-bold tracking-[0.12em] ${config.badge}`}
                >
                  AI
                </span>
              </div>

              <p className="mt-1 text-[9px] font-medium tracking-[0.08em] text-[#52525B]">
                {config.role}
              </p>
            </div>
          </div>

          {/* STATUS */}

          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[7px] font-bold tracking-[0.1em] ${statusConfig.className}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot} ${
                status === "PROCESSING"
                  ? "animate-pulse"
                  : ""
              }`}
            />

            {statusConfig.label}
          </div>
        </div>

        {/* DESCRIPTION */}

        <p className="mt-5 text-xs leading-5 text-[#71717A]">
          {description ?? config.description}
        </p>

        {/* OBJECTIVE */}

        {objective && (
          <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="flex items-center gap-2">
              <Target
                size={13}
                className={config.text}
              />

              <span className="text-[8px] font-bold tracking-[0.14em] text-[#52525B]">
                OBJECTIVE
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-[#A1A1AA]">
              {objective}
            </p>
          </div>
        )}

        {/* PRICE */}

        {price !== undefined && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3">
            <div className="flex items-center gap-2">
              <CircleDollarSign
                size={13}
                className="text-[#F5A623]"
              />

              <span className="text-[8px] font-bold tracking-[0.14em] text-[#52525B]">
                CURRENT PROPOSAL
              </span>
            </div>

            <span className="dealer-mono text-sm font-semibold text-white">
              {formatCurrency(price, currency)}
            </span>
          </div>
        )}

        {/* LAST ACTION */}

        {lastAction && (
          <div className="mt-4 flex items-start gap-2.5">
            <div className="mt-0.5 text-[#52525B]">
              <Handshake size={13} />
            </div>

            <div>
              <p className="text-[8px] font-bold tracking-[0.12em] text-[#52525B]">
                LAST ACTION
              </p>

              <p className="mt-1 text-xs leading-5 text-[#71717A]">
                {lastAction}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}

      <div className="border-t border-white/[0.05] bg-black/10 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu
              size={12}
              className="text-[#52525B]"
            />

            <span className="text-[7px] font-bold tracking-[0.12em] text-[#52525B]">
              AGENT DECISION LAYER
            </span>
          </div>

          {status === "SUCCESS" ? (
            <CheckCircle2
              size={13}
              className="text-[#22C55E]"
            />
          ) : status === "ERROR" ? (
            <XCircle
              size={13}
              className="text-[#EF4444]"
            />
          ) : status === "PROCESSING" ? (
            <Zap
              size={13}
              className="animate-pulse text-[#F5A623]"
            />
          ) : (
            <Sparkles
              size={13}
              className={config.text}
            />
          )}
        </div>
      </div>
    </article>
  );
}