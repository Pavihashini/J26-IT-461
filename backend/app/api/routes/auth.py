from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import ROLE_USER, User, UserProfile
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserOut, normalize_mobile

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Verified against when the email is unknown, so response time does not reveal which emails exist.
_DUMMY_HASH = hash_password("not-a-real-password")


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Create a regular user account. Admin accounts are never created through this endpoint."""
    if db.scalar(select(User).where(User.email == request.email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")
    if request.phone_number and db.scalar(select(UserProfile).where(UserProfile.phone_number == request.phone_number)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this mobile number already exists.")

    user = User(
        full_name=request.full_name,
        email=request.email,
        password_hash=hash_password(request.password),
        role=ROLE_USER,
    )
    db.add(user)
    try:
        if request.phone_number:
            db.flush()
            db.add(UserProfile(
                user_id=user.id,
                title=request.title,
                first_name=request.first_name,
                last_name=request.last_name,
                country=request.country,
                country_code=request.country_code,
                phone_number=request.phone_number,
                use_email_username=request.use_email_username,
                use_mobile_username=request.use_mobile_username,
            ))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email or mobile number already exists.") from None

    return TokenResponse(access_token=create_access_token(user.id, user.role, user.password_hash), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == request.email))
    if user:
        profile = db.get(UserProfile, user.id)
        if profile and not profile.use_email_username:
            user = None
    else:
        phone = normalize_mobile(request.email)
        if phone:
            user = db.scalar(select(User).join(UserProfile, UserProfile.user_id == User.id).where(
                UserProfile.phone_number == phone,
                UserProfile.use_mobile_username.is_(True),
            ))
    password_ok = verify_password(request.password, user.password_hash if user else _DUMMY_HASH)
    if user is None or not password_ok:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email, mobile number or password.")

    return TokenResponse(access_token=create_access_token(user.id, user.role, user.password_hash), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user
