"use client";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Cpu,
  GitBranch,
  Loader2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createPaymentOrder,
  getDeal,
  runAutonomousNegotiation,
  submitDecision,
  verifyPayment,
  type DealSession,
  type RazorpayOrder,
  type SubmitDecisionResponse,
} from "@/lib/dealer-api";

type Agent = "BUYER_AGENT" | "MERCHANT_AGENT";
type Decision = "MAKE_OFFER" | "ACCEPT" | "REJECT" | "COUNTER" | "STOP";

type LiveDecision = {
  id: string;
  agent: Agent;
  decision: string;
  offerPrice?: number;
  quantity?: number;
  reasoning: string;
  round: number;
  createdAt: string;
};

type Offer = NonNullable<SubmitDecisionResponse["offer"]>;

type Audit = {
  id: string;
  actor: string;
  type: string;
  description: string;
  createdAt: string;
};

type CheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: CheckoutOptions) => { open: () => void };
  }
}

const money = (value?: number) =>
  `₹${Math.round(value ?? 0).toLocaleString("en-IN")}`;

const labelAgent = (agent?: string) =>
  agent === "BUYER_AGENT" ? "BUYER AI" : "MERCHANT AI";

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

export default function DealPage() {
  const params = useParams<{ dealId: string }>();
  const router = useRouter();
  const dealId = params?.dealId;

  const [session, setSession] = useState<DealSession | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [decisions, setDecisions] = useState<LiveDecision[]>([]);
  const [paymentOrder, setPaymentOrder] = useState<RazorpayOrder | null>(null);

  const [buyerPrice, setBuyerPrice] = useState(0);
  const [merchantPrice, setMerchantPrice] = useState(0);
  const [busy, setBusy] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [error, setError] = useState("");
  const [pulse, setPulse] = useState(false);

  const loadDeal = useCallback(async () => {
    if (!dealId) return;

    try {
      const result = await getDeal(dealId);

      if (!result.success || !result.session) {
        throw new Error(result.error ?? "Unable to load deal");
      }

      setSession(result.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load deal");
    }
  }, [dealId]);

  useEffect(() => {
    void loadDeal();
  }, [loadDeal]);

  useEffect(() => {
    if (!session) return;

    if (["COMPLETED", "PAID", "REJECTED", "CANCELLED", "EXPIRED"].includes(session.state)) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadDeal();
    }, 2500);

    return () => window.clearInterval(timer);
  }, [session, loadDeal]);

  const latestOffer = offers.at(-1);

  // This is the authoritative value from the active deal session.
  // Gemini proposals are intentionally kept separate in the agent cards.
  const currentPrice = session?.currentPrice ?? 0;

  const progress = session
    ? Math.min(100, Math.round((session.currentRound / Math.max(1, session.maxRounds)) * 100))
    : 0;

  const buyerDecision = decisions
    .filter((decision) => decision.agent === "BUYER_AGENT")
    .at(-1);

  const merchantDecision = decisions
    .filter((decision) => decision.agent === "MERCHANT_AGENT")
    .at(-1);

  const latestAudit = audit.at(-1);

  const terminal =
    !!session &&
    ["COMPLETED", "PAID", "REJECTED", "CANCELLED", "EXPIRED"].includes(session.state);

  const canStop =
    !!session &&
    ["CREATED", "NEGOTIATING", "OFFER_RECEIVED", "POLICY_CHECK", "COUNTERED"].includes(session.state);

  const canAccept =
    !!session &&
    ["OFFER_RECEIVED", "POLICY_CHECK", "COUNTERED"].includes(session.state);

  const latestActivity = useMemo(
    () =>
      [
        ...decisions.map((decision) => ({
          id: decision.id,
          time: decision.createdAt,
          actor: decision.agent,
          type: `AI_${decision.decision}`,
          description: decision.reasoning,
          price: decision.offerPrice,
        })),
        ...audit.map((event) => ({
          id: event.id,
          time: event.createdAt,
          actor: event.actor,
          type: event.type,
          description: event.description,
          price: undefined,
        })),
      ]
        .sort((a, b) => +new Date(b.time) - +new Date(a.time))
        .slice(0, 12),
    [audit, decisions]
  );

  const runNegotiation = async () => {
    if (!dealId || !session || terminal || busy) return;

    setBusy(true);
    setError("");
    setPulse(true);

    try {
      setAudit((current) => [
        ...current,
        {
          id: `audit-${Date.now()}`,
          actor: "SYSTEM",
          type: "NEGOTIATION_STARTED",
          description: "Gemini negotiation started through the deterministic control layer.",
          createdAt: new Date().toISOString(),
        },
      ]);

      const result = await runAutonomousNegotiation(dealId);

      if (!result.session) {
        throw new Error(result.errors?.join(" • ") ?? result.error ?? "Negotiation failed");
      }

      setSession(result.session);

      const returnedOffers = (result.offers ?? []).filter(
        (offer): offer is Offer => Boolean(offer)
      );

      if (returnedOffers.length > 0) {
        setOffers((current) => [...current, ...returnedOffers]);
      }

      const responseRound = result.session.currentRound;
      const incoming = (result.decisions ?? []).map((decision, index) => ({
        id: `gemini-${Date.now()}-${index}`,
        agent: decision.agent === "MERCHANT_AGENT" ? "MERCHANT_AGENT" : "BUYER_AGENT",
        decision: decision.decision,
        offerPrice: decision.offerPrice,
        quantity: decision.quantity,
        reasoning: decision.reasoning,
        round: responseRound,
        createdAt: new Date().toISOString(),
      })) as LiveDecision[];

      if (incoming.length > 0) {
        setDecisions((current) => [...current, ...incoming]);

        for (const decision of incoming) {
          if (decision.agent === "BUYER_AGENT" && decision.offerPrice !== undefined) {
            setBuyerPrice(decision.offerPrice);
          }
          if (decision.agent === "MERCHANT_AGENT" && decision.offerPrice !== undefined) {
            setMerchantPrice(decision.offerPrice);
          }
          setAudit((current) => [
            ...current,
            {
              id: `audit-decision-${decision.id}`,
              actor: decision.agent,
              type: `AI_${decision.decision}`,
              description: decision.reasoning,
              createdAt: decision.createdAt,
            },
          ]);
        }
      }

      for (const offer of returnedOffers) {
        setAudit((current) => [
          ...current,
          {
            id: `audit-offer-${offer.id}`,
            actor: offer.actor,
            type: "OFFER_VALIDATED",
            description: `${labelAgent(offer.actor)} proposal ${money(offer.price)} passed the negotiation validation path.`,
            createdAt: offer.createdAt,
          },
        ]);
      }

      await loadDeal();

      if (result.errors?.length && incoming.length === 0 && returnedOffers.length === 0) {
        setError(result.errors.join(" • "));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Negotiation failed");
    } finally {
      setBusy(false);
      window.setTimeout(() => setPulse(false), 800);
    }
  };

  const decide = async (agent: Agent, decision: Decision) => {
    if (!dealId || !session || busy) return;

    setBusy(true);
    setError("");
    setPulse(true);

    const isTerminalDecision = decision === "ACCEPT" || decision === "REJECT" || decision === "STOP";
    const price = isTerminalDecision
      ? session.currentPrice
      : agent === "BUYER_AGENT"
        ? buyerPrice || 0
        : merchantPrice || 0;

    try {
      const response: SubmitDecisionResponse = await submitDecision(dealId, {
        agent,
        decision,
        offerPrice: price,
        quantity: 1,
        reasoning: `${labelAgent(agent)} submitted ${decision}${price > 0 ? ` at ${money(price)}` : ""}. The decision is submitted to deterministic policy and state-machine controls.`,
      });

      if (!response.session) {
        throw new Error(response.error ?? "Decision was not accepted by the server");
      }

      const responseSession = response.session;
      setSession(responseSession);

      if (response.offer) {
        setOffers((current) => [...current, response.offer!]);
        if (agent === "BUYER_AGENT") setBuyerPrice(response.offer.price);
        else setMerchantPrice(response.offer.price);
      }

      const manualDecision: LiveDecision = {
        id: `manual-${Date.now()}`,
        agent,
        decision,
        offerPrice: response.offer?.price ?? (decision === "ACCEPT" || decision === "STOP" ? undefined : price),
        quantity: response.offer?.quantity ?? 1,
        reasoning:
          response.insight?.summary ??
          `${labelAgent(agent)} submitted ${decision}${response.offer ? ` at ${money(response.offer.price)}` : ""}.`,
        round: responseSession.currentRound,
        createdAt: new Date().toISOString(),
      };

      setDecisions((current) => [...current, manualDecision]);
      setAudit((current) => [
        ...current,
        {
          id: `audit-manual-${Date.now()}`,
          actor: agent,
          type: decision === "COUNTER" ? "OFFER_VALIDATED" : decision,
          description: manualDecision.reasoning,
          createdAt: manualDecision.createdAt,
        },
      ]);

      await loadDeal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision failed");
    } finally {
      setBusy(false);
      window.setTimeout(() => setPulse(false), 800);
    }
  };

  const startPayment = async () => {
    if (
      !dealId ||
      !session ||
      session.state !== "ACCEPTED" ||
      paymentBusy
    ) {
      return;
    }

    setPaymentBusy(true);
    setError("");

    try {
      const result = await createPaymentOrder(dealId);

      if (!result.success || !result.order || !result.keyId) {
        throw new Error(
          result.error ??
            result.errors?.join(" • ") ??
            "Unable to create payment order"
        );
      }

      setPaymentOrder(result.order);

      const openCheckout = () => {
        if (!window.Razorpay) {
          throw new Error("Razorpay Checkout failed to load");
        }

        const checkout = new window.Razorpay({
          key: result.keyId!,
          amount: Math.round(result.order!.amount * 100),
          currency: result.order!.currency,
          name: "DEALER",
          description: "Controlled AI commerce transaction",
          order_id: result.order!.razorpayOrderId,
          handler: async (payment) => {
            try {
              const verification = await verifyPayment(dealId, {
                orderId: payment.razorpay_order_id,
                paymentId: payment.razorpay_payment_id,
                signature: payment.razorpay_signature,
              });

              if (!verification.success || !verification.session) {
                throw new Error(
                  verification.error ??
                    verification.errors?.join(" • ") ??
                    "Payment verification failed"
                );
              }

              setSession(verification.session);

              if (verification.session.state === "PAID") {
                router.push(
                  `/deals/${encodeURIComponent(dealId)}/result`
                );
              }
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : "Payment verification failed"
              );
            } finally {
              setPaymentBusy(false);
            }
          },
          modal: {
            ondismiss: () => setPaymentBusy(false),
          },
        });

        checkout.open();
      };

      const scriptId = "razorpay-checkout-js";
      const existing = document.getElementById(scriptId);

      if (existing) {
        openCheckout();
        return;
      }

      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = openCheckout;
      script.onerror = () => {
        setPaymentBusy(false);
        setError("Unable to load Razorpay Checkout");
      };

      document.body.appendChild(script);
    } catch (err) {
      setPaymentBusy(false);
      setError(err instanceof Error ? err.message : "Payment failed");
    }
  };

  if (!session) {
    return (
      <main className="dealer-deal-page min-h-screen bg-[#04050A] text-white">
        <div className="dealer-loading">
          <div className="dealer-loading-orbit">
            <div className="dealer-loading-core">
              <CircleDollarSign size={20} />
            </div>
          </div>
          <p className="dealer-kicker mt-7 text-[#60A5FA]">
            INITIALIZING DEAL CORE
          </p>
          <p className="mt-2 text-xs text-[#52525B]">
            Loading controlled commerce session…
          </p>
        </div>
        <DealStyles />
      </main>
    );
  }

  return (
    <main className="dealer-deal-page min-h-screen overflow-hidden bg-[#04050A] text-white">
      <div className="dealer-noise" />
      <div className="dealer-ambient dealer-ambient-blue" />
      <div className="dealer-ambient dealer-ambient-violet" />
      <div className="dealer-scanline" />

      <header className="dealer-header sticky top-0 z-50">
        <div className="mx-auto flex h-[76px] max-w-[1520px] items-center justify-between px-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="dealer-back-button"
              aria-label="Back to DEALER home"
            >
              <ArrowLeft size={15} />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="dealer-kicker text-[#60A5FA]">
                  DEALER
                </span>
                <span className="text-[#30323A]">/</span>
                <span className="dealer-kicker hidden text-[#71717A] sm:inline">
                  COMMERCE ARENA
                </span>
              </div>

              <p className="dealer-mono mt-1 truncate text-[8px] text-[#454750]">
                {session.id}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <StatusPill
              tone="blue"
              icon={<ShieldCheck size={11} />}
              label="CONTROLLED EXECUTION"
            />
            <StatusPill
              tone={terminal ? "green" : "neutral"}
              label={session.state}
            />
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-[1520px] px-5 pb-16 pt-10 lg:px-8 lg:pt-14">
        <div className="dealer-hero-grid">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="dealer-kicker text-[#8B5CF6]">
                LIVE AI NEGOTIATION
              </span>
              <span className="dealer-dot" />
              <span className="dealer-kicker text-[#52525B]">
                ROUND {session.currentRound}/{session.maxRounds}
              </span>
            </div>

            <h1 className="mt-5 text-[2.7rem] font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-[5rem]">
              <span className="block text-white">Commerce,</span>
              <span className="dealer-gradient-text">
                negotiated live.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#858995]">
              Gemini proposes the next move. Deterministic policy validates
              it. The state machine decides what can happen next. The AI
              never receives direct authority over money movement.
            </p>
          </div>

          <div className="dealer-session-summary">
            <div className="dealer-summary-top">
              <span className="dealer-kicker text-[#52525B]">
                SESSION STATUS
              </span>
              <Activity
                size={14}
                className={busy ? "animate-pulse text-[#60A5FA]" : "text-[#3F4149]"}
              />
            </div>

            <div className="dealer-summary-price">
              <span className="dealer-kicker text-[#454750]">
                AUTHORITATIVE PRICE
              </span>
              <strong className="dealer-mono mt-2 block text-3xl tracking-[-0.04em]">
                {money(currentPrice)}
              </strong>
            </div>

            <div className="dealer-summary-meta">
              <div>
                <span>ROUND</span>
                <strong>
                  {session.currentRound}/{session.maxRounds}
                </strong>
              </div>
              <div>
                <span>STATE</span>
                <strong>{session.state}</strong>
              </div>
              <div>
                <span>UPDATED</span>
                <strong>{formatTime(session.updatedAt)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="dealer-stage-line">
          <div className="dealer-stage-line-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
          <AgentPanel
            side="BUYER"
            agent="BUYER_AGENT"
            decision={buyerDecision}
            price={buyerDecision?.offerPrice ?? buyerPrice}
            fallbackPrice={
              offers
                .filter((offer) => offer.actor === "BUYER_AGENT")
                .at(-1)?.price
            }
            onPriceChange={setBuyerPrice}
            onDecision={(decision) => decide("BUYER_AGENT", decision)}
            disabled={busy || terminal}
          />

          <DealCore
            session={session}
            currentPrice={currentPrice}
            progress={progress}
            latestOffer={latestOffer}
            latestAudit={latestAudit}
            pulse={pulse}
          />

          <AgentPanel
            side="MERCHANT"
            agent="MERCHANT_AGENT"
            decision={merchantDecision}
            price={merchantDecision?.offerPrice ?? merchantPrice}
            fallbackPrice={
              offers
                .filter((offer) => offer.actor === "MERCHANT_AGENT")
                .at(-1)?.price
            }
            onPriceChange={setMerchantPrice}
            onDecision={(decision) => decide("MERCHANT_AGENT", decision)}
            disabled={busy || terminal}
          />
        </div>

        <div className="dealer-command-bar mt-4">
          <div className="min-w-0">
            <p className="dealer-kicker text-[#52525B]">
              NEGOTIATION CONTROL
            </p>
            <p className="mt-1 truncate text-xs text-[#71747D]">
              {busy
                ? "Gemini is evaluating the next commerce decision…"
                : terminal
                  ? `Session reached terminal state: ${session.state}`
                  : "Run the autonomous negotiation or submit a controlled agent decision."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              onClick={runNegotiation}
              disabled={busy || terminal}
              className="dealer-primary-button flex min-w-[220px] items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[9px] font-black tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {busy ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} />
              )}
              {busy ? "GEMINI IS THINKING…" : "RUN GEMINI NEGOTIATION"}
            </button>

            <button
              onClick={() => loadDeal()}
              disabled={busy}
              className="dealer-secondary-button flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[9px] font-black tracking-[0.14em] disabled:opacity-35"
            >
              <RefreshCw size={12} />
              SYNC STATE
            </button>
          </div>
        </div>

        {error && (
          <div className="dealer-error mt-4">
            <div className="dealer-error-icon">
              <XCircle size={14} />
            </div>
            <div className="min-w-0">
              <p className="dealer-kicker text-[#EF4444]">
                CONTROL RESPONSE
              </p>
              <p className="mt-1 text-xs leading-6 text-[#FCA5A5]">
                {error}
              </p>
            </div>
          </div>
        )}

        <section className="mt-5 grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
          <NegotiationFlow
            session={session}
            offers={offers}
            decisions={decisions}
          />

          <GovernancePanel session={session} busy={busy} />
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.92fr]">
          <ActivityPanel rows={latestActivity} />

          <ExecutionPanel
            session={session}
            paymentOrder={paymentOrder}
            paymentBusy={paymentBusy}
            canAccept={canAccept}
            canStop={canStop}
            onAccept={() => decide("BUYER_AGENT", "ACCEPT")}
            onStop={() => decide("BUYER_AGENT", "STOP")}
            onPay={startPayment}
            onResult={() =>
              router.push(
                `/deals/${encodeURIComponent(dealId)}/result`
              )
            }
          />
        </section>
      </section>

      <footer className="dealer-footer">
        <div className="mx-auto flex max-w-[1520px] flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="dealer-footer-mark">
              <Zap size={11} />
            </div>
            <p className="dealer-kicker text-[#4A4D56]">
              AI PROPOSES → POLICY DECIDES → STATE MACHINE EXECUTES
            </p>
          </div>

          <p className="dealer-mono text-[8px] text-[#3B3D45]">
            DEAL SESSION // {formatDate(session.createdAt)}
          </p>
        </div>
      </footer>

      <DealStyles />
    </main>
  );
}

