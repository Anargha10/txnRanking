import TransactionForm from "@/components/TransactionForm";
import { ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Transaction{" "}
          <span className="text-primary-600">Ranking System</span>
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          A production-grade platform for processing transactions, calculating
          fair scores, and ranking users with atomic concurrency guarantees.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/ranking"
            className="btn-primary inline-flex items-center gap-2"
          >
            View Leaderboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/summary" className="btn-secondary">
            Check Your Stats
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        <FeatureCard
          icon={<Shield className="w-6 h-6 text-primary-600" />}
          title="Duplicate Prevention"
          description="Unique transaction IDs enforced at the database level with 409 Conflict responses."
        />
        <FeatureCard
          icon={<Zap className="w-6 h-6 text-warning-500" />}
          title="Atomic Concurrency"
          description="Serializable Prisma transactions ensure consistent stats even under high load."
        />
        <FeatureCard
          icon={<BarChart3 className="w-6 h-6 text-success-600" />}
          title="Fair Ranking"
          description="Logarithmic volume scoring with activity caps prevents abuse and manipulation."
        />
      </div>

      {/* Transaction Form */}
      <TransactionForm />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card text-center hover:border-primary-300 transition-all">
      <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}
