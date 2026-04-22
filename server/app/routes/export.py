from fastapi import APIRouter, HTTPException
from app.services.session_store import get_session

router = APIRouter(prefix="/api", tags=["export"])


@router.get("/export/{session_id}")
def export_session(session_id: str):
    try:
        session = get_session(session_id)
        return session.model_dump()
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))