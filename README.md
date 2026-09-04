# 🤝 DEALER — AI Commerce Arena

> **AI-powered commerce negotiation with deterministic business governance.**

🚧 **ONGOING PROJECT — Active Development**

DEALER is an AI-driven commerce negotiation platform where **Buyer and Merchant AI agents negotiate deals**, while a **deterministic business-rule layer** controls what actions are actually allowed.

The goal is to explore a future where autonomous AI agents can participate in commerce without giving AI direct authority over business rules, deal states, or financial transactions.

---

## 💡 What is DEALER?

Traditional e-commerce usually follows:

```text
Browse → Buy → Pay
```

DEALER explores a more dynamic model:

```text
Buyer Agent
     ↕
Negotiation
     ↕
Merchant Agent
     ↓
Validate
     ↓
Accept
     ↓
Pay
```

Instead of simply selecting a fixed price, a buyer can negotiate with a merchant through AI agents.

However, the AI does **not** get unrestricted control.

The core principle of DEALER is:

> **AI can negotiate. Deterministic code decides what is allowed.**

This separation creates a safer architecture for agentic commerce.

---

# 🎯 Core Idea

DEALER combines two different layers:

### 🧠 AI Layer

AI agents are responsible for tasks such as:

* Understanding the buyer's intent
* Understanding product information
* Generating offers
* Counter-offering
* Evaluating negotiation context
* Communicating with the other agent
* Reaching a potential agreement

### 🛡️ Governance Layer

Deterministic application logic is responsible for:

* Validating offers
* Enforcing business rules
* Controlling negotiation state
* Determining whether an action is permitted
* Preventing invalid transitions
* Protecting transaction logic
* Ensuring AI cannot bypass application constraints

This gives DEALER a clear separation between:

```text
AI Decision Making
        ↓
Proposal
        ↓
Deterministic Validation
        ↓
Allowed / Rejected
```

The AI can **suggest** an action.

The system decides whether that action is **legal**.

---

# 🏗️ Architecture

The high-level architecture of DEALER is:

```text
┌──────────────────────────────┐
│      Commerce Arena UI       │
│                              │
│  Buyer ↔ Merchant Negotiation│
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       Next.js APIs           │
│                              │
│  Request / Response Layer    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     Negotiation Layer        │
│                              │
│   Buyer Agent ↔ Merchant     │
│            Agent             │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   Deterministic Governance   │
│                              │
│  Business Rules              │
│  Offer Validation            │
│  Deal State                   │
│  Action Authorization        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      Transaction Layer       │
│                              │
│    Accept → Pay → Complete   │
└──────────────────────────────┘
```

---

# 🔄 How DEALER Works

A typical negotiation follows this flow:

```text
1. Buyer selects a product
          ↓
2. Buyer Agent evaluates the product
          ↓
3. Buyer Agent proposes an offer
          ↓
4. Merchant Agent evaluates the offer
          ↓
5. Merchant Agent accepts / rejects / counter-offers
          ↓
6. Negotiation continues
          ↓
7. Proposed deal reaches validation
          ↓
8. Deterministic rules validate the deal
          ↓
9. Deal is accepted or rejected
          ↓
10. Transaction can proceed
```

The important part is step 7–8.

Even if an AI agent proposes something unreasonable or invalid, the deterministic layer remains the final authority.

---

# 🧠 Agentic Negotiation

DEALER treats the buyer and merchant as separate participants.

## 👤 Buyer Agent

The Buyer Agent represents the buyer's interests.

It can:

* Analyze the product
* Consider the current offer
* Make an offer
* Respond to merchant counter-offers
* Decide whether to continue negotiating
* Attempt to reach the buyer's desired deal

## 🏪 Merchant Agent

The Merchant Agent represents the merchant.

It can:

* Evaluate incoming offers
* Consider product pricing
* Respond to buyer proposals
* Make counter-offers
* Accept or reject negotiations
* Attempt to protect the merchant's pricing constraints

The agents communicate through the negotiation system rather than directly modifying business state.

---

# 🛡️ Deterministic Governance

One of the most important design decisions in DEALER is that **AI does not own the business rules**.

For example:

```text
AI:
"I want to accept this offer."

        ↓

Governance Layer:
"Is this offer actually allowed?"

        ↓

YES → Continue
NO  → Reject
```

This protects the system from relying on an LLM as the final authority for rules that should be deterministic.

### Why this matters

An LLM can:

* Misinterpret instructions
* Produce inconsistent outputs
* Generate unexpected actions
* Attempt actions outside the intended workflow

A deterministic rules engine can instead provide predictable enforcement.

Therefore:

```text
LLM = Negotiation Intelligence

Code = Business Authority
```

---

# 🔐 AI Does NOT Control Transactions

DEALER intentionally avoids giving the AI unrestricted authority over financial or business-critical operations.

The AI may propose:

```text
"Accept ₹X"
```

