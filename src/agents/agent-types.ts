import type { Offer } from "@/models/offer";

export type AgentType =
  | "BUYER_AGENT"
  | "MERCHANT_AGENT";

export type AgentDecision =
  | "MAKE_OFFER"
  | "ACCEPT"
  | "REJECT"
  | "COUNTER"
  | "STOP";

export interface AgentContext {
  dealSessionId: string;

  round: number;

  maxRounds: number;

  currentPrice: number;

  initialPrice: number;

  currency: "INR";

  previousOffers: Offer[];

  /**
   * Optional role information used by
   * the Gemini-powered agent layer.
   */
  agentRole?: AgentType;

  /**
   * Optional product information exposed
   * to the AI for better negotiation reasoning.
   */
  productName?: string;

  productPrice?: number;

  /**
   * Merchant-side deterministic constraints.
   *
   * These are informational inputs for the AI.
   * The actual policy engine remains authoritative.
   */
  minimumSellingPrice?: number;

  minimumMargin?: number;

  maxDiscountPercent?: number;

  approvalThreshold?: number;
}

export interface AgentDecisionResult {
  agent: AgentType;

  decision: AgentDecision;

  offerPrice?: number;

  quantity?: number;

  reasoning: string;
}