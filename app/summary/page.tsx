import UserSummary from "@/components/UserSummary";

export const metadata = {
  title: "User Summary | Transaction Ranking System",
  description: "Look up user transaction stats and current rank.",
};

export default function SummaryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">User Summary</h1>
        <p className="text-slate-500 mt-2">
          Enter a user ID to view their transaction history, total amount, and ranking.
        </p>
      </div>
      <UserSummary />
    </div>
  );
}
