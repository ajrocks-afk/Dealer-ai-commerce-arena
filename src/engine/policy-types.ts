import type { MerchantPolicy } from "@/models/merchant-policy";
import type { Offer } from "@/models/offer";
import type { Product } from "@/models/product";

export type PolicyDecision =
  | "ALLOW"
  | "REJECT"
  | "REQUIRE_HUMAN_APPROVAL";

export type PolicyViolationCode =
  | "MINIMUM_SELLING_PRICE"
  | "MAXIMUM_DISCOUNT"
  | "MINIMUM_MARGIN"
  | "MAX_NEGOTIATION_ROUNDS"
  | "BUNDLE_NOT_ALLOWED"
  | "BUNDLE_QUANTITY_NOT_MET"
  | "BUNDLE_DISCOUNT_EXCEEDED"
  | "HUMAN_APPROVAL_REQUIRED";

export interface PolicyViolation {
  code: PolicyViolationCode;
  message: string;
  severity: "ERROR" | "WARNING";
}

export interface PolicyEvaluation {
  decision: PolicyDecision;

  passed: boolean;

  violations: PolicyViolation[];

  evaluatedAt: string;

  offerId: string;

  dealSessionId: string;
}

export interface PolicyEvaluationContext {
  product: Product;

  policy: MerchantPolicy;

  offer: Offer;

  currentRound: number;
}