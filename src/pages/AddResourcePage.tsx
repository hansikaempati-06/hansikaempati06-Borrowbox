import { useState } from "react";
import { CATEGORIES, CONDITIONS } from "@/types";
import { createResource, getAICategory } from "@/services/resources";
import { Spinner, showToast } from "@/components/ui";
import type { PageId } from "@/components/Navbar";
import { Bot, Sparkles, Check, PlusCircle, Tag } from "lucide-react";

interface AddResourcePageProps {
  onNavigate: (page: PageId) => void;
}

interface FormData {
  name: string;
  description: string;
  category: string;
  owner_name: string;
  owner_id: string;
  owner_contact: string;
  condition: string;
}

const EMPTY_FORM: FormData = {
  name: "",
  description: "",
  category: "",
  owner_name: "",
  owner_id: "",
  owner_contact: "",
  condition: "Good",
};

export function AddResourcePage({ onNavigate }: AddResourcePageProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "name" || field === "description") {
      setAiSuggestion(null);
      setAiError(null);
    }
  };

  const handleAISuggest = async () => {
    if (!form.name.trim()) {
      showToast("Please enter a resource name first.", "info");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiSuggestion(null);
    try {
      const result = await getAICategory(form.name, form.description);
      setAiSuggestion(result.category);
      showToast(`AI suggested: ${result.category}`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "AI suggestion failed.";
      setAiError(message);
      showToast(message, "error");
    } finally {
      setAiLoading(false);
    }
  };

  const acceptSuggestion = () => {
    if (aiSuggestion) {
      setForm((prev) => ({ ...prev, category: aiSuggestion }));
      showToast(`Category set to ${aiSuggestion}`, "success");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!form.name.trim() || !form.category || !form.owner_name.trim() || !form.owner_id.trim() || !form.owner_contact.trim()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await createResource({
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        owner_name: form.owner_name.trim(),
        owner_id: form.owner_id.trim(),
        owner_contact: form.owner_contact.trim(),
        condition: form.condition,
      });
      showToast(`"${form.name.trim()}" has been added successfully!`, "success");
      setForm(EMPTY_FORM);
      setAiSuggestion(null);
      onNavigate("browse");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add resource.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all";

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Add a Resource</h1>
        <p className="mt-1 text-gray-500">Share something other students can borrow</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Resource Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g. Database Management Systems Textbook"
            className={inputClass}
            required
          />
        </div>

        {/* Description + AI suggestion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Describe the resource — what it is, what it's useful for..."
            rows={3}
            className={inputClass}
          />

          {/* AI Category Suggestion */}
          <div className="mt-3 rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">AI Category Suggestion</p>
                  <p className="text-xs text-gray-500">Let AI pick the best category from your name and description</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAISuggest}
                disabled={aiLoading || !form.name.trim()}
                className="px-3.5 py-2 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
              >
                {aiLoading ? <Spinner size={16} /> : <Bot className="w-4 h-4" />}
                {aiLoading ? "Thinking..." : "Suggest Category"}
              </button>
            </div>

            {aiSuggestion && (
              <div className="mt-3 flex items-center gap-3 bg-white rounded-lg p-3 border border-emerald-100 animate-fade-in">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">
                  AI suggests: <span className="font-bold text-emerald-700">{aiSuggestion}</span>
                </span>
                <button
                  type="button"
                  onClick={acceptSuggestion}
                  className="ml-auto px-3 py-1.5 text-xs font-semibold text-white bg-emerald-500 rounded-md hover:bg-emerald-600 inline-flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Accept
                </button>
              </div>
            )}

            {aiError && (
              <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-100">
                {aiError}
              </div>
            )}
          </div>
        </div>

        {/* Category select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={form.category}
            onChange={(e) => updateField("category", e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Condition
          </label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((cond) => (
              <button
                key={cond}
                type="button"
                onClick={() => updateField("condition", cond)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                  form.condition === cond
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>

        {/* Owner info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.owner_name}
              onChange={(e) => updateField("owner_name", e.target.value)}
              placeholder="e.g. Priya Sharma"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Student ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.owner_id}
              onChange={(e) => updateField("owner_id", e.target.value)}
              placeholder="e.g. CS21B001"
              className={inputClass}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Contact <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.owner_contact}
            onChange={(e) => updateField("owner_contact", e.target.value)}
            placeholder="e.g. priya.s@campus.edu"
            className={inputClass}
            required
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate("browse")}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Spinner size={18} /> : <PlusCircle className="w-5 h-5" />}
            {submitting ? "Adding..." : "Add Resource"}
          </button>
        </div>
      </form>
    </div>
  );
}
