import { useEffect, useState, useMemo, useCallback } from "react";
import type { Resource } from "@/types";
import { CATEGORIES, AVAILABILITY_STATUSES } from "@/types";
import { fetchResources, returnResource } from "@/services/resources";
import { ResourceCard } from "@/components/ResourceCard";
import { BorrowModal } from "@/components/BorrowModal";
import { Spinner, EmptyState, ErrorState, showToast } from "@/components/ui";
import { Search, SlidersHorizontal, X, PackageSearch, ArrowRightLeft } from "lucide-react";

type SortKey = "newest" | "name" | "category";

export function BrowsePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [borrowTarget, setBorrowTarget] = useState<Resource | null>(null);
  const [returning, setReturning] = useState(false);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchResources();
      setResources(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load resources.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const filtered = useMemo(() => {
    let result = [...resources];

    // Search by name and description
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((r) => r.category === categoryFilter);
    }

    // Availability filter
    if (availabilityFilter !== "all") {
      result = result.filter((r) => r.availability_status === availabilityFilter);
    }

    // Sorting
    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "category") {
      result.sort((a, b) => a.category.localeCompare(b.category));
    } else {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return result;
  }, [resources, searchQuery, categoryFilter, availabilityFilter, sortBy]);

  const handleBorrow = (resource: Resource) => {
    setBorrowTarget(resource);
  };

  const handleReturn = async (resource: Resource) => {
    setReturning(true);
    try {
      await returnResource(resource.id);
      showToast(`"${resource.name}" has been returned successfully.`, "success");
      await loadResources();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to return resource.";
      showToast(message, "error");
    } finally {
      setReturning(false);
    }
  };

  const hasFilters = searchQuery || categoryFilter !== "all" || availabilityFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setAvailabilityFilter("all");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Browse Resources</h1>
        <p className="mt-1 text-gray-500">Find and borrow resources available on campus</p>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or description..."
            className="w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
          />
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500 font-medium">
            <SlidersHorizontal className="w-4 h-4" /> Filters:
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
          >
            <option value="all">All Status</option>
            {AVAILABILITY_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
          >
            <option value="newest">Newest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="category">Category (A-Z)</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" /> Clear
            </button>
          )}

          <div className="ml-auto text-sm text-gray-400 font-medium">
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={40} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadResources} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="w-16 h-16" />}
          title="No resources found"
          message={hasFilters ? "Try adjusting your search or filters." : "No resources have been added yet."}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onBorrow={handleBorrow}
              onReturn={handleReturn}
            />
          ))}
        </div>
      )}

      {/* Return overlay */}
      {returning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl px-8 py-6 flex items-center gap-3 shadow-xl">
            <Spinner size={24} />
            <span className="text-sm font-medium text-gray-700">Returning resource...</span>
          </div>
        </div>
      )}

      {/* Borrow modal */}
      {borrowTarget && (
        <BorrowModal
          resource={borrowTarget}
          onClose={() => setBorrowTarget(null)}
          onBorrowed={loadResources}
        />
      )}
    </div>
  );
}
