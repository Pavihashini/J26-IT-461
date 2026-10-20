from datetime import datetime

from pydantic import BaseModel, Field


class PlaceBidRequest(BaseModel):
    listing_id: str = Field(min_length=1, max_length=40)
    listing_name: str = Field(min_length=1, max_length=160)
    amount: float = Field(gt=0, le=10_000_000)


class BidOut(BaseModel):
    id: int
    listing_id: str
    listing_name: str
    amount: float
    created_at: datetime
    bidder_name: str
    bidder_email: str