But the system determines whether that action is permitted.

The architecture therefore follows:

```text
AI Proposal
     ↓
Application Validation
     ↓
Business Rule Check
     ↓
State Transition
     ↓
Transaction
```

This creates an important boundary between **reasoning** and **execution**.

---

# 🧩 Technology Stack

DEALER is currently being developed using:

| Layer                     | Technology                    |
| ------------------------- | ----------------------------- |
| Frontend                  | Next.js / React               |
| Backend                   | Next.js API routes            |
| Language                  | TypeScript                    |
| Runtime / Package Manager | Node.js / npm                 |
| AI                        | LLM API integration           |
| Testing                   | Vitest                        |
| Configuration             | Environment variables         |
| Development               | Local development environment |

The project is structured to keep the AI negotiation logic and deterministic application logic clearly separated.

---

# 📁 Project Structure

The project follows a Next.js / TypeScript structure.

A simplified view:

```text
DEALER/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ...
│   │   │
│   │   └── ...
│   │
│   ├── ...
│   │
│   └── ...
│
├── .env.local
├── package.json
├── tsconfig.json
├── ...
└── README.md
```

> The exact folder structure may continue to evolve while DEALER is under active development.

---

# 🔑 Environment Configuration

DEALER uses environment variables for sensitive configuration such as API credentials.

Create a local environment file:

```text
.env.local
```

Add the required AI API key:

```env
YOUR_AI_API_KEY=your_api_key_here
```

### ⚠️ Important

Never commit secret API keys to GitHub.

Make sure environment files containing secrets are excluded through `.gitignore`.

For example:

```gitignore
.env
.env.local
.env.*.local
```

The actual environment-variable name should match the one used by the application code.

---

# 🤖 AI Integration

The AI integration allows DEALER to move beyond a traditional fixed-price shopping experience.

Instead of simply:

```text
Product → Price → Purchase
```

DEALER enables:

```text
Product
   ↓
Buyer Agent
   ↓
Offer
   ↓
Merchant Agent
   ↓
Counter Offer
   ↓
Negotiation
   ↓
Validation
   ↓
Deal
```

The AI API is used for the **intelligence layer**, while application code remains responsible for enforcing system constraints.

---

# 🧪 Testing

DEALER uses **Vitest** for automated testing.

Tests can be executed using:

```bash
npm test
```

The project has already been tested during development while resolving implementation and integration issues.

Testing is an important part of the project because negotiation systems can have many edge cases.

Examples include:

* Invalid offers
* Invalid deal states
* Unexpected agent responses
* Boundary conditions
* Rejected negotiations
* Invalid state transitions
* API failures

---

# 🧱 Development Philosophy

DEALER is built around a simple architectural principle:

## **Don't let the AI become the source of truth.**

The AI should be powerful enough to negotiate but constrained enough that it cannot directly redefine the rules of the marketplace.

This creates a layered system:

```text
┌─────────────────────────────┐
│          AI Layer           │
│                             │
│ Reasoning + Negotiation     │
└──────────────┬──────────────┘
               │
               │ Proposal
               ▼
┌─────────────────────────────┐
│      Governance Layer       │
│                             │
│ Deterministic Rules         │
│ Validation + State          │
└──────────────┬──────────────┘
               │
               │ Authorized Action
               ▼
┌─────────────────────────────┐
│       Transaction Layer     │
│                             │
│ Business-Critical Actions   │
└─────────────────────────────┘
```

---

# 🧠 Why Deterministic Governance?

A normal AI-powered application might look like:

```text
User
 ↓
LLM
 ↓
Action
```

DEALER intentionally moves toward:

```text
User
 ↓
AI
 ↓
Proposal
 ↓
Rules
 ↓
Validation
 ↓
Action
```

This distinction becomes increasingly important as AI agents gain the ability to perform real-world actions.

The system should not assume:

> "The AI said it, therefore it is allowed."

Instead:

> "The AI proposed it. Now the system checks whether it is allowed."

---

# 💼 Commerce Use Case

Imagine a product listed at:

```text
₹50,000
```

A buyer's agent might propose:

```text
₹40,000
```

The merchant agent could respond:

```text
₹47,000
```

The buyer agent could counter:

```text
₹44,000
```

The merchant could respond again:

```text
₹45,000
```

Eventually:

```text
Buyer Agent
     ↓
₹45,000
     ↓
Merchant Agent
     ↓
Agreement
     ↓
Governance Validation
     ↓
Approved
     ↓
Transaction
```

The important point is that the negotiation can be flexible while the final authorization remains deterministic.

---

# 🔄 Negotiation State

A negotiation is treated as a controlled process rather than an unlimited conversation.

Conceptually:

```text
START
  ↓
NEGOTIATING
  ↓
 ┌───────────────┐
 │               │
 ▼               ▼
ACCEPTED       REJECTED
  │
  ▼
VALIDATED
  │
  ▼
TRANSACTION
```

