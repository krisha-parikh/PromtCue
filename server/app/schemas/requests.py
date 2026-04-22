from pydantic import BaseModel, Field
from typing import Optional


class ValidateKeyRequest(BaseModel):
    api_key: str = Field(..., min_length=10)


class SessionInitRequest(BaseModel):
    session_id: str


class SuggestionRequest(BaseModel):
    session_id: str


class ExpandSuggestionRequest(BaseModel):
    session_id: str
    suggestion_id: str


class ChatRequest(BaseModel):
    session_id: str
    message: str = Field(..., min_length=1)


class UpdateSettingsRequest(BaseModel):
    session_id: str
    groq_api_key: Optional[str] = None
    live_suggestion_prompt: str = ""
    detailed_answer_prompt: str = ""
    chat_prompt: str = ""
    suggestion_context_window_chars: int = 4000
    expand_context_window_chars: int = 12000