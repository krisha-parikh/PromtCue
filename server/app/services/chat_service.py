from datetime import datetime, timezone
from uuid import uuid4
from typing import Iterator

from app.services.groq_client import get_groq_client
from app.services.session_store import get_session
from app.schemas.session import ChatMessage


def _get_recent_transcript(session_id: str, max_chars: int) -> str:
    session = get_session(session_id)
    text = "\n".join(chunk.text for chunk in session.transcript)
    return text[-max_chars:]


# -------------------------------
# STREAM: EXPAND SUGGESTION
# -------------------------------
def expand_suggestion_stream(session_id: str, suggestion_id: str) -> Iterator[str]:
    session = get_session(session_id)
    api_key = session.settings.groq_api_key

    context = _get_recent_transcript(
        session_id,
        session.settings.expand_context_window_chars
    )

    selected = None
    for batch in session.suggestion_batches:
        for suggestion in batch.suggestions:
            if suggestion.id == suggestion_id:
                selected = suggestion
                break
        if selected:
            break

    if not selected:
        raise ValueError("Suggestion not found.")

    base_prompt = session.settings.detailed_answer_prompt or """
You are a helpful AI assistant.

Expand the suggestion into a clear, useful, and practical response.
Do not return empty answers.
"""

    prompt = f"""{base_prompt}

Selected suggestion:
Type: {selected.type}
Title: {selected.title}
Preview: {selected.preview}

Transcript context:
{context or "No transcript available."}
"""

    client = get_groq_client(api_key)

    stream = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )

    collected = []

    for chunk in stream:
        delta = getattr(chunk.choices[0].delta, "content", None)
        if delta:
            collected.append(delta)
            yield delta

    full_reply = "".join(collected).strip()

    # 🔥 Fallback if streaming fails
    if not full_reply:
        print("DEBUG: expand stream failed, retrying without stream...")

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
        )

        full_reply = response.choices[0].message.content or "No response generated."

    session.chat_history.append(
        ChatMessage(
            id=str(uuid4()),
            role="assistant",
            text=full_reply,
            created_at=datetime.now(timezone.utc),
            related_suggestion_id=suggestion_id,
        )
    )


# -------------------------------
# STREAM: CHAT ANSWER
# -------------------------------
def answer_chat_stream(session_id: str, user_message: str) -> Iterator[str]:
    session = get_session(session_id)
    api_key = session.settings.groq_api_key

    context = _get_recent_transcript(
        session_id,
        session.settings.expand_context_window_chars
    )

    session.chat_history.append(
        ChatMessage(
            id=str(uuid4()),
            role="user",
            text=user_message,
            created_at=datetime.now(timezone.utc),
        )
    )

    base_prompt = session.settings.chat_prompt or """
You are a helpful AI assistant.

Give clear, correct, and useful answers.
Do not return empty responses.
"""

    prompt = f"""{base_prompt}

Transcript context:
{context or "No transcript available."}

User question:
{user_message}
"""

    client = get_groq_client(api_key)

    stream = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )

    collected = []

    for chunk in stream:
        delta = getattr(chunk.choices[0].delta, "content", None)
        if delta:
            collected.append(delta)
            yield delta

    full_reply = "".join(collected).strip()

    # 🔥 Fallback if streaming fails
    if not full_reply:
        print("DEBUG: chat stream failed, retrying without stream...")

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
        )

        full_reply = response.choices[0].message.content or "No response generated."

    session.chat_history.append(
        ChatMessage(
            id=str(uuid4()),
            role="assistant",
            text=full_reply,
            created_at=datetime.now(timezone.utc),
        )
    )


# -------------------------------
# NON-STREAMING WRAPPERS
# -------------------------------
def expand_suggestion(session_id: str, suggestion_id: str) -> ChatMessage:
    text = "".join(expand_suggestion_stream(session_id, suggestion_id)).strip()

    if not text:
        text = "No response generated."

    return ChatMessage(
        id=str(uuid4()),
        role="assistant",
        text=text,
        created_at=datetime.now(timezone.utc),
        related_suggestion_id=suggestion_id,
    )


def answer_chat(session_id: str, user_message: str) -> ChatMessage:
    text = "".join(answer_chat_stream(session_id, user_message)).strip()

    if not text:
        text = "No response generated."

    return ChatMessage(
        id=str(uuid4()),
        role="assistant",
        text=text,
        created_at=datetime.now(timezone.utc),
    )