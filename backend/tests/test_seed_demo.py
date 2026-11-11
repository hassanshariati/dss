from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import Session
from app.models import Base, Dataset, DataSheet, DataRow, User
from app.seed_demo import seed_demo, generate_demo_sets


def test_examples_look_realistic_and_are_explicitly_synthetic():
    bundles = generate_demo_sets()
    assert len(bundles) >= 5
    assert all(filename.startswith("DEMO__") for filename, _ in bundles)
    assert sum(len(rows) for _, sheets in bundles for _, rows in sheets) > 1000
    assert all(rows and len(rows[0]) >= 5 for _, sheets in bundles for _, rows in sheets)


def test_seed_is_idempotent_and_does_not_overwrite_other_uploads():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        db.add(User(email="real@example.org", name="نمونه واقعی کاربر",
                    password_hash="unused", role="employee", active=True))
        db.flush()
        db.add(Dataset(owner_id=1, filename="my_private.xlsx", row_count=0, sheet_count=0))
        db.commit()
        once = seed_demo(db)
        assert len(once["created"]) == 5
        assert once["new_rows"] > 1000
        before = db.scalar(select(func.count(Dataset.id)))
        twice = seed_demo(db)
        assert twice["created"] == []
        assert len(twice["skipped"]) == 5
        assert db.scalar(select(func.count(Dataset.id))) == before
        assert db.scalar(select(func.count(DataRow.id))) == once["new_rows"]
        assert db.scalar(select(Dataset.id).where(Dataset.filename == "my_private.xlsx"))
        owner = db.scalar(select(User).where(User.email == "demo-datasets@invalid.local"))
        assert owner and not owner.active and owner.role == "system"
