export type Money = number;

/**
 * Convert rupees to paise.
 *
 * Example:
 * ₹49,999 → 4,999,900 paise
 */
export function rupeesToPaise(rupees: number): Money {
  if (!Number.isFinite(rupees)) {
    throw new Error("Invalid rupee amount.");
  }

  if (rupees < 0) {
    throw new Error("Money amount cannot be negative.");
  }

  return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees.
 *
 * Example:
 * 4,999,900 → ₹49,999
 */
export function paiseToRupees(paise: Money): number {
  if (!Number.isSafeInteger(paise)) {
    throw new Error("Paise must be a safe integer.");
  }

  if (paise < 0) {
    throw new Error("Money amount cannot be negative.");
  }

  return paise / 100;
}

/**
 * Add two money values.
 */
export function addMoney(a: Money, b: Money): Money {
  return a + b;
}

/**
 * Subtract money.
 *
 * Result cannot be negative.
 */
export function subtractMoney(a: Money, b: Money): Money {
  const result = a - b;

  if (result < 0) {
    throw new Error("Money result cannot be negative.");
  }

  return result;
}

/**
 * Calculate a percentage of a money value.
 *
 * Example:
 * percentageOf(5000000, 10) → 500000
 */
export function percentageOf(
  amount: Money,
  percentage: number
): Money {
  if (!Number.isFinite(percentage) || percentage < 0) {
    throw new Error("Invalid percentage.");
  }

  return Math.round((amount * percentage) / 100);
}

/**
 * Apply a percentage discount.
 *
 * Example:
 * ₹50,000 with 10% discount → ₹45,000
 */
export function applyDiscount(
  amount: Money,
  discountPercent: number
): Money {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error("Discount must be between 0 and 100.");
  }

  const discount = percentageOf(amount, discountPercent);

  return amount - discount;
}

/**
 * Calculate discount percentage between original and final price.
 */
export function calculateDiscountPercent(
  originalPrice: Money,
  finalPrice: Money
): number {
  if (originalPrice <= 0) {
    throw new Error("Original price must be greater than zero.");
  }

  if (finalPrice < 0) {
    throw new Error("Final price cannot be negative.");
  }

  return ((originalPrice - finalPrice) / originalPrice) * 100;
}

/**
 * Format paise as INR for display.
 *
 * Example:
 * 4999900 → ₹49,999.00
 */
export function formatINR(paise: Money): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(paiseToRupees(paise));
}