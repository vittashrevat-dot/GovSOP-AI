"""Unit tests for the document frontmatter/section parser."""
from __future__ import annotations

from datetime import date
from pathlib import Path

import pytest

from app.models import ReviewStatus
from app.parser import (
    DocumentParseError,
    parse_document,
    parse_file,
    split_sections,
)

MOCK_DIR = Path(__file__).resolve().parents[2] / "mock_documents"

VALID_DOC = """\
---
doc_id: SOP-TEST-001
title: Test Procedure
department: Finance
effective_date: 2024-03-01
review_status: needs_review
action_items:
  - "Do the first thing"
  - "Do the second thing"
deadlines:
  - label: "Quarter close"
    date: 2024-06-30
responsible_departments:
  - Finance
  - Procurement
policy_changes:
  - "Threshold raised to $10,000"
---

## Purpose
This explains the purpose.

## Scope
This explains the scope with the word procurement in it.
"""


def test_parse_valid_document_metadata():
    doc = parse_document(VALID_DOC, source="test.md")
    assert doc.doc_id == "SOP-TEST-001"
    assert doc.title == "Test Procedure"
    assert doc.department == "Finance"
    assert doc.effective_date == date(2024, 3, 1)
    assert doc.review_status is ReviewStatus.NEEDS_REVIEW


def test_parse_valid_document_extraction_fields():
    doc = parse_document(VALID_DOC, source="test.md")
    assert doc.action_items == ["Do the first thing", "Do the second thing"]
    assert doc.responsible_departments == ["Finance", "Procurement"]
    assert doc.policy_changes == ["Threshold raised to $10,000"]
    assert len(doc.deadlines) == 1
    assert doc.deadlines[0].label == "Quarter close"
    assert doc.deadlines[0].date == date(2024, 6, 30)


def test_sections_split_by_headings():
    doc = parse_document(VALID_DOC, source="test.md")
    titles = [s.section_title for s in doc.sections]
    assert titles == ["Purpose", "Scope"]
    assert [s.order for s in doc.sections] == [0, 1]
    assert "procurement" in doc.sections[1].text


def test_preamble_captured_before_first_heading():
    content = (
        "---\n"
        "doc_id: X\n"
        "title: T\n"
        "department: D\n"
        "effective_date: 2024-01-01\n"
        "review_status: current\n"
        "---\n\n"
        "Intro text before any heading.\n\n"
        "## First\nBody.\n"
    )
    sections = parse_document(content).sections
    assert sections[0].section_title == "Preamble"
    assert "Intro text" in sections[0].text
    assert sections[1].section_title == "First"


def test_split_sections_standalone():
    body = "# A\nalpha\n## B\nbeta\n"
    sections = split_sections(body)
    assert [s.section_title for s in sections] == ["A", "B"]
    assert sections[0].text == "alpha"
    assert sections[1].text == "beta"


def test_missing_required_field_raises():
    content = (
        "---\n"
        "title: No ID\n"
        "department: Finance\n"
        "effective_date: 2024-01-01\n"
        "review_status: current\n"
        "---\n\n## Body\ntext\n"
    )
    with pytest.raises(DocumentParseError, match="doc_id"):
        parse_document(content, source="bad.md")


def test_no_frontmatter_raises():
    with pytest.raises(DocumentParseError, match="no frontmatter"):
        parse_document("# Just a heading\n\nNo frontmatter here.\n", source="bad.md")


def test_invalid_review_status_raises():
    content = (
        "---\n"
        "doc_id: X\n"
        "title: T\n"
        "department: D\n"
        "effective_date: 2024-01-01\n"
        "review_status: totally_wrong\n"
        "---\n\n## Body\ntext\n"
    )
    with pytest.raises(DocumentParseError):
        parse_document(content, source="bad.md")


def test_deadline_missing_date_raises():
    content = (
        "---\n"
        "doc_id: X\n"
        "title: T\n"
        "department: D\n"
        "effective_date: 2024-01-01\n"
        "review_status: current\n"
        "deadlines:\n"
        "  - label: No date here\n"
        "---\n\n## Body\ntext\n"
    )
    with pytest.raises(DocumentParseError, match="deadline"):
        parse_document(content, source="bad.md")


# --- Tests against the real mock corpus -------------------------------------


def test_all_mock_documents_parse():
    files = sorted(MOCK_DIR.glob("*.md"))
    assert len(files) >= 8, "expected at least 8 mock documents"
    doc_ids = set()
    statuses = set()
    for path in files:
        doc = parse_file(path)
        assert doc.sections, f"{path.name} should have sections"
        assert doc.doc_id not in doc_ids, f"duplicate doc_id {doc.doc_id}"
        doc_ids.add(doc.doc_id)
        statuses.add(doc.review_status)
    # The corpus exercises every badge-driving status.
    assert statuses == {
        ReviewStatus.CURRENT,
        ReviewStatus.NEEDS_REVIEW,
        ReviewStatus.OUTDATED_CLAUSE,
    }
