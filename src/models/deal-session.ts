import type { DealState } from "@/state-machine/deal-states";

export type DealActor =
  | "BUYER_AGENT"
  | "MERCHANT_AGENT"
  | "SYSTEM";

export interface DealSession {
  id: string;

  productId: string;
  merchantId: string;

  buyerId: string;

  state: DealState;

  currentRound: number;

  maxRounds: number;

  currency: "INR";

  initialPrice: number;

  currentPrice: number;

  acceptedPrice?: number;

  createdAt: string;

  updatedAt: string;

  expiresAt: string;
}