import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "https://promtcue-2.onrender.com";
const api = axios.create({ baseURL: BASE_URL });

export const uploadAudioChunk = async (sessionId, blob) => {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("file", blob, "chunk.webm");

  const response = await api.post("/transcribe", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const fetchSuggestions = async (sessionId) => {
  const response = await api.post("/suggestions", {
    session_id: sessionId,
  });
  return response.data;
};

export const updateSettings = async (payload) => {
  const response = await api.post("/settings/update", payload);
  return response.data;
};

export const exportSession = async (sessionId) => {
  const response = await api.get(`/export/${sessionId}`);
  return response.data;
};

export const expandSuggestionStream = async (sessionId, suggestionId, onChunk) => {
  const response = await fetch(`${BASE_URL}/suggestions/expand`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      suggestion_id: suggestionId,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to expand suggestion");
  }

  return readStream(response, onChunk);
};

export const sendChatStream = async (sessionId, message, onChunk) => {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      message,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Failed to send chat");
  }

  return readStream(response, onChunk);
};

async function readStream(response, onChunk) {
  if (!response.body || !response.body.getReader) {
    const text = await response.text();
    if (text && onChunk) onChunk(text);
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    full += chunk;
    if (onChunk) onChunk(chunk);
  }

  full += decoder.decode();
  return full;
}

export default api;
