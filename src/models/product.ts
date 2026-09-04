export type ProductStatus = "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK";

export interface Product {
  id: string;

  name: string;
  description: string;
  category: string;

  // Money is always stored in the smallest currency unit.
  // Example: ₹49,999 = 4999900 paise.
  currency: "INR";
  price: number;

  inventory: {
    available: number;
    reserved: number;
  };

  status: ProductStatus;

  merchantId: string;

  createdAt: string;
  updatedAt: string;
}