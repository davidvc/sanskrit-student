#!/bin/bash
# Dev server with Cloudflare tunnel for Expo Go on restricted networks (hotel wifi etc).
#
# Architecture:
#   Expo Go → https://TUNNEL_HOST → Cloudflare → metro-proxy:8082 → Metro:8081
#   metro-proxy.js rewrites manifest URLs from http://TUNNEL_HOST:8081 → https://TUNNEL_HOST
#
# --tunnel is broken (ngrok v2 EOL). For pilot distribution see beads ss-aa6.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v cloudflared &>/dev/null; then
    echo "cloudflared not found. Install: brew install cloudflare/cloudflare/cloudflared"
    exit 1
fi

TUNNEL_URL_FILE=$(mktemp)
PROXY_PID=""
METRO_PID=""

cleanup() {
    kill "$PROXY_PID" 2>/dev/null || true
    kill "$METRO_PID" 2>/dev/null || true
    rm -f "$TUNNEL_URL_FILE"
}
trap cleanup EXIT INT TERM

# Start Cloudflare tunnel pointing at the proxy (port 8082), not Metro directly
echo "Starting Cloudflare tunnel..."
cloudflared tunnel --url http://localhost:8082 2>&1 | while IFS= read -r line; do
    echo "$line" >&2
    if [[ "$line" =~ (https://[a-zA-Z0-9-]+\.trycloudflare\.com) ]]; then
        echo "${BASH_REMATCH[1]}" > "$TUNNEL_URL_FILE"
    fi
done &

# Wait up to 30s for the tunnel URL
echo "Waiting for tunnel URL..."
for i in {1..30}; do
    [[ -s "$TUNNEL_URL_FILE" ]] && break
    sleep 1
done

TUNNEL_URL=$(cat "$TUNNEL_URL_FILE")
if [[ -z "$TUNNEL_URL" ]]; then
    echo "ERROR: Timed out waiting for Cloudflare tunnel URL"
    exit 1
fi
TUNNEL_HOST="${TUNNEL_URL#https://}"
echo "Tunnel: $TUNNEL_URL"

# Start the manifest-rewriting proxy
node "$SCRIPT_DIR/metro-proxy.js" "$TUNNEL_HOST" &
PROXY_PID=$!

# Start Metro — REACT_NATIVE_PACKAGER_HOSTNAME makes it put the tunnel host
# in manifest URLs (still with :8081, which the proxy then strips)
echo "Starting Expo Metro bundler..."
REACT_NATIVE_PACKAGER_HOSTNAME="$TUNNEL_HOST" npx expo start --lan --clear &
METRO_PID=$!

# Wait for Metro to be ready, then show the QR code
sleep 10

echo ""
qrencode -t ANSIUTF8 "exp://${TUNNEL_HOST}"
echo "Scan in Expo Go, or enter manually: exp://${TUNNEL_HOST}"

wait $METRO_PID
