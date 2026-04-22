from datetime import datetime, timezone
from uuid import uuid4
from app.schemas.session import TranscriptChunk
from app.services.groq_client import get_groq_client
from app.services.session_store import get_session


def transcribe_audio_bytes(
    *,
    session_id: str,
    filename: str,
    file_bytes: bytes,
    api_key: str | None = None,
) -> TranscriptChunk:
    session = get_session(session_id)
    final_api_key = api_key or session.settings.groq_api_key

    print("DEBUG transcript service key exists:", bool(final_api_key))
    print("DEBUG transcript service key prefix:", final_api_key[:8] if final_api_key else None)

    client = get_groq_client(final_api_key)

    transcription = client.audio.transcriptions.create(
        file=(filename, file_bytes),
        model="whisper-large-v3",
        response_format="verbose_json",
        language="en",
        temperature=0.0,
    )

    print("DEBUG transcription text:", transcription.text[:100] if transcription.text else None)

    chunk = TranscriptChunk(
        id=str(uuid4()),
        text=transcription.text,
        created_at=datetime.now(timezone.utc),
    )

    session.transcript.append(chunk)
    return chunk