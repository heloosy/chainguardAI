"""
ChainGuard AI - FastAPI Application
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from chainguard.api.routes import router as api_router
from chainguard.validation.retraining_pipeline import pipeline_manager

app = FastAPI(
    title="ChainGuard AI - Predictive Supply-Chain Intelligence System",
    description="Real predictive forecasting, consequence cascading, preventive recommendations, and continuous model governance.",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router)

# Mount frontend static files
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "frontend"))
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")


@app.on_event("startup")
def startup_event():
    print("ChainGuard AI Engine initializing...")
    if not pipeline_manager.calibrated_predictor.is_fitted:
        print("Training initial benchmark models (v1.0)...")
        pipeline_manager.train_initial_models()
        print("Models trained successfully!")