function StatusPill({
  tone,
  label,
  icon,
}: {
  tone: "blue" | "green" | "neutral";
  label: string;
  icon?: ReactNode;
}) {
  const toneClass =
    tone === "blue"
      ? "border-[#60A5FA]/15 bg-[#60A5FA]/[0.05] text-[#60A5FA]"
      : tone === "green"
        ? "border-[#22C55E]/15 bg-[#22C55E]/[0.05] text-[#22C55E]"
        : "border-white/[0.08] bg-white/[0.025] text-[#71717A]";

  return (
    <span
      className={`dealer-kicker flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${toneClass}`}
    >
      {icon}
      {label}
    </span>
  );
}

function AgentPanel({
  side,
  agent,
  decision,
  price,
  fallbackPrice,
  onPriceChange,
  onDecision,
  disabled,
}: {
  side: "BUYER" | "MERCHANT";
  agent: Agent;
  decision?: LiveDecision;
  price: number;
  fallbackPrice?: number;
  onPriceChange: (value: number) => void;
  onDecision: (decision: Decision) => void;
  disabled: boolean;
}) {
  const actualPrice = decision?.offerPrice ?? fallbackPrice ?? price;
  const isBuyer = side === "BUYER";

  return (
    <section className={`dealer-agent-card ${isBuyer ? "dealer-agent-blue" : "dealer-agent-violet"}`}>
      <div className="dealer-agent-topline" />

      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`dealer-agent-avatar ${isBuyer ? "blue" : "violet"}`}>
              <Bot size={19} />
              <span />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="dealer-kicker text-[#858993]">
                  {side} AGENT
                </p>
                <span className="dealer-live-dot" />
              </div>
              <p className="mt-1 truncate text-sm font-semibold">
                Gemini decision layer
              </p>
            </div>
          </div>

          <span
            className={`dealer-agent-tag ${
              isBuyer ? "text-[#60A5FA]" : "text-[#A78BFA]"
            }`}
          >
            {agent.replace("_AGENT", "")}
          </span>
        </div>

        <div className="mt-7">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="dealer-kicker text-[#4F525B]">
                LATEST ACTUAL PROPOSAL
              </p>
              <p className="dealer-mono mt-2 text-[2.55rem] font-semibold tracking-[-0.06em] text-white">
                {money(actualPrice)}
              </p>
            </div>

            <div className="dealer-round-chip">
              <span>ROUND</span>
              <strong>{decision?.round ?? "—"}</strong>
            </div>
          </div>
        </div>

        <div className="dealer-decision-box mt-6">
          <div className="flex items-center justify-between gap-3">
            <span className="dealer-kicker text-[#4F525B]">
              GEMINI ACTION
            </span>

            <span
              className={`dealer-kicker ${
                decision ? "text-[#60A5FA]" : "text-[#555861]"
              }`}
            >
              {decision?.decision ?? "AWAITING"}
            </span>
          </div>

          <p className="mt-3 min-h-[92px] text-[11px] leading-6 text-[#92959E]">
            {decision?.reasoning ??
              "No live Gemini decision has been returned yet. Run the negotiation to reveal the actual decision and reasoning returned by the negotiation service."}
          </p>
        </div>

        <div className="mt-4">
          <p className="dealer-kicker mb-2 text-[#454850]">
            CONTROLLED MANUAL INPUT
          </p>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              type="number"
              value={price || ""}
              onChange={(event) =>
                onPriceChange(Number(event.target.value))
              }
              disabled={disabled}
              className="dealer-input dealer-mono rounded-xl px-3.5 py-3 text-sm"
              placeholder="Offer amount"
            />

            <button
              disabled={disabled}
              onClick={() => onDecision("COUNTER")}
              className="dealer-mini-button rounded-xl px-4 text-[9px] font-black tracking-[0.1em]"
            >
              COUNTER
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            disabled={disabled}
            onClick={() => onDecision("ACCEPT")}
            className="dealer-agent-accept rounded-xl px-3 py-3 text-[9px] font-black tracking-[0.1em] disabled:opacity-25"
          >
            ACCEPT
          </button>

          <button
            disabled={disabled}
            onClick={() => onDecision("STOP")}
            className="dealer-agent-stop rounded-xl px-3 py-3 text-[9px] font-black tracking-[0.1em] disabled:opacity-25"
          >
            STOP
          </button>
        </div>
      </div>
    </section>
  );
}

