from datetime import datetime, timezone
from app.schemas.session import SessionState, SessionSettings
from app.prompts.live_suggestions import DEFAULT_LIVE_SUGGESTION_PROMPT
from app.prompts.detailed_answer import DEFAULT_DETAILED_ANSWER_PROMPT
from app.prompts.chat_prompt import DEFAULT_CHAT_PROMPT


_sessions: dict[str, SessionState] = {}


def create_or_get_session(session_id: str) -> SessionState:
    if session_id not in _sessions:
        _sessions[session_id] = SessionState(
            session_id=session_id,
            created_at=datetime.now(timezone.utc),
            settings=SessionSettings(
                live_suggestion_prompt=DEFAULT_LIVE_SUGGESTION_PROMPT,
                detailed_answer_prompt=DEFAULT_DETAILED_ANSWER_PROMPT,
                chat_prompt=DEFAULT_CHAT_PROMPT,
                suggestion_context_window_chars=4000,
                expand_context_window_chars=12000,
            ),
        )
    return _sessions[session_id]


def get_session(session_id: str) -> SessionState:
    return create_or_get_session(session_id)


def update_api_key(session_id: str, api_key: str) -> SessionState:
    session = create_or_get_session(session_id)
    session.settings.groq_api_key = api_key
    return session


def all_sessions() -> dict[str, SessionState]:
    return _sessions