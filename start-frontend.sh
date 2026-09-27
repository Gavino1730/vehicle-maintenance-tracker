#!/bin/bash
# 4Runner Maintenance Tracker - Start Frontend Development Server
cd "$(dirname "$0")/frontend"
echo "Starting 4Runner Frontend Development Server..."
echo ""
echo "The app will be available at http://localhost:5173"
echo ""
npm run dev
