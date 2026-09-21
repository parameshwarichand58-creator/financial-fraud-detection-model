from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path

import bcrypt
from jose import JWTError, jwt
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: str = "http://localhost:3000"
    MODELS_DIR: str = "./storage/models"
    UPLOADS_DIR: str = "./storage/uploads"
    REVIEW_THRESHOLD: float = 0.60
    CRITICAL_THRESHOLD: float = 0.85
    EPHEMERAL_MODE: bool = True
    SEED_DEMO_USER: bool = True

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    def ensure_dirs(self):
        Path(self.MODELS_DIR).mkdir(parents=True, exist_ok=True)
        Path(self.UPLOADS_DIR).mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    s = Settings()
    s.ensure_dirs()
    return s


def wipe_state() -> None:
    """Delete SQLite DB file and clear storage dirs (ephemeral mode)."""
    s = get_settings()

    if s.DATABASE_URL.startswith("sqlite:///"):
        rel = s.DATABASE_URL.replace("sqlite:///", "")
        p = Path(rel)
        if not p.is_absolute():
            p = Path.cwd() / rel.replace("./", "", 1)
        for suffix in ("", "-journal", "-wal", "-shm"):
            f = Path(str(p) + suffix)
            if f.exists():
                try:
                    f.unlink()
                except Exception:
                    pass

    for d in (Path(s.MODELS_DIR), Path(s.UPLOADS_DIR)):
        if d.exists():
            for f in d.iterdir():
                if f.is_file() and f.name != ".gitkeep":
                    try:
                        f.unlink()
                    except Exception:
                        pass


def seed_demo_user() -> None:
    """Create the demo account if it does not exist."""
    s = get_settings()
    if not s.SEED_DEMO_USER:
        return

    from sqlalchemy import select
    from app.db import SessionLocal
    from app.models import User

    db = SessionLocal()
    try:
        existing = db.scalar(select(User).where(User.email == "demo@fraudiq.io"))
        if existing:
            return
        u = User(
            email="demo@fraudiq.io",
            full_name="Demo Analyst",
            hashed_password=hash_password("demo12345"),
            role="ANALYST",
        )
        db.add(u)
        db.commit()
        print(">> Demo user seeded: demo@fraudiq.io / demo12345")
    except Exception as exc:
        print(f">> Demo seed skipped: {exc}")
    finally:
        db.close()


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(sub: str, extra: dict | None = None) -> str:
    s = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=s.ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp()),
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, s.JWT_SECRET, algorithm=s.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    s = get_settings()
    try:
        return jwt.decode(token, s.JWT_SECRET, algorithms=[s.JWT_ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc


RISK_BANDS = [
    ("Low", 0.0, 0.30),
    ("Medium", 0.30, 0.60),
    ("High", 0.60, 0.85),
    ("Critical", 0.85, 1.01),
]


def risk_band(p: float) -> str:
    for name, lo, hi in RISK_BANDS:
        if lo <= p < hi:
            return name
    return "Critical"
