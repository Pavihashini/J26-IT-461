from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Bid(Base):
    __tablename__ = "bids"

    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[str] = mapped_column(String(40), index=True)
    listing_name: Mapped[str] = mapped_column(String(160))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
