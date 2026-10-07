"""Unit tests for the in-memory IndexService."""
from __future__ import annotations

from pathlib import Path

import pytest

from app.index_service import IndexService

VALID_TEMPLATE = """\
---
doc_id: {doc_id}
title: {title}
department: {department}
effective_date: 2024-01-01
review_status: current
action_items:
  - "An action"
responsible_departments:
  - {department}
policy_changes:
  - "A change"
---

## Purpose
Body text for {title}.

## Scope
More body text mentioning {keyword}.
"""


def _write(dir_path: Path, filename: str, **kwargs) -> None:
    (dir_path / filename).write_text(VALID_TEMPLATE.format(**kwargs), encoding="utf-8")


@pytest.fixture
def docs_dir(tmp_path: Path) -> Path:
    _write(
        tmp_path,
        "a.md",
        doc_id="DOC-A",
        title="Alpha",
        department="Finance",
        keyword="procurement",
    )
    _write(
        tmp_path,
        "b.md",
        doc_id="DOC-B",
        title="Beta",
        department="Legal",
        keyword="redaction",
    )
    # Invalid: missing required frontmatter (no doc_id/review_status/etc.).
    (tmp_path / "bad.md").write_text(
        "---\ntitle: Broken\n---\n\n## Body\ntext\n", encoding="utf-8"
    )
    return tmp_path


def test_load_skips_invalid_and_reports(docs_dir: Path):
    svc = IndexService(docs_dir)
    result = svc.load()

    assert result.loaded == 2
    assert len(result.skipped) == 1
    skipped_name, reason = result.skipped[0]
    assert skipped_name == "bad.md"
    assert reason  # non-empty explanation
    assert len(svc) == 2


def test_documents_sorted_by_doc_id(docs_dir: Path):
    svc = IndexService(docs_dir)
    svc.load()
    assert [d.doc_id for d in svc.documents] == ["DOC-A", "DOC-B"]


def test_sections_flattened_with_doc_id(docs_dir: Path):
    svc = IndexService(docs_dir)
    svc.load()
    # Each valid doc has two sections (Purpose, Scope) -> 4 total.
    assert len(svc.sections) == 4
    doc_ids = {doc_id for doc_id, _ in svc.sections}
    assert doc_ids == {"DOC-A", "DOC-B"}


def test_get_returns_document_or_none(docs_dir: Path):
    svc = IndexService(docs_dir)
    svc.load()
    assert svc.get("DOC-A").title == "Alpha"
    assert svc.get("DOC-MISSING") is None


def test_reload_picks_up_new_file(docs_dir: Path):
    svc = IndexService(docs_dir)
    svc.load()
    assert len(svc) == 2

    _write(
        docs_dir,
        "c.md",
        doc_id="DOC-C",
        title="Gamma",
        department="Operations",
        keyword="continuity",
    )
    result = svc.load()

    assert result.loaded == 3
    assert len(svc) == 3
    assert svc.get("DOC-C").title == "Gamma"


def test_duplicate_doc_id_skipped(docs_dir: Path):
    # Second file reuses DOC-A's id.
    _write(
        docs_dir,
        "dup.md",
        doc_id="DOC-A",
        title="Duplicate",
        department="Finance",
        keyword="x",
    )
    svc = IndexService(docs_dir)
    result = svc.load()
    # One of the DOC-A files is skipped as a duplicate.
    assert result.loaded == 2
    assert any("duplicate" in reason.lower() for _, reason in result.skipped)


def test_missing_directory_is_safe(tmp_path: Path):
    svc = IndexService(tmp_path / "does_not_exist")
    result = svc.load()
    assert result.loaded == 0
    assert len(svc) == 0
