DEALER — BRAIN.md

AI Commerce Arena

Last Updated: 2026-08-29

IMPORTANT: This file is the continuation point for the next DEALER session.
Do NOT restart the project. Do NOT rewrite working core architecture.
Continue from the exact state documented below.

1. PROJECT IDENTITY

Project: DEALER
Concept: AI Commerce Arena — an AI-driven negotiation and transaction platform where a Buyer Agent negotiates with a Merchant Agent.

Core principle:

AI PROPOSES
    ↓
DETERMINISTIC VALIDATION
    ↓
BUSINESS POLICY DECIDES
    ↓
STATE MACHINE CONTROLS EXECUTION
    ↓
PAYMENT SERVICE CONTROLS PAYMENT FLOW
    ↓
RAZORPAY EXECUTES MONEY MOVEMENT

Golden safety rule

AI must NEVER directly control money movement.

AI can recommend an action. Deterministic systems validate and authorize it.

2. PROJECT LOCATION / STACK

Project folder:

D:\dealer

Main stack:

Next.js 16.3.2

TypeScript

React

Tailwind CSS

Next.js App Router

Vitest 4.1.11

Firebase / Firestore planned

Gemini planned for real AI integration

Razorpay Test Mode planned/partially abstracted

In-memory persistence currently

Architecture:

src/
├── app/
├── agents/
├── controllers/
├── engine/
├── models/
├── services/
├── state-machine/
├── validators/
└── data/

3. CURRENT VERIFIED MILESTONE — 2026-08-29

TESTS

Latest full test result:

Test Files  22 passed (22)
Tests       136 passed (136)

Command used:

npm test

Result:

22 test files passed
136 tests passed
0 failed

This is a major milestone.

The payment work that previously failed is now fixed.

Payment-specific tests:

tests/api/payment.test.ts
    3/3 passed

tests/api/payment-verify.test.ts
    4/4 passed

tests/services/payment-service.test.ts
    7/7 passed

tests/services/razorpay-service.test.ts
    7/7 passed

Total payment-related tests currently confirmed:

21 passing

4. BUILD STATUS

Previous confirmed production build:

npm run build

Result:

PASSED

The project has previously compiled successfully under Next.js 16.3.2.

After future significant changes, rerun:

npm run build

Do not assume the build is still passing after modifying architecture.

5. NON-BLOCKING VITEST WARNING

Every npm test currently shows:

Your Vite config uses features that are unsupported by
configLoader: 'native'...

ESM syntax in a file loaded as CommonJS
(vitest.config.ts)

This is currently only a warning.

It does NOT cause test failures.

Do not waste time on this before the product-critical work unless we intentionally clean up the Vitest configuration later.

Possible future cleanup:

use .mjs, OR

set "type": "module" appropriately, OR

otherwise update the Vitest/Vite configuration

But this is LOW PRIORITY.

6. COMPLETED CORE ARCHITECTURE

The deterministic foundation is considered complete and tested.

Domain / state

DealSession model — COMPLETE

Offer model — COMPLETE

RazorpayOrder model — COMPLETE

Deal state machine — COMPLETE

Business logic

Policy Engine — COMPLETE

Negotiation Engine — COMPLETE

Agent validation — COMPLETE

Offer validation — COMPLETE

Negotiation Orchestrator — COMPLETE

Negotiation Runner Service — COMPLETE

Deal Controller — COMPLETE

Audit Service — COMPLETE

Agents

Buyer Agent — COMPLETE as deterministic/mock abstraction

Merchant Agent — COMPLETE as deterministic/mock abstraction

Agent Decision Service — COMPLETE

AI Decision Validator — COMPLETE

Persistence

Persistence service abstraction — COMPLETE

In-memory persistence implementation — WORKING

Persistence instance — WORKING

Firestore implementation — NOT DONE

Payments

Payment Service — COMPLETE at abstraction/business-logic level

Razorpay Service abstraction — COMPLETE

Payment order creation flow — TESTED

Payment verification flow — TESTED

Payment state transition to PAID — TESTED

API

Core API foundation is complete and tested.

Confirmed routes include:

