import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    CHAINGUARD_ENV: str = os.getenv("CHAINGUARD_ENV", "development")
    
    # Database configuration: prefers SUPABASE_DATABASE_URL if provided, then DATABASE_URL, defaults to persistent SQLite
    SUPABASE_DATABASE_URL: str = os.getenv("SUPABASE_DATABASE_URL", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # JWT & Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "chainguard-enterprise-secret-key-9938104712")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours
    
    # CORS
    ALLOWED_ORIGINS: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"
    )

    @property
    def effective_database_url(self) -> str:
        if self.SUPABASE_DATABASE_URL.strip():
            return self.SUPABASE_DATABASE_URL.strip()
        if self.DATABASE_URL.strip():
            return self.DATABASE_URL.strip()
        return "sqlite:///./chainguard.db"

    @property
    def is_postgres(self) -> bool:
        url = self.effective_database_url
        return url.startswith("postgres://") or url.startswith("postgresql://")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
