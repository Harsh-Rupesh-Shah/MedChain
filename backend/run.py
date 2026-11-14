import uvicorn
import socket
import sys
import os
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.config import PORT

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

if __name__ == "__main__":
    target_port = PORT
    if is_port_in_use(target_port):
        print(f"\n⚠️  Warning: Port {target_port} is already in use.")
        alt_port = 8001 if target_port == 8000 else target_port + 1
        if not is_port_in_use(alt_port):
            print(f"👉 Automatically switching to available port {alt_port}.\n")
            target_port = alt_port
        else:
            print(f"Attempting to bind to {target_port} anyway...\n")

    print(f"🚀 Starting MedChain FastAPI server on port {target_port}...")
    uvicorn.run(
        "backend.app.main:socket_app",
        host="0.0.0.0",
        port=target_port,
        reload=True
    )
