import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env in project root, or server/.env
env_path = BASE_DIR / ".env"
if not env_path.exists():
    env_path = BASE_DIR / "server" / ".env"
load_dotenv(dotenv_path=env_path)

# Load local overrides from .env.local if present (never committed to git)
local_env = BASE_DIR / ".env.local"
if local_env.exists():
    load_dotenv(dotenv_path=local_env, override=True)

PORT = int(os.getenv("PORT", 8000))
MONGODB_URI = os.getenv("MONGODB_URI", "")
JWT_SECRET = os.getenv("JWT_SECRET", "3a7d5f9b2c4e6a8d1f0e3c5b7a9d2e4f6a8c1d3e5f7b9a2c4e6d8f0a1b3c5d7e9")
NODE_ENV = os.getenv("NODE_ENV", "development")
CLIENT_URL = os.getenv("CLIENT_URL", "http://localhost:5173")

# SMTP Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "no-reply@medchain.local"))

# Gmail OAuth API Configuration
GMAIL_CLIENT_ID = os.getenv("GMAIL_CLIENT_ID", "")
GMAIL_CLIENT_SECRET = os.getenv("GMAIL_CLIENT_SECRET", "")
GMAIL_REFRESH_TOKEN = os.getenv("GMAIL_REFRESH_TOKEN", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", SMTP_USER or "no-reply@medchain.local")

# Google Meet Video Consultation Configuration
GOOGLE_MEET_LINK = os.getenv("GOOGLE_MEET_LINK", "https://meet.google.com/new")

# Upload directories
UPLOADS_DIR = BASE_DIR / "server" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
(UPLOADS_DIR / "doctor-ids").mkdir(parents=True, exist_ok=True)
(UPLOADS_DIR / "faces").mkdir(parents=True, exist_ok=True)
(UPLOADS_DIR / "medical-records").mkdir(parents=True, exist_ok=True)

# Also ensure top-level uploads exists
ROOT_UPLOADS = BASE_DIR / "uploads"
ROOT_UPLOADS.mkdir(parents=True, exist_ok=True)

