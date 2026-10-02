import { Home, LayoutGrid, PlusCircle, Bot, History, Settings, Boxes } from "lucide-react";
import type { ComponentType } from "react";

export type PageId = "home" | "browse" | "add" | "ai" | "history" | "admin";

interface NavItem {
  id: PageId;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "browse", label: "Browse", icon: LayoutGrid },
  { id: "add", label: "Add Resource", icon: PlusCircle },
  { id: "ai", label: "Ask AI", icon: Bot },
  { id: "history", label: "History", icon: History },
  { id: "admin", label: "Manage", icon: Settings },
];

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  return (
    <>
      {/* Desktop top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={() => onNavigate("home")} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Boxes className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="text-lg font-bold text-gray-900 leading-none">BorrowBox</span>
                <span className="block text-[10px] text-gray-400 leading-none mt-0.5">Campus Resource Sharing</span>
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-2 ${
                    currentPage === item.id
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-1.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
                currentPage === item.id ? "text-emerald-600" : "text-gray-400"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
