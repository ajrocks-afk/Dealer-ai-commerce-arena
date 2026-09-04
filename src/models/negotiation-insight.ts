export type NegotiationInsightActor =
  | "BUYER_AGENT"
  | "MERCHANT_AGENT";

export type NegotiationInsightAction =
  | "MAKE_OFFER"
  | "COUNTER"
  | "ACCEPT"
  | "REJECT"
  | "STOP";

export type NegotiationInsightSeverity =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "BLOCKED";

export interface NegotiationInsight {
  actor: NegotiationInsightActor;

  action: NegotiationInsightAction;

  severity: NegotiationInsightSeverity;

  title: string;

  summary: string;

  facts: string[];

  price?: {
    proposed?: number;
    current: number;
    initial: number;
    policyFloor: number;
    currency: string;
  };

  round: {
    current: number;
    maximum: number;
  };

  policy: {
    evaluated: boolean;
    allowed: boolean;
    reason?: string;
  };

  generatedAt: string;
}