The application controls which transitions are valid.

This prevents an AI agent from simply jumping from an arbitrary conversational state directly into a transaction.

---

# 🚧 Current Project Status

DEALER is currently an:

> **ONGOING PROJECT — Active Development**

Work completed so far includes the core project foundation and continued implementation/debugging of the AI commerce negotiation system.

The development process has included:

* Project setup
* Next.js / TypeScript application development
* API/backend structure
* AI API configuration
* Environment-variable setup
* Negotiation architecture
* Buyer / merchant agent concept
* Deterministic governance concept
* Testing with Vitest
* Debugging and resolving implementation issues
* Continued refinement of the project architecture

The project is intentionally being built incrementally so that the AI layer does not become tightly coupled to the business-rule layer.

---

# 🧪 Running the Project Locally

Clone the repository:

```bash
git clone <YOUR_REPOSITORY_URL>
```

Enter the project:

```bash
cd DEALER
```

Install dependencies:

```bash
npm install
```

Create your local environment file:

```text
.env.local
```

Add the required API configuration.

Then start the development server:

```bash
npm run dev
```

Open the local application in your browser.

---

# 🧪 Run Tests

Run the test suite with:

```bash
npm test
```

For a watch-based development workflow, use the appropriate Vitest command configured by the project.

---

# 🛠️ Development Workflow

A typical development cycle is:

```text
Build Feature
     ↓
Run TypeScript / Build Checks
     ↓
Run Tests
     ↓
Fix Errors
     ↓
Test Again
     ↓
Integrate AI
     ↓
Validate Governance
     ↓
Repeat
```

DEALER is being developed incrementally rather than treating the LLM as the entire application.

---

# 🎯 Design Goals

The project aims to demonstrate several ideas:

### 1. Agentic Commerce

AI agents can negotiate on behalf of users and businesses.

### 2. Controlled Autonomy

Agents can make decisions within a constrained environment.

### 3. Deterministic Governance

Business rules remain enforceable by traditional application code.

### 4. Separation of Concerns

AI reasoning and transaction authorization remain separate.

### 5. Safe Agent Execution

AI-generated proposals should not automatically become real-world actions.

### 6. Extensible Architecture

The system can evolve toward more sophisticated negotiation strategies without replacing the underlying governance model.

---

# 🚀 Future Direction

DEALER is designed as an evolving platform.

Potential future development areas include:

* More sophisticated buyer negotiation strategies
* More sophisticated merchant strategies
* Persistent negotiation sessions
* Richer product catalogs
* Advanced pricing rules
* Negotiation limits
* Deal expiration
* Audit logs
* Stronger transaction-state management
* Improved frontend visualization
* More comprehensive automated tests
* Agent evaluation and benchmarking
* Multi-product negotiations
* Personalized buyer constraints
* Merchant inventory constraints
* More advanced governance policies

These features can be added while preserving the fundamental architecture:

```text
AI proposes
     ↓
Rules validate
     ↓
System executes
```

---

# 🔬 The Experiment

DEALER is more than an e-commerce UI.

It is an exploration of a larger question:

> **What happens when AI agents become participants in commerce?**

If an AI agent can negotiate prices, choose products, and interact with another autonomous agent, then traditional assumptions about e-commerce begin to change.

Instead of:

```text
Human → Website → Checkout
```

we can imagine:

```text
Human
  ↓
Buyer Agent
  ↕
Merchant Agent
  ↓
Governance
  ↓
Commerce
```

The challenge is ensuring that increased autonomy does not mean uncontrolled authority.

DEALER explores one possible answer:

> **Give AI the ability to reason and negotiate, but keep authority deterministic.**

---

# 🏆 Project Vision

The long-term vision for DEALER is an **AI Commerce Arena** where autonomous agents can negotiate meaningful commercial agreements while remaining inside clearly defined and enforceable boundaries.

The system should make it possible to have:

```text
🤖 Intelligent Negotiation
        +
🛡️ Deterministic Governance
        +
💳 Controlled Transactions
        =
🤝 Agentic Commerce
```

---

# 📌 Key Principle

## AI is the negotiator — not the authority.

That principle sits at the heart of DEALER.

The agents can:

> **Think → Propose → Negotiate**

But the system must:

> **Validate → Authorize → Execute**

---

# 👨‍💻 Project Status

**DEALER — AI Commerce Arena**

🚧 **Active Development**

The project is being built iteratively, with a strong focus on:

* AI agent negotiation
* Deterministic business governance
* Reliable state management
* API architecture
* Testing
* Safe execution of AI-generated proposals

---

## ⭐ If you find the idea interesting

DEALER is an exploration of what commerce could look like when AI agents become active participants rather than simple assistants.

The core question is simple:

> **Can autonomous AI agents negotiate commerce without being allowed to control the rules of commerce?**

DEALER is an attempt to build that answer.
