# DSS Studio — سامانه هوشمند تصمیم‌یار

A Persian RTL decision-support platform for uploading Excel / CSV, organization-wide analytics, interactive charts, and configurable branding.

**GitHub:** https://github.com/hassanshariati/dss

## Version 0.1

Employee portal: /dss/employee

Management portal: /dss/management

Login pages: /dss/login/employee and /dss/login/management

- Employee: upload XLSX/CSV, see their own history, preview data and generate charts.
- Manager: review aggregated organizational counters, all uploaded datasets, per-sheet data quality, numeric statistics, and dynamic charts (bar/line/area/pie).
- Admin: create employee/manager/admin accounts and customize company name/logo independently for both login screens.
- Secure login: Argon2 password hashing, one-use image CAPTCHA, HTTP-only session cookies, CSRF protection, temporary account lockout, HTTPS-only cookies in production.
- An optional LLM endpoint can add interpretations using *numeric aggregates only*. Arithmetic and graphs never rely on language-model output.
- Automated GitHub CI: backend tests, frontend build, Docker build.
- Manual gated GitHub Actions deployment to the previous server with verified SSH host key.

**Status:** initial MVP source code. Production server and public domain have not been configured by this repository. Avoid uploading real sensitive HR records until security hardening, privacy review, proper backups and testing are complete.

## Deployment: 94.184.27.131

Prepare the host safely, without replacing the existing Interview AI, ERP, or armember.ir gateway:

1. Ensure Docker + Docker Compose are installed and the host can access GitHub and the Docker registry.
2. Run:

   git clone https://github.com/hassanshariati/dss.git /opt/dss
   cd /opt/dss
   cp .env.example .env
   chmod 600 .env

3. Edit .env. Use unique random values for **POSTGRES_PASSWORD** (URL-safe alphanumeric recommended) and **SESSION_SECRET** (minimum 32 random chars). Never commit secrets. Keep the bind port 18110 unless it conflicts with another service.
4. Start the service and check health:

   docker compose up -d --build
   curl -fsS http://127.0.0.1:18110/dss/api/health

5. Create the first admin using the interactive command (password hidden; length >=16):

   docker compose exec api python -m app.bootstrap

6. Verify the current HTTPS gateway before changes. Add ONLY the directives in deploy/nginx-location.conf (if nginx is serving armember.ir) or deploy/caddy-snippet.txt (if Caddy), inside the **existing** armember.ir HTTPS server/site. Test the config before reload.
7. Verify the two login pages over https://armember.ir/dss/ and create least-privilege accounts.

## GitHub Actions deployment

Configure protected production Environment and repository Actions secrets:

- DSS_SSH_KEY: dedicated SSH private key for a deploy account
- DSS_SSH_USER: server account that owns /opt/dss and can run Docker
- DSS_KNOWN_HOSTS: the *independently verified* SSH host key entry for 94.184.27.131

Then run Actions → **DSS Deploy (manual, verified SSH)**. Deployment uses GitHub-hosted runners and SSH so it does not rely on the previous Interview AI repository's self-hosted runner being registered here. Never use StrictHostKeyChecking=no or copy existing application secrets into Actions.

The deployment checks for .env and a clean checkout, builds images, and checks http://127.0.0.1:18110/dss/api/health. Setting the public reverse proxy is a **separate step** so the existing domain is not overwritten.

## Development

Python 3.12 and Node 22:

    python -m pip install -r backend/requirements.txt
    DEV_MODE=1 PYTHONPATH=backend COOKIE_SECURE=false uvicorn app.main:app --reload --port 8000

    cd frontend
    npm install
    npm run dev

Run tests:

    PYTHONPATH=backend pytest backend/tests -q

## Current limits and security roadmap

- Supports XLSX and CSV, max 12 MB, 12 sheets and 40k total rows per uploaded file.
- XLSX is read in read-only/data-only mode; macros and formula execution are not supported.
- Charts can group and aggregate selected columns, but cross-file entity resolution and semantic HR KPI models are *not yet implemented*.
- Employee access is limited to own datasets; manager/admin can access all. Single-organization authorization only.
- No public registration or default passwords.
- For production HR/employee-performance data, add a reviewed KPI policy, audit logs, distributed rate limits, MFA/SSO, encryption/data-retention controls, backups, schema migrations and a human approval process. Do not allow AI-only employment decisions.

## Demonstration datasets

Upload the clearly synthetic examples in samples/demo_performance.csv and samples/demo_projects.csv through the employee portal. All names, metrics and projects in these files are fictional and **not actual performance evaluations**. Use the management explorer to choose a group, an aggregation, and one of the automatically suggested charts.

## Populated demonstration data

For initial evaluation, docker-compose.yml enables \`SEED_DEMO_DATA=true\`. At API startup the idempotent \`backend/app/seed_demo.py\` generates **five explicitly marked DEMO datasets** with more than 1,000 synthetic records: management KPIs (8 managers over 9 months), employees and activities (64 staff), project portfolio/milestones (24 projects), finance and budgets, and service-quality requests. Identifiers and figures are fake and never represent actual people. These datasets are owned by a disabled system account and appear only in manager/admin organization-wide views. Repeated restarts do not duplicate them or alter employees' uploads.

Run manually after database initialization: \`docker compose exec -T api python -m app.seed_demo\`

Disable automatic sample seeding with \`SEED_DEMO_DATA=false\` in /opt/dss/.env. Existing samples are not deleted automatically. For production assessments, keep samples visually separated and establish reviewed KPI definitions before relying on any decisions.
