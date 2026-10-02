import { useEffect, useState, useCallback } from "react";
import type { BorrowingHistory } from "@/types";
import { fetchBorrowingHistory } from "@/services/resources";
import { Spinner, EmptyState, ErrorState, Badge } from "@/components/ui";
import { History, Package, User, Calendar, CalendarCheck, RotateCcw } from "lucide-react";

export function HistoryPage() {
  const [history, setHistory] = useState<BorrowingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBorrowingHistory();
      setHistory(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load borrowing history.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Borrowing History</h1>
        <p className="mt-1 text-gray-500">A record of all completed borrow and return transactions</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={40} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadHistory} />
      ) : history.length === 0 ? (
        <EmptyState
          icon={<History className="w-16 h-16" />}
          title="No history yet"
          message="When resources are borrowed and returned, transactions will appear here."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Resource</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Borrower</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Borrowed On</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Expected Return</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Returned On</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((entry) => {
                  const returnedOn = new Date(entry.returned_at);
                  const expected = entry.expected_return_date ? new Date(entry.expected_return_date) : null;
                  const onTime = expected ? returnedOn <= expected : true;

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-gray-900">{entry.resource_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-gray-700">{entry.borrower_name}</span>
                          <span className="text-xs text-gray-400">{entry.borrower_id}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(entry.borrowed_at)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(entry.expected_return_date)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(entry.returned_at)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={onTime ? "success" : "warning"}>
                          {onTime ? "On Time" : "Late Return"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {history.map((entry) => {
              const returnedOn = new Date(entry.returned_at);
              const expected = entry.expected_return_date ? new Date(entry.expected_return_date) : null;
              const onTime = expected ? returnedOn <= expected : true;

              return (
                <div key={entry.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="font-semibold text-gray-900 text-sm">{entry.resource_name}</span>
                    </div>
                    <Badge variant={onTime ? "success" : "warning"}>
                      {onTime ? "On Time" : "Late"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <User className="w-3.5 h-3.5" /> {entry.borrower_name} ({entry.borrower_id})
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Calendar className="w-3.5 h-3.5" /> Borrowed: {formatDate(entry.borrowed_at)}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <CalendarCheck className="w-3.5 h-3.5" /> Expected: {formatDate(entry.expected_return_date)}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <RotateCcw className="w-3.5 h-3.5" /> Returned: {formatDate(entry.returned_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
