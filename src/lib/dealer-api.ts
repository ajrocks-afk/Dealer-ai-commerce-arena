// src/lib/dealer-api.ts
import type {
  NegotiationInsight,
} from "@/models/negotiation-insight";

import type {
  HumanApprovalRequest,
} from "@/models/human-approval";

export interface CreateDealInput {
  productId: string;
  merchantId: string;
  buyerId: string;
  initialPrice: number;
  currency?: string;
  maxRounds?: number;
}

export interface DealSession {
  id: string;
  productId: string;
  merchantId: string;
  buyerId: string;
  state: string;
  currentRound: number;
  maxRounds: number;
  currency: string;
  initialPrice: number;
  currentPrice: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface CreateDealResponse {
  success: boolean;
  session?: DealSession;
  error?: string;
}

export interface GetDealResponse {
  success: boolean;
  session?: DealSession;
  error?: string;
}

export interface HumanApprovalResponse {
  success: boolean;
  session?: DealSession;
  approval?: HumanApprovalRequest | null;
  error?: string;
}

export interface ReviewHumanApprovalInput {
  decision: "APPROVE" | "REJECT";
  reviewerId: string;
  reason?: string;
}

export interface SubmitDecisionInput {
  agent: "BUYER_AGENT" | "MERCHANT_AGENT";
  decision:
    | "MAKE_OFFER"
    | "ACCEPT"
    | "REJECT"
    | "COUNTER"
    | "STOP";
  reasoning: string;
  offerPrice?: number;
  quantity?: number;
  offer?: {
    id?: string;
    price: number;
    quantity: number;
    round?: number;
    createdAt?: string;
    expiresAt?: string;
  };
  product?: unknown;
  policy?: unknown;
}

export interface SubmitDecisionResponse {
  success: boolean;
  action?: string;
  session?: DealSession;
  offer?: {
    id: string;
    dealSessionId: string;
    actor: string;
    price: number;
    quantity: number;
    currency: string;
    status: string;
    round: number;
    createdAt: string;
    expiresAt?: string;
  };
  negotiationResult?: unknown;
  insight?: NegotiationInsight;
  errors?: string[];
  error?: string;
}

async function parseResponse<T>(
  response: Response
): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!data) {
    throw new Error(
      `Server returned an invalid response (${response.status})`
    );
  }

  return data as T;
}

export async function createDeal(
  input: CreateDealInput
): Promise<CreateDealResponse> {
  const response = await fetch("/api/deals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...input,
      currency: input.currency ?? "INR",
      maxRounds: input.maxRounds ?? 5,
    }),
  });

  return parseResponse<CreateDealResponse>(
    response
  );
}

export async function getDeal(
  dealId: string
): Promise<GetDealResponse> {
  const response = await fetch(
    `/api/deals/${encodeURIComponent(dealId)}`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  return parseResponse<GetDealResponse>(
    response
  );
}

export async function submitDecision(
  dealId: string,
  input: SubmitDecisionInput
): Promise<SubmitDecisionResponse> {
  const response = await fetch(
    `/api/deals/${encodeURIComponent(
      dealId
    )}/decision`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  );

  return parseResponse<SubmitDecisionResponse>(
    response
  );
}

export interface AutonomousNegotiationResponse {
  success: boolean;
  session?: DealSession;
  offers?: SubmitDecisionResponse["offer"][];
  decisions?: Array<{
    agent: string;
    decision: string;
    offerPrice?: number;
    quantity?: number;
    reasoning: string;
  }>;
  errors?: string[];
  error?: string;
}

export interface RazorpayOrder {
  id: string;
  dealSessionId: string;
  razorpayOrderId: string;
  amount: number;
  currency: "INR";
  status: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  session?: DealSession;
  order?: RazorpayOrder;
  keyId?: string;
  error?: string;
  errors?: string[];
}

export interface VerifyPaymentResponse {
  success: boolean;
  session?: DealSession;
  order?: RazorpayOrder;
  error?: string;
  errors?: string[];
}

export async function runAutonomousNegotiation(
  dealId: string
): Promise<AutonomousNegotiationResponse> {
  const response = await fetch(
    `/api/deals/${encodeURIComponent(dealId)}/negotiate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  );

  return parseResponse<AutonomousNegotiationResponse>(response);
}

export async function createPaymentOrder(
  dealId: string
): Promise<CreatePaymentResponse> {
  const response = await fetch(
    `/api/deals/${encodeURIComponent(dealId)}/payment`,
    { method: "POST" }
  );

  return parseResponse<CreatePaymentResponse>(response);
}

export async function verifyPayment(
  dealId: string,
  input: {
    orderId: string;
    paymentId: string;
    signature: string;
  }
): Promise<VerifyPaymentResponse> {
  const response = await fetch(
    `/api/deals/${encodeURIComponent(dealId)}/payment/verify`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  );

  return parseResponse<VerifyPaymentResponse>(response);
}

export async function getHumanApproval(
  dealId: string
): Promise<HumanApprovalResponse> {
  const response = await fetch(
    `/api/deals/${dealId}/approval`,
    {
      method: "GET",
      cache: "no-store",
    }
  );

  const data =
    (await response.json()) as HumanApprovalResponse;

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Failed to retrieve human approval."
    );
  }

  return data;
}

export async function reviewHumanApproval(
  dealId: string,
  input: ReviewHumanApprovalInput
): Promise<HumanApprovalResponse> {
  const response = await fetch(
    `/api/deals/${dealId}/approval`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  );

  const data =
    (await response.json()) as HumanApprovalResponse;

  if (!response.ok) {
    throw new Error(
      data.error ??
        "Failed to process human approval."
    );
  }

  return data;
}