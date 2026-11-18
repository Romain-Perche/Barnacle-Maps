#!/bin/sh
# Prepare and start the app for the AI scenarios (run from the repo root).
set -e
[ -f /tmp/leaflet/package/dist/leaflet.js ] || (cd /tmp && npm pack leaflet@1.9.4 >/dev/null && mkdir -p leaflet && tar -xzf leaflet-1.9.4.tgz -C leaflet)
curl -s -o /dev/null localhost:8000 || (nohup npm run start >/tmp/server.log 2>&1 &)
for i in 1 2 3 4 5 6 7 8 9 10; do curl -s -o /dev/null localhost:8000 && exit 0; sleep 1; done
echo "app did not start" >&2; exit 1
