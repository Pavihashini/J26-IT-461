import unittest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import ROLE_ADMIN, User


class AuthTest(unittest.TestCase):
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

    def register(self, email: str = "kamal@example.com") -> dict:
        response = self.client.post(
            "/api/auth/register", json={"full_name": "Kamal Perera", "email": email, "password": "secret-pass-1"}
        )
        self.assertEqual(response.status_code, 201)
        return response.json()

    def test_register_creates_regular_user_and_logs_in(self) -> None:
        body = self.register()
        self.assertEqual(body["user"]["role"], "user")
        me = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {body['access_token']}"})
        self.assertEqual(me.json()["email"], "kamal@example.com")

    def test_register_cannot_choose_admin_role(self) -> None:
        response = self.client.post(
            "/api/auth/register",
            json={"full_name": "Sneaky", "email": "s@example.com", "password": "secret-pass-1", "role": "admin"},
        )
        self.assertEqual(response.json()["user"]["role"], "user")

    def test_duplicate_email_and_bad_login_are_rejected(self) -> None:
        self.register()
        duplicate = self.client.post(
            "/api/auth/register", json={"full_name": "Other", "email": "KAMAL@example.com", "password": "secret-pass-1"}
        )
        self.assertEqual(duplicate.status_code, 409)
        wrong = self.client.post("/api/auth/login", json={"email": "kamal@example.com", "password": "wrong-password"})
        self.assertEqual(wrong.status_code, 401)
        ok = self.client.post("/api/auth/login", json={"email": "kamal@example.com", "password": "secret-pass-1"})
        self.assertEqual(ok.status_code, 200)

    def test_forecast_endpoints_require_admin(self) -> None:
        self.assertEqual(self.client.get("/api/forecast/options").status_code, 401)

        user_token = self.register()["access_token"]
        as_user = self.client.get("/api/forecast/options", headers={"Authorization": f"Bearer {user_token}"})
        self.assertEqual(as_user.status_code, 403)

        with self.session_factory() as db:
            db.add(User(full_name="Admin", email="admin@example.com", password_hash=hash_password("admin-pass-1"), role=ROLE_ADMIN))
            db.commit()
        admin_token = self.client.post(
            "/api/auth/login", json={"email": "admin@example.com", "password": "admin-pass-1"}
        ).json()["access_token"]
        as_admin = self.client.get("/api/forecast/options", headers={"Authorization": f"Bearer {admin_token}"})
        self.assertEqual(as_admin.status_code, 200)


if __name__ == "__main__":
    unittest.main()
