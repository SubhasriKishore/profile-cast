#!/bin/bash
cd "$(dirname "$0")"

# Start backend (api) in background
./start.sh &
BACKEND_PID=$!
echo "[dev.sh] Backend (FastAPI) started on http://localhost:5000 (PID: $BACKEND_PID)"

# Wait a bit to ensure backend is up
sleep 3

# Start frontend (Next.js) in foreground
cd frontend
npm install
npm run dev

# When frontend stops, kill backend
kill $BACKEND_PID 