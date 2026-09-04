DEALER --- AI Commerce Arena

AI proposes. Deterministic systems decide.







DEALER --- AI Commerce Arena is an AI-driven commerce negotiation
platform where autonomous Buyer and Merchant agents negotiate deals
while deterministic business rules, policy validation, state machines,
and payment services control what can actually happen.

The project explores a simple but important question:

What happens when AI agents participate in commerce, but AI itself
is never given authority over business rules or money movement?

DEALER answers that question by separating AI decision-making from
deterministic execution.

Live Demo

Production: https://dealer-ai-commerce-arena.vercel.app/

Repository: https://github.com/ajrocks-afk/Dealer-ai-commerce-arena

What is DEALER?

Traditional e-commerce generally follows:

Browse → Buy → Pay

DEALER explores a more dynamic model:

Buyer Agent
     ↕
Negotiate
     ↕
Merchant Agent
     ↓
Deterministic Validation
     ↓
Business Policy
     ↓
State Machine
     ↓
Payment Service
     ↓
Razorpay

The Buyer and Merchant agents can reason about offers and propose
actions.

They do not have direct authority to:

bypass business rules

bypass price limits

change deal state arbitrarily

mark a deal as accepted without validation

directly move money

execute payments outside the payment service

This creates a controlled environment for experimenting with autonomous
commerce.

Core Principle

The central architecture of DEALER is:

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

The most important boundary is:

AI ≠ AUTHORITY

AI can recommend an action.

Deterministic systems decide whether that action is allowed.

Why This Architecture Matters

Giving an AI agent unrestricted access to commerce operations creates
obvious risks.

An AI model could theoretically:

propose an invalid price

ignore a merchant's minimum price

accept an offer outside the allowed state

modify a transaction state incorrectly

attempt to trigger payment directly

DEALER deliberately prevents this architecture.

Instead:

Gemini
  ↓
Decision
  ↓
Application Validation
  ↓
Business Policy
  ↓
State Machine
  ↓
Payment Service

Each layer has a specific responsibility.

System Architecture

┌─────────────────────────────────────────────┐
│              COMMERCE ARENA                │
│                                             │
│        Buyer Agent ↔ Merchant Agent         │
│                                             │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             NEXT.JS API LAYER               │
│                                             │
│     Deal / Negotiation / Decision APIs      │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              AI NEGOTIATION                 │
│                                             │
│              Google Gemini                  │
│                                             │
│      Proposes decisions and offer prices    │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│          DETERMINISTIC GOVERNANCE           │
│                                             │
│   Business Policy + Validation + Rules      │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│               STATE MACHINE                 │
│                                             │
│ CREATED → NEGOTIATING → POLICY_CHECK       │
│                  ↓                          │
│       OFFER / COUNTER / ACCEPT / REJECT     │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              PAYMENT SERVICE                │
│                                             │
│        Payment order / execution            │
│                                             │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                 RAZORPAY                   │
│                                             │
│             Money movement                  │
└─────────────────────────────────────────────┘

Buyer Agent

The Buyer Agent represents the customer side of the negotiation.

It can:

analyze the current deal

evaluate merchant proposals

generate negotiation decisions

propose a counter-offer

accept a suitable offer

stop negotiation when necessary

The Buyer Agent's AI output is treated as a proposal, not as an
authoritative transaction command.

Merchant Agent

The Merchant Agent represents the seller side.

It can:

evaluate buyer proposals

reason about acceptable prices

respond with offers

accept suitable buyer proposals

reject unsuitable proposals

participate in autonomous negotiation

The Merchant Agent is also constrained by deterministic business rules.

Gemini AI Negotiation

DEALER integrates Gemini for autonomous negotiation.

The Gemini decision layer produces structured decisions such as:

agent
decision
offerPrice
quantity
reasoning

Example:

Agent: BUYER
Decision: MAKE_OFFER
Offer Price: ₹112000
Reasoning:
Proposing an opening offer based on the negotiation context.

The returned AI decision is then passed through deterministic
validation.

The application can adjust or reject an AI proposal when business rules
require it.

This distinction is intentional.

AI Proposal vs Authoritative Price

DEALER separates:

Gemini Proposal

from:

Authoritative Deal Price

The Gemini output is the AI's recommendation.

The Deal Core price is the validated value accepted by the deterministic
system.

Therefore:

Gemini Offer
     ↓
Validation
     ↓
Business Policy
     ↓
Authoritative Price

This prevents an AI-generated value from automatically becoming the
final commercial truth.

Negotiation Flow

A typical autonomous negotiation follows this process:

1. Deal Created
        ↓
2. Buyer and Merchant Context Loaded
        ↓
