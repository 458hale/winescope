#!/bin/bash
set -e

echo "🚀 Starting WineScope Development Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop."
  exit 1
fi

# Start services
echo "📦 Starting Docker services..."
docker compose --profile development up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service status
echo ""
echo "📊 Checking service status..."
docker compose ps

echo ""
echo "✅ Services started successfully!"
echo ""
echo "📊 API Service: http://localhost:3000"
echo "🕷️  Crawler Service: http://localhost:3001"
echo ""
echo "📋 Useful commands:"
echo "  - View logs: pnpm run docker:logs"
echo "  - Stop services: pnpm run docker:down"
echo "  - Debug mode: pnpm run docker:debug"
echo "  - API shell: pnpm run docker:shell:api"
echo ""
