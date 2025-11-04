#!/bin/bash
set -e

echo "🛑 Stopping WineScope Development Environment..."
docker compose down
echo ""
echo "✅ All services stopped successfully."
