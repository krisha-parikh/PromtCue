from pydantic import BaseModel
from typing import List, Optional


class HealthResponse(BaseModel):
    status: str


class ValidateKeyResponse(BaseModel):
    valid: bool
    message: str


class TranscriptResponse(BaseModel):
    chunk_id: str
    text: str
    created_at: str


class SuggestionCardResponse(BaseModel):
    id: str
    type: str
    title: str
    preview: str
    created_at: str


class SuggestionBatchResponse(BaseModel):
    batch_id: str
    created_at: str
    suggestions: List[SuggestionCardResponse]


class ChatResponse(BaseModel):
    reply: str
    created_at: str
    related_suggestion_id: Optional[str] = None