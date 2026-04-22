import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.routes.settings import router as settings_router
from app.routes.transcribe import router as transcribe_router
from app.routes.suggestions import router as suggestions_router
from app.routes.chat import router as chat_router
from app.routes.export import router as export_router

app = FastAPI(
    title="PromptCue Backend",
    version="1.0.0"
)

# ✅ CORS
_raw_origins = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
allowed_origins = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ✅ allow all (for now)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Include routers
app.include_router(settings_router)
app.include_router(transcribe_router)
app.include_router(suggestions_router)
app.include_router(chat_router)
app.include_router(export_router)

# ✅ Root route
@app.get("/")
def root():
    return {"message": "API is running"}

# ✅ Favicon (safe)
@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("favicon.ico")
