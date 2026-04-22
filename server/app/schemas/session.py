from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone


SuggestionType = Literal["question", "talking_point", "answer", "fact_check", "clarification"]


class TranscriptChunk(BaseModel):
    id: str
    text: str
    created_at: datetime
    audio_start_ms: Optional[int] = None
    audio_end_ms: Optional[int] = None


class SuggestionItem(BaseModel):
    id: str
    type: SuggestionType
    title: str
    preview: str
    created_at: datetime


class SuggestionBatch(BaseModel):
    id: str
    created_at: datetime
    based_on_chunk_ids: List[str] = Field(default_factory=list)
    suggestions: List[SuggestionItem] = Field(default_factory=list)


class ChatMessage(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    text: str
    created_at: datetime
    related_suggestion_id: Optional[str] = None


class SessionSettings(BaseModel):
    groq_api_key: Optional[str] = None
    live_suggestion_prompt: str
    detailed_answer_prompt: str
    chat_prompt: str
    suggestion_context_window_chars: int = 4000
    expand_context_window_chars: int = 12000


class SessionState(BaseModel):
    session_id: str
    created_at: datetime
    transcript: List[TranscriptChunk] = Field(default_factory=list)
    suggestion_batches: List[SuggestionBatch] = Field(default_factory=list)
    chat_history: List[ChatMessage] = Field(default_factory=list)
    settings: SessionSettings