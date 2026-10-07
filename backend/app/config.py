"""Runtime configuration for the GovSOP AI backend."""
from __future__ import annotations

import os
from pathlib import Path

# Backend package lives at backend/app; the repo root is two levels up.
_REPO_ROOT = Path(__file__).resolve().parents[2]

# Folder of mock markdown documents. Overridable via env for tests/deployments.
MOCK_DOCUMENTS_DIR = Path(
    os.environ.get("GOVSOP_DOCS_DIR", str(_REPO_ROOT / "mock_documents"))
)
