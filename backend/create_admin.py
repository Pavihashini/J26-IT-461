"""Create or promote an administrator account.

Usage (from the backend folder):
    python create_admin.py admin@example.com "Admin Name"
The password is asked for interactively so it never appears in shell history.
"""

import getpass
import sys


def main() -> int:
    if len(sys.argv) != 3:
        print('Usage: python create_admin.py <email> "<full name>"')
        return 1

    from sqlalchemy import select

    from app.core.security import hash_password
    from app.db.base import Base
    from app.db.session import SessionLocal, engine
    from app.models.user import ROLE_ADMIN, User

    email, full_name = sys.argv[1].strip().lower(), sys.argv[2].strip()
    password = getpass.getpass("Password (min 8 characters): ")
    if len(password) < 8:
        print("Password must be at least 8 characters.")
        return 1
    if password != getpass.getpass("Repeat password: "):
        print("Passwords do not match.")
        return 1

    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user:
            user.role = ROLE_ADMIN
            user.password_hash = hash_password(password)
            print(f"Existing account {email} promoted to admin and password updated.")
        else:
            db.add(User(full_name=full_name, email=email, password_hash=hash_password(password), role=ROLE_ADMIN))
            print(f"Admin account {email} created.")
        db.commit()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
