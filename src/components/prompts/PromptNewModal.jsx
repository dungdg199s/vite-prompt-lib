import { useEffect, useMemo, useState } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import Input from '../shared/Input';
import { useNavigate, useParams } from 'react-router-dom';
import { usePrompts } from '../../hooks/usePrompts';

export default function PromptNewModal() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { createPrompt } = usePrompts();

  const [formData, setFormData] = useState({
    name: '',
    workspace: workspaceId || '',
    description: '',
    content: '',
    shareMode: 'private',
    shareWith: '',
  });

  useEffect(() => {
    if (workspaceId) {
      setFormData((prev) => ({
        ...prev,
        workspace: workspaceId,
      }));
    }
  }, [workspaceId]);

  const [isSaving, setIsSaving] = useState(false);

  const onChange = (prop, value) => {
    setFormData((prev) => ({
      ...prev,
      [prop]: value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const createdPrompt = await createPrompt(formData);
    setIsSaving(false);
    if (createdPrompt?.id) {
      navigate(`/workspaces/${workspaceId}/prompts/${createdPrompt.id}/view`);
    }
  };

  const shareOptions = useMemo(() => {
    return ['private', 'public'].map((v) => ({ label: v, value: v }));
  }, []);

  return (
    <Modal isOpen={true} onClose={() => navigate(-1)} title="Create Prompt" size="lg">
      <form className="grid gap-3" onSubmit={onSubmit}>
        <Input
          type="text"
          label="Prompt Name"
          value={formData.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="my-prompt-name"
          required
        ></Input>

        <Input
          type="text"
          label="Description"
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Short description of this prompt"
        ></Input>

        <Input
          type="textarea"
          label="Content"
          rows={8}
          value={formData.content}
          onChange={(e) => onChange('content', e.target.value)}
          placeholder="Write your prompt template here.\nUse ${VariableName|description} for tokens.\nExample: ${Topic|options:React,Vue,Angular}"
          required
        ></Input>

        <Input
          label="Share Mode"
          type="select"
          value={formData.shareMode}
          onChange={(e) => onChange('shareMode', e.target.value)}
          options={shareOptions}
          required
        ></Input>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