/api/deals
/api/deals/[dealId]
/api/deals/[dealId]/offers
/api/deals/[dealId]/decision
/api/deals/[dealId]/payment
/api/deals/[dealId]/payment/verify

7. PAYMENT FIX COMPLETED — IMPORTANT

There was a Vitest mocking problem in the payment API tests.

Error was:

Cannot access 'fakeRazorpayService' before initialization

Cause:

vi.mock() is hoisted by Vitest.

The correct solution was:

const fakeRazorpayService = vi.hoisted(() => ({
  createOrder: vi.fn(),
  verifyPayment: vi.fn(),
}));

This has been applied to:

tests/api/payment.test.ts
tests/api/payment-verify.test.ts

Do NOT remove vi.hoisted() from those mocks.

Payment tests now pass.

8. CURRENT FRONTEND ISSUE — IMPORTANT NEXT DEBUG TASK

There is currently a browser/runtime error on the Deal Arena page:

[browser] Error: Deal not found
    at DealArenaPage.useCallback[loadDeal]
    src/app/deals/[dealId]/page.tsx:115

Relevant frontend logic currently throws:

if (!result.success || !result.session) {
  throw new Error(
    result.error ?? "Unable to load deal"
  );
}

The API is returning:

Deal not found

Likely architectural reason

The project currently uses in-memory persistence.

The frontend page is trying to load a deal by ID, but that ID does not exist in the persistence store at the moment the browser requests it.

This is NOT evidence that the negotiation core is broken.

The next session should investigate:

Who creates the deal?
        ↓
Where is the created deal stored?
        ↓
What dealId does the frontend navigate to?
        ↓
Does /api/deals/[dealId] use the same persistence instance?
        ↓
Does the browser refresh / new server process lose the in-memory deal?

Do NOT immediately rewrite the Deal Arena page.

First trace the complete flow:

CREATE DEAL
    ↓
GET DEAL ID
    ↓
NAVIGATE /deals/[dealId]
    ↓
GET /api/deals/[dealId]
    ↓
persistence.getDeal(dealId)

The goal is to identify exactly where the ID disappears.

9. MOST IMPORTANT REMAINING WORK

The core is done.

The remaining work is primarily real infrastructure + product integration.

PRIORITY 1 — FIX FRONTEND DEAL LOADING

Current blocker:

/deals/[dealId]
        ↓
Deal not found

Investigate and fix the real data flow.

Do not hide the error with fake UI data.

The frontend must load a real DealSession through the API.

10. PRIORITY 2 — FIRESTORE PERSISTENCE

Current state:

In-memory persistence = WORKING
Firestore = NOT CONNECTED

Goal:

Next.js API
    ↓
Persistence abstraction
    ↓
Firestore implementation

Important:

The existing services/controllers should continue using the persistence abstraction.

Do NOT spread Firebase calls throughout API routes.

Preferred structure:

services/
    persistence-service.ts
    firestore-persistence-service.ts
    persistence-instance.ts

or an equivalent clean adapter structure.

Required work:

Firebase project/configuration

Firestore initialization

Deal persistence

Offer persistence

Audit persistence

Payment order persistence

Safe environment variables

Replace in-memory implementation for production mode

Tests for Firestore adapter where practical

11. PRIORITY 3 — REAL GEMINI AGENTS

Current:

GeminiService abstraction = COMPLETE
Real Gemini API = NOT CONNECTED

Goal:

Buyer context
    ↓
Gemini
    ↓
structured decision
    ↓
AI decision validator
    ↓
Policy Engine
    ↓
Negotiation Engine

Important:

Gemini output must NEVER directly mutate deal state.

Expected flow:

Gemini proposes
    ↓
validate schema
    ↓
validate business rules
    ↓
policy decision
    ↓
state transition

Use structured output rather than trusting free-form text.

Keep API keys server-side.

12. PRIORITY 4 — REAL RAZORPAY PAYMENT FLOW

Current:

Razorpay abstraction = COMPLETE
Payment Service = TESTED
Real Razorpay execution = NOT FULLY CONNECTED

