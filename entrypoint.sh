#!/bin/sh
set -e

echo "[entrypoint] Preparing data directory..."
mkdir -p /app/data

echo "[entrypoint] Running database migrations..."
npx sequelize-cli db:migrate --env production

echo "[entrypoint] Starting SerpBear (app + cron)..."
exec "$@"
