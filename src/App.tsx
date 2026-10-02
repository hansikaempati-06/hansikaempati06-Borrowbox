import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import type { PageId } from "@/components/Navbar";
import { ToastContainer } from "@/components/ui";
import { HomePage } from "@/pages/HomePage";
import { BrowsePage } from "@/pages/BrowsePage";
import { AddResourcePage } from "@/pages/AddResourcePage";
import { AIAssistantPage } from "@/pages/AIAssistantPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { AdminPage } from "@/pages/AdminPage";

function App() {
  const [page, setPage] = useState<PageId>("home");

  const navigate = (p: PageId) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 antialiased">
      <Navbar currentPage={page} onNavigate={navigate} />
      <ToastContainer />
      <main>
        {page === "home" && <HomePage onNavigate={navigate} />}
        {page === "browse" && <BrowsePage />}
        {page === "add" && <AddResourcePage onNavigate={navigate} />}
        {page === "ai" && <AIAssistantPage />}
        {page === "history" && <HistoryPage />}
        {page === "admin" && <AdminPage />}
      </main>
    </div>
  );
}

export default App;
