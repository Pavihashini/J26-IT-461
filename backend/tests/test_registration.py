import unittest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User, UserProfile


class RegistrationTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(bind=self.engine, expire_on_commit=False)

        def database():
            with self.sessions() as db:
                yield db

        app.dependency_overrides[get_db] = database
        self.client = TestClient(app)
        self.payload = {
            "title": "Ms.", "first_name": "Nimali", "last_name": "Perera",
            "country": "Sri Lanka", "country_code": "+94", "phone_number": "0771234567",
            "email": "nimali@example.com", "password": "Kitchen123",
            "use_email_username": True, "use_mobile_username": True,
        }

    def tearDown(self):
        self.client.close()
        app.dependency_overrides.clear()
        self.engine.dispose()

    def register(self, **changes):
        return self.client.post("/api/auth/register", json={**self.payload, **changes})

    def login(self, identity):
        return self.client.post("/api/auth/login", json={"email": identity, "password": self.payload["password"]})

    def test_profile_persists_and_both_username_options_work(self):
        response = self.register()
        self.assertEqual(response.status_code, 201, response.text)
        self.assertEqual(response.json()["user"]["full_name"], "Nimali Perera")
        with self.sessions() as db:
            profile = db.scalar(select(UserProfile))
            self.assertEqual(profile.phone_number, "+94771234567")
            self.assertEqual(profile.title, "Ms.")
            self.assertTrue(profile.use_email_username)
            self.assertTrue(profile.use_mobile_username)
        for identity in ("NIMALI@example.com", "0771234567", "+94 77 123 4567", "771234567"):
            self.assertEqual(self.login(identity).status_code, 200, identity)

    def test_username_preferences_are_enforced(self):
        self.assertEqual(self.register(use_email_username=False).status_code, 201)
        self.assertEqual(self.login("nimali@example.com").status_code, 401)
        self.assertEqual(self.login("0771234567").status_code, 200)

    def test_email_only_preference_disables_phone_login(self):
        self.assertEqual(self.register(use_mobile_username=False).status_code, 201)
        self.assertEqual(self.login("nimali@example.com").status_code, 200)
        self.assertEqual(self.login("0771234567").status_code, 401)

    def test_duplicate_contact_details_are_rejected(self):
        self.assertEqual(self.register().status_code, 201)
        self.assertEqual(self.register(email="NIMALI@example.com", phone_number="0772345678").status_code, 409)
        self.assertEqual(self.register(email="other@example.com", phone_number="+94771234567").status_code, 409)
        with self.sessions() as db:
            self.assertEqual(len(db.scalars(select(User)).all()), 1)

    def test_invalid_registration_does_not_create_an_account(self):
        invalid = [
            {"first_name": "   "}, {"last_name": "Perera123"}, {"phone_number": "123"},
            {"phone_number": "abc0771234567"}, {"email": "not-an-email"},
            {"password": "short1"}, {"password": "letters-only"},
            {"title": "Invalid"}, {"country": "Unknown"}, {"country_code": "+1"},
            {"use_email_username": False, "use_mobile_username": False},
        ]
        for changes in invalid:
            with self.subTest(changes=changes):
                self.assertEqual(self.register(**changes).status_code, 422)
        with self.sessions() as db:
            self.assertEqual(db.scalars(select(User)).all(), [])

    def test_existing_registration_clients_still_work(self):
        response = self.client.post("/api/auth/register", json={
            "full_name": "Existing Client", "email": "old@example.com", "password": "legacy-pass-1",
        })
        self.assertEqual(response.status_code, 201)
        response = self.client.post("/api/auth/login", json={"email": "old@example.com", "password": "legacy-pass-1"})
        self.assertEqual(response.status_code, 200)
