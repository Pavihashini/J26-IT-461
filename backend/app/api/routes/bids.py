from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.db.session import get_db
from app.models.bid import Bid
from app.models.user import ROLE_USER, User
from app.schemas.bids import BidOut, PlaceBidRequest

router = APIRouter(prefix="/api/bids", tags=["bids"])


def _to_out(bid: Bid, user: User) -> BidOut:
    return BidOut(
        id=bid.id,
        listing_id=bid.listing_id,
        listing_name=bid.listing_name,
        amount=float(bid.amount),
        created_at=bid.created_at,
        bidder_name=user.full_name,
        bidder_email=user.email,
    )


@router.post("", response_model=BidOut, status_code=status.HTTP_201_CREATED)
def place_bid(request: PlaceBidRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> BidOut:
    """Record a bid from a registered user."""
    if user.role != ROLE_USER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only registered users can place bids.")

    bid = Bid(
        listing_id=request.listing_id.strip(),
        listing_name=request.listing_name.strip(),
        user_id=user.id,
        amount=request.amount,
    )
    db.add(bid)
    db.commit()
    db.refresh(bid)
    return _to_out(bid, user)


@router.get("", response_model=list[BidOut])
def list_bids(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[BidOut]:
    """All bids, newest first, for the admin dashboard."""
    rows = db.execute(
        select(Bid, User).join(User, User.id == Bid.user_id).order_by(Bid.created_at.desc(), Bid.id.desc()).limit(500)
    ).all()
    return [_to_out(bid, user) for bid, user in rows]
