/** Money/format helpers (INR). Amounts are whole rupees from the API. */

/** e.g. 5000 -> "₹5,000" (Indian digit grouping). */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** e.g. 5900 -> "₹5900.00" (matches the payment-gateway display). */
export function formatINRDecimal(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

/** Slugify free text into a URL-safe code: lowercase, hyphenated. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Lenient client-side email check (the backend re-validates). */
export function isValidEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());
}
