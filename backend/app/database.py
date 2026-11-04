import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

db_url = settings.effective_database_url
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create engine with fallback protection
try:
    engine = create_engine(
        db_url,
        connect_args=connect_args,
        echo=False
    )
    # Quick probe to ensure engine functions
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    engine_operational = True
    engine_error = None
except Exception as e:
    # If postgres failed to connect (e.g. invalid host or credentials), gracefully fall back to local persistent SQLite
    fallback_url = "sqlite:///./chainguard.db"
    engine = create_engine(
        fallback_url,
        connect_args={"check_same_thread": False},
        echo=False
    )
    engine_operational = True
    engine_error = f"Primary database connection failed ({str(e)}). Active fallback: persistent SQLite."

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
