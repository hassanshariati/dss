from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from app.models import Base, User
from app.seed_admin import create_first_admin


def test_bootstrap_admin_is_idempotent():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        assert create_first_admin(db, "dssadmin@example.org", "an-exclusively-demo-password-1234")
        assert not create_first_admin(db, "dssadmin@example.org", "another-demo-password-123456")
        account = db.scalar(select(User).where(User.email == "dssadmin@example.org"))
        assert account.role == "admin"
        assert account.password_hash != "an-exclusively-demo-password-1234"
