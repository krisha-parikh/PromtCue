from uuid import uuid4
from datetime import datetime, timezone
import json

from app.services.groq_client import get_groq_client
from app.services.session_store import get_session
from app.schemas.session import SuggestionBatch, SuggestionItem


def _build_recent_context(session_id: str, max_chars: int) -> str:
    session = get_session(session_id)
    text = "\n".join(chunk.text for chunk in session.transcript)
    return text[-max_chars:]


def _build_dedup_context(session_id: str) -> str:
    """Return titles of the last 2 suggestion batches so the model avoids repeating them."""
    session = get_session(session_id)
    recent_batches = session.suggestion_batches[:2]  # newest first (inserted at index 0)
    titles = [s.title for batch in recent_batches for s in batch.suggestions]
    if not titles:
        return ""
    return "Recently shown suggestions (avoid repeating these):\n" + "\n".join(f"- {t}" for t in titles)


def generate_live_suggestions(session_id: str) -> SuggestionBatch:
    session = get_session(session_id)
    api_key = session.settings.groq_api_key

    context = _build_recent_context(
        session_id,
        session.settings.suggestion_context_window_chars,
    )

    if not context.strip():
        return SuggestionBatch(
            id=str(uuid4()),
            created_at=datetime.now(timezone.utc),
            based_on_chunk_ids=[],
            suggestions=[],
        )

    dedup_note = _build_dedup_context(session_id)

    user_content = f"Transcript:\n{context}"
    if dedup_note:
        user_content += f"\n\n{dedup_note}"
    user_content += '\n\nReturn exactly 3 suggestions as JSON: {"suggestions": [{"type": "...", "title": "...", "preview": "..."}]}'

    client = get_groq_client(api_key)

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            # Use the editable system prompt from settings (the rich one with type rules, etc.)
            {"role": "system", "content": session.settings.live_suggestion_prompt},
            {"role": "user", "content": user_content},
        ],
        response_format={"type": "json_object"},  # guarantees valid JSON, no parse crashes
    )

    raw = response.choices[0].message.content
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: return empty batch rather than crashing the request
        return SuggestionBatch(
            id=str(uuid4()),
            created_at=datetime.now(timezone.utc),
            based_on_chunk_ids=[],
            suggestions=[],
        )

    suggestions = parsed.get("suggestions", [])[:3]

    batch = SuggestionBatch(
        id=str(uuid4()),
        created_at=datetime.now(timezone.utc),
        based_on_chunk_ids=[c.id for c in session.transcript[-3:]],
        suggestions=[
            SuggestionItem(
                id=str(uuid4()),
                type=item.get("type", "clarification"),
                title=item.get("title", ""),
                preview=item.get("preview", ""),
                created_at=datetime.now(timezone.utc),
            )
            for item in suggestions
        ],
    )

    session.suggestion_batches.insert(0, batch)
    return batch