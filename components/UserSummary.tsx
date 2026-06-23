"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, UserCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatting";

interface UserSummary {
  userId: string;
  username: string;
  totalAmount: string;
  totalTransactions: number;
  score: string;
  rank?: number;
}

interface ApiResponse {
  success: boolean;
  data?: UserSummary;
  error?: {
    code: string;
    message: string;
  };
}

export default function UserSummary() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/summary/${encodeURIComponent(userId.trim())}`);
      const data: ApiResponse = await response.json();
      setResult(data);
    } catch {
      setResult({
        success: false,
        error: {
          code: "CLIENT_ERROR",
          message: "Failed to connect to the server. Please try again.",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">User Summary</h2>
        <p className="text-sm text-slate-500 mt-1">
          Look up a user&apos;s transaction stats and current rank. You can search by <strong>username</strong> or <strong>User ID</strong>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Enter username or User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input-field pl-10"
            disabled={loading}
          />
          <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
        <button
          type="submit"
          disabled={loading || !userId.trim()}
          className="btn-primary"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>
      </form>

      {/* Result */}
      {result && (
        <div className="mt-6 animate-slide-up">
          {result.success && result.data ? (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-primary-50 px-4 py-3 border-b border-primary-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      {result.data.username}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {result.data.userId}
                    </p>
                  </div>
                  {result.data.rank && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-700">
                        #{result.data.rank}
                      </p>
                      <p className="text-xs text-slate-500">Current Rank</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 grid grid-cols-3 gap-4">
                <StatCard
                  label="Total Amount"
                  value={formatCurrency(result.data.totalAmount)}
                  accent="primary"
                />
                <StatCard
                  label="Transactions"
                  value={String(result.data.totalTransactions)}
                  accent="success"
                />
                <StatCard
                  label="Score"
                  value={parseFloat(result.data.score).toFixed(2)}
                  accent="warning"
                />
              </div>
            </div>
          ) : (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-danger-800">Error</p>
                <p className="text-sm text-danger-700 mt-1">
                  {result.error?.message || "User not found."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "primary" | "success" | "warning";
}) {
  const accentClasses = {
    primary: "text-primary-700 bg-primary-50",
    success: "text-success-700 bg-success-50",
    warning: "text-warning-700 bg-warning-50",
  };

  return (
    <div className={`rounded-lg p-3 text-center ${accentClasses[accent]}`}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}
