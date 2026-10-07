# GovSOP AI — Tasks

- [x] 1. Backend project skeleton + health check
  - Scaffold FastAPI app with CORS enabled for `http://localhost:3000`, a `/health` endpoint, requirements file, and run instructions.
  - Create `backend/` with `app/main.py`, `requirements.txt` (fastapi, uvicorn, python-frontmatter/PyYAML, pytest, httpx).
  - Test: pytest hitting `/health` returns 200 `{status:"ok"}`.
  - Demo: uvicorn runs; `/health` returns ok and `/docs` shows OpenAPI UI.

- [x] 2. Mock documents + frontmatter/section parser
  - Create ~8–10 sample docs in `/mock_documents` across departments with varied `review_status`.
  - Parser loads a markdown file into a typed model (metadata, extraction fields, section chunks split by headings).
  - Pydantic models (`Document`, `Section`, extraction sub-models); split body on `#`/`##` headings; validate required fields.
  - Test: correct metadata, section count/titles, extraction fields populated; malformed file raises a clear error.
  - Demo: script prints parsed structure for one sample document.

- [x] 3. In-memory index + document loader service
  - Load all `/mock_documents` at startup into an in-memory store; expose a reload function.
  - `IndexService` holds documents + flat section list; `load()` scans folder, parses each file, logs skipped/invalid files without crashing.
  - Test: temp folder with 3 docs (one invalid) → 2 loaded, 1 reported; reload picks up a new file.
  - Demo: startup logs show "Indexed N documents, M sections".

- [x] 4. Directory endpoint with compliance badges
  - `GET /documents` returns all documents with metadata and a derived `badges` field computed from `review_status`.
  - Support optional `?department=` filter.
  - Test: badge mapping for each status and department filtering.
  - Demo: `GET /documents` returns full list with correct badges and metadata.

- [x] 5. TF-IDF search endpoint with citations
  - `GET /search?q=` ranks section chunks by TF-IDF relevance; returns top results each with doc_id, section title, snippet, score; include a simple assembled answer.
  - Tokenize lowercased, strip stopwords/punctuation; citations `{doc_id, section_title, order}`; empty/zero-match → explicit empty result.
  - Test: known term ranks expected section first; nonsense query returns no results.
  - Demo: "procurement approval threshold" returns right section(s) with citations.

- [x] 6. Extraction endpoint
  - `GET /extraction` aggregates action items, deadlines, responsible departments, policy changes across all docs, each item carrying source doc_id/title; also `GET /extraction/{doc_id}`.
  - Normalize deadlines to `{label, date, doc_id}`.
  - Test: aggregated counts and valid doc references.
  - Demo: `GET /extraction` returns grouped structured data for cards.

- [x] 7. Upload endpoint with re-index
  - `POST /documents` accepts an uploaded `.md` file, validates it parses with required frontmatter, writes it into `/mock_documents`, reloads the index.
  - Reject non-`.md`/unparseable with 400 + message; prevent path traversal; reject duplicate doc_id.
  - Test: valid upload → 201 and appears in `GET /documents`; invalid → 400; cleanup temp files.
  - Demo: upload markdown via `/docs`; immediately shows in directory/search/extraction.

- [x] 8. Frontend scaffold + layout + API client
  - Next.js + Tailwind app with shared command-center layout (sidebar nav: Search / Directory / Dashboard), dark high-density theme, typed API client reading `NEXT_PUBLIC_API_BASE`.
  - App Router, Tailwind configured, `lib/api.ts` typed fetch helpers + error handling, reusable `Badge` component.
  - Test: render test for layout + nav; API client unit test with mocked fetch.
  - Demo: app runs on :3000 showing shell with working navigation (empty states).

- [x] 9. Search page wired to backend
  - Search view: query input, results list with answer summary and citation chips (doc_id + section), loading/empty/error states.
  - Call `GET /search`, render ranked results, citation click scrolls to/opens the document section; debounce input.
  - Test: render test with mocked results asserts citations and empty-state.
  - Demo: natural-language query shows ranked answers with clickable citations.

- [x] 10. Directory page with badges and filters
  - Directory grid/table showing Department, Effective Date, badges, with department filter.
  - Call `GET /documents`, group/filter by department, reuse `Badge`; clicking a document opens a detail drawer/page with its sections.
  - Test: render test asserts badge display per status and filter behavior.
  - Demo: browse all documents, filter by department, see warning badges.

- [x] 11. Extraction dashboard page
  - Dashboard with four card sections (Action Items, Deadlines, Responsible Departments, Key Policy Changes), each item linking back to source document.
  - Call `GET /extraction`, render structured cards; deadlines sorted by date; each item shows source doc_id/title.
  - Test: render test with mocked extraction data asserts all four groups render and link to source.
  - Demo: dashboard shows extracted items organized into clean cards.

- [x] 12. Upload UI integration
  - Drag-and-drop upload (on Directory or dedicated panel) that posts to `POST /documents` and refreshes views on success.
  - Show upload progress, success toast, validation errors from backend; refetch directory/search/extraction after success.
  - Test: render test mocks successful and failed upload; asserts UI feedback and refetch trigger.
  - Demo: drag a markdown file in; appears in directory and becomes searchable without restart.

- [x] 13. Local run experience + docs + steering update
  - Root README with setup/run steps and a root script to start both services (FastAPI :8000, Next.js :3000); update `.kiro/steering/product.md` and `tech.md` to reflect the real product/stack.
  - Cross-platform start (npm script using `concurrently`, or documented two-terminal PowerShell steps). Document `.env`/`NEXT_PUBLIC_API_BASE`.
  - Test: follow README from clean state to confirm both services start and frontend talks to backend.
  - Demo: one documented command (or two short steps) brings up the full app end-to-end.
