"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface TransactionFormData {
  transactionId: string;
  username: string;
  amount: string;
  type: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    transaction: {
      id: string;
      transactionId: string;
      amount: string;
      type: string;
      userId: string;
      createdAt: string;
    };
    user: {
      userId: string;
      username: string;
      totalAmount: string;
      totalTransactions: number;
      score: string;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export default function TransactionForm() {
  const [formData, setFormData] = useState<TransactionFormData>({
    transactionId: "",
    username: "",
    amount: "",
    type: "purchase",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      const data: ApiResponse = await response.json();
      setResult(data);

      if (data.success) {
        // Reset form on success
        setFormData({
          transactionId: "",
          username: "",
          amount: "",
          type: "purchase",
        });
      }
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
        <h2 className="text-xl font-bold text-slate-900">
          Submit Transaction
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Enter transaction details to update the leaderboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="transactionId"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Transaction ID
          </label>
          <input
            id="transactionId"
            name="transactionId"
            type="text"
            required
            placeholder="txn_123456"
            value={formData.transactionId}
            onChange={handleChange}
            className="input-field"
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mt-1">
            Must be unique. Alphanumeric with hyphens and underscores.
          </p>
        </div>

        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            placeholder="johndoe"
            value={formData.username}
            onChange={handleChange}
            className="input-field"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Amount (USD)
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="100.00"
              value={formData.amount}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="type"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
            >
              <option value="purchase">Purchase</option>
              <option value="deposit">Deposit</option>
              <option value="transfer">Transfer</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Transaction
            </>
          )}
        </button>
      </form>

      {/* Result Display */}
      {result && (
        <div className="mt-6 animate-slide-up">
          {result.success ? (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-success-800">
                    Transaction Successful
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-success-700">
                    <p>
                      <span className="font-medium">Transaction ID:</span>{" "}
                      {result.data?.transaction.transactionId}
                    </p>
                    <p>
                      <span className="font-medium">Amount:</span> ${" "}
                      {parseFloat(
                        result.data?.transaction.amount || "0"
                      ).toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium">User:</span>{" "}
                      {result.data?.user.username}
                    </p>
                    <p>
                      <span className="font-medium">New Score:</span>{" "}
                      {parseFloat(result.data?.user.score || "0").toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium">Total Transactions:</span>{" "}
                      {result.data?.user.totalTransactions}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-danger-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-danger-800">
                    Error
                  </p>
                  <p className="text-sm text-danger-700 mt-1">
                    {result.error?.message || "An unexpected error occurred."}
                  </p>
                  {result.error?.code === "CONFLICT" && (
                    <p className="text-xs text-danger-600 mt-2">
                      This transaction ID has already been used. Please use a unique ID.
                    </p>
                  )}
                  {result.error?.code === "UNPROCESSABLE_ENTITY" && (
                    <p className="text-xs text-danger-600 mt-2">
                      Please check your input values and try again.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
