import type { Product } from "@/models/product";

export function validateProduct(product: Product): string[] {
  const errors: string[] = [];

  if (!product.id.trim()) {
    errors.push("Product ID is required.");
  }

  if (!product.name.trim()) {
    errors.push("Product name is required.");
  }

  if (!product.description.trim()) {
    errors.push("Product description is required.");
  }

  if (!product.category.trim()) {
    errors.push("Product category is required.");
  }

  if (!product.merchantId.trim()) {
    errors.push("Merchant ID is required.");
  }

  if (product.price <= 0) {
    errors.push("Product price must be greater than zero.");
  }

  if (!Number.isSafeInteger(product.price)) {
    errors.push("Product price must be represented as an integer.");
  }

  if (product.inventory.available < 0) {
    errors.push("Available inventory cannot be negative.");
  }

  if (product.inventory.reserved < 0) {
    errors.push("Reserved inventory cannot be negative.");
  }

  if (!Number.isInteger(product.inventory.available)) {
    errors.push("Available inventory must be an integer.");
  }

  if (!Number.isInteger(product.inventory.reserved)) {
    errors.push("Reserved inventory must be an integer.");
  }

  if (product.inventory.reserved > product.inventory.available) {
    errors.push(
      "Reserved inventory cannot exceed available inventory."
    );
  }

  if (product.currency !== "INR") {
    errors.push("Only INR is currently supported.");
  }

  const validStatuses = [
    "ACTIVE",
    "INACTIVE",
    "OUT_OF_STOCK",
  ] as const;

  if (!validStatuses.includes(product.status)) {
    errors.push("Invalid product status.");
  }

  return errors;
}

export function isValidProduct(product: Product): boolean {
  return validateProduct(product).length === 0;
}