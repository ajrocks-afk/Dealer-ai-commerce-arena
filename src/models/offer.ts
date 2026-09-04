export type OfferActor =
  | "BUYER_AGENT"
  | "MERCHANT_AGENT";

export type OfferStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "COUNTERED"
  | "EXPIRED";

export interface Offer {
  id: string;

  dealSessionId: string;

  actor: OfferActor;

  price: number;

  quantity: number;

  currency: "INR";

  status: OfferStatus;

  round: number;

  createdAt: string;

  expiresAt?: string;
}