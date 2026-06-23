import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { rankingQuerySchema } from "@/lib/validation";
import { successResponse, errors } from "@/lib/api-response";
import {
  checkRateLimit,
  getClientIdentifier,
  applyRateLimitHeaders,
} from "@/lib/rate-limit";
import { RankingResponse } from "@/types";

/**
 * GET /api/ranking
 *
 * Returns ranked users ordered by score (descending).
 * Supports pagination via limit and offset query parameters.
 *
 * Rate limited to prevent abuse and scraping.
 */
export async function GET(request: NextRequest) {
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

  // Parse and validate query parameters
  const { searchParams } = new URL(request.url);
  const queryParams = {
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
  };

  const parseResult = rankingQuerySchema.safeParse(queryParams);

  if (!parseResult.success) {
    const response = errors.unprocessable(
      "Invalid query parameters",
      parseResult.error.flatten().fieldErrors
    );
    applyRateLimitHeaders(response, rateLimit);
    return response;
  }

  const { limit, offset } = parseResult.data;

  try {
    // Fetch users ordered by score descending, with pagination
    const users = await prisma.user.findMany({
      orderBy: {
        score: "desc",
      },
      skip: offset,
      take: limit,
      select: {
        id: true,
        username: true,
        totalAmount: true,
        totalTransactions: true,
        score: true,
      },
    });

    // Get total count for pagination metadata
    const total = await prisma.user.count();

    // Calculate rank for each user based on score ordering
    // Since we already order by score desc, rank = offset + index + 1
    const rankedUsers = users.map((user, index) => ({
      userId: user.id,
      username: user.username,
      totalAmount: user.totalAmount.toString(),
      totalTransactions: user.totalTransactions,
      score: user.score.toString(),
      rank: offset + index + 1,
    }));

    const responseData: RankingResponse = {
      users: rankedUsers,
      total,
      limit,
      offset,
    };

    const response = successResponse(responseData);
    applyRateLimitHeaders(response, rateLimit);
    return response;
  } catch (error: unknown) {
    console.error("Ranking fetch error:", error);
    const response = errors.internal("Failed to fetch rankings");
    applyRateLimitHeaders(response, rateLimit);
    return response;
  }
}
