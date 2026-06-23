import { z } from "zod";

// Transaction type enum for validation
export const TransactionType = {
  PURCHASE: "purchase",
  DEPOSIT: "deposit",
  TRANSFER: "transfer",
  WITHDRAWAL: "withdrawal",
} as const;

export const transactionTypes = [
  TransactionType.PURCHASE,
  TransactionType.DEPOSIT,
  TransactionType.TRANSFER,
  TransactionType.WITHDRAWAL,
] as const;

/**
 * Transaction creation schema
 * Validates incoming transaction data with strict rules
 */
export const createTransactionSchema = z.object({
  transactionId: z
    .string()
    .min(3, "Transaction ID must be at least 3 characters")
    .max(128, "Transaction ID must be at most 128 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Transaction ID must be alphanumeric with underscores and hyphens only"
    ),
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(50, "Username must be at most 50 characters")
    .trim()
    .toLowerCase(),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .finite("Amount must be a finite number")
    .max(999999999.99, "Amount exceeds maximum allowed value"),
  type: z.enum(transactionTypes, {
    errorMap: () => ({
      message: `Type must be one of: ${transactionTypes.join(", ")}`,
    }),
  }),
});

/**
 * User ID parameter schema for summary route
 */
export const userIdParamSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
});

/**
 * Query parameter schema for ranking (optional pagination/filter)
 */
export const rankingQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(50),
  offset: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type RankingQueryInput = z.infer<typeof rankingQuerySchema>;
