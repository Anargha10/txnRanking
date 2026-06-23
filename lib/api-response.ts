/**
 * Standardized API response helpers
 * Ensures consistent response format across all API routes
 */

import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";

export function successResponse<T>(
  data: T,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status: number = 500,
  details?: unknown
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

// Common error responses
export const errors = {
  badRequest: (message: string, details?: unknown) =>
    errorResponse("BAD_REQUEST", message, 400, details),
  unprocessable: (message: string, details?: unknown) =>
    errorResponse("UNPROCESSABLE_ENTITY", message, 422, details),
  conflict: (message: string, details?: unknown) =>
    errorResponse("CONFLICT", message, 409, details),
  notFound: (message: string) => errorResponse("NOT_FOUND", message, 404),
  internal: (message: string = "Internal server error") =>
    errorResponse("INTERNAL_SERVER_ERROR", message, 500),
  tooManyRequests: (message: string = "Too many requests") =>
    errorResponse("TOO_MANY_REQUESTS", message, 429),
} as const;