3. Gemini Generates Decisions
        ↓
4. AI Proposals Are Returned
        ↓
5. Deterministic Validation Runs
        ↓
6. Business Policy Is Evaluated
        ↓
7. State Machine Validates Transition
        ↓
8. Authoritative Deal State Is Updated
        ↓
9. Negotiation Continues or Deal Is Accepted
        ↓
10. Payment Service Handles Payment Flow
        ↓
11. Razorpay Executes Money Movement

Deal Core

The Deal Core is the authoritative center of a negotiation session.

It exposes information such as:

current authoritative price

current negotiation round

maximum rounds

current state

latest validated offer

control events

negotiation progress

The Deal Core is intentionally separate from the raw Gemini output.

That allows the UI to communicate two different concepts:

WHAT AI PROPOSED

and:

WHAT THE SYSTEM ACTUALLY ACCEPTED

Deal State Machine

DEALER uses a deterministic state machine to control deal execution.

Example states include:

CREATED
NEGOTIATING
POLICY_CHECK
OFFER_RECEIVED
COUNTERED
ACCEPTED
REJECTED
CANCELLED
EXPIRED

A simplified flow:

CREATED
   ↓
NEGOTIATING
   ↓
POLICY_CHECK
   ├── ACCEPTED
   ├── REJECTED
   ├── COUNTERED
   ├── NEGOTIATING
   ├── CANCELLED
   └── EXPIRED

The state machine prevents arbitrary state changes.

For example:

AI says: ACCEPT

does not mean:

Deal automatically becomes ACCEPTED

Instead:

AI decision
    ↓
Allowed transition?
    ↓
Business policy valid?
    ↓
State transition permitted?
    ↓
Update authoritative state

Deterministic Business Policy

Business rules are deterministic.

Examples include:

minimum merchant selling price

allowed offer ranges

negotiation round limits

quantity constraints

deal expiration

accepted/rejected states

payment eligibility

The AI cannot override these rules.

This is a core design principle of the project.

Price Authority

DEALER intentionally distinguishes between several price concepts.

AI Proposed Price

The value generated by Gemini.

Gemini → offerPrice

Validated Offer

The value after application-level validation and business policy.

AI proposal
    ↓
Validation
    ↓
Validated offer

Authoritative Deal Price

The final value stored in the deal session after deterministic controls.

Deal Core → currentPrice

This separation is important because an AI model can propose a value
that the deterministic system does not allow to become authoritative.

Manual Control

DEALER also supports controlled manual interaction.

The Deal Page allows the operator to:

enter a manual offer

submit a counter

accept a deal

stop negotiation

synchronize state

trigger Gemini negotiation

Manual input still passes through the same deterministic governance
layer.

The UI does not directly bypass the backend rules.

Commerce Arena UI

The primary interface is a dark, futuristic AI commerce arena built
around live negotiation.

The landing page presents:

DEALER
AI COMMERCE ARENA

SYSTEM ONLINE

AUTONOMOUS COMMERCE / CONTROLLED EXECUTION

COMMERCE, NEGOTIATED.

DEALER is an AI commerce arena where buyer and merchant agents
negotiate — while deterministic systems decide what can actually happen.

CREATE DEAL
EXPLORE SYSTEM

The Deal Page presents the negotiation as three central panels:

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   BUYER AGENT    │  │    DEAL CORE     │  │ MERCHANT AGENT   │
│                  │  │                  │  │                  │
│ Gemini proposal  │  │ Authoritative    │  │ Gemini proposal  │
│ Gemini action    │  │ price            │  │ Gemini action    │
│ Reasoning        │  │ Round / State    │  │ Reasoning        │
│ Manual input     │  │ Progress         │  │ Manual input     │
│ Counter / Accept │  │ Control events   │  │ Counter / Accept │
└──────────────────┘  └──────────────────┘  └──────────────────┘

The interface is designed to make the separation between AI reasoning
and deterministic authority visible.

Live Gemini Negotiation

Before Gemini negotiation is started, the agent proposal cards show:

₹0

This prevents the UI from pretending that an AI proposal exists before
Gemini has actually returned one.

When:

RUN GEMINI NEGOTIATION

is pressed, the application calls the existing autonomous negotiation
API.

The page then displays the actual returned Gemini decision:

decision.offerPrice
decision.decision
decision.reasoning

No hardcoded negotiation result is used.

The Deal Core separately displays:

session.currentPrice

as the authoritative validated price.

Payment Architecture

Payment execution is intentionally isolated from AI.

The architecture is:

AI
 ↓
Negotiation
 ↓
Validation
 ↓
Policy
 ↓