The current tests intentionally mock external Razorpay calls.

Production integration still needs:

Real Razorpay order creation

Environment variables

Payment verification using real credentials

Signature verification

Payment/order persistence

Webhook handling

Idempotency

Duplicate payment protection

Failure handling

Amount/currency consistency checks

Important:

Never trust payment status supplied by the browser.

The server must verify payment.

13. PRIORITY 5 — COMPLETE END-TO-END DEAL → PAYMENT FLOW

Target:

CREATE DEAL
    ↓
BUYER AGENT
    ↓
MERCHANT AGENT
    ↓
NEGOTIATION LOOP
    ↓
ACCEPTED
    ↓
PAYMENT_PENDING
    ↓
RAZORPAY ORDER
    ↓
PAYMENT
    ↓
SERVER VERIFICATION
    ↓
PAID
    ↓
COMPLETED

This is the most important demo path.

A judge should be able to see the entire lifecycle.

14. PRIORITY 6 — AUTHENTICATION

Current:

Authentication = NOT COMPLETE

Need:

Buyer identity

Merchant identity

Protected APIs

Session handling

Authorization

Prevent buyer from acting as merchant

Prevent users from accessing unrelated deals

Do this after core persistence/integration is stable.

15. PRIORITY 7 — SECURITY / PRODUCTION HARDENING

Remaining areas:

Idempotency

Prevent duplicate:

deal creation

payment order creation

payment verification

state transitions

Concurrency

Handle two requests attempting to update the same deal simultaneously.

Validation

Every external request must be validated.

Authorization

Users can only access resources they are allowed to access.

Secrets

Never expose:

GEMINI_API_KEY
RAZORPAY_KEY_SECRET
FIREBASE_ADMIN credentials

to the browser.

Webhooks

Razorpay webhook processing must be:

signature verified

idempotent

persisted

safe against replay

16. PRIORITY 8 — FRONTEND PRODUCT

The current frontend is NOT finished.

Target screens:

Landing / Home
    ↓
Create Deal
    ↓
Deal Arena
    ↓
Live Negotiation
    ↓
Offer / Counter Offer Timeline
    ↓
Decision / Policy Explanation
    ↓
Payment
    ↓
Success

Additional interfaces:

Buyer Dashboard
Merchant Dashboard
Human Approval UI
Admin / Monitoring
Audit Timeline

The frontend should visualize the architecture rather than duplicate business logic.

Frontend should call APIs.

Frontend should NOT implement:

policy decisions

price authorization

payment verification

state transitions

AI trust decisions

17. DEMO EXPERIENCE — VERY IMPORTANT

The final competition/demo version should make DEALER understandable within seconds.

A strong demo should visibly show:

Buyer Agent
      ↕
Negotiation
      ↕
Merchant Agent
      ↓
Policy Engine
      ↓
Approved Deal
      ↓
Razorpay
      ↓
PAID

Useful visual elements:

live negotiation messages

current round

buyer offer

merchant counter

policy decision

margin/discount rule status

audit events

deal state

payment status

The UI should make the deterministic safety architecture obvious.

18. WHAT NOT TO DO

DO NOT:

Restart the project

Rewrite the state machine

Rewrite the policy engine

Rewrite the negotiation engine

Replace working tests unnecessarily

Add random AI features

Put business logic into React components

Let Gemini directly control payment/state

Trust browser payment status

Replace deterministic validation with AI

Add Firestore calls randomly to API routes

Ignore failing tests

Hide "Deal not found" with fake data

DO:

Preserve the architecture

Add infrastructure through existing abstractions

Test every new layer

Keep AI constrained

Keep payments server-authoritative

Keep state transitions deterministic

Fix the actual data flow

19. DEVELOPMENT ORDER FROM THIS POINT

Follow this exact order unless a real blocker requires adjustment:

CURRENT
  ↓
Fix Deal Arena "Deal not found"
  ↓
Verify complete frontend ↔ API data flow
  ↓
Firestore persistence
  ↓
Firestore integration tests
  ↓
Real Gemini integration
  ↓
Real autonomous negotiation
  ↓
Real Razorpay integration
  ↓
