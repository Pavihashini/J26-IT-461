import hashlib
import hmac
import secrets
import threading
import time

import jwt
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_reset_token, decode_reset_token, hash_password, password_tag
from app.db.session import get_db
from app.models.user import GoogleIdentity, ROLE_USER, User
from app.schemas.auth import EMAIL_PATTERN, RegisterRequest, TokenResponse, UserOut
from app.services import account_access as service

router = APIRouter(prefix="/api/auth", tags=["account access"])
_attempts: dict[str, list[float]] = {}
_lock = threading.Lock()


def limit_attempts(key: str, limit: int = 5) -> None:
    now = time.monotonic()
    key = hashlib.sha256(key.encode()).hexdigest()
    with _lock:
        for old in [name for name, times in _attempts.items() if not times or now - times[-1] > 900]:
            del _attempts[old]
        if key not in _attempts and len(_attempts) >= 10000:
            raise HTTPException(429, "Please try again later.")
        times = [stamp for stamp in _attempts.get(key, []) if now - stamp < 900]
        if len(times) >= limit:
            raise HTTPException(429, "Too many attempts. Please try again in 15 minutes.")
        _attempts[key] = [*times, now]


class RecoveryRequest(BaseModel):
    email: str = Field(max_length=254)

    @field_validator("email")
    @classmethod
    def valid_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not EMAIL_PATTERN.fullmatch(value):
            raise ValueError("Enter a valid email address.")
        return value


class ResetRequest(BaseModel):
    token: str = Field(min_length=1, max_length=4096)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def valid_password(cls, value: str) -> str:
        return RegisterRequest.validate_password(value)


class GoogleRequest(BaseModel):
    credential: str = Field(min_length=1, max_length=10000)


@router.get("/capabilities")
def capabilities():
    return {"google_client_id": service.google_client_id(), "password_reset_enabled": service.reset_email_enabled()}


@router.post("/forgot-password", status_code=202)
def forgot_password(body: RecoveryRequest, request: Request, tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if not service.reset_email_enabled():
        raise HTTPException(503, "Password recovery is not available yet. Please contact the restaurant administrator.")
    host = request.client.host if request.client else "unknown"
    limit_attempts(f"reset-ip:{host}", 20)
    limit_attempts(f"reset-email:{body.email}")
    user = db.scalar(select(User).where(User.email == body.email))
    if user:
        tasks.add_task(service.send_reset_email, user.email, create_reset_token(user.id, user.password_hash))
    return {"message": "If an account exists for that email, a password reset link will be sent. Check your inbox and spam folder."}


@router.post("/reset-password")
def reset_password(body: ResetRequest, request: Request, db: Session = Depends(get_db)):
    limit_attempts(f"reset-confirm:{request.client.host if request.client else 'unknown'}", 20)
    invalid = HTTPException(400, "This reset link is invalid or expired. Please request a new one.")
    try:
        payload = decode_reset_token(body.token)
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError, TypeError):
        raise invalid from None
    # Serializes password changes so the same link cannot be used twice concurrently.
    user = db.scalar(select(User).where(User.id == user_id).with_for_update())
    if not user or not hmac.compare_digest(str(payload.get("pwd", "")), password_tag(user.password_hash)):
        raise invalid
    user.password_hash = hash_password(body.password)
    db.commit()
    return {"message": "Your password has been updated. Sign in with your new password."}


@router.post("/google", response_model=TokenResponse)
def google_login(body: GoogleRequest, request: Request, db: Session = Depends(get_db)):
    if not service.google_client_id():
        raise HTTPException(503, "Google sign-in is not available yet.")
    limit_attempts(f"google:{request.client.host if request.client else 'unknown'}", 30)
    try:
        claims = service.verify_google(body.credential)
    except ValueError:
        raise HTTPException(401, "Google could not verify this account. Please sign in again.") from None
    except Exception:
        raise HTTPException(503, "Google sign-in could not be reached. Please try again.") from None
    email = str(claims.get("email", "")).strip().lower()
    subject = str(claims.get("sub", ""))
    if claims.get("email_verified") is not True or not EMAIL_PATTERN.fullmatch(email) or len(email) > 254 or not subject or len(subject) > 255:
        raise HTTPException(401, "A verified Google email address is required.")
    identity = db.get(GoogleIdentity, subject)
    user = db.get(User, identity.user_id) if identity else db.scalar(select(User).where(User.email == email))
    if user and user.role != ROLE_USER:
        raise HTTPException(403, "Restaurant administrators must sign in with their password.")
    if user and not identity and not (email.endswith("@gmail.com") or claims.get("hd")):
        raise HTTPException(403, "Please sign in with your password for this existing account.")
    try:
        if not user:
            name = " ".join(str(claims.get("name") or email.split("@")[0]).split())[:120]
            user = User(full_name=name if len(name) >= 2 else "Google user", email=email, password_hash=hash_password(secrets.token_urlsafe(48)), role=ROLE_USER)
            db.add(user)
            db.flush()
        if not identity:
            db.add(GoogleIdentity(subject=subject, user_id=user.id))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "This account changed while signing in. Please try again.") from None
    return TokenResponse(access_token=create_access_token(user.id, user.role, user.password_hash), user=UserOut.model_validate(user))
