from collections.abc import Generator
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker


BACKEND_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_ROOT / ".env")


def _load_database_url() -> str:
    database_url = (os.getenv("DATABASE_URL") or "").strip().strip('"').strip("'")
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL is missing. Add it to backend/.env before starting the database connection."
        )

    if database_url.startswith("DATABASE_URL="):
        raise RuntimeError(
            "DATABASE_URL in backend/.env must contain only the connection URL, not the variable name."
        )

    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif not database_url.startswith("postgresql+psycopg://"):
        raise RuntimeError("DATABASE_URL must use a PostgreSQL connection URL.")

    parsed = urlparse(database_url)
    if parsed.scheme != "postgresql+psycopg":
        raise RuntimeError("DATABASE_URL must use a PostgreSQL connection URL.")

    query_params = {key: values[-1] for key, values in parse_qs(parsed.query).items()}
    query_params.setdefault("sslmode", "require")
    query_params.setdefault("gssencmode", "disable")
    query_params.setdefault("connect_timeout", "10")

    return urlunparse(parsed._replace(query=urlencode(query_params)))


database_url = _load_database_url()

# Neon (and other) transaction poolers multiplex connections, so keep a small
# SQLAlchemy pool and disable prepared statements.
engine: Engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=5,
    connect_args={"prepare_threshold": None},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
