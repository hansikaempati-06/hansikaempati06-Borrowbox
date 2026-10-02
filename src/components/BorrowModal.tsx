import { useState } from "react";
import type { Resource } from "@/types";
import { Spinner } from "@/components/ui";
import { X, Calendar, User, Hash } from "lucide-react";
import { showToast } from "@/components/ui";
import { borrowResource } from "@/services/resources";

interface BorrowModalProps {
  resource: Resource;
  onClose: () => void;
  onBorrowed: () => void;
}

export function BorrowModal({ resource, onClose, onBorrowed }: BorrowModalProps) {
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerId, setBorrowerId] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim() || !borrowerId.trim() || !expectedReturnDate) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    const selectedDate = new Date(expectedReturnDate);
    if (selectedDate < today) {
      showToast("Expected return date cannot be in the past.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await borrowResource(resource.id, borrowerName.trim(), borrowerId.trim(), expectedReturnDate);
      showToast(`Successfully borrowed "${resource.name}".`, "success");
      onBorrowed();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to borrow resource.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Borrow Resource</h2>
            <p className="text-sm text-gray-500 mt-0.5">{resource.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Your Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Student ID
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={borrowerId}
                onChange={(e) => setBorrowerId(e.target.value)}
                placeholder="e.g. CS22B010"
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Expected Return Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={expectedReturnDate}
                min={minDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
            >
              {submitting && <Spinner size={16} />}
              {submitting ? "Borrowing..." : "Confirm Borrow"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
