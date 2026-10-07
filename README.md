<img width="1916" height="1145" alt="Screenshot 2026-10-07 133325" src="https://github.com/user-attachments/assets/12f96d74-dfba-4f50-98eb-d4821944a946" /><img width="1916" height="1145" alt="Screenshot 2026-10-07 133325" src="https://github.com/user-attachments/assets/dde88ac2-c4ed-4b53-aebf-b87601b2e518" />
# GovSOP AI

**Author: Vittash Revat**

Local-first enterprise AI document management and decision support prototype.

## The Problem

Government agencies manage thousands of documents — policies, SOPs, circulars,
guidelines, reports, and meeting minutes. Finding the right information is slow
and manual, which leads to slower decision-making and reduced productivity. The
knowledge exists, but it is buried and hard to act on.

## What GovSOP AI Does

GovSOP AI transforms a folder of organizational documents into an intelligent,
searchable, self-organizing knowledge resource so employees and stakeholders
find the right information faster and make better decisions. It solves the
problem on three fronts:

- **Ask, don't dig (AI Assistant + Search).** Query the document library in
  natural language and get a direct, synthesized answer with explicit source
  citations (document ID + section) that link straight back to the source — so
  staff trust the answer and can verify it instantly.
- **Stay compliant automatically (Directory + Alerts).** Documents are
  auto-organized by department with compliance badges (⚠️ Needs Review, Outdated
  Clause) and a notification bell that surfaces exactly what needs attention,
  turning a passive archive into an active compliance tool.
- **Act on what matters (Extraction Dashboard).** Action items, deadlines,
  responsible departments, and key policy changes are automatically extracted
  into structured cards and exportable as an offline action plan — turning dense
  documents into a to-do list for compliance officers.

Everything runs locally and offline. No API keys, no external services — a fit
for sensitive government document handling.

## Screenshots

### 1. Extraction Dashboard
<img width="1916" height="1145" alt="Screenshot 2026-10-07 133325" src="https://github.com/user-attachments/assets/b12d5dd8-586f-4bd7-a9c2-a7a8d040b3b9" />
Automatically extracts action items, deadlines, responsible departments, and key
policy changes from across the whole library into structured cards. Each item
cites its source document, and the whole plan can be exported offline.

### 2. Auto-Organizing Directory with Compliance Alerts
<img width="1600" height="2431" alt="image" src="https://github.com/user-attachments/assets/11ca240c-d77b-4867-ae70-1d546e2f1709" />

Every document categorized by department with metadata and visual compliance
badges (Needs Review / Outdated Clause). Drag-and-drop upload adds new documents
that are indexed instantly. Clicking a card opens the full document.
<img width="1919" height="1145" alt="Screenshot 2026-10-07 133316" src="https://github.com/user-attachments/assets/3d170643-81e7-48b4-b611-9b090c4a039e" />

### 3. AI Assistant with Source Citations & Compliance Bell
Ask a question in plain language and get a synthesized answer with clickable
source citations (document ID + section). The notification bell lists every
flagged document so nothing slips through.

## Architecture

```
Next.js + Tailwind (frontend, :3000)  ──HTTP──▶  FastAPI (backend, :8000)
                                                      │
                                                      ▼
                                          mock_documents/*.md  (data layer)
```

- **Frontend:** Next.js (App Router) + React + Tailwind CSS.
- **Backend:** Python FastAPI with an in-memory TF-IDF index built at startup.
- **Data:** Markdown files with YAML frontmatter in `mock_documents/`.

## Before You Start (please read)

This is a **local app you run on your own computer** — not a website you can
open directly from GitHub. GitHub only stores the code; it does not run the
servers for you. To use GovSOP AI you download the code and start it locally,
then open it in your browser at `http://localhost:3000`.

You need two free tools installed first. If you don't have them, install them
(takes a few minutes), then follow Setup below:

- **Node.js 18 or newer** — download the "LTS" version:
  https://nodejs.org/en/download
  (On Windows you can also run `winget install OpenJS.NodeJS.LTS` in a terminal.)
- **Python 3.11 or newer** — download from: https://www.python.org/downloads/
  (On Windows, tick **"Add Python to PATH"** in the installer.)

To check if you already have them, open a terminal and run:

```
node --version
python --version
```

If both print a version number, you're ready. If a command is "not recognized",
install that tool (or on Windows, close and reopen the terminal after
installing), then try again.

> No way to install these? You can still see what the app looks like from the
> screenshots in the Screenshots section above — no installation needed to view
> those.

## Prerequisites

- **Python 3.11+** (developed on 3.13). On Windows the `py` launcher works too.
- **Node.js 18+** (developed on 24).
- **Operating system:** works on Windows, macOS, and Linux. The one-click
  `start.bat` launcher is **Windows-only** (and expects Node at
  `C:\Program Files\nodejs`). On macOS/Linux, use the two-terminal steps under
  "Running → Option B".
- If `node`/`npm` or `python` are "not recognized" right after installing, open
  a brand-new terminal so the updated PATH is picked up, then retry.

## Setup

### 1. Backend

Windows (PowerShell):

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

macOS / Linux:

```bash
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
```

### 2. Frontend

```bash
cd frontend
npm install
```

The frontend reads `NEXT_PUBLIC_API_BASE` (default `http://localhost:8000`).
Copy `frontend/.env.example` to `frontend/.env.local` to override.

## Running

### Option A — one command (requires Node on PATH)

From the repo root, install the launcher dependency once, then start both:

```powershell
npm install            # installs 'concurrently' at the root
npm run dev            # backend on :8000, frontend on :3000
```

### Option B — two terminals (always works, any OS)

Terminal 1 — backend:

```powershell
# Windows
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

```bash
# macOS / Linux
cd backend
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

Terminal 2 — frontend:

```bash
cd frontend
npm run dev
```

### Option C — Windows one-click

Double-click **`start.bat`** in the project root. It starts both servers and
opens your browser automatically. (Windows only.)

Then open:

- App: http://localhost:3000
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Testing

```powershell
# Backend (from backend/)
.\.venv\Scripts\python.exe -m pytest

# Frontend (from frontend/)
npm test
npm run build
```

## Project Layout

```
backend/            FastAPI app, parser, index, search, routers, tests
  app/
  mock_documents/   (shared) markdown corpus lives at repo root
  tests/
frontend/           Next.js + Tailwind app
  src/app/          Search (/), Directory, Dashboard pages
  src/components/    UI: SearchView, DirectoryView, DashboardView, Badge, Upload
  src/lib/           typed API client + types
mock_documents/     sample government documents (markdown + frontmatter)
.kiro/specs/govsop-ai/   requirements.md, design.md, tasks.md
```

## Document Format

Each document in `mock_documents/` is markdown with YAML frontmatter:

```markdown
---
doc_id: SOP-2024-014
title: Procurement Approval Procedure
department: Finance
effective_date: 2024-03-01
review_status: needs_review   # current | needs_review | outdated_clause
action_items:
  - "Submit vendor forms before quarter close"
deadlines:
  - label: "Q2 vendor registration"
    date: 2024-06-30
responsible_departments:
  - Finance
  - Procurement
policy_changes:
  - "Approval threshold raised from $5,000 to $10,000"
---

## Section 1 — Purpose
...body text (searched and cited)...
```

Upload new documents through the Directory page's drag-and-drop zone, or
`POST /documents` directly. Valid uploads are written to `mock_documents/` and
indexed immediately.
