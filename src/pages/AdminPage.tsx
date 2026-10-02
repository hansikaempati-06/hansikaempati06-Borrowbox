import { useEffect, useState, useCallback, useMemo } from "react";
import type { Resource } from "@/types";
import { CATEGORIES, CONDITIONS } from "@/types";
import { fetchResources, updateResource, deleteResource, fetchStats, fetchHistoryCount } from "@/services/resources";
import { Spinner, EmptyState, ErrorState, showToast, Badge } from "@/components/ui";
import { getCategoryIcon, getCategoryColor } from "@/components/ResourceCard";
import { Search, Pencil, Trash2, X, Check, Settings, Package, CheckCircle2, ArrowRightLeft, History, AlertTriangle } from "lucide-react";

export function AdminPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [stats, setStats] = useState<{ total: number; available: number; borrowed: number } | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, s, h] = await Promise.all([fetchResources(), fetchStats(), fetchHistoryCount()]);
      setResources(res);
      setStats(s);
      setHistoryCount(h);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return resources;
    const q = search.toLowerCase();
    return resources.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.owner_name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }, [resources, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await deleteResource(deleteTarget.id);
      showToast(`"${deleteTarget.name}" has been deleted.`, "success");
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete resource.";
      showToast(message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const statCards = [
    { label: "Total Resources", value: stats?.total ?? 0, icon: Package, bg: "bg-blue-50", text: "text-blue-600" },
    { label: "Available", value: stats?.available ?? 0, icon: CheckCircle2, bg: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Borrowed", value: stats?.borrowed ?? 0, icon: ArrowRightLeft, bg: "bg-amber-50", text: "text-amber-600" },
    { label: "Transactions", value: historyCount, icon: History, bg: "bg-teal-50", text: "text-teal-600" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-sm font-medium text-gray-600 mb-3">
          <Settings className="w-4 h-4" /> Management Dashboard
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Resources</h1>
        <p className="mt-1 text-gray-500">Add, edit, delete, and monitor all campus resources</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-200 p-5">
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

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources by name, category, or owner..."
            className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all"
          />
        </div>
      </div>

      {/* Resource table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size={40} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-16 h-16" />}
          title="No resources found"
          message={search ? "Try a different search term." : "No resources have been added yet."}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Resource</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Owner</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((resource) => {
                  const Icon = getCategoryIcon(resource.category);
                  return (
                    <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border flex-shrink-0 ${getCategoryColor(resource.category)}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{resource.name}</p>
                            <p className="text-xs text-gray-400">{resource.condition}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{resource.category}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{resource.owner_name}</p>
                        <p className="text-xs text-gray-400">{resource.owner_id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={resource.availability_status === "Available" ? "success" : "warning"}>
                          {resource.availability_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingResource(resource)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(resource)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {filtered.map((resource) => {
              const Icon = getCategoryIcon(resource.category);
              return (
                <div key={resource.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border flex-shrink-0 ${getCategoryColor(resource.category)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{resource.name}</p>
                        <p className="text-xs text-gray-400">{resource.category} · {resource.owner_name}</p>
                        <Badge variant={resource.availability_status === "Available" ? "success" : "warning"}>
                          {resource.availability_status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditingResource(resource)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(resource)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingResource && (
        <EditModal
          resource={editingResource}
          onClose={() => setEditingResource(null)}
          onSaved={loadData}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => !actionLoading && setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Delete Resource?</h2>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete "{deleteTarget.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
              >
                {actionLoading ? <Spinner size={16} /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Edit Modal ----

interface EditModalProps {
  resource: Resource;
  onClose: () => void;
  onSaved: () => void;
}

function EditModal({ resource, onClose, onSaved }: EditModalProps) {
  const [form, setForm] = useState({
    name: resource.name,
    category: resource.category,
    description: resource.description,
    owner_name: resource.owner_name,
    owner_id: resource.owner_id,
    owner_contact: resource.owner_contact,
    condition: resource.condition,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category || !form.owner_name.trim()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    setSaving(true);
    try {
      await updateResource(resource.id, {
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        owner_name: form.owner_name.trim(),
        owner_id: form.owner_id.trim(),
        owner_contact: form.owner_contact.trim(),
        condition: form.condition,
      });
      showToast(`"${form.name}" has been updated.`, "success");
      onSaved();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update resource.";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-8 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Edit Resource</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} required>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Condition</label>
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={inputClass}>
                {CONDITIONS.map((cond) => <option key={cond} value={cond}>{cond}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Owner Name *</label>
              <input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Student ID</label>
              <input value={form.owner_id} onChange={(e) => setForm({ ...form, owner_id: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact</label>
            <input value={form.owner_contact} onChange={(e) => setForm({ ...form, owner_contact: e.target.value })} className={inputClass} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2">
              {saving ? <Spinner size={16} /> : <Check className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