State Machine
 ↓
Payment Service
 ↓
Razorpay

The AI does not receive direct access to payment credentials or money
movement.

Razorpay credentials remain server-side environment variables.

Payment Safety

Payment configuration errors are not treated as AI decisions.

The backend is responsible for checking required payment credentials.

If Razorpay credentials are unavailable, the UI should communicate a
safe status such as:

Payment execution is pending configuration.

It should not falsely report that money was transferred.

The backend payment validation remains intact even when the UI presents
a cleaner status message.

Security Model

DEALER follows a basic authority hierarchy:

AI OUTPUT
   ↓
UNTRUSTED PROPOSAL
   ↓
DETERMINISTIC VALIDATION
   ↓
BUSINESS POLICY
   ↓
STATE MACHINE
   ↓
AUTHORIZED ACTION

The system therefore treats AI output as data that must be validated.

This is safer than giving an AI agent direct access to critical business
operations.

Observability

DEALER records and exposes negotiation information useful for
understanding what happened during a deal.

Useful events include:

Gemini decision generated
Offer initiated
Policy check
State transition
Counter offer
Acceptance
Payment preparation
Payment execution

State transitions are deterministic and can be inspected during
development.

Example:

[STATE MACHINE]
CREATED → NEGOTIATING

[STATE MACHINE]
NEGOTIATING → POLICY_CHECK

[STATE MACHINE]
POLICY_CHECK → ACCEPTED

This makes autonomous behavior auditable rather than opaque.

Example Negotiation

Suppose the merchant's minimum legal selling price is:

₹112000

and the initial asking price is:

₹140000

Gemini may propose:

₹112000

The deterministic system can then validate the proposal against the
active negotiation policy.

The final authoritative Deal Core value may therefore differ from the
raw AI proposal.

This is not a bug in the architecture.

It demonstrates the architecture:

Gemini proposes
      ↓
System validates
      ↓
Policy decides
      ↓
Deal Core becomes authoritative

Technology Stack

Frontend

Next.js

React

TypeScript

Tailwind CSS

Custom glass/neon UI styling

Backend

Next.js API routes

TypeScript services

Deterministic business rules

Deal state machine

Negotiation services

Payment service

AI

Google Gemini

Structured AI negotiation decisions

Payments

Razorpay

Deployment

Vercel

Development

Node.js

npm

Git

GitHub

Project Structure

The project is organized around UI, API, services, governance, state
management, payments, and tests.

DEALER- AI Commerce Arena/
│
├── .dealer/
│   └── ...
│
├── public/
│   └── ...
│
├── scripts/
│   └── ...
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deals/
│   │   │   └── ...
│   │   │
│   │   ├── deals/
│   │   │   └── [dealId]/
│   │   │       ├── page.tsx
│   │   │       └── ...
│   │   │
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── services/
│   │   ├── dealer-api.ts
│   │   ├── gemini-service.ts
│   │   ├── ...
│   │
│   └── ...
│
├── tests/
│   └── ...
│
├── BRAIN.md
├── README.md
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── ...

Important Backend Contracts

The deal session contains authoritative information including:

id
productId
merchantId
buyerId
state
currentRound
maxRounds
currency
initialPrice
currentPrice
createdAt
updatedAt
expiresAt

The autonomous negotiation response can contain:

session
offers
decisions
errors

A decision contains information such as:

agent
decision
offerPrice
quantity
reasoning

The frontend uses the existing API contracts rather than inventing
additional backend fields.

Environment Variables

Create a local .env.local file.

Example:

GEMINI_API_KEY=your_gemini_api_key

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

For Vercel, configure the same variables in the project's Environment
Variables section.

Important

Never commit:

.env.local

Never put secret credentials directly into:

GitHub source code

README files

frontend code

screenshots

client-side JavaScript

Use .env.example for documenting variable names without exposing real
values.

Local Development

Clone the repository:

git clone https://github.com/ajrocks-afk/Dealer-ai-commerce-arena.git

Enter the project:

cd "Dealer-ai-commerce-arena"

Install dependencies:

npm install

Create the local environment file:

copy .env.example .env.local

Add the required credentials to .env.local.

Start the development server:

npm run dev

Open:

http://localhost:3000

Production Build

Before deployment, verify the project with:

npm run build

A successful build confirms that the application can be compiled for
production.

Vercel Deployment

DEALER is deployed using Vercel.

Recommended configuration:

Framework:
Next.js

Root Directory:
./

Build Command:
Next.js default

Install Command:
npm install

Add the required environment variables in Vercel:

GEMINI_API_KEY
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET

Then deploy.

Git Workflow

The project is maintained using Git.

Typical workflow:

