"""
ChainGuard AI - Main Entry Point
"""
import sys
import os
from pathlib import Path

# Add backend directory and project root to Python sys.path
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import uvicorn
from chainguard.api.app import app

if __name__ == "__main__":
    uvicorn.run("chainguard.api.app:app", host="127.0.0.1", port=8000, reload=True, app_dir=str(BASE_DIR))

