from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.forecast import router as forecast_router


app = FastAPI(
    title="Food Waste Prevention Backend",
    version="0.1.0",
    description="Initial API for the proactive food waste prevention system.",
)

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:5176",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(forecast_router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    """Confirm that the backend process is available."""
    return {
        "status": "ok",
        "service": "food-waste-prevention-backend",
    }


@app.get("/api/health/db")
def database_health_check() -> dict[str, str]:
    """Confirm that the backend can reach the PostgreSQL database."""
    from sqlalchemy import text
    from sqlalchemy.exc import SQLAlchemyError

    from app.db.session import engine

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except RuntimeError as error:
        return {"status": "error", "database": "not_configured", "detail": str(error)}
    except SQLAlchemyError:
        return {"status": "error", "database": "unreachable"}

    return {"status": "ok", "database": "connected"}


@app.get("/api/health/storage")
def storage_health_check() -> dict[str, str]:
    """Confirm that the Neon image bucket is reachable."""
    from botocore.exceptions import BotoCoreError, ClientError

    from app.storage import IMAGE_BUCKET_NAME, get_s3_client, storage_is_configured

    if not storage_is_configured():
        return {"status": "error", "storage": "not_configured", "bucket": IMAGE_BUCKET_NAME}

    try:
        get_s3_client().head_bucket(Bucket=IMAGE_BUCKET_NAME)
    except (BotoCoreError, ClientError):
        return {"status": "error", "storage": "unreachable", "bucket": IMAGE_BUCKET_NAME}

    return {"status": "ok", "storage": "connected", "bucket": IMAGE_BUCKET_NAME}
