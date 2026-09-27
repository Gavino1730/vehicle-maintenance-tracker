#!/bin/bash
# 4Runner Maintenance Tracker - Start Backend Server
cd "$(dirname "$0")/backend"
echo "Starting 4Runner Backend Server..."
echo ""
echo "The API will be available at http://localhost:3001"
echo ""
npm run dev
