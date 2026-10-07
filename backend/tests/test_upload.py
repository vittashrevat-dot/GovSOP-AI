"""Tests for the POST /documents upload endpoint and re-index behavior."""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_index_service
from app.index_service import IndexService
from app.main import app

EXISTING = """\
---
doc_id: SOP-EXIST
title: Existing Doc
department: Finance
effective_date: 2024-01-01
review_status: current
---

## Purpose
Existing body.
"""

NEW_DOC = """\
---
doc_id: SOP-NEW
title: New Procurement Rules
department: Finance
effective_date: 2024-08-01
review_status: needs_review
action_items:
  - "Review new vendor policy"
deadlines:
  - label: "Policy rollout"
    date: 2024-09-01
responsible_departments:
  - Finance
policy_changes:
  - "New escalation workflow added"
---

## Overview
This document introduces an escalation workflow for procurement disputes.
"""


@pytest.fixture
def ctx(tmp_path: Path):
    (tmp_path / "existing.md").write_text(EXISTING, encoding="utf-8")
    svc = IndexService(tmp_path)
    svc.load()
    app.dependency_overrides[get_index_service] = lambda: svc
    client = TestClient(app)
    yield client, svc, tmp_path
    app.dependency_overrides.clear()


def _upload(client: TestClient, name: str, body: str | bytes):
    data = body.encode("utf-8") if isinstance(body, str) else body
    return client.post(
        "/documents",
        files={"file": (name, data, "text/markdown")},
    )


def test_valid_upload_creates_document(ctx):
    client, svc, docs_dir = ctx
    resp = _upload(client, "new.md", NEW_DOC)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["doc_id"] == "SOP-NEW"
    assert body["badges"] == [{"label": "⚠️ Needs Review", "severity": "warning"}]

    # File persisted and index reloaded.
    assert (docs_dir / "SOP-NEW.md").exists()
    assert svc.get("SOP-NEW") is not None

    # Appears in the directory listing.
    listing = client.get("/documents").json()
    assert "SOP-NEW" in {d["doc_id"] for d in listing["documents"]}


def test_uploaded_document_is_searchable(ctx):
    client, _, _ = ctx
    _upload(client, "new.md", NEW_DOC)
    results = client.get("/search", params={"q": "escalation workflow"}).json()
    assert any(r["doc_id"] == "SOP-NEW" for r in results["results"])


def test_uploaded_document_appears_in_extraction(ctx):
    client, _, _ = ctx
    _upload(client, "new.md", NEW_DOC)
    extraction = client.get("/extraction").json()
    assert any(
        i["source"]["doc_id"] == "SOP-NEW" for i in extraction["action_items"]
    )


def test_reject_non_markdown_extension(ctx):
    client, _, docs_dir = ctx
    resp = _upload(client, "notes.txt", NEW_DOC)
    assert resp.status_code == 400
    assert ".md" in resp.json()["detail"]
    assert not (docs_dir / "SOP-NEW.md").exists()


def test_reject_unparseable_content(ctx):
    client, _, _ = ctx
    resp = _upload(client, "broken.md", "no frontmatter here\n")
    assert resp.status_code == 400
    assert "Invalid document" in resp.json()["detail"]


def test_reject_missing_required_field(ctx):
    client, _, _ = ctx
    bad = "---\ntitle: No ID\ndepartment: X\n---\n\n## Body\ntext\n"
    resp = _upload(client, "bad.md", bad)
    assert resp.status_code == 400


def test_reject_duplicate_doc_id(ctx):
    client, _, _ = ctx
    dup = EXISTING  # same doc_id SOP-EXIST
    resp = _upload(client, "dup.md", dup)
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"]


def test_reject_path_traversal_filename(ctx):
    client, _, docs_dir = ctx
    resp = _upload(client, "../escape.md", NEW_DOC)
    assert resp.status_code == 400
    # Nothing written outside the docs dir.
    assert not (docs_dir.parent / "escape.md").exists()


def test_reject_non_utf8(ctx):
    client, _, _ = ctx
    # Invalid UTF-8 byte sequence.
    resp = _upload(client, "bin.md", b"\xff\xfe\x00invalid")
    assert resp.status_code == 400
