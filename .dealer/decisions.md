# Dealer Architecture Decisions

## ADR-001 — Next.js

Dealer uses Next.js App Router with TypeScript.

## ADR-002 — AI Is Not Authoritative

LLM output can propose actions but cannot directly modify authoritative transaction state.

## ADR-003 — Deterministic Policy Engine

Merchant business rules are enforced through deterministic application logic.

## ADR-004 — State Machine

Deal lifecycle is controlled through explicit states and transitions.

## ADR-005 — Integer Money

Financial values use the smallest currency unit.

For INR:

₹49,999 = 4,999,900 paise.

## ADR-006 — Auditability

Important deal events must be recorded.

## ADR-007 — Payment After Acceptance

Razorpay payment execution can only occur after a valid deal has been accepted.

## ADR-008 — External Services Are Isolated

Gemini, Firebase, and Razorpay are accessed through service modules rather than directly from UI components.