function DealCore({
  session,
  currentPrice,
  progress,
  latestOffer,
  latestAudit,
  pulse,
}: {
  session: DealSession;
  currentPrice: number;
  progress: number;
  latestOffer?: Offer;
  latestAudit?: Audit;
  pulse: boolean;
}) {
  return (
    <section
      className={`dealer-core relative h-full min-h-[535px] overflow-hidden rounded-[30px] p-5 sm:p-7 ${
        pulse ? "dealer-core-pulse" : ""
      }`}
    >
      <div className="dealer-core-halo" />
      <div className="dealer-core-ring dealer-core-ring-a" />
      <div className="dealer-core-ring dealer-core-ring-b" />
      <div className="dealer-core-ring dealer-core-ring-c" />
      <div className="dealer-core-grid" />
      <div className="dealer-core-crosshair" />

      <div className="relative flex h-full min-h-[535px] flex-col items-center justify-center text-center">
        <div className="dealer-core-label">
          <span className="dealer-core-live-dot" />
          <CircleDollarSign size={13} />
          DEAL CORE // LIVE
        </div>

        <p className="dealer-kicker mt-12 text-[#51545E]">
          CURRENT AUTHORITATIVE PRICE
        </p>

        <p className="dealer-mono mt-2 text-[3.35rem] font-semibold tracking-[-0.075em] text-white sm:text-[4.2rem]">
          {money(currentPrice)}
        </p>

        <p className="mt-3 max-w-xs text-[10px] leading-5 text-[#62656F]">
          Value is read from the active deal session and latest validated
          negotiation state.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <CorePill
            label={`ROUND ${session.currentRound}/${session.maxRounds}`}
            tone="violet"
          />
          <CorePill label={session.state} tone="neutral" />
        </div>

        <div className="mt-9 w-full max-w-sm">
          <div className="flex justify-between text-[8px] font-black tracking-[0.14em] text-[#4C4F58]">
            <span>NEGOTIATION PROGRESS</span>
            <span>{progress}%</span>
          </div>

          <div className="dealer-progress-track mt-2">
            <div
              className="dealer-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-7 grid w-full max-w-sm grid-cols-2 gap-2 text-left">
          <MiniStat
            label="LATEST OFFER"
            value={money(latestOffer?.price ?? currentPrice)}
          />
          <MiniStat
            label="CONTROL EVENT"
            value={latestAudit?.type ?? "AWAITING"}
          />
        </div>
      </div>
    </section>
  );
}

