from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.schemas.requests import ChatRequest
from app.services.chat_service import answer_chat_stream

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat")
def chat(payload: ChatRequest):
    try:
        return StreamingResponse(
            answer_chat_stream(payload.session_id, payload.message),
            media_type="text/plain",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))