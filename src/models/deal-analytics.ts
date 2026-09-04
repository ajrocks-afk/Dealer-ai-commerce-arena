import type { DealState } from "@/state-machine/deal-states";

export type DealPaymentStatus =
  | "NOT_STARTED"
  | "ORDER_CREATED"
  | "PAID"
  | "FAILED";

export interface DealAnalytics {
  dealSessionId: string;

  startingPrice: number;

  currentPrice: number;

  finalPrice?: number;

  buyerSavings: number;

  buyerSavingsPercent: number;

  merchantDiscount: number;

  merchantDiscountPercent: number;

  roundsUsed: number;

  maximumRounds: number;

  offerCount: number;

  buyerOfferCount: number;

  merchantOfferCount: number;

  policyBlockCount: number;

  result: DealState;

  paymentStatus: DealPaymentStatus;

  generatedAt: string;
}