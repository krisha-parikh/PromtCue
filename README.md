# PromptCue — Real-Time AI Meeting Copilot

**Live demo:** https://incredible-mochi-6de56f.netlify.app/

PromptCue is a full-stack AI meeting assistant I built to solve a problem I kept running into: conversations move fast, and it's hard to stay present while also tracking action items, thinking of the right follow-up questions, or recalling relevant context mid-discussion.

The app listens to live microphone audio, transcribes speech in real time, and surfaces three context-aware suggestions — all without interrupting the flow of the conversation. A persistent chat panel lets you ask deeper follow-up questions at any point during the session.

---

## Why I Built This

Most AI tools require you to stop the conversation and ask for help. I wanted something that worked *alongside* a conversation — observing what's being said and offering relevant prompts without you having to think about it. The core challenge was making this feel fast and unobtrusive, which drove most of the technical decisions around streaming, prompt design, and context windowing.

---

## Features

- Live microphone capture with chunked uploads for near-real-time transcription
- Transcript history panel that appends recognized speech over time
- 3 AI-generated suggestions refreshed per audio batch, tuned to the current conversation context
- Click-to-expand suggestions for longer, more detailed assistant responses
- Chat panel for follow-up questions with full markdown rendering
- Settings modal for API key, editable prompts, and context-window tuning
- Session export as JSON for later review

---

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React, Vite, React Markdown, remark-gfm |
| Backend | FastAPI, Python |
| AI / LLM | Groq API, Whisper Large V3, GPT-OSS 120B |
| Transport | Axios (JSON/multipart), Fetch API (streaming) |

---

## How It Works

1. The recorder captures audio from the browser microphone and emits chunks on a set interval.
2. Each chunk is uploaded to the FastAPI backend as `multipart/form-data`.
3. The backend transcribes the audio via Whisper Large V3 and stores the transcript text in the current session.
4. The frontend requests a fresh batch of 3 suggestions derived from recent transcript context.
5. Clicking a suggestion opens a longer-form streamed response in the chat panel.
6. Users can also type custom questions directly into the chat box.
7. The full session can be exported as JSON at any time.

---

## Prompt Strategy

The core insight here is that the user's intent differs at each stage, so one prompt path doesn't fit all. PromptCue uses three distinct prompts:

- **Live suggestion prompt** — optimized for short, immediately useful prompts that surface during the conversation. Uses a smaller transcript window to prioritize latency.
- **Detailed answer prompt** — triggered when a user clicks a suggestion. Uses a wider context window for more complete, grounded responses.
- **Chat prompt** — handles open-ended follow-up questions. Designed for depth and conversational tone.

The tradeoff is prompt-maintenance overhead in exchange for much better output quality at each stage.

---

## Streaming Implementation

The chat UI inserts an empty assistant message before the request starts, then appends text into that same message as chunks arrive using `response.body.getReader()`. This avoids the jarring experience of waiting for the full response before anything renders.

---

## Project Structure

```
prompts/
  liveSuggestion.js
  detailedAnswer.js
  chatPrompt.js
src/
  components/
    ControlBar.jsx
    TranscriptPanel.jsx
    SuggestionPanel.jsx
    ChatPanel.jsx
    SettingsModal.jsx
  hooks/
    useSession.js
    useRecorder.js
  api.js
  App.jsx
backend/
  routes/
  services/
```

`api.js` handles transport and streaming. `useSession.js` manages per-session UI state. `useRecorder.js` handles microphone chunking. `App.jsx` coordinates the overall flow.

---

## API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/transcribe` | POST | Upload one audio chunk and return transcript |
| `/api/suggestions` | POST | Generate 3 live suggestions from transcript context |
| `/api/suggestions/expand` | POST | Stream a detailed answer for one suggestion |
| `/api/chat` | POST | Stream a follow-up assistant answer |
| `/api/settings/update` | POST | Save API key, prompts, and context settings |
| `/api/export/{sessionId}` | GET | Export session data as JSON |

---

## Setup

**Environment variables** — create a `.env` file in the frontend:

```
VITE_API_URL=http://127.0.0.1:8000/api
VITE_DEFAULT_GROQ_KEY=
```

**Frontend:**

```bash
npm install
npm run dev
```

**Backend:**

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## Design Tradeoffs

- **Session-only storage** — no database persistence keeps the stack simple and the UX fast; sessions export to JSON if you need to save them.
- **Chunk-based suggestion refresh** — easier to reason about and debug than fully token-level orchestration, while still feeling real-time.
- **Separate prompts per task** — more to maintain, but meaningfully better output quality at each stage.
- **Streaming chat + batch suggestions** — streaming where latency matters most (chat), batch refresh where consistency matters (suggestions).

---

## Common Issues

**Settings button does nothing**
Check that `ControlBar` receives `onOpenSettings`, and that `App.jsx` passes `onOpenSettings={() => actions.setSettingsOpen(true)}`. A prop name mismatch like `settingsOpen` vs `isSettingsOpen` will silently break the modal.

**Chat shows "No response generated"**
The assistant placeholder message needs to be inserted *before* streaming starts. If the stream callback isn't appending into the existing assistant message, nothing renders.

**Audio upload fails**
Multipart uploads require `Content-Type: multipart/form-data`. A missing or incorrect header here is the most common culprit.
