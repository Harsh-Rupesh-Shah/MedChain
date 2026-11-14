import logging
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import socketio

from backend.app.config import CLIENT_URL, UPLOADS_DIR, BASE_DIR, CORS_ORIGINS
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

# CORS Configuration (Strict Origins Allowlist without Wildcards)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
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
# NOTE: Public static mounts of /uploads and /api/uploads were deliberately removed
# to prevent unauthorized access to sensitive medical records, doctor IDs, and facial biometric captures.
# All medical record attachments and doctor credentials are served via authenticated, authorized endpoints.

# Public models for client-side face detection
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