function CorePill({
  label,
  tone,
}: {
  label: string;
  tone: "violet" | "neutral";
}) {
  return (
    <span
      className={`dealer-core-pill ${
        tone === "violet" ? "violet" : "neutral"
      }`}
    >
      {label}
    </span>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="dealer-mini-stat">
      <p className="dealer-kicker text-[#3F424A]">{label}</p>
      <p className="dealer-mono mt-2 truncate text-[10px] text-[#A1A4AD]">
        {value}
      </p>
    </div>
  );
}

function NegotiationFlow({
  session,
  offers,
  decisions,
}: {
  session: DealSession;
  offers: Offer[];
  decisions: LiveDecision[];
}) {
  const latest = offers.at(-1);
  const buyerActive = decisions.some(
    (decision) => decision.agent === "BUYER_AGENT"
  );
  const merchantActive = decisions.some(
    (decision) => decision.agent === "MERCHANT_AGENT"
  );
  const policyActive = [
    "POLICY_CHECK",
    "COUNTERED",
    "OFFER_RECEIVED",
    "ACCEPTED",
  ].includes(session.state);

  return (
    <section className="dealer-glass dealer-section-card">
      <SectionHeading
        kicker="NEGOTIATION BUS"
        title="The offer travels through control layers"
        icon={<Activity size={15} />}
      />

      <div className="mt-7 grid items-center gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
        <FlowNode
          icon={<Bot size={15} />}
          label="BUYER AI"
          sublabel="PROPOSE"
          active={buyerActive}
          tone="blue"
        />

        <FlowArrow />

        <FlowNode
          icon={<ShieldCheck size={15} />}
          label="POLICY"
          sublabel="VALIDATE"
          active={policyActive}
          tone="violet"
        />

        <FlowArrow />

        <FlowNode
          icon={<Bot size={15} />}
          label="MERCHANT AI"
          sublabel="RESPOND"
          active={merchantActive}
          tone="violet"
        />
      </div>

      <div className="dealer-offer-strip mt-5">
        <div>
          <p className="dealer-kicker text-[#50535C]">
            LATEST VALIDATED OFFER
          </p>

          <p className="mt-2 text-xs text-[#858892]">
            {latest
              ? `${labelAgent(latest.actor)} submitted ${money(
                  latest.price
                )} in round ${latest.round}.`
              : "No validated offer has entered the negotiation bus yet."}
          </p>
        </div>

        <div className="dealer-offer-value">
          <span className="dealer-kicker text-[#454850]">VALUE</span>
          <strong className="dealer-mono mt-1 block text-lg text-[#60A5FA]">
            {money(latest?.price ?? session.currentPrice)}
          </strong>
        </div>
      </div>

      <div className="mt-5">
        <p className="dealer-kicker text-[#454850]">
          OFFER TRAJECTORY
        </p>

        <div className="dealer-trajectory mt-3">
          {offers.length === 0 ? (
            <div className="dealer-trajectory-empty">
              <span />
              Waiting for the first validated offer.
            </div>
          ) : (
            offers.slice(-8).map((offer, index) => (
              <div key={`${offer.id}-${index}`} className="dealer-trajectory-item">
                <div
                  className={`dealer-trajectory-dot ${
                    offer.actor === "BUYER_AGENT" ? "blue" : "violet"
                  }`}
                />
                <div className="min-w-0">
                  <span className="dealer-kicker text-[#60636D]">
                    {labelAgent(offer.actor)} · R{offer.round}
                  </span>
                  <p className="dealer-mono mt-1 text-[10px] text-[#A1A4AD]">
                    {money(offer.price)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function FlowNode({
  icon,
  label,
  sublabel,
  active,
  tone,
}: {
  icon: ReactNode;
  label: string;
  sublabel: string;
  active: boolean;
  tone: "blue" | "violet";
}) {
  return (
    <div
      className={`dealer-flow-node ${
        active ? `active ${tone}` : ""
      }`}
    >
      <div className="dealer-flow-icon">{icon}</div>
      <p className="dealer-kicker mt-2 text-[#858892]">{label}</p>
      <span className="mt-1 text-[8px] font-bold tracking-[0.14em] text-[#444750]">
        {sublabel}
      </span>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="dealer-flow-arrow">
      <ArrowRight size={13} />
    </div>
  );
}

function GovernancePanel({
  session,
  busy,
}: {
  session: DealSession;
  busy: boolean;
}) {
  const steps: Array<{
    number: string;
    label: string;
    description: string;
    icon: ReactNode;
    active: boolean;
  }> = [
    {
      number: "01",
      label: "AI PROPOSAL",
      description: "Gemini generates the commerce decision.",
      icon: <Cpu size={13} />,
      active: busy,
    },
    {
      number: "02",
      label: "DETERMINISTIC POLICY",
      description: "Rules decide whether the proposal is allowed.",
      icon: <ShieldCheck size={13} />,
      active: [
        "OFFER_RECEIVED",
        "POLICY_CHECK",
        "COUNTERED",
      ].includes(session.state),
    },
    {
      number: "03",
      label: "STATE MACHINE",
      description: `Execution state is ${session.state}.`,
      icon: <GitBranch size={13} />,
      active: true,
    },
    {
      number: "04",
      label: "PAYMENT SERVICE",
      description:
        session.state === "ACCEPTED"
          ? "Payment gate is unlocked."
          : "Money movement remains locked.",
      icon: <Lock size={13} />,
      active: session.state === "ACCEPTED" || session.state === "PAID",
    },
  ];

  return (
    <section className="dealer-glass dealer-section-card">
      <SectionHeading
        kicker="GOVERNANCE LAYER"
        title="AI never gets execution authority"
        icon={busy ? <Zap size={15} className="animate-pulse" /> : <Lock size={15} />}
        violet
      />

      <div className="dealer-governance-list mt-6">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`dealer-governance-row ${
              step.active ? "active" : ""
            }`}
          >
            <div className="dealer-governance-number">
              {step.number}
            </div>

            <div className="dealer-governance-icon">{step.icon}</div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="dealer-kicker text-[#747780]">
                  {step.label}
                </span>
                {step.active && <span className="dealer-tiny-active" />}
              </div>
              <p className="mt-1 text-[10px] leading-5 text-[#656871]">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({
  kicker,
  title,
  icon,
  violet = false,
}: {
  kicker: string;
  title: string;
  icon: ReactNode;
  violet?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p
          className={`dealer-kicker ${
            violet ? "text-[#A78BFA]" : "text-[#60A5FA]"
          }`}
        >
          {kicker}
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em]">
          {title}
        </h2>
      </div>

      <div className="dealer-heading-icon">{icon}</div>
    </div>
  );
}

function ActivityPanel({
  rows,
}: {
  rows: Array<{
    id: string;
    time: string;
    actor?: string;
    type: string;
    description: string;
    price?: number;
  }>;
}) {
  return (
    <section className="dealer-glass dealer-section-card overflow-hidden p-0">
      <div className="border-b border-white/[0.055] px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="dealer-kicker text-[#71747D]">
              NEGOTIATION LOG
            </p>
            <h2 className="mt-2 text-lg font-semibold">
              Actual control events
            </h2>
          </div>

          <span className="dealer-log-count">
            {rows.length} SHOWN
          </span>
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto">
        {rows.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <Clock3 className="mx-auto text-[#30333B]" size={21} />
            <p className="mt-3 text-xs text-[#555861]">
              Waiting for the first negotiation event.
            </p>
          </div>
        ) : (
          rows.map((row, index) => (
            <div
              key={row.id}
              className="dealer-log-row"
            >
              <div className="dealer-log-rail">
                <div className="dealer-log-icon">
                  {row.type.startsWith("AI_") ? (
                    <Bot size={12} />
                  ) : (
                    <Activity size={12} />
                  )}
                </div>

                {index < rows.length - 1 && (
                  <div className="dealer-log-line" />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="dealer-kicker text-[#60A5FA]">
                    {row.type}
                  </span>

                  {row.actor && (
                    <span className="dealer-kicker text-[#4D5058]">
                      {labelAgent(row.actor)}
                    </span>
                  )}

                  <span className="dealer-mono text-[8px] text-[#3F424A]">
                    {formatTime(row.time)}
                  </span>

                  {row.price !== undefined && (
                    <span className="dealer-mono text-[8px] text-[#A78BFA]">
                      {money(row.price)}
                    </span>
                  )}
                </div>

                <p className="mt-1.5 text-[10px] leading-5 text-[#777A84]">
                  {row.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function ExecutionPanel({
  session,
  paymentOrder,
  paymentBusy,
  canAccept,
  canStop,
  onAccept,
  onStop,
  onPay,
  onResult,
}: {
  session: DealSession;
  paymentOrder: RazorpayOrder | null;
  paymentBusy: boolean;
  canAccept: boolean;
  canStop: boolean;
  onAccept: () => void;
  onStop: () => void;
  onPay: () => void;
  onResult: () => void;
}) {
  const accepted = session.state === "ACCEPTED";
  const paid = session.state === "PAID";
  const completed = session.state === "COMPLETED";
  const stopped = ["REJECTED", "CANCELLED", "EXPIRED"].includes(
    session.state
  );

  return (
    <section className="dealer-glass dealer-section-card">
      <SectionHeading
        kicker="EXECUTION GATE"
        title="Deterministic control over the final action"
        icon={
          accepted || paid || completed ? (
            <CheckCircle2 size={15} />
          ) : (
            <Lock size={15} />
          )
        }
      />

      <div className="dealer-execution-card mt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="dealer-kicker text-[#50535C]">
              AUTHORITATIVE VALUE
            </p>
            <p className="dealer-mono mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">
              {money(session.currentPrice)}
            </p>
          </div>

          <span
            className={`dealer-state-badge ${
              accepted || paid || completed
                ? "positive"
                : stopped
                  ? "negative"
                  : "neutral"
            }`}
          >
            {session.state}
          </span>
        </div>

        {!accepted && !paid && !completed && !stopped && (
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              disabled={!canAccept}
              onClick={onAccept}
              className="dealer-final-accept"
            >
              <CheckCircle2 size={13} />
              ACCEPT DEAL
            </button>

            <button
              disabled={!canStop}
              onClick={onStop}
              className="dealer-final-stop"
            >
              <XCircle size={13} />
              STOP DEAL
            </button>
          </div>
        )}

        {accepted && !paid && !completed && (
          <button
            disabled={paymentBusy}
            onClick={onPay}
            className="dealer-primary-button mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[9px] font-black tracking-[0.12em] disabled:opacity-35"
          >
            {paymentBusy ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <CircleDollarSign size={13} />
            )}
            {paymentOrder
              ? "OPEN RAZORPAY CHECKOUT"
              : "CREATE PAYMENT ORDER"}
          </button>
        )}

        {(paid || completed) && (
          <button
            onClick={onResult}
            className="dealer-primary-button mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[9px] font-black tracking-[0.12em]"
          >
            VIEW FINAL RESULT
            <ArrowRight size={13} />
          </button>
        )}

        {stopped && (
          <div className="dealer-terminal-note negative mt-5">
            <XCircle size={13} />
            <span>
              This deal is no longer executable. The state machine has
              reached a terminal state.
            </span>
          </div>
        )}
      </div>

      <div className="dealer-security-note mt-4">
        <Lock size={13} />
        <p>
          AI agents can propose and negotiate. Deterministic policy,
          state-machine rules, and the payment service control whether
          execution can happen.
        </p>
      </div>
    </section>
  );
}

function DealStyles() {
  return (
    <style jsx global>{`
      .dealer-deal-page {
        font-family: Arial, Helvetica, sans-serif;
        position: relative;
        color: #fff;
      }

      .dealer-deal-page * {
        box-sizing: border-box;
      }

      .dealer-mono {
        font-family:
          "SFMono-Regular",
          Consolas,
          "Liberation Mono",
          monospace;
      }

      .dealer-kicker {
        font-size: 8px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 0.16em;
      }

      .dealer-header {
        border-bottom: 1px solid rgba(255, 255, 255, 0.055);
        background: rgba(4, 5, 10, 0.76);
        backdrop-filter: blur(24px);
      }

      .dealer-back-button {
        display: flex;
        height: 38px;
        width: 38px;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 13px;
        background: rgba(255, 255, 255, 0.025);
        color: #8c8f98;
        transition: all 0.2s ease;
      }

      .dealer-back-button:hover {
        border-color: rgba(96, 165, 250, 0.25);
        background: rgba(96, 165, 250, 0.055);
        color: #fff;
        transform: translateX(-1px);
      }

      .dealer-noise {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        opacity: 0.028;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.6'/%3E%3C/svg%3E");
      }

      .dealer-scanline {
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        opacity: 0.035;
        background: repeating-linear-gradient(
          180deg,
          transparent 0,
          transparent 4px,
          rgba(255, 255, 255, 0.035) 5px
        );
      }

      .dealer-ambient {
        position: fixed;
        z-index: 0;
        width: 560px;
        height: 560px;
        border-radius: 50%;
        pointer-events: none;
        filter: blur(120px);
        opacity: 0.09;
      }

      .dealer-ambient-blue {
        left: -300px;
        top: 8%;
        background: #2563eb;
      }

      .dealer-ambient-violet {
        right: -310px;
        top: 36%;
        background: #7c3aed;
      }

      .dealer-hero-grid {
        display: grid;
        gap: 28px;
        align-items: end;
      }

      @media (min-width: 1024px) {
        .dealer-hero-grid {
          grid-template-columns: minmax(0, 1fr) 340px;
        }
      }

      .dealer-gradient-text {
        background: linear-gradient(
          95deg,
          #60a5fa 0%,
          #8b5cf6 48%,
          #c4b5fd 100%
        );
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }

      .dealer-dot {
        height: 3px;
        width: 3px;
        border-radius: 50%;
        background: #52555e;
      }

      .dealer-session-summary {
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.075);
        border-radius: 22px;
        padding: 18px;
        background:
          radial-gradient(
            circle at 100% 0%,
            rgba(124, 58, 237, 0.09),
            transparent 48%
          ),
          linear-gradient(
            145deg,
            rgba(18, 20, 29, 0.78),
            rgba(8, 9, 14, 0.7)
          );
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(24px);
      }

      .dealer-summary-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .dealer-summary-price {
        margin-top: 24px;
        padding-top: 18px;
        border-top: 1px solid rgba(255, 255, 255, 0.055);
      }

      .dealer-summary-meta {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: 18px;
      }

      .dealer-summary-meta > div {
        min-width: 0;
        border: 1px solid rgba(255, 255, 255, 0.055);
        border-radius: 12px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.17);
      }

      .dealer-summary-meta span {
        display: block;
        font-size: 7px;
        font-weight: 900;
        letter-spacing: 0.14em;
        color: #484b54;
      }

      .dealer-summary-meta strong {
        display: block;
        overflow: hidden;
        margin-top: 6px;
        font-family: "SFMono-Regular", Consolas, monospace;
        font-size: 9px;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #a1a4ad;
      }

      .dealer-stage-line {
        position: relative;
        height: 1px;
        margin-top: 36px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.055);
      }

      .dealer-stage-line-fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #2563eb, #7c3aed, #60a5fa);
        box-shadow: 0 0 18px rgba(96, 165, 250, 0.45);
        transition: width 0.7s ease;
      }

      .dealer-agent-card {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 535px;
        box-sizing: border-box;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.075);
        border-radius: 30px;
        padding: 22px;
        background:
          linear-gradient(
            145deg,
            rgba(18, 20, 29, 0.86),
            rgba(7, 8, 13, 0.76)
          );
        box-shadow: 0 30px 90px rgba(0, 0, 0, 0.25);
        backdrop-filter: blur(24px);
      }

      .dealer-agent-card::before {
        position: absolute;
        top: -120px;
        width: 270px;
        height: 270px;
        border-radius: 50%;
        content: "";
        filter: blur(70px);
        opacity: 0.13;
        pointer-events: none;
      }

      .dealer-agent-blue::before {
        left: -100px;
        background: #2563eb;
      }

      .dealer-agent-violet::before {
        right: -100px;
        background: #7c3aed;
      }

      .dealer-agent-topline {
        position: absolute;
        top: 0;
        left: 22px;
        right: 22px;
        height: 1px;
        opacity: 0.65;
      }

      .dealer-agent-blue .dealer-agent-topline {
        background: linear-gradient(90deg, transparent, #60a5fa, transparent);
      }

      .dealer-agent-violet .dealer-agent-topline {
        background: linear-gradient(90deg, transparent, #a78bfa, transparent);
      }

      .dealer-agent-avatar {
        position: relative;
        display: flex;
        height: 45px;
        width: 45px;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.075);
        border-radius: 15px;
        background: rgba(255, 255, 255, 0.03);
      }

      .dealer-agent-avatar.blue {
        color: #60a5fa;
        box-shadow: inset 0 0 24px rgba(37, 99, 235, 0.08);
      }

      .dealer-agent-avatar.violet {
        color: #a78bfa;
        box-shadow: inset 0 0 24px rgba(124, 58, 237, 0.08);
      }

      .dealer-agent-avatar span {
        position: absolute;
        right: 5px;
        top: 5px;
        height: 5px;
        width: 5px;
        border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 10px rgba(34, 197, 94, 0.8);
      }

      .dealer-live-dot {
        height: 4px;
        width: 4px;
        border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.7);
      }

      .dealer-agent-tag {
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 999px;
        padding: 7px 9px;
        background: rgba(255, 255, 255, 0.02);
        font-size: 7px;
        font-weight: 900;
        letter-spacing: 0.13em;
      }

      .dealer-round-chip {
        border: 1px solid rgba(255, 255, 255, 0.065);
        border-radius: 11px;
        padding: 8px 10px;
        background: rgba(0, 0, 0, 0.16);
        text-align: right;
      }

      .dealer-round-chip span {
        display: block;
        font-size: 7px;
        font-weight: 900;
        letter-spacing: 0.13em;
        color: #454850;
      }

      .dealer-round-chip strong {
        display: block;
        margin-top: 3px;
        font-family: "SFMono-Regular", Consolas, monospace;
        font-size: 10px;
        color: #8b8e98;
      }

      .dealer-decision-box {
        border: 1px solid rgba(255, 255, 255, 0.055);
        border-radius: 18px;
        padding: 15px;
        background:
          linear-gradient(
            145deg,
            rgba(255, 255, 255, 0.025),
            rgba(0, 0, 0, 0.18)
          );
      }

      .dealer-input {
        width: 100%;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(0, 0, 0, 0.25);
        color: #fff;
        outline: none;
        transition: all 0.2s ease;
      }

      .dealer-input:focus {
        border-color: rgba(96, 165, 250, 0.4);
        box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.055);
      }

      .dealer-input:disabled {
        cursor: not-allowed;
        opacity: 0.42;
      }

      .dealer-mini-button {
        border: 1px solid rgba(167, 139, 250, 0.2);
        background: rgba(139, 92, 246, 0.06);
        color: #a78bfa;
        transition: all 0.2s ease;
      }

      .dealer-mini-button:hover:not(:disabled) {
        border-color: rgba(167, 139, 250, 0.35);
        background: rgba(139, 92, 246, 0.11);
      }

      .dealer-agent-accept,
      .dealer-agent-stop {
        transition: all 0.2s ease;
      }

      .dealer-agent-accept {
        border: 1px solid rgba(34, 197, 94, 0.2);
        background: rgba(34, 197, 94, 0.055);
        color: #4ade80;
      }

      .dealer-agent-accept:hover:not(:disabled) {
        background: rgba(34, 197, 94, 0.11);
      }

      .dealer-agent-stop {
        border: 1px solid rgba(239, 68, 68, 0.16);
        background: rgba(239, 68, 68, 0.035);
        color: #f87171;
      }

      .dealer-agent-stop:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.075);
      }

      .dealer-core {
        width: 100%;
        height: 100%;
        min-height: 535px;
        box-sizing: border-box;
        border: 1px solid rgba(96, 165, 250, 0.12);
        background:
          radial-gradient(
            circle at 50% 46%,
            rgba(96, 165, 250, 0.12),
            transparent 27%
          ),
          radial-gradient(
            circle at 50% 46%,
            rgba(139, 92, 246, 0.08),
            transparent 56%
          ),
          linear-gradient(145deg, #0c0f18, #05060a 74%);
        box-shadow:
          inset 0 0 90px rgba(37, 99, 235, 0.035),
          0 30px 100px rgba(0, 0, 0, 0.3);
      }

      .dealer-core-halo {
        position: absolute;
        left: 50%;
        top: 47%;
        height: 190px;
        width: 190px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        background: radial-gradient(
          circle,
          rgba(96, 165, 250, 0.11),
          transparent 70%
        );
        filter: blur(14px);
      }

      .dealer-core-ring {
        position: absolute;
        left: 50%;
        top: 47%;
        border: 1px solid rgba(96, 165, 250, 0.1);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
      }

      .dealer-core-ring-a {
        width: 300px;
        height: 300px;
        animation: dealerSpin 24s linear infinite;
      }

      .dealer-core-ring-b {
        width: 405px;
        height: 405px;
        border-color: rgba(167, 139, 250, 0.07);
        animation: dealerSpin 35s linear infinite reverse;
      }

      .dealer-core-ring-c {
        width: 505px;
        height: 505px;
        border-style: dashed;
        border-color: rgba(96, 165, 250, 0.035);
        animation: dealerSpin 50s linear infinite;
      }

      .dealer-core-grid {
        position: absolute;
        inset: 0;
        opacity: 0.065;
        background-image:
          linear-gradient(rgba(96, 165, 250, 0.18) 1px, transparent 1px),
          linear-gradient(
            90deg,
            rgba(96, 165, 250, 0.18) 1px,
            transparent 1px
          );
        background-size: 32px 32px;
        mask-image: radial-gradient(circle at center, black, transparent 68%);
        pointer-events: none;
      }

      .dealer-core-crosshair {
        position: absolute;
        left: 50%;
        top: 47%;
        width: 78%;
        height: 1px;
        transform: translate(-50%, -50%);
        background: linear-gradient(
          90deg,
          transparent,
          rgba(96, 165, 250, 0.1),
          transparent
        );
        pointer-events: none;
      }

      .dealer-core-label {
        display: flex;
        align-items: center;
        gap: 7px;
        border: 1px solid rgba(96, 165, 250, 0.12);
        border-radius: 999px;
        padding: 7px 11px;
        background: rgba(96, 165, 250, 0.035);
        color: #60a5fa;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.16em;
      }

      .dealer-core-live-dot {
        height: 5px;
        width: 5px;
        border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 11px rgba(34, 197, 94, 0.9);
      }

      .dealer-core-pill {
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 999px;
        padding: 7px 10px;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.12em;
      }

      .dealer-core-pill.violet {
        border-color: rgba(167, 139, 250, 0.2);
        background: rgba(139, 92, 246, 0.055);
        color: #a78bfa;
      }

      .dealer-core-pill.neutral {
        background: rgba(255, 255, 255, 0.02);
        color: #686b75;
      }

      .dealer-progress-track {
        height: 5px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.055);
      }

      .dealer-progress-fill {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #2563eb, #7c3aed, #60a5fa);
        box-shadow: 0 0 14px rgba(96, 165, 250, 0.45);
        transition: width 0.7s ease;
      }

      .dealer-mini-stat {
        min-width: 0;
        border: 1px solid rgba(255, 255, 255, 0.055);
        border-radius: 13px;
        padding: 11px;
        background: rgba(0, 0, 0, 0.19);
      }

      .dealer-command-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        border: 1px solid rgba(255, 255, 255, 0.065);
        border-radius: 19px;
        padding: 13px;
        background: rgba(255, 255, 255, 0.018);
        backdrop-filter: blur(18px);
      }

      @media (max-width: 639px) {
        .dealer-command-bar {
          align-items: stretch;
          flex-direction: column;
        }
      }

      .dealer-primary-button {
        background: linear-gradient(100deg, #2563eb, #7c3aed, #2563eb);
        background-size: 200% 100%;
        box-shadow: 0 14px 50px rgba(37, 99, 235, 0.18);
        transition:
          transform 0.2s ease,
          background-position 0.45s ease,
          box-shadow 0.2s ease;
      }

      .dealer-primary-button:hover:not(:disabled) {
        transform: translateY(-1px);
        background-position: 100% 0;
        box-shadow: 0 18px 65px rgba(124, 58, 237, 0.25);
      }

      .dealer-secondary-button {
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.025);
        color: #a1a1aa;
        transition: all 0.2s ease;
      }

      .dealer-secondary-button:hover:not(:disabled) {
        border-color: rgba(255, 255, 255, 0.16);
        color: #fff;
      }

      .dealer-error {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        border: 1px solid rgba(239, 68, 68, 0.2);
        border-radius: 17px;
        padding: 14px;
        background: rgba(239, 68, 68, 0.045);
      }

      .dealer-error-icon {
        display: flex;
        height: 29px;
        width: 29px;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(239, 68, 68, 0.14);
        border-radius: 9px;
        color: #ef4444;
        background: rgba(239, 68, 68, 0.06);
      }

      .dealer-glass {
        position: relative;
        border: 1px solid rgba(255, 255, 255, 0.065);
        background: linear-gradient(
          145deg,
          rgba(18, 20, 29, 0.76),
          rgba(8, 9, 14, 0.68)
        );
        box-shadow: 0 30px 90px rgba(0, 0, 0, 0.21);
        backdrop-filter: blur(24px);
      }

      .dealer-section-card {
        border-radius: 25px;
        padding: 20px;
      }

      @media (min-width: 640px) {
        .dealer-section-card {
          padding: 24px;
        }
      }

      .dealer-heading-icon {
        display: flex;
        height: 31px;
        width: 31px;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.055);
        border-radius: 10px;
        color: #4e515a;
        background: rgba(255, 255, 255, 0.02);
      }

      .dealer-flow-node {
        border: 1px solid rgba(255, 255, 255, 0.055);
        border-radius: 15px;
        padding: 12px 8px;
        background: rgba(255, 255, 255, 0.012);
        text-align: center;
        transition: all 0.25s ease;
      }

      .dealer-flow-node.active {
        box-shadow: inset 0 0 30px rgba(96, 165, 250, 0.035);
      }

      .dealer-flow-node.active.blue {
        border-color: rgba(96, 165, 250, 0.22);
        background: rgba(96, 165, 250, 0.045);
      }

      .dealer-flow-node.active.violet {
        border-color: rgba(167, 139, 250, 0.2);
        background: rgba(139, 92, 246, 0.045);
      }

      .dealer-flow-icon {
        display: flex;
        height: 31px;
        width: 31px;
        margin: 0 auto;
        align-items: center;
        justify-content: center;
        border-radius: 9px;
        color: #52555e;
        background: rgba(255, 255, 255, 0.025);
      }

      .dealer-flow-node.active.blue .dealer-flow-icon {
        color: #60a5fa;
        background: rgba(96, 165, 250, 0.08);
      }

      .dealer-flow-node.active.violet .dealer-flow-icon {
        color: #a78bfa;
        background: rgba(139, 92, 246, 0.08);
      }

      .dealer-flow-arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #383b43;
      }

      .dealer-offer-strip {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        border: 1px solid rgba(96, 165, 250, 0.095);
        border-radius: 17px;
        padding: 14px;
        background: rgba(96, 165, 250, 0.022);
      }

      .dealer-offer-value {
        flex-shrink: 0;
        text-align: right;
      }

      .dealer-trajectory {
        display: flex;
        gap: 0;
        overflow-x: auto;
        padding-bottom: 4px;
      }

      .dealer-trajectory-item {
        position: relative;
        display: flex;
        min-width: 105px;
        gap: 8px;
        padding: 9px 18px 9px 0;
      }

      .dealer-trajectory-item:not(:last-child)::after {
        position: absolute;
        left: 4px;
        right: 5px;
        top: 13px;
        height: 1px;
        margin-left: 9px;
        content: "";
        background: rgba(255, 255, 255, 0.06);
        transform: translateX(12px);
      }

      .dealer-trajectory-dot {
        position: relative;
        z-index: 1;
        height: 9px;
        width: 9px;
        margin-top: 2px;
        flex-shrink: 0;
        border-radius: 50%;
        box-shadow: 0 0 12px currentColor;
      }

      .dealer-trajectory-dot.blue {
        background: #60a5fa;
        color: rgba(96, 165, 250, 0.4);
      }

      .dealer-trajectory-dot.violet {
        background: #a78bfa;
        color: rgba(167, 139, 250, 0.4);
      }

      .dealer-trajectory-empty {
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px dashed rgba(255, 255, 255, 0.07);
        border-radius: 13px;
        padding: 13px;
        font-size: 10px;
        color: #555861;
      }

      .dealer-trajectory-empty span {
        height: 5px;
        width: 5px;
        border-radius: 50%;
        background: #3f424a;
      }

      .dealer-governance-list {
        display: grid;
        gap: 8px;
      }

      .dealer-governance-row {
        display: grid;
        grid-template-columns: 25px 33px minmax(0, 1fr);
        align-items: center;
        gap: 10px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 14px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.012);
      }

      .dealer-governance-row.active {
        border-color: rgba(139, 92, 246, 0.13);
        background: rgba(139, 92, 246, 0.025);
      }

      .dealer-governance-number {
        font-family: "SFMono-Regular", Consolas, monospace;
        font-size: 8px;
        color: #3e4149;
        text-align: center;
      }

      .dealer-governance-icon {
        display: flex;
        height: 33px;
        width: 33px;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 10px;
        color: #62656e;
        background: rgba(255, 255, 255, 0.02);
      }

      .dealer-governance-row.active .dealer-governance-icon {
        border-color: rgba(167, 139, 250, 0.16);
        color: #a78bfa;
      }

      .dealer-tiny-active {
        height: 4px;
        width: 4px;
        border-radius: 50%;
        background: #22c55e;
        box-shadow: 0 0 8px rgba(34, 197, 94, 0.7);
      }

      .dealer-log-count {
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 999px;
        padding: 7px 9px;
        font-family: "SFMono-Regular", Consolas, monospace;
        font-size: 8px;
        color: #4f525b;
        background: rgba(255, 255, 255, 0.018);
      }

      .dealer-log-row {
        display: flex;
        gap: 12px;
        padding: 15px 20px 0;
      }

      @media (min-width: 640px) {
        .dealer-log-row {
          padding-left: 24px;
          padding-right: 24px;
        }
      }

      .dealer-log-rail {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .dealer-log-icon {
        position: relative;
        z-index: 1;
        display: flex;
        height: 28px;
        width: 28px;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.055);
        border-radius: 9px;
        color: #60a5fa;
        background: #0b0d14;
      }

      .dealer-log-line {
        position: absolute;
        top: 29px;
        bottom: 0;
        width: 1px;
        background: rgba(255, 255, 255, 0.055);
      }

      .dealer-execution-card {
        border: 1px solid rgba(255, 255, 255, 0.065);
        border-radius: 19px;
        padding: 16px;
        background:
          radial-gradient(
            circle at 100% 0%,
            rgba(34, 197, 94, 0.035),
            transparent 40%
          ),
          rgba(0, 0, 0, 0.2);
      }

      .dealer-state-badge {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        padding: 7px 10px;
        font-family: "SFMono-Regular", Consolas, monospace;
        font-size: 8px;
        font-weight: 900;
        letter-spacing: 0.1em;
      }

      .dealer-state-badge.positive {
        border-color: rgba(34, 197, 94, 0.2);
        background: rgba(34, 197, 94, 0.05);
        color: #4ade80;
      }

      .dealer-state-badge.negative {
        border-color: rgba(239, 68, 68, 0.18);
        background: rgba(239, 68, 68, 0.045);
        color: #f87171;
      }

      .dealer-state-badge.neutral {
        color: #666972;
      }

      .dealer-final-accept,
      .dealer-final-stop {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border-radius: 12px;
        padding: 13px;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.1em;
        transition: all 0.2s ease;
      }

      .dealer-final-accept {
        background: #22c55e;
        color: #020604;
      }

      .dealer-final-accept:hover:not(:disabled) {
        background: #4ade80;
        transform: translateY(-1px);
      }

      .dealer-final-stop {
        border: 1px solid rgba(239, 68, 68, 0.18);
        background: rgba(239, 68, 68, 0.045);
        color: #f87171;
      }

      .dealer-final-stop:hover:not(:disabled) {
        border-color: rgba(239, 68, 68, 0.32);
        background: rgba(239, 68, 68, 0.08);
        transform: translateY(-1px);
      }

      .dealer-final-accept:disabled,
      .dealer-final-stop:disabled {
        cursor: not-allowed;
        opacity: 0.2;
      }

      .dealer-terminal-note,
      .dealer-security-note {
        display: flex;
        align-items: flex-start;
        gap: 9px;
        border-radius: 13px;
        padding: 12px;
        font-size: 10px;
        line-height: 1.6;
      }

      .dealer-terminal-note.negative {
        border: 1px solid rgba(239, 68, 68, 0.13);
        background: rgba(239, 68, 68, 0.035);
        color: #777a83;
      }

      .dealer-security-note {
        border: 1px solid rgba(96, 165, 250, 0.09);
        background: rgba(96, 165, 250, 0.02);
        color: #666a73;
      }

      .dealer-security-note svg {
        margin-top: 1px;
        flex-shrink: 0;
        color: #60a5fa;
      }

      .dealer-footer {
        position: relative;
        z-index: 1;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
      }

      .dealer-footer-mark {
        display: flex;
        height: 25px;
        width: 25px;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(96, 165, 250, 0.1);
        border-radius: 8px;
        color: #4f7fb5;
        background: rgba(96, 165, 250, 0.035);
      }

      .dealer-loading {
        display: flex;
        min-height: 100vh;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        background:
          radial-gradient(
            circle at 50% 45%,
            rgba(37, 99, 235, 0.08),
            transparent 32%
          ),
          #04050a;
      }

      .dealer-loading-orbit {
        display: flex;
        height: 82px;
        width: 82px;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(96, 165, 250, 0.13);
        border-radius: 50%;
        animation: dealerSpin 5s linear infinite;
      }

      .dealer-loading-core {
        display: flex;
        height: 46px;
        width: 46px;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(96, 165, 250, 0.16);
        border-radius: 50%;
        color: #60a5fa;
        background: rgba(96, 165, 250, 0.045);
        animation: dealerSpin 5s linear infinite reverse;
      }

      .dealer-core-pulse {
        animation: dealerPulse 0.8s ease;
      }

      @keyframes dealerSpin {
        to {
          transform: translate(-50%, -50%) rotate(360deg);
        }
      }

      .dealer-loading-orbit {
        animation-name: dealerLoadingSpin;
      }

      @keyframes dealerLoadingSpin {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes dealerPulse {
        0% {
          box-shadow: 0 0 0 rgba(96, 165, 250, 0);
        }
        45% {
          box-shadow:
            0 0 100px rgba(96, 165, 250, 0.16),
            inset 0 0 90px rgba(124, 58, 237, 0.1);
        }
        100% {
          box-shadow: 0 0 0 rgba(96, 165, 250, 0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .dealer-core-ring-a,
        .dealer-core-ring-b,
        .dealer-core-ring-c,
        .dealer-loading-orbit,
        .dealer-loading-core {
          animation: none;
        }

        .dealer-primary-button,
        .dealer-back-button,
        .dealer-final-accept,
        .dealer-final-stop {
          transition: none;
        }
      }
    `}</style>
  );
}
