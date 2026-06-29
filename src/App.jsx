import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { uiClasses } from './components/shared/uiClasses';
import { ToastProvider } from './components/shared/ToastManager';
import AppLayout from './AppLayout';
import WorkspaceEditModal from './components/workspaces/WorkspaceEditModal';
import WorkspaceDetail from './components/workspaces/WorkspaceDetail';
import DocumentDetail from './components/documents/DocumentDetail';
import DocumentEditModal from './components/documents/DocumentEditModal';
import WorkspaceNewModal from './components/workspaces/WorkspaceNewModal';
import WorkspaceDeleteModal from './components/workspaces/WorkspaceDeleteModal';
import DocumentDeleteModal from './components/documents/DocumentDeleteModal';
import PromptDeleteModal from './components/prompts/PromptDeleteModal';
import PromptEditModal from './components/prompts/PromptEditModal';
import PromptDetail from './components/workspaces/PromptDetail';
import PromptNewModal from './components/prompts/PromptNewModal';

function AppContent() {
  const location = useLocation();

  const backgroundLocation = location.state?.backgroundLocation;

  return (
    <div className={uiClasses.pageSurface}>
      <Routes location={backgroundLocation || location}>
        <Route path="workspaces" element={<AppLayout />}>
          <Route path="" element={<WorkspaceDetail />} />
          <Route path=":workspaceId">
            <Route path="view" element={<WorkspaceDetail />} />
            <Route path="prompts">
              <Route path=":promptId">
                <Route path="view" element={<PromptDetail />} />
              </Route>
            </Route>
            <Route path="documents">
              <Route path=":documentId">
                <Route path="view" element={<DocumentDetail />} />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/workspaces" replace />} />
      </Routes>

      {backgroundLocation && (
        <Routes>
          <Route path="workspaces">
            <Route path="new" element={<WorkspaceNewModal />} />
            <Route path=":workspaceId">
              <Route path="edit" element={<WorkspaceEditModal />} />
              <Route path="delete" element={<WorkspaceDeleteModal />} />

              <Route path="prompts">
                <Route path="new" element={<PromptNewModal />} />
                <Route path=":promptId">
                  <Route path="edit" element={<PromptEditModal />} />
                  <Route path="delete" element={<PromptDeleteModal />} />
                </Route>
              </Route>

              <Route path="documents">
                <Route path="new" element={<DocumentEditModal />} />
                <Route path=":documentId">
                  <Route path="edit" element={<DocumentEditModal />} />
                  <Route path="delete" element={<DocumentDeleteModal />} />
                </Route>
              </Route>
            </Route>
          </Route>
        </Routes>
      )}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
