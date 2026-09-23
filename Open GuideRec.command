#!/bin/zsh
# GuideRec — local practice guide. Loopback only.
# Leave this window open while you use the app.

set -e
PORT=5183
ROOT="/Users/kenzi/ChantzMedia/ChantzMediaProjects/StackRig"

cd "$ROOT" || {
  echo "ERROR: App folder not found: $ROOT"
  exit 1
}

kill_port_server() {
  local pids
  pids=$(lsof -nP -iTCP:${PORT} -sTCP:LISTEN -t 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    echo "Stopping previous GuideRec on port ${PORT}…"
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 0.4
  fi
}

echo ""
echo "GuideRec"
echo "http://127.0.0.1:${PORT}/"
echo "Leave this window open. Ctrl+C stops the app."
echo ""

if [[ ! -d node_modules ]]; then
  echo "Installing dependencies…"
  npm install
fi

kill_port_server
npm run dev &
DEV_PID=$!

cleanup() {
  kill "$DEV_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for i in {1..40}; do
  if curl -sf "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

open "http://127.0.0.1:${PORT}/" 2>/dev/null || true
wait "$DEV_PID"
