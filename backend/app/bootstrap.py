"""Run once inside API container: python -m app.bootstrap"""
import getpass
import os
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from argon2 import PasswordHasher
from .models import Base, User

def main():
    url = os.environ["DATABASE_URL"]
    engine = create_engine(url)
    Base.metadata.create_all(engine)
    email = input("Administrator email: ").strip().lower()
    if not email or "@" not in email: raise SystemExit("Valid email required")
    password = getpass.getpass("New admin password (16+ characters): ")
    if len(password) < 16: raise SystemExit("Password too short")
    with Session(engine) as db:
        if db.scalar(select(User).where(User.email == email)):
            raise SystemExit("Account already exists; refusing to overwrite")
        db.add(User(email=email, name="System Administrator", role="admin",
                    password_hash=PasswordHasher().hash(password)))
        db.commit()
    print("Administrator created successfully.")

if __name__ == "__main__": main()
