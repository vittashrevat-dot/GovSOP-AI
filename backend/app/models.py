"""Pydantic data models for GovSOP AI documents and their parsed structure."""
from __future__ import annotations

from datetime import date
from enum import Enum

from pydantic import BaseModel, Field


class ReviewStatus(str, Enum):
    """Compliance review status, driven directly by document frontmatter."""

    CURRENT = "current"
    NEEDS_REVIEW = "needs_review"
    OUTDATED_CLAUSE = "outdated_clause"


class BadgeSeverity(str, Enum):
    """Visual severity for a compliance badge."""

    WARNING = "warning"
    NONE = "none"


class Badge(BaseModel):
    """A compliance badge derived from a document's review status."""

    label: str
    severity: BadgeSeverity


class Deadline(BaseModel):
    """A dated obligation extracted from a document's frontmatter."""

    label: str
    date: date
    # doc_id is populated when deadlines are aggregated across documents.
    doc_id: str | None = None


class Section(BaseModel):
    """A heading-delimited chunk of a document body, used for search."""

    section_title: str
    text: str
    order: int


class Document(BaseModel):
    """A fully parsed GovSOP document: metadata, extraction fields, and body sections."""

    doc_id: str
    title: str
    department: str
    effective_date: date
    review_status: ReviewStatus
    action_items: list[str] = Field(default_factory=list)
    deadlines: list[Deadline] = Field(default_factory=list)
    responsible_departments: list[str] = Field(default_factory=list)
    policy_changes: list[str] = Field(default_factory=list)
    sections: list[Section] = Field(default_factory=list)
