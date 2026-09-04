"use client";

import {
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getDeal, type DealSession } from "@/lib/dealer-api";

const money = (value?: number) =>
  `₹${Math.round(value ?? 0).toLocaleString("en-IN")}`;

const formatTime = (value?: string) =>
  value
    ? new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "—";

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const terminalStates = [
  "ACCEPTED",
  "COMPLETED",
  "PAID",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
];

export default function DealResultPage() {
  const params = useParams<{ dealId: string }>();
  const dealId = params?.dealId;

  const [session, setSession] = useState<DealSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!dealId) return;

    async function loadResult() {
      try {
        setLoading(true);
        setError("");

        const result = await getDeal(dealId);

        if (!result.success || !result.session) {
          throw new Error(result.error ?? "Unable to load deal result");
        }

        setSession(result.session);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load deal result"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadResult();
  }, [dealId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#04050A] text-white">
        <div className="flex min-h-screen flex-col items-center justify-center">
          <CircleDollarSign
            size={30}
            className="animate-pulse text-[#60A5FA]"
          />
          <p className="mt-5 text-[10px] font-black tracking-[0.18em] text-[#60A5FA]">
            LOADING DEAL RESULT
          </p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-[#04050A] px-5 py-10 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-400/10 bg-white/[0.02] p-8">
          <p className="text-xs text-red-300">
            {error || "Deal result is unavailable."}
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-[9px] font-black tracking-[0.12em] text-white"
          >
            <ArrowLeft size={12} />
            BACK TO DEALER
          </Link>
        </div>
      </main>
    );
  }

  const isAccepted =
    session.state === "ACCEPTED" ||
    session.state === "COMPLETED" ||
    session.state === "PAID";

  const isTerminal = terminalStates.includes(session.state);

  const savings = Math.max(0, session.initialPrice - session.currentPrice);
  const savingsPercent =
    session.initialPrice > 0
      ? Math.round((savings / session.initialPrice) * 100)
      : 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[#04050A] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.09),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(124,58,237,0.09),transparent_30%)]" />

      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            href={`/deals/${encodeURIComponent(session.id)}`}
            className="inline-flex items-center gap-2 text-[9px] font-black tracking-[0.14em] text-[#71747D] transition hover:text-white"
          >
            <ArrowLeft size={13} />
            BACK TO DEAL
          </Link>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#60A5FA]/15 bg-[#60A5FA]/[0.04] px-3 py-1.5 text-[8px] font-black tracking-[0.14em] text-[#60A5FA]">
              CONTROLLED EXECUTION
            </span>
            <span
              className={`rounded-full border px-3 py-1.5 text-[8px] font-black tracking-[0.14em] ${
                isAccepted
                  ? "border-[#22C55E]/15 bg-[#22C55E]/[0.04] text-[#22C55E]"
                  : "border-white/[0.08] bg-white/[0.025] text-[#71747D]"
              }`}
            >
              {session.state}
            </span>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-12">
        <div className="max-w-3xl">
          <p className="text-[9px] font-black tracking-[0.2em] text-[#60A5FA]">
            DEAL RESULT / FINAL STATE
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
            Commerce,
            <br />
            <span className="bg-gradient-to-r from-[#60A5FA] via-[#818CF8] to-[#A78BFA] bg-clip-text text-transparent">
              resolved under control.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#858995]">
            The result below is read directly from the authoritative deal
            session. Gemini can propose negotiation actions, but the
            deterministic control layer owns the final deal state and price.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <ResultCard
            label="AUTHORITATIVE PRICE"
            value={money(session.currentPrice)}
            accent="blue"
            icon={<CircleDollarSign size={16} />}
          />

          <ResultCard
            label="DEAL STATE"
            value={session.state}
            accent={isAccepted ? "green" : "violet"}
            icon={isAccepted ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
          />

          <ResultCard
            label="ROUNDS USED"
            value={`${session.currentRound} / ${session.maxRounds}`}
            accent="violet"
            icon={<Sparkles size={16} />}
          />
        </div>

        <section className="mt-4 rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[#60A5FA]/10 bg-[#60A5FA]/[0.04] p-2 text-[#60A5FA]">
              <ShieldCheck size={15} />
            </div>
            <div>
              <p className="text-[8px] font-black tracking-[0.18em] text-[#52555E]">
                DETERMINISTIC RESULT
              </p>
              <h2 className="mt-1 text-sm font-semibold">
                Final authoritative deal facts
              </h2>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="STARTING PRICE" value={money(session.initialPrice)} />
            <Fact label="FINAL / CURRENT PRICE" value={money(session.currentPrice)} />
            <Fact label="BUYER SAVINGS" value={`${money(savings)} (${savingsPercent}%)`} />
            <Fact label="CURRENCY" value={session.currency} />
            <Fact label="PRODUCT" value={session.productId} />
            <Fact label="BUYER" value={session.buyerId} />
            <Fact label="MERCHANT" value={session.merchantId} />
            <Fact label="SESSION" value={session.id} />
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <InfoPanel
            label="TIMELINE"
            title="Session timestamps"
            rows={[
              ["CREATED", formatDate(session.createdAt)],
              ["UPDATED", formatTime(session.updatedAt)],
              ["EXPIRES", formatDate(session.expiresAt)],
            ]}
          />

          <InfoPanel
            label="CONTROL STATUS"
            title="Execution boundary"
            rows={[
              ["STATE", session.state],
              ["TERMINAL", isTerminal ? "YES" : "NO"],
              ["PAYMENT", session.state === "PAID" ? "PAID" : "NOT PAID"],
            ]}
          />
        </section>

        <div className="mt-8 rounded-2xl border border-[#60A5FA]/10 bg-[#60A5FA]/[0.025] p-5">
          <p className="text-[9px] font-black tracking-[0.16em] text-[#60A5FA]">
            AI → POLICY → STATE MACHINE → PAYMENT
          </p>
          <p className="mt-2 text-xs leading-6 text-[#6F737D]">
            Gemini proposes. Deterministic validation decides whether the
            proposal is allowed. The state machine controls execution. Payment
            remains outside direct AI authority.
          </p>
        </div>
      </section>
    </main>
  );
}

function ResultCard({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: string;
  accent: "blue" | "violet" | "green";
  icon: React.ReactNode;
}) {
  const accentClass =
    accent === "blue"
      ? "text-[#60A5FA] border-[#60A5FA]/10 bg-[#60A5FA]/[0.035]"
      : accent === "violet"
        ? "text-[#A78BFA] border-[#A78BFA]/10 bg-[#A78BFA]/[0.035]"
        : "text-[#22C55E] border-[#22C55E]/10 bg-[#22C55E]/[0.035]";

  return (
    <div className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
      <div className={`inline-flex rounded-xl border p-2 ${accentClass}`}>
        {icon}
      </div>
      <p className="mt-5 text-[8px] font-black tracking-[0.18em] text-[#52555E]">
        {label}
      </p>
      <p className="mt-2 break-words font-mono text-2xl font-semibold tracking-[-0.04em]">
        {value}
      </p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.055] bg-black/20 p-4">
      <p className="text-[8px] font-black tracking-[0.15em] text-[#464951]">
        {label}
      </p>
      <p className="mt-2 break-words font-mono text-[11px] text-[#A1A4AD]">
        {value}
      </p>
    </div>
  );
}

function InfoPanel({
  label,
  title,
  rows,
}: {
  label: string;
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="rounded-3xl border border-white/[0.07] bg-white/[0.018] p-6">
      <div className="flex items-center gap-2 text-[#71747D]">
        <Clock3 size={14} />
        <span className="text-[8px] font-black tracking-[0.18em]">
          {label}
        </span>
      </div>

      <h2 className="mt-3 text-sm font-semibold">{title}</h2>

      <div className="mt-5 space-y-3">
        {rows.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 border-b border-white/[0.045] pb-3 last:border-0 last:pb-0"
          >
            <span className="text-[8px] font-black tracking-[0.14em] text-[#4D5059]">
              {key}
            </span>
            <span className="text-right font-mono text-[10px] text-[#92959E]">
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
