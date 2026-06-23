import RankingTable from "@/components/RankingTable";

export const metadata = {
  title: "Leaderboard | Transaction Ranking System",
  description: "View the top ranked users by fair scoring algorithm.",
};

export default function RankingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
        <p className="text-slate-500 mt-2">
          Users are ranked by a composite score combining transaction volume and activity.
        </p>
      </div>
      <RankingTable />
    </div>
  );
}
