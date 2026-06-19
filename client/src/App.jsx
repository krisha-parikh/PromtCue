import { useEffect, useMemo, useRef } from "react";
import "./style.css";

import TranscriptPanel from "./components/TranscriptPanel";
import SuggestionsPanel from "./components/SuggestionPanel";
import ChatPanel from "./components/ChatPanel";
import ControlBar from "./components/ControlBar";
import SettingsModal from "./components/SettingsModal";

import useSession from "./hooks/useSession";
import useRecorder from "./hooks/useRecorder";

import {
  exportSession,
  uploadAudioChunk,
  fetchSuggestions,
  expandSuggestionStream,
  sendChatStream,
  updateSettings,
} from "./api";

function App() {
  const { state, actions } = useSession();
  const didBootstrapRef = useRef(false);
  const defaultApiKey = import.meta.env.VITE_DEFAULT_GROQ_KEY || "";

  useEffect(() => {
    const bootstrapSettings = async () => {
      if (didBootstrapRef.current) return;
      didBootstrapRef.current = true;

      actions.setIsBootstrapping(true);

      try {
        if (defaultApiKey) {
          await updateSettings({
            session_id: state.sessionId,
            groq_api_key: defaultApiKey,
            live_suggestion_prompt:
              state.savedPrompts?.live_suggestion_prompt || "",
            detailed_answer_prompt:
              state.savedPrompts?.detailed_answer_prompt || "",
            chat_prompt: state.savedPrompts?.chat_prompt || "",
            suggestion_context_window_chars: 4000,
            expand_context_window_chars: 12000,
          });

          actions.setApiKey(defaultApiKey);
        }
      } catch (err) {
        console.error("Auto settings bootstrap failed:", err);
      } finally {
        actions.setIsBootstrapping(false);
      }
    };

    bootstrapSettings();
  }, [defaultApiKey, state.sessionId, state.savedPrompts, actions]);

  const ensureApiKey = () => {
    if (state.apiKey) return true;

    actions.setError("Please enter your Groq API key in Settings.");
    actions.setSettingsOpen(true);
    return false;
  };

  const handleChunkReady = async (blob) => {
    try {
      actions.setIsTranscribing(true);
      actions.setError("");

      const transcriptResult = await uploadAudioChunk(state.sessionId, blob);
      actions.setTranscriptChunks((prev) => [...prev, transcriptResult]);

      if (transcriptResult?.text?.trim()) {
        actions.setIsFetchingSuggestions(true);

        const suggestionBatch = await fetchSuggestions(state.sessionId);

        if (suggestionBatch?.suggestions?.length > 0) {
          actions.setSuggestionBatches((prev) => [suggestionBatch, ...prev]);
        }
      }
    } catch (err) {
      console.error("Chunk processing failed:", err);
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to process audio.";
      actions.setError(detail);
    } finally {
      actions.setIsTranscribing(false);
      actions.setIsFetchingSuggestions(false);
    }
  };

  const recorder = useRecorder({
    onChunkReady: handleChunkReady,
    chunkMs: 10000,
  });

  const handleToggleRecording = async () => {
    try {
      actions.setError("");

      if (state.isBootstrapping) {
        actions.setError("App is still initializing settings. Please wait.");
        return;
      }

      if (state.isRecording) {
        recorder.stop();
        actions.setIsRecording(false);
        return;
      }

      if (!ensureApiKey()) return;

      await recorder.start();
      actions.setIsRecording(true);
    } catch (err) {
      console.error("Mic error:", err);
      actions.setError("Failed to access microphone.");
    }
  };

  const handleRefreshSuggestions = async () => {
    if (!ensureApiKey()) return;
    if (state.transcriptChunks.length === 0) return;

    try {
      actions.setIsFetchingSuggestions(true);
      actions.setError("");

      const suggestionBatch = await fetchSuggestions(state.sessionId);

      if (suggestionBatch?.suggestions?.length > 0) {
        actions.setSuggestionBatches((prev) => [suggestionBatch, ...prev]);
      }
    } catch (err) {
      console.error("Refresh suggestions failed:", err);
      actions.setError("Failed to refresh suggestions.");
    } finally {
      actions.setIsFetchingSuggestions(false);
    }
  };

  const handleExpandSuggestion = async (suggestion) => {
    if (!ensureApiKey()) return;

    const assistantId = crypto.randomUUID();

    try {
      actions.setIsSendingChat(true);
      actions.setError("");

      actions.setChatMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          text: `Expand suggestion: ${suggestion.title}`,
        },
        {
          id: assistantId,
          role: "assistant",
          text: "",
          isStreaming: true,
          relatedSuggestionId: suggestion.id,
        },
      ]);

      await expandSuggestionStream(state.sessionId, suggestion.id, (chunk) => {
        actions.setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, text: (msg.text || "") + chunk }
              : msg
          )
        );
      });

      actions.setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (err) {
      console.error("Expand suggestion failed:", err);
      actions.setError("Failed to expand suggestion.");

      actions.setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                isStreaming: false,
                text: msg.text || "No response generated.",
              }
            : msg
        )
      );
    } finally {
      actions.setIsSendingChat(false);
    }
  };

  const handleSendMessage = async (message) => {
    if (!ensureApiKey()) return;

    const assistantId = crypto.randomUUID();

    try {
      actions.setIsSendingChat(true);
      actions.setError("");

      actions.setChatMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "user",
          text: message,
        },
        {
          id: assistantId,
          role: "assistant",
          text: "",
          isStreaming: true,
        },
      ]);

      await sendChatStream(state.sessionId, message, (chunk) => {
        actions.setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? { ...msg, text: (msg.text || "") + chunk }
              : msg
          )
        );
      });

      actions.setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, isStreaming: false } : msg
        )
      );
    } catch (err) {
      console.error("Send chat failed:", err);
      actions.setError("Failed to send chat.");

      actions.setChatMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                isStreaming: false,
                text: msg.text || "No response generated.",
              }
            : msg
        )
      );
    } finally {
      actions.setIsSendingChat(false);
    }
  };

  const handleSaveSettings = async (formValues) => {
    try {
      actions.setError("");

      await updateSettings({
        session_id: state.sessionId,
        ...formValues,
      });

      actions.setApiKey(formValues.groq_api_key || "");
      actions.setSavedPrompts({
        live_suggestion_prompt: formValues.live_suggestion_prompt,
        detailed_answer_prompt: formValues.detailed_answer_prompt,
        chat_prompt: formValues.chat_prompt,
      });

      actions.setSettingsOpen(false);
    } catch (err) {
      console.error("Save settings failed:", err);
      actions.setError("Failed to save settings.");
    }
  };

  const handleExport = async () => {
    try {
      actions.setError("");

      const data = await exportSession(state.sessionId);

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = `${state.sessionId}.json`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      actions.setError("Failed to export session.");
    }
  };

  const handleClearSession = () => {
    if (state.isRecording) {
      recorder.stop();
      actions.setIsRecording(false);
    }

    actions.resetSession();
  };

  const settingsDefaultValues = useMemo(
    () => ({
      groq_api_key: state.apiKey || defaultApiKey || "",
      live_suggestion_prompt:
        state.savedPrompts?.live_suggestion_prompt || "",
      detailed_answer_prompt:
        state.savedPrompts?.detailed_answer_prompt || "",
      chat_prompt: state.savedPrompts?.chat_prompt || "",
      suggestion_context_window_chars: 4000,
      expand_context_window_chars: 12000,
    }),
    [state.apiKey, defaultApiKey, state.savedPrompts]
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>PromptCue - Real-time meeting copilot</h1>
      </header>

      {state.error && <div className="error-banner">{state.error}</div>}

      <ControlBar
        apiKey={state.apiKey}
        isRecording={state.isRecording}
        isTranscribing={state.isTranscribing}
        isFetchingSuggestions={state.isFetchingSuggestions}
        onToggleRecording={handleToggleRecording}
        onRefresh={handleRefreshSuggestions}
        onExport={handleExport}
        onOpenSettings={() => actions.setSettingsOpen(true)}
        onClearSession={handleClearSession}
      />

      <div className="layout">
        <TranscriptPanel
          transcriptChunks={state.transcriptChunks}
          isRecording={state.isRecording}
          isTranscribing={state.isTranscribing}
        />

        <SuggestionsPanel
          suggestionBatches={state.suggestionBatches}
          onExpandSuggestion={handleExpandSuggestion}
          isFetchingSuggestions={state.isFetchingSuggestions}
        />

        <ChatPanel
          chatMessages={state.chatMessages}
          onSendMessage={handleSendMessage}
          isSendingChat={state.isSendingChat}
        />
      </div>

      <SettingsModal
        isOpen={state.settingsOpen}
        onClose={() => actions.setSettingsOpen(false)}
        onSave={handleSaveSettings}
        defaultValues={settingsDefaultValues}
      />
    </div>
  );
}

export default App;
