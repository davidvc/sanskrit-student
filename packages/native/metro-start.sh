#!/bin/bash
# Dev server for Expo Go on local network (direct device-to-device).

set -e

echo "Starting Expo Metro bundler..."
npx expo start --lan --clear
