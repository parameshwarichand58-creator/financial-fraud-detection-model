from collections.abc import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from app.core import get_settings


class Base(DeclarativeBase):
    pass


_s = get_settings()
_connect_args = {"check_same_thread": False} if _s.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(_s.DATABASE_URL, pool_pre_ping=True, future=True, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
