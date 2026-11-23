#!/bin/bash
# Tunnel Monitor - Auto-restarts tunnel if it drops

while true; do
  # Check if expo process is running
  if ! pgrep -f "expo start" > /dev/null; then
    echo "$(date): Tunnel process died, restarting..."
    cd /Users/crancitech/Desktop/fin-app-main/mobile
    npx expo start --tunnel --no-dev --minify &
  fi
  sleep 30
done
