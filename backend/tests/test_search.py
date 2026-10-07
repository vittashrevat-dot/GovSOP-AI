"""Tests for the TF-IDF search engine and the GET /search endpoint."""
from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_index_service
from app.index_service import IndexService
from app.main import app
from app.models import Section
from app.search import SearchEngine, tokenize

# --- SearchEngine unit tests ------------------------------------------------


def _sections(*pairs: tuple[str, str, str]) -> list[tuple[str, Section]]:
    out = []
    for i, (doc_id, title, text) in enumerate(pairs):
        out.append((doc_id, Section(section_title=title, text=text, order=i)))
    return out


def test_tokenize_drops_stopwords_lowercases_and_stems():
    # "the" and "is" are stopwords; remaining tokens are lowercased and stemmed.
    assert tokenize("The Approval Threshold is RAISED") == [
        "approv",
        "threshold",
        "rais",
    ]


def test_stemming_unifies_word_variants():
    # Query/document wording variants collapse to the same stem so they match.
    assert tokenize("approval")[0] == tokenize("approved")[0]
    assert tokenize("threshold")[0] == tokenize("thresholds")[0]
    assert tokenize("deadline")[0] == tokenize("deadlines")[0]


def test_ranks_expected_section_first():
    engine = SearchEngine(
        _sections(
            ("D1", "Approval Thresholds", "Purchases above the approval threshold require review."),
            ("D2", "Scope", "This covers onboarding of new employees and orientation."),
            ("D3", "Backups", "Encrypted backups are stored for tier one data."),
        )
    )
    hits = engine.search("approval threshold")
    assert hits, "expected at least one hit"
    assert hits[0].doc_id == "D1"
    assert hits[0].section_title == "Approval Thresholds"
    assert hits[0].score > 0


def test_nonsense_query_returns_no_results():
    engine = SearchEngine(
        _sections(("D1", "Scope", "Procurement approval and vendor registration."))
    )
    assert engine.search("xyzzy quux florbnax") == []


def test_empty_query_returns_no_results():
    engine = SearchEngine(_sections(("D1", "T", "some text here")))
    assert engine.search("") == []
    assert engine.search("   ") == []


def test_snippet_contains_query_term():
    engine = SearchEngine(
        _sections(
            (
                "D1",
                "Notification",
                "Confirmed data breaches must be reported to affected parties "
                "and the Legal department within forty eight hours.",
            )
        )
    )
    hit = engine.search("breach notification")[0]
    assert "breach" in hit.snippet.lower()


# --- Endpoint tests ---------------------------------------------------------

DOC = """\
---
doc_id: {doc_id}
title: {title}
department: Finance
effective_date: 2024-01-01
review_status: current
---

## Approval Thresholds
Purchases above ten thousand dollars require a procurement approval review.

## Vendor Registration
Vendors must be registered before any purchase order is issued.
"""


@pytest.fixture
def client(tmp_path: Path) -> TestClient:
    (tmp_path / "a.md").write_text(
        DOC.format(doc_id="SOP-1", title="Procurement Approval Procedure"),
        encoding="utf-8",
    )
    (tmp_path / "b.md").write_text(
        """\
---
doc_id: SOP-2
title: Onboarding Procedure
department: HR
effective_date: 2024-01-01
review_status: current
---

## First Week
New hires complete orientation and security awareness training.
""",
        encoding="utf-8",
    )
    svc = IndexService(tmp_path)
    svc.load()
    app.dependency_overrides[get_index_service] = lambda: svc
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_search_returns_citations(client: TestClient):
    resp = client.get("/search", params={"q": "procurement approval threshold"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["results"], "expected ranked results"
    top = body["results"][0]
    assert top["doc_id"] == "SOP-1"
    assert top["section_title"] == "Approval Thresholds"
    assert top["citation"]["doc_id"] == "SOP-1"
    assert top["citation"]["title"] == "Procurement Approval Procedure"
    assert top["citation"]["section_title"] == "Approval Thresholds"
    assert body["answer"] is not None
    assert "SOP-1" in body["answer"]


def test_search_empty_state(client: TestClient):
    resp = client.get("/search", params={"q": "zzzznomatchquux"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["results"] == []
    assert body["answer"] is None


def test_search_respects_limit(client: TestClient):
    resp = client.get("/search", params={"q": "orientation", "limit": 1})
    assert resp.status_code == 200
    assert len(resp.json()["results"]) <= 1


def test_search_requires_query_param(client: TestClient):
    resp = client.get("/search")
    assert resp.status_code == 422
