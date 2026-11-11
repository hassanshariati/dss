FROM public.ecr.aws/docker/library/node:22-alpine AS ui
WORKDIR /build/frontend
COPY frontend/package.json ./
RUN npm install --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM public.ecr.aws/docker/library/python:3.12-slim AS service
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 STATIC_DIST=/app/frontend/dist
RUN apt-get update && apt-get install -y --no-install-recommends fonts-dejavu-core ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN groupadd --system dss && useradd --system --gid dss --home-dir /app dss
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app/ ./app/
COPY --from=ui /build/frontend/dist/ /app/frontend/dist/
RUN chown -R dss:dss /app
USER dss
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=4 \
  CMD python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8000/api/health',timeout=3)"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
