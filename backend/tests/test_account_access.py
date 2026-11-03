import os
from unittest.mock import patch

from app.api.routes import account_access
from app.core.security import create_reset_token
from app.models.user import User
from tests.test_registration import RegistrationTest


class AccountAccessTest(RegistrationTest):
    def setUp(self):
        super().setUp()
        account_access._attempts.clear()

    def test_reset_link_is_single_use_and_revokes_existing_sessions(self):
        old_session = self.register().json()
        with self.sessions() as db:
            user = db.get(User, old_session["user"]["id"])
            token = create_reset_token(user.id, user.password_hash)
        response = self.client.post("/api/auth/reset-password", json={"token": token, "password": "ChangedPassword123"})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(self.login(self.payload["email"]).status_code, 401)
        self.assertEqual(self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {old_session['access_token']}"}).status_code, 401)
        again = self.client.post("/api/auth/reset-password", json={"token": token, "password": "AnotherPassword123"})
        self.assertEqual(again.status_code, 400)
        fresh = self.client.post("/api/auth/login", json={"email": self.payload["email"], "password": "ChangedPassword123"})
        self.assertEqual(fresh.status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {fresh.json()['access_token']}"}).status_code, 200)

    def test_access_and_reset_tokens_cannot_be_interchanged(self):
        session = self.register().json()
        self.assertEqual(self.client.post("/api/auth/reset-password", json={"token": session["access_token"], "password": "NewPassword123"}).status_code, 400)
        with self.sessions() as db:
            user = db.get(User, session["user"]["id"])
            token = create_reset_token(user.id, user.password_hash)
        self.assertEqual(self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code, 401)

    def test_invalid_and_expired_reset_links_are_rejected(self):
        import jwt
        from datetime import datetime, timedelta, timezone
        from app.core.security import _secret

        token = jwt.encode({"sub": "1", "purpose": "reset", "pwd": "invalid", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)}, _secret(), algorithm="HS256")
        for invalid in (token, "invalid-token"):
            self.assertEqual(self.client.post("/api/auth/reset-password", json={"token": invalid, "password": "NewPassword123"}).status_code, 400)

    def test_recovery_does_not_reveal_account_existence(self):
        self.register()
        with patch("app.services.account_access.reset_email_enabled", return_value=True), patch("app.services.account_access.send_reset_email") as mail:
            known = self.client.post("/api/auth/forgot-password", json={"email": self.payload["email"]})
            self.assertEqual(mail.call_count, 1)
            mail.reset_mock()
            unknown = self.client.post("/api/auth/forgot-password", json={"email": "absent@example.com"})
            self.assertEqual(known.json(), unknown.json())
            self.assertEqual(unknown.status_code, 202)
            mail.assert_not_called()

    def test_recovery_requests_are_limited(self):
        with patch("app.services.account_access.reset_email_enabled", return_value=True):
            for _ in range(5):
                self.assertEqual(self.client.post("/api/auth/forgot-password", json={"email": "absent@example.com"}).status_code, 202)
            self.assertEqual(self.client.post("/api/auth/forgot-password", json={"email": "absent@example.com"}).status_code, 429)

    def test_google_creates_regular_user_and_reuses_subject(self):
        claims = {"sub": "verified-google-subject", "email": "googleuser@gmail.com", "email_verified": True, "name": "Google Customer"}
        with patch.dict(os.environ, {"GOOGLE_CLIENT_ID": "test-client"}), patch("app.services.account_access.verify_google", return_value=claims):
            first = self.client.post("/api/auth/google", json={"credential": "verified-by-mock"})
            self.assertEqual(first.status_code, 200, first.text)
            self.assertEqual(first.json()["user"]["role"], "user")
            second = self.client.post("/api/auth/google", json={"credential": "verified-by-mock"})
            self.assertEqual(first.json()["user"]["id"], second.json()["user"]["id"])

    def test_google_rejects_invalid_or_unverified_identity(self):
        with patch.dict(os.environ, {"GOOGLE_CLIENT_ID": "test-client"}):
            with patch("app.services.account_access.verify_google", side_effect=ValueError):
                self.assertEqual(self.client.post("/api/auth/google", json={"credential": "forged"}).status_code, 401)
            with patch("app.services.account_access.verify_google", return_value={"sub": "subject", "email": "test@gmail.com", "email_verified": False}):
                self.assertEqual(self.client.post("/api/auth/google", json={"credential": "unverified"}).status_code, 401)

    def test_google_does_not_take_over_admin_or_third_party_email(self):
        session = self.register().json()
        claims = {"sub": "subject", "email": self.payload["email"], "email_verified": True}
        with patch.dict(os.environ, {"GOOGLE_CLIENT_ID": "test-client"}), patch("app.services.account_access.verify_google", return_value=claims):
            self.assertEqual(self.client.post("/api/auth/google", json={"credential": "verified"}).status_code, 403)
            with self.sessions() as db:
                db.get(User, session["user"]["id"]).role = "admin"
                db.commit()
            claims["hd"] = "example.com"
            self.assertEqual(self.client.post("/api/auth/google", json={"credential": "verified"}).status_code, 403)

    def test_unconfigured_services_are_explicitly_unavailable(self):
        with patch.dict(os.environ, {"GOOGLE_CLIENT_ID": "", "SMTP_PASSWORD": ""}):
            capabilities = self.client.get("/api/auth/capabilities").json()
            self.assertEqual(capabilities, {"google_client_id": "", "password_reset_enabled": False})
            self.assertEqual(self.client.post("/api/auth/google", json={"credential": "anything"}).status_code, 503)
            self.assertEqual(self.client.post("/api/auth/forgot-password", json={"email": "test@example.com"}).status_code, 503)
