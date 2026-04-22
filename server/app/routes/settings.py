from fastapi import APIRouter, HTTPException
from app.schemas.requests import ValidateKeyRequest, UpdateSettingsRequest
from app.schemas.responses import ValidateKeyResponse
from app.services.groq_client import test_api_key
from app.services.session_store import create_or_get_session, update_api_key

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.post("/validate-key", response_model=ValidateKeyResponse)
def validate_key(payload: ValidateKeyRequest):
    try:
        test_api_key(payload.api_key)
        return ValidateKeyResponse(valid=True, message="API key is valid.")
    except Exception as e:
        print("VALIDATE KEY ERROR:", repr(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/update")
def update_settings(payload: UpdateSettingsRequest):
    session = create_or_get_session(payload.session_id)

    if payload.groq_api_key:
        update_api_key(payload.session_id, payload.groq_api_key)

    session.settings.live_suggestion_prompt = payload.live_suggestion_prompt
    session.settings.detailed_answer_prompt = payload.detailed_answer_prompt
    session.settings.chat_prompt = payload.chat_prompt
    session.settings.suggestion_context_window_chars = payload.suggestion_context_window_chars
    session.settings.expand_context_window_chars = payload.expand_context_window_chars

    print("DEBUG update session key exists:", bool(session.settings.groq_api_key))
    print(
        "DEBUG update session key prefix:",
        session.settings.groq_api_key[:8] if session.settings.groq_api_key else None
    )

    return {"ok": True}