# GovSOP AI — Backend (FastAPI)

Local-first API for GovSOP AI. Fully offline; no API keys required.

## Prerequisites
- Python 3.11+ (developed against 3.13). On Windows the `py` launcher is used in the examples below.

## Setup (Windows / PowerShell)

```powershell
# From the backend/ directory
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
```

## Run

```powershell
# Serves on http://localhost:8000
py -m uvicorn app.main:app --reload --port 8000
```

- Health check: http://localhost:8000/health → `{"status":"ok"}`
- OpenAPI docs: http://localhost:8000/docs

## Test

```powershell
py -m pytest
```

## Notes
- CORS is enabled for the Next.js dev server at `http://localhost:3000`.
