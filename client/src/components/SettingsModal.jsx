import { useEffect, useState } from "react";
import DEFAULT_LIVE_SUGGESTION_PROMPT from "../prompts/liveSuggestion";
import DEFAULT_DETAILED_ANSWER_PROMPT from "../prompts/detailedAnswer";
import DEFAULT_CHAT_PROMPT from "../prompts/chatPrompt";

function SettingsModal({ isOpen, onClose, onSave, defaultValues }) {
  const [form, setForm] = useState({
    groq_api_key: "",
    live_suggestion_prompt: DEFAULT_LIVE_SUGGESTION_PROMPT,
    detailed_answer_prompt: DEFAULT_DETAILED_ANSWER_PROMPT,
    chat_prompt: DEFAULT_CHAT_PROMPT,
    suggestion_context_window_chars: 4000,
    expand_context_window_chars: 12000,
  });

  useEffect(() => {
    if (defaultValues) {
      setForm({
        groq_api_key: defaultValues.groq_api_key || "",
        live_suggestion_prompt:
          defaultValues.live_suggestion_prompt || DEFAULT_LIVE_SUGGESTION_PROMPT,
        detailed_answer_prompt:
          defaultValues.detailed_answer_prompt || DEFAULT_DETAILED_ANSWER_PROMPT,
        chat_prompt: defaultValues.chat_prompt || DEFAULT_CHAT_PROMPT,
        suggestion_context_window_chars:
          defaultValues.suggestion_context_window_chars || 4000,
        expand_context_window_chars:
          defaultValues.expand_context_window_chars || 12000,
      });
    }
  }, [defaultValues, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Settings</h2>
            <p>Paste your Groq API key and adjust prompts or context windows.</p>
          </div>

          <button className="close-btn" onClick={onClose} type="button">
            ×
          </button>
        </div>

        <form className="settings-form" onSubmit={handleSubmit}>
          <label>
            Groq API Key
            <input
              type="password"
              value={form.groq_api_key}
              onChange={(e) => handleChange("groq_api_key", e.target.value)}
              placeholder="gsk_..."
            />
          </label>

          <label>
            Live Suggestion Prompt
            <textarea
              rows="10"
              value={form.live_suggestion_prompt}
              onChange={(e) =>
                handleChange("live_suggestion_prompt", e.target.value)
              }
              placeholder="Prompt used for live suggestions..."
            />
          </label>

          <label>
            Detailed Answer Prompt
            <textarea
              rows="9"
              value={form.detailed_answer_prompt}
              onChange={(e) =>
                handleChange("detailed_answer_prompt", e.target.value)
              }
              placeholder="Prompt used when a suggestion is expanded..."
            />
          </label>

          <label>
            Chat Prompt
            <textarea
              rows="9"
              value={form.chat_prompt}
              onChange={(e) => handleChange("chat_prompt", e.target.value)}
              placeholder="Prompt used for direct chat questions..."
            />
          </label>

          <label>
            Suggestion Context Window (chars)
            <input
              type="number"
              value={form.suggestion_context_window_chars}
              onChange={(e) =>
                handleChange(
                  "suggestion_context_window_chars",
                  Number(e.target.value)
                )
              }
              min="500"
              step="500"
            />
          </label>

          <label>
            Expand Context Window (chars)
            <input
              type="number"
              value={form.expand_context_window_chars}
              onChange={(e) =>
                handleChange(
                  "expand_context_window_chars",
                  Number(e.target.value)
                )
              }
              min="1000"
              step="500"
            />
          </label>

          <div className="modal-actions">
            <button
              className="panel-btn secondary"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>

            <button className="panel-btn" type="submit">
              Save settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettingsModal;