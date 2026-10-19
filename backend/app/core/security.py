"""Password hashing and access-token helpers."""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv

from app.db.session import BACKEND_ROOT

load_dotenv(BACKEND_ROOT / ".env")

TOKEN_LIFETIME = timedelta(hours=8)
_SCRYPT = {"n": 2**14, "r": 8, "p": 1}


def _secret() -> str:
    secret = (os.getenv("JWT_SECRET") or "").strip()
    if len(secret) < 32:
        raise RuntimeError("JWT_SECRET is missing or too short. Add a random value of 32+ characters to backend/.env.")
    return secret


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, dklen=32, **_SCRYPT)
    return f"scrypt${base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, salt_b64, digest_b64 = stored.split("$")
        if scheme != "scrypt":
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(digest_b64)
    except ValueError:
        return False
    actual = hashlib.scrypt(password.encode(), salt=salt, dklen=len(expected), **_SCRYPT)
    return hmac.compare_digest(actual, expected)


def create_access_token(user_id: int, role: str) -> str:
    payload = {"sub": str(user_id), "role": role, "exp": datetime.now(timezone.utc) + TOKEN_LIFETIME}
    return jwt.encode(payload, _secret(), algorithm="HS256")


def decode_access_token(token: str) -> dict:
    """Return the token payload, or raise jwt.PyJWTError when invalid or expired."""
    return jwt.decode(token, _secret(), algorithms=["HS256"])
