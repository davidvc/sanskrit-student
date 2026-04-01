#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
MAESTRO_FLOWS="$SCRIPT_DIR"
SERVER_PORT=4000
SERVER_PID=""

# --- Cleanup ------------------------------------------------------------------

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    echo "Stopping backend server (pid $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# --- GCP auth -----------------------------------------------------------------

echo "Checking GCP application-default credentials..."
if ! gcloud auth application-default print-access-token &>/dev/null; then
  echo "No valid credentials found. Launching gcloud auth..."
  gcloud auth application-default login
fi
echo "GCP credentials OK."

# --- Backend server -----------------------------------------------------------

echo "Starting backend server on port $SERVER_PORT..."
npm --prefix "$PROJECT_ROOT" run dev &>/tmp/sanskrit-backend.log &
SERVER_PID=$!

echo "Waiting for backend to be ready..."
for i in $(seq 1 30); do
  if curl -sf "http://localhost:$SERVER_PORT/graphql" -H 'Content-Type: application/json' \
      --data '{"query":"{__typename}"}' &>/dev/null; then
    echo "Backend is ready."
    break
  fi
  if [[ $i -eq 30 ]]; then
    echo "ERROR: Backend did not start within 30 seconds." >&2
    echo "Server log:" >&2
    cat /tmp/sanskrit-backend.log >&2
    exit 1
  fi
  sleep 1
done

# --- Maestro tests ------------------------------------------------------------

echo "Running Maestro E2E tests..."
maestro test "$MAESTRO_FLOWS"
