from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

ROLE_USER = "user"
ROLE_ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default=ROLE_USER)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class UserProfile(Base):
    """Registration details, kept separately so existing accounts remain compatible."""

    __tablename__ = "user_profiles"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    title: Mapped[str] = mapped_column(String(10))
    first_name: Mapped[str] = mapped_column(String(59))
    last_name: Mapped[str] = mapped_column(String(60))
    country: Mapped[str] = mapped_column(String(80))
    country_code: Mapped[str] = mapped_column(String(5))
    phone_number: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    use_email_username: Mapped[bool] = mapped_column(Boolean, default=True)
    use_mobile_username: Mapped[bool] = mapped_column(Boolean, default=False)
