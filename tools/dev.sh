#!/usr/bin/env bash
# Start the GraphQL backend and Next.js web app for local development.
# Usage: ./tools/dev.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Ensure dependencies are installed
if [ ! -d "$ROOT/node_modules" ]; then
  echo "Installing root dependencies..."
  npm install --prefix "$ROOT"
fi

if [ ! -d "$ROOT/packages/shared/node_modules" ]; then
  echo "Building shared package..."
  npm run build --prefix "$ROOT/packages/shared"
fi

cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$BACKEND_PID" "$WEB_PID" 2>/dev/null
  wait "$BACKEND_PID" "$WEB_PID" 2>/dev/null
}
trap cleanup INT TERM

echo "Starting GraphQL backend on http://localhost:4000/graphql ..."
npm run dev --prefix "$ROOT" &
BACKEND_PID=$!

echo "Starting Next.js web app on http://localhost:3000 ..."
npm run dev --prefix "$ROOT/packages/web" &
WEB_PID=$!

echo ""
echo "  Backend:  http://localhost:4000/graphql"
echo "  Web app:  http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers."

wait "$BACKEND_PID" "$WEB_PID"
