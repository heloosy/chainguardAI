"""
ChainGuard AI - Quick Server Launcher
"""
import sys
import os
import uvicorn

# Add backend to sys.path
backend_path = os.path.join(os.path.dirname(__file__), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

if __name__ == "__main__":
    print("=" * 70)
    print("  ChainGuard AI - Predictive Supply-Chain Intelligence System")
    print("  Server starting at: http://127.0.0.1:8000")
    print("  API Docs available at: http://127.0.0.1:8000/docs")
    print("=" * 70)
    uvicorn.run("chainguard.api.app:app", host="127.0.0.1", port=8000, reload=False)

