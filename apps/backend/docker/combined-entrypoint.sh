#!/bin/sh
set -e

OSRM_DATA="/data/venezuela-latest.osrm"
OSRM_PORT=${OSRM_PORT:-5000}
GEOCODE_PORT=${GEOCODE_PORT:-8080}

cleanup() {
  echo "[Combined] Shutting down..."
  [ -n "$OSRM_PID" ] && kill "$OSRM_PID" 2>/dev/null
  [ -n "$GEOCODE_PID" ] && kill "$GEOCODE_PID" 2>/dev/null
  exit 0
}
trap cleanup INT TERM

if [ -f "$OSRM_DATA" ]; then
  echo "[Combined] Starting OSRM routing on port $OSRM_PORT..."
  osrm-routed --algorithm mld --port "$OSRM_PORT" "$OSRM_DATA" &
  OSRM_PID=$!
  echo "[Combined] OSRM started (PID: $OSRM_PID)"
else
  echo "[Combined] WARNING: OSRM data not found at $OSRM_DATA"
fi

echo "[Combined] Starting Ohana Geocoder on port $GEOCODE_PORT..."
node /app/geocode-server.js &
GEOCODE_PID=$!

echo "[Combined] All services started. OSRM=$OSRM_PID, Geocoder=$GEOCODE_PID"
wait