Webhook + idempotency
  ↓
Authentication / authorization
  ↓
Concurrency + production hardening
  ↓
Complete Buyer UI
  ↓
Complete Merchant UI
  ↓
Payment UI
  ↓
Admin / audit UI
  ↓
End-to-end testing
  ↓
Deployment
  ↓
Competition demo

20. TEST COMMANDS

Full suite:

npm test

Expected current baseline:

22 test files
136 tests
ALL PASSING

Payment-only:

npm test -- tests/api/payment.test.ts tests/api/payment-verify.test.ts

Build:

npm run build

After meaningful changes:

npm test
npm run build

21. CURRENT TEST INVENTORY

Confirmed passing areas include:

State Machine                  13
Policy Engine                   5
Deal Controller                 4
Offer Validator                 5
Audit Service                   3
Negotiation Engine              3
Negotiation Orchestrator       9
Negotiation Runner              4
Agent Validation                5
Buyer Agent                     7
Merchant Agent                  7
Agent Decision Service          5
AI Decision Validator            9
Persistence Service             10
Gemini Service                   3
Razorpay Service                 7
Payment Service                  7
Deals API                       12
Offers API                       8
Complete API                     3
Payment API                      3
Payment Verification API         4

Total:

136 passing

22. ARCHITECTURE TO PRESERVE

                    ┌──────────────────────┐
                    │      FRONTEND        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     NEXT.JS API      │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   CONTROLLER /       │
                    │   ORCHESTRATOR       │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
       Buyer Agent       Merchant Agent    Negotiation
             │                 │             Engine
             └─────────────────┼─────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │  AGENT VALIDATION    │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │    POLICY ENGINE     │
                    └──────────┬───────────┘
                               ▼
                    ┌──────────────────────┐
                    │    STATE MACHINE     │
                    └──────┬─────────┬─────┘
                           │         │
                           ▼         ▼
                    Persistence     Audit
                           │
                           ▼
                       Firestore

For payment:

State Machine
      ↓
Payment Service
      ↓
Razorpay Service
      ↓
Razorpay

23. PROJECT COMPLETION REALITY

Do NOT interpret the old "~45–55%" estimate as current code completion.

The deterministic core has advanced substantially since that estimate.

Current practical status:

CORE ENGINEERING
████████████████████  ~90%+

PRODUCTION INFRASTRUCTURE
████████░░░░░░░░░░░░  ~40%

COMPLETE PRODUCT
██████████░░░░░░░░░░  ~50–60%

These are rough engineering milestone estimates, NOT literal measurements.

Why the complete product is not close to 100%:

Firestore not connected

Real Gemini not connected

Real Razorpay flow not fully connected

Authentication incomplete

Security hardening incomplete

Frontend still has real data-flow issues

End-to-end demo not complete

Deployment not finalized

24. TOMORROW'S FIRST TASK

START HERE:

Task 1 — Debug:

src/app/deals/[dealId]/page.tsx

Error:

Deal not found

Do NOT start Firestore yet.

First make sure the current in-memory version can successfully do:

Create deal
    ↓
Return dealId
    ↓
Open /deals/[dealId]
    ↓
Frontend calls GET /api/deals/[dealId]
    ↓
Deal loads successfully

Once this works, the frontend/API contract is clear.

Then move to Firestore.

25. SESSION HANDOFF RULE

When continuing this project in a new chat/session:

Read this BRAIN.md first.

Do not ask to rebuild the project from scratch.

Do not repeat completed core work.

Check the current files before proposing changes.

Work one milestone at a time.

After each significant change:

run targeted tests

run full tests

run build when appropriate

Keep the architecture deterministic.

Keep AI and payment execution separated.

Do not change multiple unrelated systems at once.

26. FINAL STATUS — 2026-08-29

DEALER CORE
    ✅ COMPLETE

STATE MACHINE
    ✅ COMPLETE

POLICY ENGINE
    ✅ COMPLETE

NEGOTIATION ENGINE
    ✅ COMPLETE

AGENTS
    ✅ COMPLETE AS ABSTRACTIONS

