#!/bin/sh
set -e

# Create NestJS monorepo compatibility symlinks
# This ensures the build output location matches the expected runtime location
mkdir -p /app/dist/apps

# Create symlinks for both services
ln -sf /app/apps/api/dist /app/dist/apps/api 2>/dev/null || true
ln -sf /app/apps/crawler/dist /app/dist/apps/crawler 2>/dev/null || true

# Execute the command passed to the container
exec "$@"
