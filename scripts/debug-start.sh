#!/bin/bash
set -e

echo "🐛 Starting WineScope Debug Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop."
  exit 1
fi

# Start services in debug mode
echo "📦 Starting Docker services in debug mode..."
docker compose --profile debug up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service status
echo ""
echo "📊 Checking service status..."
docker compose ps

echo ""
echo "✅ Debug environment started successfully!"
echo ""
echo "📊 API Service: http://localhost:3000"
echo "🐛 Debugger Port: 9229"
echo "🕷️  Crawler Service: http://localhost:3001"
echo ""
echo "🔍 Next steps:"
echo "  1. Open VSCode Cursor"
echo "  2. Press F5 or Run > Start Debugging"
echo "  3. Select 'Docker: Attach to API (Debug Mode)'"
echo "  4. Set breakpoints in your code"
echo "  5. Make API requests to trigger breakpoints"
echo ""
echo "📋 Useful commands:"
echo "  - View debug logs: docker compose logs -f api-debug"
echo "  - Stop services: pnpm run docker:down"
echo "  - API shell: docker exec -it winescope-api-debug sh"
echo ""
