"""External identity verification and password recovery email delivery."""
import logging
import os
import smtplib
import ssl
from email.message import EmailMessage
from urllib.parse import urlencode


def google_client_id() -> str:
    return (os.getenv("GOOGLE_CLIENT_ID") or "").strip()


def reset_email_enabled() -> bool:
    return all((os.getenv(key) or "").strip() for key in ("SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM"))


def verify_google(credential: str) -> dict:
    from google.auth.transport.requests import Request
    from google.oauth2 import id_token

    return id_token.verify_oauth2_token(credential, Request(), google_client_id())


def send_reset_email(recipient: str, token: str) -> None:
    # The origin is server-controlled; never derive reset links from a request header.
    origin = (os.getenv("FRONTEND_URL") or "http://localhost:5173").rstrip("/")
    url = f"{origin}/?{urlencode({'reset_token': token})}"
    message = EmailMessage()
    message["Subject"] = "Reset your SmartPlate password"
    message["From"] = os.environ["SMTP_FROM"]
    message["To"] = recipient
    message.set_content(f"A password reset was requested for your SmartPlate account.\n\nOpen this link within 15 minutes:\n{url}\n\nThe link can be used once. If you did not request this, you can ignore this email.")
    try:
        use_ssl = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
        client = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
        options = {"context": ssl.create_default_context()} if use_ssl else {}
        with client(os.environ["SMTP_HOST"], int(os.getenv("SMTP_PORT", "465" if use_ssl else "587")), timeout=20, **options) as smtp:
            if not use_ssl:
                smtp.starttls(context=ssl.create_default_context())
            smtp.login(os.environ["SMTP_USERNAME"], os.environ["SMTP_PASSWORD"])
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException):
        # Do not log reset links, credentials, or recipient addresses.
        logging.getLogger(__name__).warning("Password recovery email could not be delivered.")