AGENT VALIDATION
    ✅ COMPLETE

ORCHESTRATOR
    ✅ COMPLETE

NEGOTIATION RUNNER
    ✅ COMPLETE

AUDIT
    ✅ COMPLETE

IN-MEMORY PERSISTENCE
    ✅ WORKING

PAYMENT SERVICE
    ✅ TESTED

RAZORPAY SERVICE
    ✅ TESTED

PAYMENT API
    ✅ 3/3

PAYMENT VERIFICATION API
    ✅ 4/4

FULL TEST SUITE
    ✅ 22/22 FILES
    ✅ 136/136 TESTS

PRODUCTION BUILD
    ✅ LAST CONFIRMED PASSING

FIRESTORE
    ❌ NOT CONNECTED

REAL GEMINI
    ❌ NOT CONNECTED

REAL RAZORPAY
    ❌ NOT FULLY CONNECTED

AUTH
    ❌ NOT COMPLETE

PRODUCTION HARDENING
    ❌ NOT COMPLETE

FRONTEND
    🟡 IN PROGRESS

CURRENT FRONTEND BLOCKER
    ❌ Deal Arena reports "Deal not found"

END-TO-END DEMO
    ❌ NOT COMPLETE

DEPLOYMENT
    ❌ NOT FINALIZED

🚨 FINAL GOLDEN RULE

DO NOT START OVER.

DO NOT REWRITE THE CORE.

DO NOT CHASE RANDOM FEATURES.

The hardest deterministic architecture is already built.

The project is now moving from:

TESTED ARCHITECTURE
        ↓
REAL DATA
        ↓
REAL AI
        ↓
REAL PAYMENT
        ↓
SECURITY
        ↓
PRODUCT UI
        ↓
END-TO-END DEMO
        ↓
DEPLOYMENT

NEXT SESSION STARTS WITH:

FIX:
src/app/deals/[dealId]/page.tsx

ERROR:
Deal not found

THEN:
Firestore

END OF BRAIN.md
8. SHIP-MODE CHANGES — 2026-08-29

The following product-critical changes were implemented in the current working copy:

- Added server-side Razorpay Test Mode environment variables to `.env.example`.
- Added autonomous negotiation API client support.
- Deal Arena now has a `RUN AUTONOMOUS DEAL` path that calls the real AI negotiation endpoint.
- Autonomous negotiation no longer accepts product/policy definitions from the browser; `/api/deals/[dealId]/negotiate` derives them from the server-side deal session.
- Razorpay payment orders are now persisted through the persistence abstraction before being returned to the client.
- Payment verification now uses the server-created order as the authoritative order record instead of trusting browser-supplied order metadata.
- Payment verification checks the stored amount and currency against the accepted/current deal value.
- Payment order creation is idempotent for an existing deal-level Razorpay order.
- Deal Arena now has a Razorpay Checkout flow: create order -> open Checkout -> server-side signature verification.
- Razorpay secret values remain server-only; only `RAZORPAY_KEY_ID` is returned to the browser.
- Persistence instance now uses a global Node.js process reference in all environments to avoid separate route-module stores inside the same process.

IMPORTANT LIMITATION:

The current persistence implementation is still in-memory. This is acceptable for local/demo development but is NOT durable production persistence and is not safe to rely on across independent serverless instances. Firestore remains the production persistence target.

9. IMMEDIATE NEXT PRIORITIES

P0:

1. Run and fix TypeScript/tests/build after installing dependencies in the local environment.
2. Add/verify integration tests for authoritative Razorpay order persistence and autonomous negotiation.
3. Add a deliberate policy-rejection/failure path to the Deal Arena so the demo visibly proves graceful failure.
4. Verify the real Gemini API with a real GEMINI_API_KEY.
5. Verify Razorpay Test Mode with real RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.

P1:

6. Add durable Firestore persistence.
7. Add real audit-event display sourced from backend audit records rather than only client-generated UI events.
8. Finish the end-to-end DEAL -> PAYMENT -> PAID -> COMPLETED UI flow.
9. Finalize README, architecture diagram, demo script, and deployment configuration.
