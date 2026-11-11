"""Idempotent and explicitly synthetic demonstration data for DSS dashboards.

All names, identifiers, performance scores and amounts are fictitious.
Never overwrite a dataset uploaded by a user.
"""
import json
import os
import random
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from .models import Base, User, Dataset, DataSheet, DataRow

DEMO_EMAIL = "demo-datasets@invalid.local"
PREFIX = "DEMO__"


def generate_demo_sets():
    rng = random.Random(140508)
    teams = ["فناوری اطلاعات", "عملیات", "مالی", "منابع انسانی", "فروش", "پشتیبانی", "زیرساخت", "توسعه محصول"]
    managers = [(f"M{i:02d}", f"مدیر نمونه {i:02d}", teams[i - 1]) for i in range(1, 9)]
    months = [f"1405-{i:02d}" for i in range(1, 10)]
    manager_rows = []
    for month_idx, month in enumerate(months):
        for i, (manager_id, name, unit) in enumerate(managers):
            improvement = month_idx * 1.4
            manager_rows.append({
                "دوره": month, "شناسه مدیر": manager_id, "نام مدیر": name, "واحد": unit,
                "تحقق اهداف (%)": min(100, round(66 + (i * 3) % 17 + improvement + rng.randint(-5, 5))),
                "تحویل به موقع (%)": min(100, round(70 + (i * 4) % 17 + month_idx + rng.randint(-5, 5))),
                "کیفیت تحویل (%)": min(100, round(73 + (i * 2) % 16 + improvement / 2 + rng.randint(-4, 4))),
                "رضایت تیم (از ۵)": round(min(5, 3.3 + (i % 4) * 0.24 + month_idx * 0.035 + rng.random() * .3), 2),
                "تعداد پروژه فعال": 2 + ((i + month_idx) % 5),
                "تعداد فعالیت تکمیل شده": 16 + i * 2 + month_idx + rng.randrange(10),
            })

    people = []
    for i in range(1, 65):
        manager_id, _, unit = managers[(i - 1) % len(managers)]
        people.append({
            "شناسه کارمند": f"E{i:03d}", "عنوان نمایشی": f"کارمند آزمایشی {i:03d}",
            "واحد": unit, "شناسه مدیر": manager_id,
            "عنوان شغلی": ["کارشناس", "کارشناس ارشد", "سرپرست", "تحلیلگر", "توسعه‌دهنده"][i % 5],
            "سابقه (سال)": 1 + (i * 3) % 11,
            "ساعت آموزش": 8 + rng.randrange(60),
            "وضعیت همکاری": "فعال",
        })
    activities = []
    for p in people:
        for month_idx, month in enumerate(months):
            activities.append({
                "دوره": month, "شناسه کارمند": p["شناسه کارمند"],
                "واحد": p["واحد"], "شناسه مدیر": p["شناسه مدیر"],
                "وظایف محول شده": 14 + rng.randrange(20),
                "وظایف تکمیل شده": 10 + rng.randrange(15),
                "ساعت آموزش": rng.randrange(12),
                "شاخص کیفیت (%)": 68 + rng.randrange(30),
                "درخواست پشتیبانی": rng.randrange(5),
            })

    projects, milestones = [], []
    stages = ["در حال اجرا", "برنامه‌ریزی", "تکمیل"]
    for i in range(1, 25):
        manager_id, _, unit = managers[(i - 1) % len(managers)]
        budget = 250 + i * 45 + rng.randrange(140)
        status = stages[i % 3]
        projects.append({
            "شناسه پروژه": f"P{i:03d}", "نام پروژه": f"پروژه آزمایشی {i:02d}",
            "واحد": unit, "شناسه مدیر": manager_id,
            "وضعیت": status, "اولویت": ["بالا", "متوسط", "پایین"][i % 3],
            "پیشرفت (%)": 100 if status == "تکمیل" else 18 + rng.randrange(70),
            "بودجه مصوب (میلیون تومان)": budget,
            "هزینه تا امروز (میلیون تومان)": int(budget * (.30 + rng.random() * .64)),
            "تأخیر (روز)": max(0, rng.randrange(-3, 16)),
        })
        for month_idx, month in enumerate(months):
            milestones.append({
                "دوره": month, "شناسه پروژه": f"P{i:03d}", "واحد": unit,
                "شناسه مدیر": manager_id,
                "پیشرفت ماهانه (%)": min(100, month_idx * 11 + rng.randrange(8, 24)),
                "فعالیت بسته شده": 4 + rng.randrange(16),
                "ریسک‌های باز": rng.randrange(7),
                "انحراف بودجه (%)": rng.randrange(-12, 22),
            })

    finance = []
    for month_idx, month in enumerate(months):
        for i, (_, _, unit) in enumerate(managers):
            approved = 130 + (i + 2) * 37 + month_idx * 7
            actual = round(approved * (0.84 + rng.random() * .34))
            finance.append({
                "دوره": month, "واحد": unit, "بودجه مصوب (میلیون تومان)": approved,
                "هزینه واقعی (میلیون تومان)": actual,
                "انحراف هزینه (میلیون تومان)": actual - approved,
                "درآمد (میلیون تومان)": round(actual * (1.25 + rng.random() * .7)),
                "تعداد سفارش": 10 + i * 3 + rng.randrange(23),
            })

    quality = []
    channels = ["تلفن", "تیکت", "وب‌سایت", "حضوری"]
    for i in range(1, 241):
        unit = teams[(i * 7 + i // 10) % len(teams)]
        quality.append({
            "شناسه درخواست": f"Q{i:04d}", "دوره": months[(i - 1) % len(months)],
            "واحد": unit, "کانال": channels[i % len(channels)],
            "موضوع": ["مشکل فنی", "پیشنهاد", "پیگیری", "درخواست خدمات"][i % 4],
            "وضعیت": ["بسته", "در حال بررسی", "بسته", "بسته"][i % 4],
            "زمان پاسخ (ساعت)": 1 + rng.randrange(49),
            "امتیاز رضایت (از ۵)": 2 + rng.randrange(4),
        })

    return [
        ("DEMO__01__مدیران_و_عملکرد.xlsx", [("شاخص‌های مدیریتی", manager_rows)]),
        ("DEMO__02__کارکنان_و_فعالیت.xlsx", [("فهرست کارکنان", people), ("فعالیت ماهانه", activities)]),
        ("DEMO__03__پروژه‌ها.xlsx", [("سبد پروژه‌ها", projects), ("روند پروژه‌ها", milestones)]),
        ("DEMO__04__بودجه_و_مالی.xlsx", [("بودجه و هزینه", finance)]),
        ("DEMO__05__کیفیت_و_رضایت.xlsx", [("درخواست‌های خدماتی", quality)]),
    ]


def seed_demo(db: Session):
    owner = db.scalar(select(User).where(User.email == DEMO_EMAIL))
    if owner is None:
        owner = User(email=DEMO_EMAIL, name="داده‌های نمایشی (غیرواقعی)",
                     password_hash="!disabled-demo-account", role="system", active=False)
        db.add(owner)
        db.flush()
    created = []
    skipped = []
    total_rows = 0
    for filename, sheets in generate_demo_sets():
        exists = db.scalar(select(Dataset.id).where(Dataset.filename == filename, Dataset.owner_id == owner.id))
        if exists is not None:
            skipped.append(filename)
            continue
        count = sum(len(rows) for _, rows in sheets)
        dataset = Dataset(owner_id=owner.id, filename=filename,
                          row_count=count, sheet_count=len(sheets))
        db.add(dataset)
        db.flush()
        for name, rows in sheets:
            if not rows:
                continue
            sheet = DataSheet(dataset_id=dataset.id, name=name,
                              columns=list(rows[0]), row_count=len(rows))
            db.add(sheet)
            db.flush()
            db.add_all(
                DataRow(sheet_id=sheet.id, sequence=idx, data=row)
                for idx, row in enumerate(rows, 1)
            )
        created.append(filename)
        total_rows += count
    db.commit()
    return {"created": created, "skipped": skipped, "new_rows": total_rows, "synthetic": True}


def main():
    url = os.environ["DATABASE_URL"]
    engine = create_engine(url)
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        print(json.dumps(seed_demo(db), ensure_ascii=False))


if __name__ == "__main__":
    main()
