import { useEffect, useRef } from 'react';
import { usePromptsStore } from '../store/promptsStore';

export function usePrompt(promptId) {
  const fetchPromptById = usePromptsStore((s) => s.fetchPromptById);
  const record = usePromptsStore((s) => s.recordState[promptId]);

  useEffect(() => {
    if (!promptId) return;
    if (!record) {
      fetchPromptById(promptId);
    }
  }, [promptId, record, fetchPromptById]);

  return {
    prompt: record?.data || null,
    isLoading: record?.isLoading || false,
    error: record?.error || null,
    fetchPromptById: () => fetchPromptById(promptId),
  };
}

export function usePrompts(options = {}) {
  const autoFetchTriggeredRef = useRef(false);

  const { autoFetch = true } = options;

  const prompts = usePromptsStore((s) => s.prompts);
  const isLoading = usePromptsStore((s) => s.isLoading);
  const error = usePromptsStore((s) => s.error);

  const fetchPrompts = usePromptsStore((s) => s.fetchPrompts);
  const createPrompt = usePromptsStore((s) => s.createPrompt);
  const updatePrompt = usePromptsStore((s) => s.updatePrompt);
  const deletePrompt = usePromptsStore((s) => s.deletePrompt);

  useEffect(() => {
    if (!autoFetch) return;
    if (autoFetchTriggeredRef.current) return;
    if (!prompts?.length && !isLoading) {
      autoFetchTriggeredRef.current = true;
      fetchPrompts();
    }
  }, [autoFetch, prompts?.length, isLoading, fetchPrompts]);

  return {
    prompts,
    isLoading,
    error,
    fetchPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
  };
}
