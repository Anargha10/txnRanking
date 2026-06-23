import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { userIdParamSchema } from "@/lib/validation";
import { successResponse, errors } from "@/lib/api-response";
import {
  checkRateLimit,
  getClientIdentifier,
  applyRateLimitHeaders,
} from "@/lib/rate-limit";
import { UserSummaryResponse } from "@/types";

/**
 * GET /api/summary/:userId
 *
 * Returns user summary including total amount, transaction count, and score.
 * Also includes the user's current rank on the leaderboard.
 *
 * Supports lookup by UUID (userId) OR by username as a fallback.
 * This is a UX improvement so users don't need to copy-paste UUIDs.
 *
 * Rate limited to prevent abuse.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

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

  try {
    let user = null;
    const isUuid = userIdParamSchema.safeParse({ userId }).success;

    if (isUuid) {
      // Try to find by UUID first
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
    }

    // If not found by UUID (or not a UUID), try username lookup
    if (!user) {
      user = await prisma.user.findUnique({
        where: { username: userId.toLowerCase().trim() },
      });
    }

    if (!user) {
      const response = errors.notFound(
        `User with ID or username '${userId}' not found`
      );
      applyRateLimitHeaders(response, rateLimit);
      return response;
    }

    // Calculate rank: count users with strictly higher score
    const higherRankedCount = await prisma.user.count({
      where: {
        score: {
          gt: user.score,
        },
      },
    });

    const rank = higherRankedCount + 1;

    const responseData: UserSummaryResponse = {
      userId: user.id,
      username: user.username,
      totalAmount: user.totalAmount.toString(),
      totalTransactions: user.totalTransactions,
      score: user.score.toString(),
      rank,
    };

    const response = successResponse(responseData);
    applyRateLimitHeaders(response, rateLimit);
    return response;
  } catch (error: unknown) {
    console.error("Summary fetch error:", error);
    const response = errors.internal("Failed to fetch user summary");
    applyRateLimitHeaders(response, rateLimit);
    return response;
  }
}
