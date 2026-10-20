import unittest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import bid as _bid  # noqa: F401  (registers the table)
from app.models.user import ROLE_ADMIN, User


class BidsTest(unittest.TestCase):
    """Runs against an in-memory SQLite database, never the real Neon database."""

    def setUp(self) -> None:
        engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(engine)
        self.session_factory = sessionmaker(bind=engine, expire_on_commit=False)

        def override_db():
            with self.session_factory() as db:
                yield db

        app.dependency_overrides[get_db] = override_db
        self.client = TestClient(app)

    def tearDown(self) -> None:
        app.dependency_overrides.clear()

    def token_for_new_user(self, email: str, name: str) -> str:
        response = self.client.post(
            "/api/auth/register", json={"full_name": name, "email": email, "password": "secret-pass-1"}
        )
        return response.json()["access_token"]

    def admin_token(self) -> str:
        with self.session_factory() as db:
            db.add(User(full_name="Admin", email="admin@example.com", password_hash=hash_password("admin-pass-1"), role=ROLE_ADMIN))
            db.commit()
        return self.client.post("/api/auth/login", json={"email": "admin@example.com", "password": "admin-pass-1"}).json()["access_token"]

    def test_user_bid_is_visible_to_admin_with_bidder_details(self) -> None:
        user_token = self.token_for_new_user("kamal@example.com", "Kamal Perera")
        placed = self.client.post(
            "/api/bids",
            json={"listing_id": "S-201", "listing_name": "Vegetable curry meal packs", "amount": 1000},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        self.assertEqual(placed.status_code, 201)

        listed = self.client.get("/api/bids", headers={"Authorization": f"Bearer {self.admin_token()}"})
        self.assertEqual(listed.status_code, 200)
        bids = listed.json()
        self.assertEqual(len(bids), 1)
        self.assertEqual(bids[0]["bidder_name"], "Kamal Perera")
        self.assertEqual(bids[0]["bidder_email"], "kamal@example.com")
        self.assertEqual(bids[0]["amount"], 1000)

    def test_bid_access_rules(self) -> None:
        payload = {"listing_id": "S-201", "listing_name": "Packs", "amount": 500}
        self.assertEqual(self.client.post("/api/bids", json=payload).status_code, 401)

        user_token = self.token_for_new_user("a@example.com", "Amal Silva")
        self.assertEqual(self.client.get("/api/bids", headers={"Authorization": f"Bearer {user_token}"}).status_code, 403)

        admin = {"Authorization": f"Bearer {self.admin_token()}"}
        self.assertEqual(self.client.post("/api/bids", json=payload, headers=admin).status_code, 403)

        bad = self.client.post("/api/bids", json={**payload, "amount": -5}, headers={"Authorization": f"Bearer {user_token}"})
        self.assertEqual(bad.status_code, 422)


if __name__ == "__main__":
    unittest.main()
