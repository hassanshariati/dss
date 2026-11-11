"""End-to-end API smoke test with an isolated SQLite database."""
import io
import os
from pathlib import Path
import tempfile
from unittest.mock import patch

os.environ["DEV_MODE"] = "1"
os.environ["COOKIE_SECURE"] = "false"
os.environ["SESSION_SECRET"] = "test-only-" + "x" * 48
os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(tempfile.gettempdir()) / "dss-ci-tests.sqlite3")

import pytest
from fastapi.testclient import TestClient
from openpyxl import Workbook
from app.main import app, engine, SessionLocal, password_hasher
from app.models import Base, User

@pytest.fixture
def client():
    Base.metadata.drop_all(engine)
    with TestClient(app) as app_client:
        with SessionLocal() as db:
            db.add(User(email="analyst@example.org", name="Analyst User",
                        role="employee", password_hash=password_hasher.hash("example-only-strong-password-123")))
            db.add(User(email="manager@example.org", name="Example Manager",
                        role="manager", password_hash=password_hasher.hash("example-only-strong-password-123")))
            db.add(User(email="admin@example.org", name="Demo Admin",
                        role="admin", password_hash=password_hasher.hash("example-only-strong-password-123")))
            db.commit()
        yield app_client

def sign_in(client, email):
    with patch("app.main.secrets.choice", return_value="A"):
        captcha = client.post("/api/auth/captcha").json()
    assert captcha["image"].startswith("data:image/png;base64,")
    response = client.post("/api/auth/login", json={
        "email": email,
        "password": "example-only-strong-password-123",
        "captcha_id": captcha["id"],
        "captcha_answer": "AAAAA",
    })
    assert response.status_code == 200, response.text
    return {"X-CSRF-Token": response.json()["csrf"]}

def test_employee_upload_and_analysis(client):
    assert client.get("/api/health").json()["status"] == "ok"
    assert client.post("/api/datasets", files={"file": ("no.csv", b"team,score\nA,2\n")}).status_code == 401
    headers = sign_in(client, "analyst@example.org")
    assert client.post("/api/datasets", files={"file": ("test.csv", b"team,score\nA,2\n")}).status_code == 403
    book = Workbook()
    sheet = book.active
    sheet.title = "Performance"
    sheet.append(["Team", "Score"])
    sheet.append(["A", 10])
    sheet.append(["A", 20])
    sheet.append(["B", 30])
    buffer = io.BytesIO()
    book.save(buffer)
    r = client.post("/api/datasets", files={"file": ("teams.xlsx", buffer.getvalue())}, headers=headers)
    assert r.status_code == 200, r.text
    did = r.json()["id"]
    detail = client.get(f"/api/datasets/{did}").json()
    assert detail["row_count"] == 3
    sid = detail["sheets"][0]["id"]
    chart = client.get(f"/api/datasets/{did}/chart", params={
        "sheet_id": sid, "group": "Team", "metric": "Score", "operation": "avg"})
    assert chart.status_code == 200
    assert chart.json()["data"][0] == {"name": "B", "value": 30.0}
    analysis = client.get(f"/api/datasets/{did}/analysis", params={"sheet_id": sid})
    assert analysis.status_code == 200
    assert analysis.json()["columns"][1]["avg"] == 20
    assert client.get("/api/dashboard").status_code == 403
    assert client.get("/api/users").status_code == 403

def test_manager_dashboard_and_captcha_one_use(client):
    headers = sign_in(client, "manager@example.org")
    dashboard = client.get("/api/dashboard")
    assert dashboard.status_code == 200
    assert dashboard.json()["employees"] == 1
    assert client.post("/api/auth/logout", headers=headers).status_code == 200
    assert client.get("/api/dashboard").status_code == 401

def test_admin_can_change_login_brand_and_create_user(client):
    headers = sign_in(client, "admin@example.org")
    from PIL import Image
    img = io.BytesIO()
    Image.new("RGB", (60, 60), color=(36, 209, 175)).save(img, format="PNG")
    updated = client.put("/api/settings/branding/employee",
        data={"company_name": "شرکت نمونه آزمایشی"},
        files={"logo": ("brand.png", img.getvalue(), "image/png")},
        headers=headers)
    assert updated.status_code == 200, updated.text
    assert updated.json()["logo"].startswith("data:image/png;base64,")
    assert client.get("/api/branding/employee").json()["company_name"] == "شرکت نمونه آزمایشی"
    created = client.post("/api/users", headers=headers, json={
        "name": "کارمند تست",
        "email": "newemployee@example.org",
        "role": "employee",
        "password": "example-only-strong-password-234"})
    assert created.status_code == 200, created.text
    assert len(client.get("/api/users").json()) == 4
