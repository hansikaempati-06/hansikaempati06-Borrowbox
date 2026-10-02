import type { Resource } from "@/types";
import { Badge } from "@/components/ui";
import {
  BookOpen,
  Calculator,
  Cpu,
  FlaskConical,
  PencilRuler,
  FolderOpen,
  Package,
  CheckCircle2,
  Clock,
  User,
  ArrowRightLeft,
} from "lucide-react";
import type { ComponentType } from "react";

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Books: BookOpen,
  Calculators: Calculator,
  Electronics: Cpu,
  "Lab Equipment": FlaskConical,
  Stationery: PencilRuler,
  "Study Materials": FolderOpen,
  Other: Package,
};

const CATEGORY_COLORS: Record<string, string> = {
  Books: "bg-blue-50 text-blue-600 border-blue-200",
  Calculators: "bg-teal-50 text-teal-600 border-teal-200",
  Electronics: "bg-cyan-50 text-cyan-600 border-cyan-200",
  "Lab Equipment": "bg-emerald-50 text-emerald-600 border-emerald-200",
  Stationery: "bg-amber-50 text-amber-600 border-amber-200",
  "Study Materials": "bg-indigo-50 text-indigo-600 border-indigo-200",
  Other: "bg-gray-50 text-gray-600 border-gray-200",
};

const CONDITION_BADGES: Record<string, "success" | "info" | "warning" | "default"> = {
  New: "success",
  Good: "info",
  Fair: "warning",
  Used: "default",
};

export function getCategoryIcon(category: string) {
  return CATEGORY_ICONS[category] || Package;
}

export function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
}

interface ResourceCardProps {
  resource: Resource;
  onBorrow?: (resource: Resource) => void;
  onReturn?: (resource: Resource) => void;
}

export function ResourceCard({ resource, onBorrow, onReturn }: ResourceCardProps) {
  const Icon = getCategoryIcon(resource.category);
  const isAvailable = resource.availability_status === "Available";

  return (
    <div className="group flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200">
      {/* Category header bar */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border ${getCategoryColor(
              resource.category
            )}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {resource.category}
          </span>
        </div>
        <Badge variant={isAvailable ? "success" : "warning"}>
          {isAvailable ? (
            <>
              <CheckCircle2 className="w-3 h-3" /> Available
            </>
          ) : (
            <>
              <Clock className="w-3 h-3" /> Borrowed
            </>
          )}
        </Badge>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 pb-4">
        <h3 className="font-semibold text-gray-900 text-base leading-snug">{resource.name}</h3>
        <p className="mt-1.5 text-sm text-gray-500 line-clamp-2">{resource.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={CONDITION_BADGES[resource.condition] || "default"}>{resource.condition}</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
            <User className="w-3.5 h-3.5" /> {resource.owner_name}
          </span>
        </div>

        {!isAvailable && resource.borrower_name && (
          <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
            Borrowed by {resource.borrower_name}
            {resource.expected_return_date && (
              <> · Expected return: {new Date(resource.expected_return_date).toLocaleDateString()}</>
            )}
          </p>
        )}
      </div>

      {/* Actions */}
      {(onBorrow || onReturn) && (
        <div className="px-5 pb-4 pt-2 border-t border-gray-100">
          {isAvailable && onBorrow && (
            <button
              onClick={() => onBorrow(resource)}
              className="w-full px-4 py-2 text-sm font-semibold text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 active:scale-[0.98] transition-all"
            >
              Borrow This Resource
            </button>
          )}
          {!isAvailable && onReturn && (
            <button
              onClick={() => onReturn(resource)}
              className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2"
            >
              <ArrowRightLeft className="w-4 h-4" /> Return Resource
            </button>
          )}
        </div>
      )}
    </div>
  );
}
