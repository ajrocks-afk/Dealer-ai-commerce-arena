export type ApprovalLevel = "NONE" | "HUMAN_REQUIRED";

export interface MerchantPolicy {
  id: string;
  merchantId: string;

  // Pricing constraints
  maxDiscountPercent: number;
  minimumSellingPrice: number;
  minimumMargin: number;

  // Negotiation constraints
  maxNegotiationRounds: number;

  // Bundle negotiation
  bundleRules: {
    allowed: boolean;
    minimumQuantity?: number;
    additionalDiscountPercent?: number;
  };

  // Human approval
  approval: {
    level: ApprovalLevel;
    threshold?: number;
  };

  currency: "INR";
  active: boolean;

  createdAt: string;
  updatedAt: string;
}