import { Decimal } from "@prisma/client/runtime/library";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface TransactionResponse {
  id: string;
  transactionId: string;
  amount: string;
  type: string;
  userId: string;
  createdAt: string;
}

export interface UserSummaryResponse {
  userId: string;
  username: string;
  totalAmount: string;
  totalTransactions: number;
  score: string;
  rank?: number;
}

export interface RankingUser {
  userId: string;
  username: string;
  totalAmount: string;
  totalTransactions: number;
  score: string;
  rank: number;
}

export interface RankingResponse {
  users: RankingUser[];
  total: number;
  limit: number;
  offset: number;
}
