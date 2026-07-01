# Build frontend and backend together for Render deploy
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.14-slim AS backend-builder
WORKDIR /app/backend
COPY backend/requirements.txt ./
RUN python -m pip install --upgrade pip
RUN pip install -r requirements.txt
COPY backend/ ./
COPY --from=frontend-builder /app/frontend/dist /app/backend/frontend/dist

ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=config.settings
ENV PATH="/root/.local/bin:$PATH"
ARG SECRET_KEY=changeme12345
ENV SECRET_KEY=${SECRET_KEY}
ENV PORT=8000

RUN python manage.py collectstatic --noinput
RUN python -m pip install gunicorn

EXPOSE 8000
CMD ["/bin/sh", "/app/backend/entrypoint.sh"]