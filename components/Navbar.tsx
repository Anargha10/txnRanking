import Link from "next/link";
import { Trophy, Home, BarChart3, UserCircle } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900 group-hover:text-primary-700 transition-colors">
                RankSystem
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <NavLink href="/" icon={<Home className="w-4 h-4" />} label="Home" />
            <NavLink
              href="/summary"
              icon={<UserCircle className="w-4 h-4" />}
              label="Summary"
            />
            <NavLink
              href="/ranking"
              icon={<BarChart3 className="w-4 h-4" />}
              label="Ranking"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-primary-700 hover:bg-primary-50 transition-colors"
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
