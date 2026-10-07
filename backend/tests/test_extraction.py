"""Tests for the extraction endpoints."""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_index_service
from app.index_service import IndexService
from app.main import app

DOC_A = """\
---
doc_id: SOP-A
title: Procurement Procedure
department: Finance
effective_date: 2024-01-01
review_status: current
action_items:
  - "Submit vendor forms"
  - "Reconcile purchase orders"
deadlines:
  - label: "Audit submission"
    date: 2024-12-15
  - label: "Vendor registration"
    date: 2024-06-30
responsible_departments:
  - Finance
  - Procurement
policy_changes:
  - "Threshold raised to $10,000"
---

## Purpose
Body.
"""

DOC_B = """\
---
doc_id: SOP-B
title: Onboarding Procedure
department: HR
effective_date: 2024-02-01
review_status: current
action_items:
  - "Provision accounts"
deadlines:
  - label: "Orientation"
    date: 2024-07-12
responsible_departments:
  - Human Resources
  - Finance
policy_changes:
  - "Security training in week one"
---

## Purpose
Body.
"""


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    (tmp_path / "a.md").write_text(DOC_A, encoding="utf-8")
    (tmp_path / "b.md").write_text(DOC_B, encoding="utf-8")
    svc = IndexService(tmp_path)
    svc.load()
    app.dependency_overrides[get_index_service] = lambda: svc
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_aggregated_counts(client: TestClient):
    body = client.get("/extraction").json()
    # 2 (A) + 1 (B) action items; 1 (A) + 1 (B) policy changes.
    assert len(body["action_items"]) == 3
    assert len(body["policy_changes"]) == 2
    # 2 (A) + 1 (B) deadlines.
    assert len(body["deadlines"]) == 3


def test_items_reference_valid_sources(client: TestClient):
    body = client.get("/extraction").json()
    valid_ids = {"SOP-A", "SOP-B"}
    for item in body["action_items"] + body["policy_changes"]:
        assert item["source"]["doc_id"] in valid_ids
        assert item["source"]["title"]
    for d in body["deadlines"]:
        assert d["source"]["doc_id"] in valid_ids


def test_deadlines_sorted_by_date(client: TestClient):
    body = client.get("/extraction").json()
    dates = [d["date"] for d in body["deadlines"]]
    assert dates == sorted(dates)
    # Soonest first.
    assert body["deadlines"][0]["date"] == "2024-06-30"


def test_responsible_departments_deduplicated_with_sources(client: TestClient):
    body = client.get("/extraction").json()
    depts = {d["department"]: d for d in body["responsible_departments"]}
    # Finance appears in both docs -> one entry, two sources.
    assert "Finance" in depts
    finance_sources = {s["doc_id"] for s in depts["Finance"]["sources"]}
    assert finance_sources == {"SOP-A", "SOP-B"}
    # Procurement only in A.
    assert {s["doc_id"] for s in depts["Procurement"]["sources"]} == {"SOP-A"}


def test_per_document_extraction(client: TestClient):
    body = client.get("/extraction/SOP-A").json()
    assert len(body["action_items"]) == 2
    assert len(body["deadlines"]) == 2
    assert all(i["source"]["doc_id"] == "SOP-A" for i in body["action_items"])
    depts = {d["department"] for d in body["responsible_departments"]}
    assert depts == {"Finance", "Procurement"}


def test_per_document_unknown_returns_404(client: TestClient):
    resp = client.get("/extraction/NOPE")
    assert resp.status_code == 404
