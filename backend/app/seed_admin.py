"""Explicit admin bootstrap: password is passed at execution time, never seeded in code."""
import os
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from argon2 import PasswordHasher
from .models import Base, User


def create_first_admin(db: Session, email: str, password: str):
    email = email.strip().lower()
    if not email or "@" not in email or len(password) < 16:
        raise ValueError("Administrator email or temporary password is invalid")
    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        return False
    db.add(User(email=email, name="مدیر سامانه DSS",
                role="admin", password_hash=PasswordHasher().hash(password)))
    db.commit()
    return True


def main():
    email = os.getenv("DSS_INITIAL_ADMIN_EMAIL", "")
    password = os.getenv("DSS_INITIAL_ADMIN_PASSWORD", "")
    engine = create_engine(os.environ["DATABASE_URL"])
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        created = create_first_admin(db, email, password)
    print("Created initial DSS administrator" if created else "Administrator already exists; credentials unchanged")


if __name__ == "__main__":
    main()
