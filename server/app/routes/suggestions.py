from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas.requests import SuggestionRequest, ExpandSuggestionRequest
from app.schemas.responses import SuggestionBatchResponse, SuggestionCardResponse
from app.services.suggestion_service import generate_live_suggestions
from app.services.chat_service import expand_suggestion_stream

router = APIRouter(prefix="/api", tags=["suggestions"])


@router.post("/suggestions", response_model=SuggestionBatchResponse)
def suggestions(payload: SuggestionRequest):
    try:
        batch = generate_live_suggestions(payload.session_id)
        return SuggestionBatchResponse(
            batch_id=batch.id,
            created_at=batch.created_at.isoformat(),
            suggestions=[
                SuggestionCardResponse(
                    id=s.id,
                    type=s.type,
                    title=s.title,
                    preview=s.preview,
                    created_at=s.created_at.isoformat(),
                )
                for s in batch.suggestions
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/suggestions/expand")
def expand(payload: ExpandSuggestionRequest):
    try:
        return StreamingResponse(
            expand_suggestion_stream(payload.session_id, payload.suggestion_id),
            media_type="text/plain",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))