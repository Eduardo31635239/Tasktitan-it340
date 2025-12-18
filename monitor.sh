#!/bin/bash

echo "=== Task Titan Request Monitor ==="
echo "Logging Nginx access requests from Front-End VM with timestamps"
echo "Press Ctrl+C to stop"
echo

# SSH to Front-End and tail the Nginx access log, adding local timestamp
ssh frontend@frontend "tail -f /var/log/nginx/access.log" | while read line; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $line"
done
