import { useState } from "react";
import WorkspacesPage from "./pages/WorkspacesPage";
import PromptsPage from "./pages/PromptsPage";

const PAGES = ["Workspaces", "Prompts"];

function App() {
  const [activePage, setActivePage] = useState("Workspaces");

  return (
    <div>
      <nav className="flex gap-1 border-b border-stone-300 bg-[#faf5ec] px-4 py-2">
        {PAGES.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => setActivePage(page)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              activePage === page
                ? "bg-teal-700 text-white"
                : "text-slate-700 hover:bg-stone-200"
            }`}
          >
            {page}
          </button>
        ))}
      </nav>
      {activePage === "Workspaces" ? <WorkspacesPage /> : <PromptsPage />}
    </div>
  );
}

export default App;
