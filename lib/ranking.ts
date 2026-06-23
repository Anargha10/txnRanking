import { Decimal } from "@prisma/client/runtime/library";

/**
 * Fair Ranking Algorithm
 *
 * Goals:
 * 1. Transaction volume matters → but not linearly (diminishing returns)
 * 2. Transaction frequency matters → but capped to prevent spam abuse
 * 3. Micro-transaction abuse is prevented
 * 4. Ranking manipulation is discouraged
 *
 * Formula:
 * volumeScore = log10(totalAmount + 1) * 500
 * activityScore = min(totalTransactions, 50) * 15
 * score = volumeScore + activityScore
 */

const VOLUME_MULTIPLIER = 500;
const MAX_TRANSACTIONS_FOR_SCORE = 50;
const ACTIVITY_MULTIPLIER = 15;

export function calculateScore(
  totalAmount: Decimal | number | string,
  totalTransactions: number
): Decimal {
  const amount = new Decimal(totalAmount);

  const volumeScore = new Decimal(
    Math.log10(amount.plus(1).toNumber()) * VOLUME_MULTIPLIER
  );

  const cappedTransactions = Math.min(totalTransactions, MAX_TRANSACTIONS_FOR_SCORE);
  const activityScore = new Decimal(cappedTransactions * ACTIVITY_MULTIPLIER);

  return volumeScore.plus(activityScore);
}

// Server-side formatting helpers using Prisma Decimal
export function formatScoreDecimal(score: Decimal | number | string): string {
  const val = new Decimal(score);
  return val.toFixed(2);
}

export function formatCurrencyDecimal(amount: Decimal | number | string): string {
  const val = new Decimal(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(val.toNumber());
}

