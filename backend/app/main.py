import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import socketio

from backend.app.config import CLIENT_URL, UPLOADS_DIR, BASE_DIR
from backend.app.database import db_manager, seed_initial_data_if_empty
from backend.app.services.socket import sio
from backend.app.routers import (
    auth,
    admin,
    doctors,
    patients,
    appointments,
    medical_records,
    messages,
    pharmacy
)

from bson import ObjectId
from fastapi.encoders import ENCODERS_BY_TYPE
ENCODERS_BY_TYPE[ObjectId] = str

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("medchain.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting MedChain FastAPI backend...")
    await db_manager.initialize()
    await seed_initial_data_if_empty()
    yield
    # Shutdown
    logger.info("Shutting down MedChain backend...")

app = FastAPI(
    title="MedChain API",
    description="Full-stack Healthcare & Telemedicine Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
allowed_origins = [
    CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    msg = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": msg, "detail": exc.detail}
    )

# Static file mounts
# Ensure upload directory exists
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="api_uploads")

# Models for face recognition in frontend
models_dir = BASE_DIR / "public" / "models"
if not models_dir.exists():
    models_dir = BASE_DIR / "server" / "models"
if models_dir.exists():
    app.mount("/models", StaticFiles(directory=str(models_dir)), name="models")

# Include Routers with /api prefix
api_prefix = "/api"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)
app.include_router(doctors.router, prefix=api_prefix)
app.include_router(patients.router, prefix=api_prefix)
app.include_router(appointments.router, prefix=api_prefix)
app.include_router(medical_records.router, prefix=api_prefix)
app.include_router(messages.router, prefix=api_prefix)
app.include_router(messages.chat_router, prefix=api_prefix)
app.include_router(pharmacy.router, prefix=api_prefix)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "MedChain API (FastAPI)",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected" if db_manager.db is not None else "disconnected"
    }

# Wrap FastAPI with python-socketio ASGI App
socket_app = socketio.ASGIApp(
    socketio_server=sio,
    other_asgi_app=app,
    socketio_path="socket.io"
)

