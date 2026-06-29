import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import Input from '../shared/Input';
import { useWorkspace, useWorkspaces } from '../../hooks/useWorkspaces';

const DEFAULT_DOCUMENT_FORM = {
  id: '',
  name: '',
  workspace: '',
  type: 'Spreadsheets',
  fileName: '',
  preasheetId: '',
  description: '',
  contentMarkdown: '',
  contentJSON: '',
  contentHTML: '',
  shareMode: 'private',
  shareWith: '',
};

export default function DocumentEditModal() {
  const navigate = useNavigate();
  const { workspaceId, documentId } = useParams();
  const isCreateMode = !documentId;
  const { workspaces } = useWorkspaces();
  const { documents, createDocument, updateDocument, isLoading } = useWorkspace(workspaceId);
  const currentDocument = useMemo(() => documents.find((item) => item.id === documentId), [documentId, documents]);
  const [generatedDocumentId] = useState(() => `document-${Date.now()}`);
  const derivedForm = useMemo(() => {
    if (isCreateMode || !currentDocument) {
      return {
        ...DEFAULT_DOCUMENT_FORM,
        id: generatedDocumentId,
        workspace: workspaceId || '',
      };
    }

    return {
      id: currentDocument.id,
      name: currentDocument.name || '',
      workspace: currentDocument.workspace || workspaceId || '',
      type: currentDocument.type || 'Spreadsheets',
      fileName: currentDocument.fileName || '',
      preasheetId: currentDocument.preasheetId || '',
      description: currentDocument.description || '',
      contentMarkdown: currentDocument.contentMarkdown || '',
      contentJSON:
        typeof currentDocument.contentJSON === 'string'
          ? currentDocument.contentJSON
          : currentDocument.contentJSON
            ? JSON.stringify(currentDocument.contentJSON, null, 2)
            : '',
      contentHTML: currentDocument.contentHTML || '',
      shareMode: currentDocument.shareMode || 'private',
      shareWith: Array.isArray(currentDocument.shareWith)
        ? currentDocument.shareWith.join(', ')
        : currentDocument.shareWith || '',
    };
  }, [currentDocument, generatedDocumentId, isCreateMode, workspaceId]);
  const [draft, setDraft] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const form = draft ?? derivedForm;

  const workspaceOptions = useMemo(
    () => workspaces.map((workspace) => ({ label: workspace.name, value: workspace.id })),
    [workspaces]
  );

  const shareModeOptions = useMemo(
    () => ['private', 'shared', 'public'].map((value) => ({ label: value, value })),
    []
  );

  const documentTypeOptions = useMemo(
    () => ['Spreadsheets', 'Markdown', 'JSON', 'HTML'].map((value) => ({ label: value, value })),
    []
  );

  const handleChange = (field, value) => {
    setDraft((prev) => {
      const base = prev ?? form;
      return {
        ...base,
        [field]: value,
        fileName: field === 'name' && base.type === 'Spreadsheets' ? value : base.fileName,
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    const payload = {
      ...form,
      workspace: form.workspace || workspaceId,
      fileName: form.type === 'Spreadsheets' ? form.fileName || form.name : '',
      shareWith:
        form.shareMode === 'shared'
          ? String(form.shareWith || '')
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
    };

    setIsSaving(true);
    const saved = isCreateMode ? await createDocument(payload) : await updateDocument(documentId, payload);
    setIsSaving(false);

    if (saved?.id || saved === true) {
      navigate(`/workspaces/${workspaceId}/documents/${saved?.id || documentId || payload.id}/view`);
      return;
    }

    setErrorMessage(isCreateMode ? 'Failed to create document.' : 'Failed to update document.');
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => navigate(-1)}
      title={isCreateMode ? 'Create Document' : 'Edit Document'}
      size="lg"
    >
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <Input
          type="text"
          label="Document Name"
          value={form.name}
          onChange={(event) => handleChange('name', event.target.value)}
          placeholder="my-document"
          required
        />

        <Input
          label="Workspace"
          type="select"
          value={form.workspace}
          onChange={(event) => handleChange('workspace', event.target.value)}
          options={workspaceOptions}
          required
        />

        <Input
          label="Document Type"
          type="select"
          value={form.type}
          onChange={(event) => handleChange('type', event.target.value)}
          options={documentTypeOptions}
          required
        />

        {form.type === 'Spreadsheets' ? (
          <Input
            type="text"
            label="Spreadsheet ID"
            value={form.preasheetId}
            onChange={(event) => handleChange('preasheetId', event.target.value)}
            placeholder="1AbCdEfGh..."
            required
          />
        ) : null}

        {form.type === 'Markdown' ? (
          <Input
            type="textarea"
            label="Markdown Content"
            rows={8}
            value={form.contentMarkdown}
            onChange={(event) => handleChange('contentMarkdown', event.target.value)}
            placeholder="Write markdown content..."
          />
        ) : null}

        {form.type === 'JSON' ? (
          <Input
            type="textarea"
            label="JSON Content"
            rows={8}
            value={form.contentJSON}
            onChange={(event) => handleChange('contentJSON', event.target.value)}
            placeholder='{"key": "value"}'
          />
        ) : null}

        {form.type === 'HTML' ? (
          <Input
            type="textarea"
            label="HTML Content"
            rows={8}
            value={form.contentHTML}
            onChange={(event) => handleChange('contentHTML', event.target.value)}
            placeholder="<h1>Title</h1>"
          />
        ) : null}

        <Input
          type="textarea"
          label="Description"
          rows={3}
          value={form.description}
          onChange={(event) => handleChange('description', event.target.value)}
          placeholder="Short description of this document"
        />

        <Input
          label="Share Mode"
          type="select"
          value={form.shareMode}
          onChange={(event) => handleChange('shareMode', event.target.value)}
          options={shareModeOptions}
          required
        />

        {form.shareMode === 'shared' ? (
          <Input
            type="text"
            label="Share With (comma separated emails)"
            value={form.shareWith}
            onChange={(event) => handleChange('shareWith', event.target.value)}
            placeholder="a@company.com, b@company.com"
          />
        ) : null}

        {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" onClick={() => navigate(-1)} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isSaving} variant="primary">
            {isCreateMode ? 'Create' : 'Update'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
