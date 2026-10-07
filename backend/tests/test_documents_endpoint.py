"""Tests for the GET /documents directory endpoint and badge mapping."""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_index_service
from app.index_service import IndexService
from app.main import app

DOC_TEMPLATE = """\
---
doc_id: {doc_id}
title: {title}
department: {department}
effective_date: 2024-01-01
review_status: {status}
---

## Purpose
Body for {title}.
"""


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    docs = [
        ("DOC-CUR", "Current Doc", "Finance", "current"),
        ("DOC-REV", "Review Doc", "Finance", "needs_review"),
        ("DOC-OLD", "Outdated Doc", "Legal", "outdated_clause"),
    ]
    for doc_id, title, department, status in docs:
        (tmp_path / f"{doc_id}.md").write_text(
            DOC_TEMPLATE.format(
                doc_id=doc_id, title=title, department=department, status=status
            ),
            encoding="utf-8",
        )

    svc = IndexService(tmp_path)
    svc.load()
    app.dependency_overrides[get_index_service] = lambda: svc
    yield TestClient(app)
    app.dependency_overrides.clear()


def _by_id(documents: list[dict]) -> dict[str, dict]:
    return {d["doc_id"]: d for d in documents}


def test_lists_all_documents(client: TestClient):
    resp = client.get("/documents")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 3
    assert body["departments"] == ["Finance", "Legal"]
    assert len(body["documents"]) == 3


def test_badge_mapping_per_status(client: TestClient):
    docs = _by_id(client.get("/documents").json()["documents"])

    cur = docs["DOC-CUR"]["badges"]
    assert cur == [{"label": "Current", "severity": "none"}]

    rev = docs["DOC-REV"]["badges"]
    assert rev == [{"label": "⚠️ Needs Review", "severity": "warning"}]

    old = docs["DOC-OLD"]["badges"]
    assert old == [{"label": "Outdated Clause", "severity": "warning"}]


def test_metadata_present(client: TestClient):
    doc = _by_id(client.get("/documents").json()["documents"])["DOC-CUR"]
    assert doc["department"] == "Finance"
    assert doc["effective_date"] == "2024-01-01"
    assert doc["title"] == "Current Doc"
    assert doc["review_status"] == "current"


def test_department_filter(client: TestClient):
    resp = client.get("/documents", params={"department": "Finance"})
    body = resp.json()
    assert body["total"] == 2
    assert {d["doc_id"] for d in body["documents"]} == {"DOC-CUR", "DOC-REV"}
    # Full department set is still reported for filter UIs.
    assert body["departments"] == ["Finance", "Legal"]


def test_department_filter_case_insensitive(client: TestClient):
    resp = client.get("/documents", params={"department": "finance"})
    assert resp.json()["total"] == 2


def test_department_filter_no_match(client: TestClient):
    resp = client.get("/documents", params={"department": "Operations"})
    body = resp.json()
    assert body["total"] == 0
    assert body["documents"] == []


def test_get_document_detail(client: TestClient):
    resp = client.get("/documents/DOC-CUR")
    assert resp.status_code == 200
    body = resp.json()
    assert body["doc_id"] == "DOC-CUR"
    assert body["title"] == "Current Doc"
    assert body["department"] == "Finance"
    assert body["badges"] == [{"label": "Current", "severity": "none"}]
    assert len(body["sections"]) == 1
    assert body["sections"][0]["section_title"] == "Purpose"
    assert body["sections"][0]["order"] == 0
    assert "Body for Current Doc" in body["sections"][0]["text"]


def test_get_document_detail_unknown_returns_404(client: TestClient):
    resp = client.get("/documents/NOPE")
    assert resp.status_code == 404
