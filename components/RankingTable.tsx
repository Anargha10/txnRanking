"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowUpDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatting";

interface RankingUser {
  userId: string;
  username: string;
  totalAmount: string;
  totalTransactions: number;
  score: string;
  rank: number;
}

interface RankingData {
  users: RankingUser[];
  total: number;
  limit: number;
  offset: number;
}

interface ApiResponse {
  success: boolean;
  data?: RankingData;
  error?: {
    code: string;
    message: string;
  };
}

export default function RankingTable() {
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchRankings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  const fetchRankings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/ranking?limit=${limit}&offset=${offset}`
      );
      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error?.message || "Failed to load rankings");
      }
    } catch {
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;
  const currentPage = data ? Math.floor(data.offset / limit) + 1 : 0;

  const canGoPrevious = offset > 0;
  const canGoNext = data ? offset + limit < data.total : false;

  const handlePrevious = () => {
    if (canGoPrevious) {
      setOffset((prev) => Math.max(0, prev - limit));
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      setOffset((prev) => prev + limit);
    }
  };

  if (loading) {
    return (
      <div className="card max-w-4xl mx-auto flex items-center justify-center py-16">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Loading rankings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card max-w-4xl mx-auto">
        <div className="flex items-center gap-3 text-danger-600 bg-danger-50 p-4 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.users.length === 0) {
    return (
      <div className="card max-w-4xl mx-auto text-center py-12">
        <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-900">
          No rankings yet
        </p>
        <p className="text-sm text-slate-500 mt-1">
          Submit a transaction to appear on the leaderboard.
        </p>
      </div>
    );
  }

  return (
    <div className="card max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-warning-500" />
            Leaderboard
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {data.total} users ranked by fair scoring algorithm
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ArrowUpDown className="w-4 h-4" />
          Sorted by score
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rank
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                User
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Transactions
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.users.map((user) => (
              <tr
                key={user.userId}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="py-3 px-4">
                  <RankBadge rank={user.rank} />
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {user.username}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {user.userId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm font-medium text-slate-700">
                    {formatCurrency(user.totalAmount)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm text-slate-600">
                    {user.totalTransactions}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp className="w-4 h-4 text-success-500" />
                    <span className="text-sm font-bold text-slate-900">
                      {parseFloat(user.score).toFixed(2)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className="btn-secondary px-3 py-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className="btn-secondary px-3 py-2"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center gap-1">
        <Medal className="w-5 h-5 text-warning-400" />
        <span className="text-sm font-bold text-warning-600">1</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center gap-1">
        <Medal className="w-5 h-5 text-slate-400" />
        <span className="text-sm font-bold text-slate-600">2</span>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center gap-1">
        <Medal className="w-5 h-5 text-amber-700" />
        <span className="text-sm font-bold text-amber-700">3</span>
      </div>
    );
  }
  return (
    <span className="text-sm font-medium text-slate-500 ml-1">#{rank}</span>
  );
}
