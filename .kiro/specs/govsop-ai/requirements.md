# GovSOP AI — Requirements

## Problem Statement
Government agencies manage thousands of documents (policies, SOPs, circulars, guidelines, reports, meeting minutes). Finding the right information is slow, hurting decision-making and productivity. GovSOP AI is a local-first prototype that turns a folder of mock markdown documents into an intelligent, searchable, auto-organized knowledge resource.

The application exposes three primary surfaces:
1. Natural-language search with source citations.
2. An auto-organizing directory with compliance badges.
3. An extraction dashboard for action items, deadlines, responsible departments, and policy changes.

## Confirmed Decisions
- **Backend:** FastAPI (Python) + keyword/TF-IDF mock search, fully offline, no API keys. Citations from matched sections.
- **Documents:** Simulated in `/mock_documents` PLUS a drag-and-drop upload UI that writes new markdown and re-indexes. Badges rule-based.
- **Extraction:** Pre-authored structured frontmatter the backend reads and renders.
- **Document format:** YAML frontmatter + markdown body; extraction fields live in frontmatter.
- **Badges:** Status flags only, driven directly by a `review_status` frontmatter field. No date math.
- **Run:** Two processes — FastAPI on :8000, Next.js on :3000 — with a README and a root script to start both.

## Functional Requirements

### FR1 — AI Search & Decision Engine (RAG-lite)
- The system SHALL provide an enterprise search UI accepting natural-language queries.
- The backend SHALL search `/mock_documents` markdown using keyword/TF-IDF ranking, fully offline, with no API keys.
- Search results SHALL return a synthesized answer plus explicit Source Citations: Document ID and Section/heading (with position/order).
- When no match is found, the system SHALL return a clear "no results" state.

### FR2 — Auto-Organizing Directory & Compliance Alerts
- The system SHALL provide a directory view listing all indexed documents, groupable/filterable by Department.
- Each item SHALL display metadata (Department, Effective Date) and visual warning badges.
- Badges SHALL be driven directly by the `review_status` frontmatter field (status flags only, no date math):
  - `needs_review` → "⚠️ Needs Review" (warning severity)
  - `outdated_clause` → "Outdated Clause" (warning severity)
  - `current` → no badge / "Current"

### FR3 — Intelligent Extraction Dashboard
- The system SHALL provide a dashboard that reads pre-authored structured frontmatter and renders Action Items, Deadlines, Responsible Departments, and Key Policy Changes as structured cards.
- The dashboard SHALL provide an aggregated view across all documents plus per-document drill-down.
- Each extracted item SHALL reference its source document (doc_id/title).

### FR4 — Document Upload (simulated + real write)
- The system SHALL provide a drag-and-drop upload that writes a new markdown file into `/mock_documents` and triggers re-indexing so the new doc appears in search, directory, and dashboard.
- The system SHALL validate uploads (must be `.md`, must parse frontmatter) and surface friendly errors.
- The system SHALL prevent path traversal in filenames and reject duplicate `doc_id`.

## Technical & Operational Requirements
- **Frontend:** Next.js (React) + Tailwind CSS, high-density command-center aesthetic (dark theme).
- **Backend:** Python FastAPI serving search, documents, extraction, and upload endpoints; CORS enabled for `http://localhost:3000`.
- **Data layer:** Local markdown files with YAML frontmatter + body in `/mock_documents`.
- **Offline:** All search/extraction runs locally with no external API calls or keys.
- **Run locally:** Two processes — FastAPI on :8000, Next.js on :3000 — with a README and a root script to start both.
- **Environment:** Windows / PowerShell; commands must be PowerShell-compatible.

## Document Format (agreed)
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
...body text used for search...

## Section 2 — Scope
...
```

## Acceptance Criteria (prototype)
- Searching a natural-language query returns ranked answers with clickable citations (doc_id + section).
- The directory lists all docs with Department, Effective Date, and correct badges; department filter works.
- The dashboard shows the four extraction groups, each item linking to its source document.
- Uploading a valid markdown file makes it appear in search, directory, and dashboard without restarting the backend.
- Both services start locally via documented steps and the frontend communicates with the backend.
