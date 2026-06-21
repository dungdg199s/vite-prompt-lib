import { useState, useEffect } from "react";
import WorkspacesPage from "./pages/WorkspacesPage";
import PromptsPage from "./pages/PromptsPage";
import DocumentsPage from "./pages/DocumentsPage";
import { AppDataProvider, useAppData } from "./contexts/AppDataContext";
import { LoadingOverlay } from "./components/shared/LoadingComponents";

const PAGES = ["Workspaces", "Prompts", "Documents"];

function AppContent() {
  const [activePage, setActivePage] = useState("Workspaces");
  const { isLoadingAll, loadAllData } = useAppData();

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return (
    <div>
      <LoadingOverlay isVisible={isLoadingAll} />
      <nav className="flex gap-1 border-b border-stone-300 bg-[#faf5ec] px-4 py-2">
        {PAGES.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => setActivePage(page)}
            disabled={isLoadingAll}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              activePage === page
                ? "bg-teal-700 text-white"
                : "text-slate-700 hover:bg-stone-200"
            } ${isLoadingAll ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {page}
          </button>
        ))}
      </nav>
      {activePage === "Workspaces" ? <WorkspacesPage /> : null}
      {activePage === "Prompts" ? <PromptsPage /> : null}
      {activePage === "Documents" ? <DocumentsPage /> : null}
    </div>
  );
}

function App() {
  return (
    <AppDataProvider>
      <AppContent />
    </AppDataProvider>
  );
}

export default App;
