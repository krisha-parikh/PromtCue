import { useMemo, useState } from "react";
import DEFAULT_LIVE_SUGGESTION_PROMPT from "../prompts/liveSuggestion";
import DEFAULT_DETAILED_ANSWER_PROMPT from "../prompts/detailedAnswer";
import DEFAULT_CHAT_PROMPT from "../prompts/chatPrompt";

const createInitialState = () => ({
  sessionId: crypto.randomUUID(),
  transcriptChunks: [],
  suggestionBatches: [],
  chatMessages: [],
  error: "",
  apiKey: "",
  isRecording: false,
  isTranscribing: false,
  isFetchingSuggestions: false,
  isSendingChat: false,
  isBootstrapping: false,
  settingsOpen: false,
  savedPrompts: {
    live_suggestion_prompt: DEFAULT_LIVE_SUGGESTION_PROMPT,
    detailed_answer_prompt: DEFAULT_DETAILED_ANSWER_PROMPT,
    chat_prompt: DEFAULT_CHAT_PROMPT,
  },
});

export default function useSession() {
  const [state, setState] = useState(createInitialState);

  const actions = useMemo(
    () => ({
      setTranscriptChunks: (updater) =>
        setState((prev) => ({
          ...prev,
          transcriptChunks:
            typeof updater === "function"
              ? updater(prev.transcriptChunks)
              : updater,
        })),

      setSuggestionBatches: (updater) =>
        setState((prev) => ({
          ...prev,
          suggestionBatches:
            typeof updater === "function"
              ? updater(prev.suggestionBatches)
              : updater,
        })),

      setChatMessages: (updater) =>
        setState((prev) => ({
          ...prev,
          chatMessages:
            typeof updater === "function"
              ? updater(prev.chatMessages)
              : updater,
        })),

      setError: (value) =>
        setState((prev) => ({ ...prev, error: value })),

      setApiKey: (value) =>
        setState((prev) => ({ ...prev, apiKey: value })),

      setIsRecording: (value) =>
        setState((prev) => ({ ...prev, isRecording: value })),

      setIsTranscribing: (value) =>
        setState((prev) => ({ ...prev, isTranscribing: value })),

      setIsFetchingSuggestions: (value) =>
        setState((prev) => ({ ...prev, isFetchingSuggestions: value })),

      setIsSendingChat: (value) =>
        setState((prev) => ({ ...prev, isSendingChat: value })),

      setIsBootstrapping: (value) =>
        setState((prev) => ({ ...prev, isBootstrapping: value })),

      setSettingsOpen: (value) =>
        setState((prev) => ({ ...prev, settingsOpen: value })),

      setSavedPrompts: (value) =>
        setState((prev) => ({ ...prev, savedPrompts: value })),

      resetSession: () =>
        setState((prev) => ({
          ...createInitialState(),
          apiKey: prev.apiKey,
          savedPrompts: prev.savedPrompts,
          settingsOpen: prev.settingsOpen,
        })),
    }),
    []
  );

  return { state, actions };
}