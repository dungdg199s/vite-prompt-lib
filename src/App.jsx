import { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import WorkspacesPage from "./pages/WorkspacesPage";
import PromptsPage from "./pages/PromptsPage";
import DocumentsPage from "./pages/DocumentsPage";
import { AppDataProvider, useAppData } from "./contexts/AppDataContext";
import { LoadingOverlay } from "./components/shared/Skeleton";
import { ToastProvider } from "./components/shared/ToastManager";
import { uiClasses } from "./components/shared/uiClasses";

const PAGES = [
  { name: "Workspaces", path: "/workspaces" },
  { name: "Prompts", path: "/prompts" },
  { name: "Documents", path: "/documents" },
];

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoadingAll, loadAllData } = useAppData();

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const getActivePage = () => {
    const path = location.pathname;
    if (path.startsWith('/workspaces')) return 'Workspaces';
    if (path.startsWith('/prompts')) return 'Prompts';
    if (path.startsWith('/documents')) return 'Documents';
    return 'Workspaces';
  };

  const activePage = getActivePage();

  return (
    <div className={uiClasses.pageSurface}>
      <LoadingOverlay isVisible={isLoadingAll} />
      <nav className="sticky top-0 z-30 flex gap-1 border-b border-stone-300 bg-[#faf5ec]/95 px-4 py-2 backdrop-blur">
        {PAGES.map((page) => (
          <button
            key={page.name}
            type="button"
            onClick={() => navigate(page.path)}
            disabled={isLoadingAll}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              activePage === page.name
                ? "bg-teal-700 text-white shadow-sm"
                : "text-slate-700 hover:bg-stone-200"
            } ${isLoadingAll ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {page.name}
          </button>
        ))}
      </nav>
      <Routes>
        <Route path="/workspaces/*" element={<WorkspacesPage />} />
        <Route path="/prompts/*" element={<PromptsPage />} />
        <Route path="/documents/*" element={<DocumentsPage />} />
        <Route path="/" element={<Navigate to="/workspaces" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AppDataProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppDataProvider>
  );
}

export default App;
