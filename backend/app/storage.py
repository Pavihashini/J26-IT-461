from pathlib import Path
import os

import boto3
from botocore.client import BaseClient
from botocore.config import Config
from dotenv import load_dotenv


BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_ROOT / ".env")

IMAGE_BUCKET_NAME = (os.getenv("IMAGE_BUCKET_NAME") or "images").strip()


def _env(name: str) -> str:
    return (os.getenv(name) or "").strip()


def storage_is_configured() -> bool:
    return all(
        [
            IMAGE_BUCKET_NAME,
            _env("AWS_REGION"),
            _env("AWS_ENDPOINT_URL_S3"),
            _env("AWS_ACCESS_KEY_ID"),
            _env("AWS_SECRET_ACCESS_KEY"),
        ]
    )


def get_s3_client() -> BaseClient:
    if not storage_is_configured():
        raise RuntimeError(
            "Image bucket is not configured. Add AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, "
            "and AWS_SECRET_ACCESS_KEY from Neon Object Storage to backend/.env."
        )

    return boto3.client(
        "s3",
        region_name=_env("AWS_REGION"),
        endpoint_url=_env("AWS_ENDPOINT_URL_S3"),
        aws_access_key_id=_env("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=_env("AWS_SECRET_ACCESS_KEY"),
        config=Config(s3={"addressing_style": "path"}),
    )
