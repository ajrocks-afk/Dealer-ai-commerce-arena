export type DealCoachRisk =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type DealCoachRecommendation =
  | "BUYER_COUNTER"
  | "MERCHANT_COUNTER"
  | "ACCEPT"
  | "CONTINUE"
  | "STOP";

export interface DealCoachAnalysis {
  recommendation: DealCoachRecommendation;

  risk: DealCoachRisk;

  suggestedPrice?: number;

  currentPrice: number;

  buyerOffer?: number;

  merchantOffer?: number;

  priceGap?: number;

  estimatedSavings?: number;

  estimatedSavingsPercent?: number;

  reasoning: string;

  factors: string[];

  policySafe: boolean;

  round: number;

  maxRounds: number;

  generatedAt: string;
}