import { useEffect, useState } from "react";
import {
  Boxes,
  Package,
  CheckCircle2,
  ArrowRightLeft,
  Bot,
  PlusCircle,
  LayoutGrid,
  Search,
  History,
  ShieldCheck,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import type { PageId } from "@/components/Navbar";
import { fetchStats, fetchHistoryCount } from "@/services/resources";
import { Spinner } from "@/components/ui";

interface HomePageProps {
  onNavigate: (page: PageId) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [stats, setStats] = useState<{ total: number; available: number; borrowed: number } | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, h] = await Promise.all([fetchStats(), fetchHistoryCount()]);
        setStats(s);
        setHistoryCount(h);
      } catch {
        setStats({ total: 0, available: 0, borrowed: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statCards = [
    { label: "Total Resources", value: stats?.total ?? 0, icon: Package, color: "from-blue-500 to-blue-600", bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Available Now", value: stats?.available ?? 0, icon: CheckCircle2, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Currently Borrowed", value: stats?.borrowed ?? 0, icon: ArrowRightLeft, color: "from-amber-500 to-amber-600", bg: "bg-amber-50", text: "text-amber-600" },
    { label: "Total Transactions", value: historyCount, icon: History, color: "from-teal-500 to-teal-600", bg: "bg-teal-50", text: "text-teal-600" },
  ];

  const features = [
    {
      icon: Search,
      title: "Search & Filter",
      description: "Find resources by name, category, or availability in seconds.",
      page: "browse" as PageId,
    },
    {
      icon: Bot,
      title: "AI Assistant",
      description: "Describe what you need in plain English — AI recommends the right resources.",
      page: "ai" as PageId,
    },
    {
      icon: PlusCircle,
      title: "List a Resource",
      description: "Own something others could borrow? Add it with AI-powered categorization.",
      page: "add" as PageId,
    },
  ];

  const steps = [
    { num: "1", title: "Browse", description: "Explore available resources on campus" },
    { num: "2", title: "Borrow", description: "Reserve what you need with a return date" },
    { num: "3", title: "Use & Return", description: "Return when done — it becomes available again" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
              <Boxes className="w-4 h-4 text-emerald-400" />
              GenAI-Powered Campus Resource Sharing
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Borrow what you need.<br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Share what you have.
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-300 leading-relaxed max-w-xl">
              BorrowBox connects students to share textbooks, calculators, electronics, lab equipment, and more — powered by AI recommendations.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate("browse")}
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <LayoutGrid className="w-5 h-5" /> Browse Resources
              </button>
              <button
                onClick={() => onNavigate("add")}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <PlusCircle className="w-5 h-5" /> Add Resource
              </button>
              <button
                onClick={() => onNavigate("ai")}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <Bot className="w-5 h-5" /> Ask AI
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.text} flex items-center justify-center`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div>
                  {loading ? (
                    <Spinner size={20} />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 leading-none">{card.value}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How BorrowBox Works</h2>
          <p className="mt-2 text-gray-500">Three simple steps to start sharing resources on campus</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.num} className="relative rounded-2xl border border-gray-200 bg-white p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold mb-4">
                {step.num}
              </div>
              <h3 className="font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What You Can Do</h2>
          <p className="mt-2 text-gray-500">Everything you need to find and share campus resources</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <button
              key={feature.title}
              onClick={() => onNavigate(feature.page)}
              className="group text-left rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg hover:border-emerald-200 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 group-hover:gap-2 transition-all">
                Get started <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 sm:p-12 text-white text-center overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.1),transparent_70%)]" />
          <div className="relative">
            <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl sm:text-3xl font-bold">Have resources others could use?</h2>
            <p className="mt-2 text-emerald-50 max-w-xl mx-auto">
              List your textbooks, equipment, and materials so fellow students can find and borrow them.
            </p>
            <button
              onClick={() => onNavigate("add")}
              className="mt-6 px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors inline-flex items-center gap-2"
            >
              <PlusCircle className="w-5 h-5" /> Add a Resource Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-gray-900">BorrowBox</span>
            <span className="text-sm text-gray-400">— Campus Resource Sharing</span>
          </div>
          <p className="text-sm text-gray-400 inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> College Mini Project · GenAI Powered
          </p>
        </div>
      </footer>
    </div>
  );
}
