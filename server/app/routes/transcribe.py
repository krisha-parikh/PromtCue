from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.responses import TranscriptResponse
from app.services.session_store import create_or_get_session, get_session
from app.services.transcript_service import transcribe_audio_bytes

router = APIRouter(prefix="/api", tags=["transcribe"])


@router.post("/transcribe", response_model=TranscriptResponse)
async def transcribe(
    session_id: str = Form(...),
    file: UploadFile = File(...)
):
    try:
        session = create_or_get_session(session_id)

        print("DEBUG session_id:", session_id)
        print("DEBUG stored session key exists:", bool(session.settings.groq_api_key))
        print(
            "DEBUG stored session key prefix:",
            session.settings.groq_api_key[:8] if session.settings.groq_api_key else None
        )

        file_bytes = await file.read()

        print("DEBUG filename:", file.filename)
        print("DEBUG file size:", len(file_bytes))

        chunk = transcribe_audio_bytes(
            session_id=session_id,
            filename=file.filename or "audio.webm",
            file_bytes=file_bytes,
        )

        return TranscriptResponse(
            chunk_id=chunk.id,
            text=chunk.text,
            created_at=chunk.created_at.isoformat(),
        )

    except Exception as e:
        print("TRANSCRIBE ERROR:", repr(e))
        raise HTTPException(status_code=400, detail=str(e))