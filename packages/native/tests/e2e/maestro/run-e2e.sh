#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
NATIVE_DIR="$PROJECT_ROOT/packages/native"
MAESTRO_FLOWS="$SCRIPT_DIR"
SERVER_PORT=4000
METRO_PORT=8081
SERVER_PID=""
METRO_PID=""
SIMULATOR_UDID=""

export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
export PATH="$HOME/.maestro/bin:$PATH"

# --- Cleanup ------------------------------------------------------------------

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    echo "Stopping backend server (pid $SERVER_PID)..."
    kill "$SERVER_PID" 2>/dev/null || true
  fi
  if [[ -n "$METRO_PID" ]]; then
    echo "Stopping Metro bundler (pid $METRO_PID)..."
    kill "$METRO_PID" 2>/dev/null || true
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

# --- iOS Simulator ------------------------------------------------------------

echo "Checking for a booted iOS Simulator..."
SIMULATOR_UDID=$(xcrun simctl list devices | grep Booted | grep -oE '[A-F0-9-]{36}' | head -1 || true)

if [[ -z "$SIMULATOR_UDID" ]]; then
  echo "No booted simulator found. Booting iPhone 16 Pro..."
  SIMULATOR_UDID=$(xcrun simctl list devices available | grep 'iPhone 16 Pro (' | grep -oE '[A-F0-9-]{36}' | head -1)
  xcrun simctl boot "$SIMULATOR_UDID"
  open -a Simulator
  echo "Waiting for simulator to finish booting..."
  xcrun simctl bootstatus "$SIMULATOR_UDID" -b
fi
echo "Simulator ready: $SIMULATOR_UDID"

# Install app — reinstall from cached build if available, otherwise build from source
APP_BUNDLE_ID=$(cd "$NATIVE_DIR" && node -e "const a=require('./app.json'); console.log(a.expo.ios.bundleIdentifier)")
APP_BINARY=$(find ~/Library/Developer/Xcode/DerivedData -name "SanskritStudent.app" -path "*/Debug-iphonesimulator/*" 2>/dev/null | head -1 || true)

if ! xcrun simctl get_app_container "$SIMULATOR_UDID" "$APP_BUNDLE_ID" &>/dev/null; then
  if [[ -n "$APP_BINARY" ]]; then
    echo "Reinstalling from cached build: $APP_BINARY"
    xcrun simctl install "$SIMULATOR_UDID" "$APP_BINARY"
  else
    echo "No cached build found. Building from source (this may take a few minutes)..."
    (cd "$NATIVE_DIR" && CI=1 npx expo run:ios --device "$SIMULATOR_UDID" --no-bundler) 2>&1
    APP_BINARY=$(find ~/Library/Developer/Xcode/DerivedData -name "SanskritStudent.app" -path "*/Debug-iphonesimulator/*" 2>/dev/null | head -1 || true)
  fi
fi
echo "App installed."

# --- Metro bundler ------------------------------------------------------------

echo "Starting Metro bundler on port $METRO_PORT..."
(cd "$NATIVE_DIR" && npx expo start --port "$METRO_PORT") &>/tmp/sanskrit-metro.log &
METRO_PID=$!

echo "Waiting for Metro to be ready..."
for i in $(seq 1 30); do
  if curl -sf "http://localhost:$METRO_PORT/status" &>/dev/null; then
    break
  fi
  if [[ $i -eq 30 ]]; then
    echo "ERROR: Metro did not start within 30 seconds." >&2
    cat /tmp/sanskrit-metro.log >&2
    exit 1
  fi
  sleep 1
done

echo "Warming up bundle (waiting for Metro to finish bundling)..."
curl -sf "http://localhost:$METRO_PORT/node_modules/expo-router/entry.bundle?platform=ios&dev=true&minify=false" -o /dev/null --max-time 120
echo "Metro is ready."

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
