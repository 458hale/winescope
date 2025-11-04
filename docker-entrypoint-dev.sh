#!/bin/sh
set -e

echo "[ENTRYPOINT] Creating NestJS monorepo compatibility symlinks..."

# Create NestJS monorepo compatibility symlinks
# This ensures the build output location matches the expected runtime location
mkdir -p /app/dist/apps

# Remove any existing symlinks or directories to avoid conflicts
rm -rf /app/dist/apps/api
rm -rf /app/dist/apps/crawler

# Create fresh symlinks for both services
ln -sf /app/apps/api/dist /app/dist/apps/api
ln -sf /app/apps/crawler/dist /app/dist/apps/crawler

echo "[ENTRYPOINT] Symlinks created successfully:"
ls -la /app/dist/apps/
echo "[ENTRYPOINT] Starting application..."

# Execute the command passed to the container
exec "$@"
