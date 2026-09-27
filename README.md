# Vehicle Maintenance Tracker

A full-stack maintenance tracker for keeping service schedules, component lifecycles, mileage, and service history in one place. Optional AI insights turn the tracked history into plain-language maintenance guidance.

## What it does

- Tracks current mileage and upcoming or overdue maintenance
- Records completed services and maintenance history
- Monitors component life by mileage
- Provides optional AI-generated maintenance insights

## Tech stack

React + Vite frontend, Express API, SQLite, and an optional OpenAI integration.

## Run locally

```powershell
# Terminal 1
cd backend
npm install
npm run dev

# Terminal 2
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`; the API runs at `http://localhost:3001`.

## Optional AI insights

Add `OPENAI_API_KEY` to `backend/.env`. The tracker remains usable without it.

## Project status

Personal project, prepared for local use and further development. Do not commit local databases or environment files.
