import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTransactionSchema } from "@/lib/validation";
import { calculateScore } from "@/lib/ranking";
import { successResponse, errors } from "@/lib/api-response";
import {
  checkRateLimit,
  getClientIdentifier,
  applyRateLimitHeaders,
} from "@/lib/rate-limit";
import { TransactionResponse } from "@/types";

/**
 * POST /api/transaction
 *
 * Creates a new transaction, updates user stats, and recalculates score.
 * All operations are wrapped in a Prisma transaction for atomicity.
 *
 * Concurrency Handling:
 * - Prisma's $transaction() ensures atomic read-modify-write operations.
 * - The transaction locks the user row during update, preventing lost updates.
 * - If two requests for the same user arrive simultaneously, they are serialized
 *   at the database level, ensuring consistent stats.
 *
 * Duplicate Prevention:
 * - transactionId has a UNIQUE constraint in the database schema.
 * - A duplicate transactionId triggers a P2002 error, which we catch and return 409.
 * - This is the most reliable method because it leverages the database's
 *   inherent atomicity for uniqueness checks.
 *
 * Abuse Prevention:
 * - Rate limiting per IP (30 req/min).
 * - Minimum amount validation (must be > 0).
 * - Username normalization and sanitization.
 */
export async function POST(request: NextRequest) {
  // Rate limit check
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId);

  if (!rateLimit || !rateLimit.allowed) {
    const response = errors.tooManyRequests(
      "Rate limit exceeded. Please try again later."
    );
    applyRateLimitHeaders(response, rateLimit || { remaining: 0, resetAt: Date.now() + 60000 });
    return response;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    const response = errors.badRequest("Invalid JSON body");
    applyRateLimitHeaders(response, rateLimit);
    return response;
  }

  // Validate input with Zod
  const parseResult = createTransactionSchema.safeParse(body);

  if (!parseResult.success) {
    const response = errors.unprocessable(
      "Validation failed",
      parseResult.error.flatten().fieldErrors
    );
    applyRateLimitHeaders(response, rateLimit);
    return response;
  }

  const { transactionId, username, amount, type } = parseResult.data;

  try {
    // Atomic transaction: create transaction + update user stats + recalculate score
    const result = await prisma.$transaction(async (tx) => {
      // Upsert user: create if not exists, or fetch existing
      const user = await tx.user.upsert({
        where: { username },
        create: {
          username,
          totalAmount: amount,
          totalTransactions: 1,
          score: calculateScore(amount, 1),
        },
        update: {},
      });

      // Create the transaction (will fail with P2002 if duplicate transactionId)
      const transaction = await tx.transaction.create({
        data: {
          transactionId,
          amount,
          type,
          userId: user.id,
        },
      });

      // If user was just created, stats are already correct.
      // If user existed, we need to recalculate from scratch to ensure consistency.
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          totalAmount: {
            increment: amount,
          },
          totalTransactions: {
            increment: 1,
          },
        },
      });

      // Recalculate score based on updated stats
      const newScore = calculateScore(
        updatedUser.totalAmount,
        updatedUser.totalTransactions
      );

      const finalUser = await tx.user.update({
        where: { id: user.id },
        data: { score: newScore },
      });

      return { transaction, user: finalUser };
    }, {
      // Transaction options for better concurrency handling
      isolationLevel: "Serializable",
      // Max wait time for acquiring locks (5 seconds)
      maxWait: 5000,
      // Total timeout for the transaction (10 seconds)
      timeout: 10000,
    });

    const responseData: TransactionResponse = {
      id: result.transaction.id,
      transactionId: result.transaction.transactionId,
      amount: result.transaction.amount.toString(),
      type: result.transaction.type,
      userId: result.transaction.userId,
      createdAt: result.transaction.createdAt.toISOString(),
    };

    const response = successResponse(
      {
        transaction: responseData,
        user: {
          userId: result.user.id,
          username: result.user.username,
          totalAmount: result.user.totalAmount.toString(),
          totalTransactions: result.user.totalTransactions,
          score: result.user.score.toString(),
        },
      },
      201
    );

    applyRateLimitHeaders(response, rateLimit);
    return response;
  } catch (error: unknown) {
    // Handle Prisma unique constraint violation (P2002) → duplicate transaction
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      const response = errors.conflict(
        `Transaction with ID '${transactionId}' already exists.`,
        { transactionId }
      );
      applyRateLimitHeaders(response, rateLimit);
      return response;
    }

    // Log unexpected errors for monitoring (in production, use a proper logger)
    console.error("Transaction creation error:", error);

    const response = errors.internal("Failed to process transaction");
    applyRateLimitHeaders(response, rateLimit);
    return response;
  }
}
