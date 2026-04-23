Link = https://incredible-mochi-6de56f.netlify.app/

TwinMind(PrompCue) — Real Time AI Meeting Copilot
PromptCue is a full-stack meeting copilot built for the TwinMind take-home assignment. It listens to live microphone audio, transcribes speech in chunks, generates three context-aware live suggestions, and supports a follow-up chat panel for detailed answers. The frontend is built with React and Vite, while the backend exposes FastAPI endpoints for transcription, suggestion generation, chat, settings, and session export.

This project was designed around the core assignment goal: showing the right thing at the right time during a real conversation. The implementation focuses on prompt quality, transcript-context selection, streaming answers, low-friction UX, and clean full-stack structure.

Assignment Context
The TwinMind assignment asks for a web app with three columns: transcript on the left, live suggestions in the middle, and chat on the right. It also emphasizes prompt engineering quality, latency, real-time usefulness, settings customization, session export, and clean code over unnecessary product complexity.

The app follows that structure closely:

Left panel: live transcript from microphone chunks.

Middle panel: exactly 3 refreshed suggestions per batch.

Right panel: detailed answer/chat area.

Settings modal: editable prompts, API key, and context windows.

Export: session transcript, suggestion batches, and chat history.

Models Used
This implementation follows the assignment requirement to use Groq for all AI tasks:

Transcription: Whisper Large V3 via Groq speech-to-text.
​

Suggestions and chat: GPT-OSS 120B on Groq, as required by the assignment text you provided.

In other words, the README should clearly state that GPT-OSS 120B was used for live suggestions, detailed suggestion expansion, and chat answers, while Whisper handled transcription.

Features
Live microphone capture with chunked uploads for near-real-time transcription.

Transcript history panel that appends recognized speech over time.

AI-generated live suggestions based on recent transcript context.

Click-to-expand suggestions for longer assistant responses.

Direct chat panel for follow-up questions with markdown rendering.

Settings modal for API key, prompts, and context-window tuning.

Session export as JSON for later review or debugging.

Streaming assistant responses for better perceived latency.

Tech Stack
Layer	Tools
Frontend	React, Vite, React Markdown, remark-gfm
Backend	FastAPI, Python
AI/LLM	Groq, Whisper Large V3, GPT-OSS 120B
Transport	Axios for JSON/multipart requests, Fetch for streaming chat
Groq’s speech-to-text documentation shows support for uploaded audio transcription, which aligns with the transcription path in this app.
​

Project Goals
The project is intentionally optimized around the areas TwinMind said they evaluate most heavily:

Live suggestion quality: three useful, context-sensitive prompts per refresh.

Detailed answer quality: stronger expansion prompt with wider transcript context.

Prompt engineering: different prompt paths for live suggestions, expansion, and direct chat.

Latency: lightweight frontend rendering and streaming assistant responses.

Code quality: separated UI, session state, recording, and API logic.

Project Structure
text
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
The exact backend folder names can vary, but the application behavior centers around endpoints such as /transcribe, /suggestions, /suggestions/expand, /chat, /settings/update, and /export/:sessionId, which matches common FastAPI full-stack layouts.

How It Works
The recorder captures audio from the browser microphone and emits chunks on an interval.

Each chunk is uploaded to the backend using multipart/form-data.

The backend transcribes the audio and stores transcript text in the current session.

The frontend requests a fresh batch of exactly 3 suggestions derived from recent transcript context.

Clicking a suggestion adds it to the chat and opens a longer-form streamed response.

Users can also type direct questions into the chat panel.

The full session can be exported for evaluation.

Using response.body.getReader() is the standard browser pattern for consuming streamed fetch responses chunk by chunk.
​

Prompt Strategy
This project uses three separate prompt paths because the user intent is different in each case:

Live suggestion prompt: optimized for short, high-value, immediate suggestions during the conversation.

Detailed answer prompt: optimized for deeper explanation when the user clicks a suggestion.

Chat prompt: optimized for open-ended follow-up questions in the session chat.

The key tradeoff is balancing context richness against latency. Live suggestions use a smaller transcript window to stay fast and timely, while expanded answers use a larger window to provide more complete guidance.

Environment Variables
Create a .env file in the frontend if you want configurable runtime values:

text
VITE_API_URL=http://127.0.0.1:8000/api
VITE_DEFAULT_GROQ_KEY=
VITE_API_URL avoids hardcoding the backend origin, which is a common pattern in React/Vite + FastAPI setups.

Frontend Setup
Install dependencies and start the Vite dev server:

bash
npm install
npm run dev
Vite is commonly used in React/FastAPI full-stack templates because it enables fast development feedback loops.

Backend Setup
Create a Python virtual environment, install backend dependencies, and run FastAPI:

bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
FastAPI’s project guidance commonly uses uvicorn for local API development.
​

API Endpoints
Endpoint	Method	Purpose
/api/transcribe	POST	Upload one audio chunk and return transcript data
/api/suggestions	POST	Generate three live suggestions from transcript context
/api/suggestions/expand	POST	Stream a detailed answer for one suggestion
/api/chat	POST	Stream a follow-up assistant answer
/api/settings/update	POST	Save API key, prompts, and context settings
/api/export/{sessionId}	GET	Export session data as JSON
Streaming Chat Notes
The chat UI inserts an empty assistant message before the request starts and then appends text into that same message as chunks arrive. This avoids the common problem where the UI waits for the entire response before rendering anything meaningful.

A typical helper reads from response.body.getReader(), decodes each chunk with TextDecoder, and updates the same assistant message in React state.
​

Common Issues
Settings button does nothing
Check that:

ControlBar receives onOpenSettings.

The button uses onClick={onOpenSettings}.

App.jsx passes onOpenSettings={() => actions.setSettingsOpen(true)}.

SettingsModal uses isOpen={state.settingsOpen}.

A mismatch such as settingsOpen vs isSettingsOpen can make the modal appear broken.

Chat says “No response generated”
This usually means the assistant placeholder message is not inserted before streaming starts, or the stream callback is not appending text into the existing assistant message.

Audio upload fails
For multipart uploads, the header should be multipart/form-data, not a misspelled variant. Multipart upload examples for speech-to-text flows use that format.
​

Tradeoffs
Session-only storage: simpler and aligned with the assignment, but not persistent across full reloads.

Chunk-based refresh: easier to reason about and debug than fully token-level live orchestration, while still matching the assignment’s ~30-second rhythm.

Separate prompts by task: adds prompt-maintenance overhead, but improves control and output quality.

Streaming chat with standard suggestion refresh: keeps the implementation simpler while improving perceived responsiveness where it matters most.

Example User Flow
Open the app and paste a Groq API key in Settings.

Start recording from the mic button.

Wait for transcript chunks and live suggestions to appear.

Click a suggestion to expand it into a detailed answer.

Ask a custom follow-up in the chat box.

Export the session JSON when done.

Deliverables Alignment
This repository is intended to support the full TwinMind submission package:

Public deployed URL.

Public or shared GitHub repository.

README with setup, stack choices, prompt strategy, and tradeoffs.

Working mic, transcript, suggestions, chat, settings, and export flow.

Development Notes
api.js handles transport and streaming details.

useSession.js handles per-session UI state.

useRecorder.js handles microphone chunking behavior.

ChatPanel.jsx handles markdown rendering and message input.

App.jsx coordinates the overall flow between transcript, suggestions, chat, export, and settings.

That separation follows common React/FastAPI project organization patterns where API access, state, and presentation are kept distinct for maintainability
