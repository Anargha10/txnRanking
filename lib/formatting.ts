// Client-safe formatting utilities
// These do NOT import Prisma and can be used in both server and client components

export function formatScore(score: number | string): string {
  const val = typeof score === "string" ? parseFloat(score) : score;
  if (isNaN(val)) return "0.00";
  return val.toFixed(2);
}

export function formatCurrency(amount: number | string): string {
  const val = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(val)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(val);
}
