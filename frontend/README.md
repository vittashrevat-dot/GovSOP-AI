# GovSOP AI — Frontend (Next.js + Tailwind)

Command-center UI for GovSOP AI. Talks to the FastAPI backend on port 8000.

## Prerequisites
- Node.js 18+ (developed against 24). On this machine Node lives at
  `C:\Program Files\nodejs`; if `node`/`npm` are not on your PATH, open a new
  terminal after installing or call them by full path.

## Setup

```powershell
# From the frontend/ directory
npm install
```

## Configure

The frontend reads `NEXT_PUBLIC_API_BASE` (defaults to `http://localhost:8000`).
Copy `.env.example` to `.env.local` to override.

## Run

```powershell
npm run dev   # http://localhost:3000
```

## Test / Build

```powershell
npm test
npm run build
```
