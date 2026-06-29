import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaces } from './hooks/useWorkspaces';

const PAGES = [{ name: 'Workspaces', path: '/workspaces' }];

const SEARCH_SCOPES = {
  ALL: 'all',
  PROMPTS: 'prompts',
  DOCUMENTS: 'documents',
};

function AppHeader() {
  const { workspaces, isLoading } = useWorkspaces();

  const navigate = useNavigate();

  const prompts = useMemo(() => {
    if (!workspaces) {
      return [];
    }
    return workspaces.flatMap((workspace) => {
      return (workspace.prompts || []).map((prompt) => ({
        ...prompt,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
      }));
    });
  }, [workspaces]);

  const documents = useMemo(() => {
    if (!workspaces) {
      return [];
    }
    return workspaces.flatMap((workspace) => {
      return (workspace.documents || []).map((document) => ({
        ...document,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
      }));
    });
  }, [workspaces]);

  const [searchScope, setSearchScope] = useState(SEARCH_SCOPES.ALL);
  const [searchQuery, setSearchQuery] = useState('');

  const activePage = 'Workspaces';
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredPrompts = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return prompts
      .filter((prompt) => {
        const name = String(prompt?.name || '').toLowerCase();
        const description = String(prompt?.description || '').toLowerCase();
        const workspace = String(prompt?.workspaceName || '').toLowerCase();
        return (
          name.includes(normalizedQuery) || description.includes(normalizedQuery) || workspace.includes(normalizedQuery)
        );
      })
      .slice(0, 8);
  }, [prompts, normalizedQuery]);

  const filteredDocuments = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return documents
      .filter((document) => {
        const name = String(document?.name || '').toLowerCase();
        const description = String(document?.description || '').toLowerCase();
        const workspace = String(document?.workspaceName || '').toLowerCase();
        return (
          name.includes(normalizedQuery) || description.includes(normalizedQuery) || workspace.includes(normalizedQuery)
        );
      })
      .slice(0, 8);
  }, [documents, normalizedQuery]);

  const goToPrompt = (prompt) => {
    const workspaceId = String(prompt?.workspaceId || '').trim();
    const promptId = String(prompt?.id || '').trim();
    if (!workspaceId || !promptId) {
      return;
    }

    setSearchQuery('');
    navigate(`/workspaces/${encodeURIComponent(workspaceId)}/prompts/${encodeURIComponent(promptId)}/view`);
  };

  const goToDocument = (document) => {
    const workspaceId = String(document?.workspaceId || '').trim();
    const documentId = String(document?.id || '').trim();
    if (!workspaceId || !documentId) {
      return;
    }

    setSearchQuery('');
    navigate(`/workspaces/${encodeURIComponent(workspaceId)}/documents/${encodeURIComponent(documentId)}/view`);
  };

  const scopedPrompts = searchScope === SEARCH_SCOPES.DOCUMENTS ? [] : filteredPrompts;
  const scopedDocuments = searchScope === SEARCH_SCOPES.PROMPTS ? [] : filteredDocuments;

  const showSearchDropdown = Boolean(normalizedQuery) && (scopedPrompts.length > 0 || scopedDocuments.length > 0);

  return (
    <>
      <nav className="sticky top-0 z-30 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-stone-300 bg-[#faf5ec]/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-1 justify-self-start">
          {PAGES.map((page) => (
            <button
              key={page.name}
              type="button"
              onClick={() => {
                navigate(page.path);
              }}
              disabled={isLoading}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                activePage === page.name ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-700 hover:bg-stone-200'
              } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {page.name}
            </button>
          ))}
        </div>

        <div className="relative w-full min-w-[40vw] max-w-2xl justify-self-center">
          <div className="flex overflow-hidden rounded-lg border border-stone-300 bg-white focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-200">
            <select
              value={searchScope}
              onChange={(event) => setSearchScope(event.target.value)}
              className="w-36 shrink-0 border-r border-stone-300 bg-stone-50 px-3 py-2 text-sm text-slate-700 outline-none"
              aria-label="Search scope"
            >
              <option value={SEARCH_SCOPES.ALL}>All</option>
              <option value={SEARCH_SCOPES.PROMPTS}>Prompts</option>
              <option value={SEARCH_SCOPES.DOCUMENTS}>Documents</option>
            </select>

            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-white px-3 py-2 text-sm text-slate-800 outline-none"
              placeholder="Global search..."
              aria-label="Global search"
            />
          </div>

          {showSearchDropdown ? (
            <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-stone-300 bg-[#fffef8] shadow-[0_10px_24px_rgba(44,33,12,0.12)]">
              {scopedPrompts.length ? (
                <div className="border-b border-stone-200 p-1.5">
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Prompts</p>
                  <div className="grid gap-1">
                    {scopedPrompts.map((prompt) => (
                      <button
                        key={`prompt:${prompt.name}:${prompt.workspace}`}
                        type="button"
                        onClick={() => goToPrompt(prompt)}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-stone-100"
                      >
                        <span className="truncate font-medium text-slate-800">{prompt.name}</span>
                        <span className="ml-3 shrink-0 text-xs text-slate-500">@{prompt.workspaceName || '-'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {scopedDocuments.length ? (
                <div className="p-1.5">
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Documents</p>
                  <div className="grid gap-1">
                    {scopedDocuments.map((document) => (
                      <button
                        key={`document:${document.name}:${document.workspace}`}
                        type="button"
                        onClick={() => goToDocument(document)}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition hover:bg-stone-100"
                      >
                        <span className="truncate font-medium text-slate-800">{document.name}</span>
                        <span className="ml-3 shrink-0 text-xs text-slate-500">@{document.workspaceName || '-'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="justify-self-end" />
      </nav>
    </>
  );
}

export default AppHeader;
