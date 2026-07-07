import { useMemo } from "react";
import { useParams } from "react-router-dom";
import documentIcon from "./assets/documents.png";
import promptIcon from "./assets/prompts.png";
import { useWorkspace } from "./hooks/useWorkspaces";
import { useAppNavigate } from "./hooks/useAppNavigate";

export default function AppNavTabs() {
  const navigate = useAppNavigate();
  const { workspaceId, promptId, documentId } = useParams();
  const { tabs: allTabs, closeTab } = useWorkspace();

  const tabs = useMemo(() => {
    if (!workspaceId) {
      return [];
    }

    return allTabs.filter((tab) => {
      if (tab.type === "workspace") {
        return tab.id === workspaceId;
      }

      return tab.workspaceId === workspaceId;
    });
  }, [allTabs, workspaceId]);

  const activeTabId = documentId || promptId || workspaceId;
  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeTabId), [tabs, activeTabId]);

  const getTabIcon = (tab) => {
    if (tab.type === "prompt") {
      return promptIcon;
    }

    if (tab.type === "document") {
      return documentIcon;
    }

    return null;
  };

  const onTabClick = (tab) => {
    if (tab.type === "workspace") {
      navigate({ object: "workspace", recordId: tab.id, action: "home" });
    } else if (tab.type === "prompt") {
      navigate({ object: "prompt", recordId: tab.id, action: "view" });
    } else if (tab.type === "document") {
      navigate({ object: "document", recordId: tab.id, action: "view" });
    }
  };

  const closeTabHandler = (tab) => {
    closeTab(tab);
    if (activeTab?.id === tab.id) {
      const remainingTabs = tabs.filter((item) => item.id !== tab.id);
      if (remainingTabs.length > 0) {
        const newActiveTab = remainingTabs[remainingTabs.length - 1];
        onTabClick(newActiveTab);
      } else {
        navigate({ object: "workspace", action: "home" });
      }
    }
  };

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto border-x border-t border-stone-300 bg-[#fffef8]">
      <div className="flex min-w-max items-center gap-1 px-2 py-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1 border px-2.5 py-1.5 text-sm ${
              activeTab?.id === tab.id
                ? "border-teal-700 bg-teal-100 text-slate-900"
                : "border-stone-300 bg-white text-slate-700"
            }`}
            role="tab"
            aria-selected={activeTab?.id === tab.id}
            tabIndex={0}
          >
            <button
              type="button"
              className="flex max-w-[180px] items-center gap-1.5 truncate text-left"
              onClick={() => onTabClick(tab)}
              title={tab.name ?? tab.label}
            >
              {getTabIcon(tab) ? (
                <img
                  src={getTabIcon(tab)}
                  alt=""
                  className="h-4 w-4 shrink-0 rounded-[4px] object-cover"
                  aria-hidden="true"
                />
              ) : null}
              <span className="truncate">
                {tab.type === "workspace" ? (tab.name ?? "Workspace") : (tab.name ?? tab.label)}
              </span>
            </button>
            {tab.type !== "workspace" ? (
              <button
                type="button"
                className="rounded px-1 text-xs text-slate-600 hover:bg-stone-200"
                onClick={() => closeTabHandler(tab)}
                aria-label={`Close ${tab.name ?? tab.label} tab`}
              >
                x
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
