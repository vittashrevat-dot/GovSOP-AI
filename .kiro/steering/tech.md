# Tech Stack

## Backend (`backend/`)

- **Python FastAPI** on port 8000, served with uvicorn.
- Parses markdown documents (YAML frontmatter + body) with `python-frontmatter`.
- Builds an in-memory **TF-IDF** index over document sections at startup
  (standard library only — no ML dependencies). Lightweight stemming unifies
  word variants; results are coverage-weighted and return source citations.
- Endpoints: `/health`, `GET /documents`, `GET /documents/{doc_id}`,
  `POST /documents` (upload + re-index), `GET /search`, `GET /extraction`,
  `GET /extraction/{doc_id}`.
- Tested with `pytest` (+ `httpx` TestClient).

## Frontend (`frontend/`)

- **Next.js (App Router) + React + Tailwind CSS** on port 3000.
- Dark, high-density command-center theme.
- Typed API client in `src/lib/api.ts` reading `NEXT_PUBLIC_API_BASE`.
- Views: Search (`/`), Directory (`/directory`), Extraction Dashboard
  (`/dashboard`).
- Tested with `vitest` + Testing Library (jsdom).

## Data (`mock_documents/`)

- Markdown files with YAML frontmatter simulating secure government document
  storage. Extraction fields are authored in frontmatter.

## Common Commands

```powershell
# Backend (from backend/)
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
.\.venv\Scripts\python.exe -m pytest

# Frontend (from frontend/)
npm install
npm run dev
npm test
npm run build

# Both at once (from repo root, needs Node on PATH)
npm install
npm run dev
```

## Environment Notes (this machine)

- Python is invoked via the `py` launcher; `python`/`python3` are not on PATH.
  Use the venv's `.venv\Scripts\python.exe` directly.
- Node.js lives at `C:\Program Files\nodejs`. If `node`/`npm` are not resolved
  in a shell, open a new terminal or call them by full path. PowerShell's
  execution policy may block the `npm.ps1` shim; use `npm.cmd` if so.
