#!/usr/bin/env bash
# Serve the deck on localhost so iframes (live LSRI/discoveryLabNL embeds) work.
# Run:  ./serve.sh   then open  http://localhost:8000  in Chrome.
cd "$(dirname "$0")"
PORT="${1:-8000}"
echo "Serving deck on http://localhost:${PORT} — Ctrl+C to stop."
python3 -m http.server "$PORT"