git status
git add -A
git commit -m "Update DEALER"
git push origin main

The production repository is:

https://github.com/ajrocks-afk/Dealer-ai-commerce-arena

Testing Strategy

The project should be tested at multiple layers.

AI Layer

Verify:

Gemini is configured

Gemini returns structured decisions

offer prices are returned correctly

reasoning is returned

invalid AI output is handled safely

Governance Layer

Verify:

business rules cannot be bypassed

invalid prices are rejected or adjusted

allowed actions are enforced

AI output cannot directly execute restricted operations

State Machine

Verify:

valid state transitions succeed

invalid transitions are rejected

accepted deals enter the correct state

cancelled and expired deals cannot continue incorrectly

Payment Layer

Verify:

payment credentials are checked server-side

payment orders are created through the payment service

AI cannot directly execute money movement

Razorpay receives only authorized payment requests

UI Layer

Verify:

Gemini results are displayed from live API responses

authoritative price is displayed separately

agent cards show actual decisions

manual actions work

state synchronization works

Design Principles

DEALER is built around several principles.

1. AI should propose, not govern

AI is useful for reasoning and negotiation.

It should not own critical business authority.

2. Deterministic rules should remain deterministic

Business policies should not depend on probabilistic model behavior.

3. State transitions should be explicit

Every important deal state change should be controlled.

4. Payment should be isolated

AI should never directly control money movement.

5. The UI should expose authority boundaries

The interface should make it clear what the AI proposed and what the
system actually accepted.

6. Autonomous does not mean uncontrolled

The goal is not unrestricted autonomy.

The goal is:

Autonomy inside deterministic boundaries.

Project Objective

The objective of DEALER is to demonstrate a practical architecture for
autonomous commerce where AI agents can negotiate while deterministic
systems retain final control.

The project combines:

Agentic AI
+
Commerce
+
Negotiation
+
Business Policy
+
State Machines
+
Payment Infrastructure

without collapsing all of those responsibilities into the AI model.

What Makes DEALER Different?

A conventional AI commerce prototype might look like:

User
 ↓
AI
 ↓
Transaction

DEALER instead uses:

User
 ↓
AI Agents
 ↓
Negotiation
 ↓
Deterministic Governance
 ↓
State Machine
 ↓
Payment Service
 ↓
Transaction

That extra control layer is the core of the project.

Demo Flow

A recommended demonstration flow is:

1. Open the landing page
2. Show SYSTEM ONLINE
3. Explain the AI Commerce Arena
4. Create or open a deal
5. Show Buyer Agent
6. Show Deal Core
7. Show Merchant Agent
8. Show that AI proposal values begin at ₹0
9. Press RUN GEMINI NEGOTIATION
10. Show the live Gemini decision
11. Show Gemini reasoning
12. Show deterministic validation
13. Show authoritative Deal Core price
14. Show state machine transition
15. Show business policy/governance
16. Show payment architecture
17. Explain Razorpay execution boundary
18. Finish with the accepted deal

Suggested Presentation Message

The project can be summarized in one sentence:

DEALER lets AI agents negotiate commerce while deterministic systems
retain authority over rules, state, and money.

Or even shorter:

AI proposes. Deterministic systems decide.

Project Vision

The longer-term vision is to explore how autonomous agents could
participate in real-world commerce without requiring the AI model itself
to become the final authority over financial or business-critical
actions.

Possible future directions include:

multi-product negotiation

multiple merchant agents

agent reputation

richer negotiation strategies

inventory-aware negotiation

dynamic business policies

audit trails

human approval workflows

multi-agent marketplaces

stronger payment authorization boundaries

These are future directions rather than requirements of the current
implementation.

Current Status

ONGOING PROJECT --- Active Development

Current implementation demonstrates:

AI-powered negotiation

Buyer and Merchant agents

Gemini integration

live autonomous negotiation

deterministic price validation

business policy enforcement

deal state machine

manual negotiation controls

Deal Core authority

payment service architecture

Razorpay integration boundary

Next.js application

Vercel deployment

GitHub source control

Final Principle

DEALER is not about giving AI complete control over commerce.

It is about demonstrating the opposite:

AI can reason.
AI can negotiate.
AI can propose.

But deterministic systems decide
what is actually allowed to happen.

And for payments:

AI
 ↓
PROPOSE
 ↓
VALIDATE
 ↓
AUTHORIZE
 ↓
PAYMENT SERVICE
 ↓
RAZORPAY
 ↓
MONEY MOVEMENT

The AI participates in the commerce --- but it does not own the
commerce.

DEALER --- AI Commerce Arena

AI proposes. Deterministic systems decide.
