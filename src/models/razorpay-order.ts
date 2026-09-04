export type RazorpayOrderStatus =
  | "CREATED"
  | "ATTEMPTED"
  | "PAID"
  | "FAILED"
  | "CANCELLED";

export interface RazorpayOrder {
  id: string;

  dealSessionId: string;

  razorpayOrderId: string;

  amount: number;

  currency: "INR";

  status: RazorpayOrderStatus;

  paymentId?: string;

  createdAt: string;
  updatedAt: string;
}