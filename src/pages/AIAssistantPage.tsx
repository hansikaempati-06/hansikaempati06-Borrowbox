import { useState } from "react";
import type { Resource, AIRecommendation } from "@/types";
import { getAIRecommendations, fetchResources } from "@/services/resources";
import { Spinner, showToast, Badge, EmptyState, ErrorState } from "@/components/ui";
import { BorrowModal } from "@/components/BorrowModal";
import { getCategoryIcon, getCategoryColor } from "@/components/ResourceCard";
import { Bot, Sparkles, Send, CheckCircle2, Lightbulb } from "lucide-react";

const EXAMPLE_QUERIES = [
  "I am preparing for my DBMS exam and need study materials.",
  "I am learning Java programming and need a resource that can help me practice.",
  "I need an electronic device for a college presentation.",
  "I need something for engineering drawing class.",
];

export function AIAssistantPage() {
  const [requirement, setRequirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [aiMessage, setAiMessage] = useState<string>("");
  const [lastQuery, setLastQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [borrowTarget, setBorrowTarget] = useState<Resource | null>(null);

  const handleAsk = async () => {
    if (!requirement.trim()) {
      showToast("Please describe what you need.", "info");
      return;
    }

    setLoading(true);
    setError(null);
    setRecommendations([]);
    setAiMessage("");
    setHasSearched(true);

    try {
      const result = await getAIRecommendations(requirement.trim());
      setRecommendations(result.recommendations);
      setAiMessage(result.message);
      setLastQuery(requirement.trim());
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI request failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const useExample = (query: string) => {
    setRequirement(query);
  };

  // Borrow directly from AI recommendation card
  const handleBorrowFromAI = async (rec: AIRecommendation) => {
    // Fetch the full resource to pass to the modal
    try {
      const all = await fetchResources();
      const resource = all.find((r) => r.id === rec.resource_id);
      if (!resource) {
        showToast("This resource is no longer available.", "error");
        return;
      }
      if (resource.availability_status !== "Available") {
        showToast("This resource was just borrowed by someone else.", "error");
        return;
      }
      setBorrowTarget(resource);
    } catch {
      showToast("Failed to load resource details.", "error");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-700 mb-3">
          <Bot className="w-4 h-4" /> BorrowBox AI Assistant
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ask AI for Recommendations</h1>
        <p className="mt-1 text-gray-500">
          Describe what you need in plain English — AI will recommend resources currently available on campus.
        </p>
      </div>

      {/* Input section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <textarea
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. I have my DBMS exam next week. I need something useful for preparation."
              rows={3}
              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all resize-none"
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-gray-400">Press Enter to send · Shift+Enter for new line</p>
            <button
              onClick={handleAsk}
              disabled={loading || !requirement.trim()}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
            >
              {loading ? <Spinner size={18} /> : <Send className="w-4 h-4" />}
              {loading ? "AI is thinking..." : "Ask AI"}
            </button>
          </div>
        </div>

        {/* Example queries */}
        {!hasSearched && !loading && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-2.5 inline-flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" /> Try these examples:
            </p>
            <div className="flex flex-col gap-2">
              {EXAMPLE_QUERIES.map((query) => (
                <button
                  key={query}
                  onClick={() => useExample(query)}
                  className="text-left px-4 py-2.5 text-sm text-gray-600 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg border border-gray-100 hover:border-emerald-100 transition-all"
                >
                  "{query}"
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-2 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-800">AI is analyzing available resources...</p>
            <p className="text-sm text-gray-400 mt-1">Matching your requirements with campus inventory</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <ErrorState message={error} onRetry={handleAsk} />
      )}

      {/* Results */}
      {!loading && !error && hasSearched && (
        <div className="space-y-4">
          {/* User's original question */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-400 mb-1">Your question:</p>
            <p className="text-sm text-gray-700 italic">"{lastQuery}"</p>
          </div>

          {/* AI message */}
          <div className="flex items-start gap-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Recommended by BorrowBox AI</p>
              <p className="text-sm text-gray-700 mt-1">{aiMessage}</p>
            </div>
          </div>

          {/* Recommendation cards */}
          {recommendations.length === 0 ? (
            <EmptyState
              icon={<Bot className="w-16 h-16" />}
              title="No matching resources found"
              message="Try rephrasing your requirement, or browse all resources manually."
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {recommendations.map((rec) => {
                const Icon = getCategoryIcon(rec.resource?.category || "Other");
                const isAvailable = true; // AI only returns available resources

                return (
                  <div
                    key={rec.resource_id}
                    className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="px-5 pt-4 pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border ${getCategoryColor(
                            rec.resource?.category || "Other"
                          )}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <Badge variant="success">
                          <CheckCircle2 className="w-3 h-3" /> Available
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-gray-900">{rec.resource?.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{rec.resource?.category} · {rec.resource?.condition}</p>
                      <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{rec.resource?.description}</p>

                      {/* AI reason */}
                      <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                        <p className="text-xs font-semibold text-emerald-700 mb-0.5 inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI Reason
                        </p>
                        <p className="text-sm text-gray-600">{rec.reason}</p>
                      </div>
                    </div>

                    <div className="px-5 pb-4 pt-2 border-t border-gray-100">
                      {isAvailable && (
                        <button
                          onClick={() => handleBorrowFromAI(rec)}
                          className="w-full px-4 py-2 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 active:scale-[0.98] transition-all"
                        >
                          Borrow This Resource
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Borrow modal */}
      {borrowTarget && (
        <BorrowModal
          resource={borrowTarget}
          onClose={() => setBorrowTarget(null)}
          onBorrowed={handleAsk}
        />
      )}

    </div>
  );
}
