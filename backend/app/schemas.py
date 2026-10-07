"""API response schemas (distinct from internal document models)."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel

from .models import Badge, Document, ReviewStatus


class DocumentSummary(BaseModel):
    """A document as shown in the directory list: metadata + derived badges."""

    doc_id: str
    title: str
    department: str
    effective_date: date
    review_status: ReviewStatus
    badges: list[Badge]

    @classmethod
    def from_document(cls, document: Document, badges: list[Badge]) -> "DocumentSummary":
        return cls(
            doc_id=document.doc_id,
            title=document.title,
            department=document.department,
            effective_date=document.effective_date,
            review_status=document.review_status,
            badges=badges,
        )


class DirectoryResponse(BaseModel):
    """Directory listing with the documents and the set of known departments."""

    total: int
    departments: list[str]
    documents: list[DocumentSummary]


class SectionView(BaseModel):
    """A document section exposed in the detail view."""

    section_title: str
    text: str
    order: int


class DocumentDetail(BaseModel):
    """Full document view: summary metadata, badges, and body sections."""

    doc_id: str
    title: str
    department: str
    effective_date: date
    review_status: ReviewStatus
    badges: list[Badge]
    sections: list[SectionView]

    @classmethod
    def from_document(cls, document: Document, badges: list[Badge]) -> "DocumentDetail":
        return cls(
            doc_id=document.doc_id,
            title=document.title,
            department=document.department,
            effective_date=document.effective_date,
            review_status=document.review_status,
            badges=badges,
            sections=[
                SectionView(
                    section_title=s.section_title, text=s.text, order=s.order
                )
                for s in document.sections
            ],
        )


class Citation(BaseModel):
    """A pointer back to the source of a search result."""

    doc_id: str
    title: str
    section_title: str
    order: int


class SearchResult(BaseModel):
    """One ranked section match with its snippet, score, and citation."""

    doc_id: str
    title: str
    section_title: str
    order: int
    snippet: str
    score: float
    citation: Citation


class SearchResponse(BaseModel):
    """Search response: an assembled answer plus ranked results."""

    query: str
    answer: str | None
    results: list[SearchResult]


class SourceRef(BaseModel):
    """Identifies the document an extracted item came from."""

    doc_id: str
    title: str


class ExtractedItem(BaseModel):
    """A single extracted text item (action item or policy change) with source."""

    text: str
    source: SourceRef


class ExtractedDeadline(BaseModel):
    """A deadline normalized to label/date with its source document."""

    label: str
    date: date
    source: SourceRef


class ExtractedDepartment(BaseModel):
    """A responsible department and the documents that reference it."""

    department: str
    sources: list[SourceRef]


class ExtractionResponse(BaseModel):
    """Aggregated extraction across one or more documents, grouped by type."""

    action_items: list[ExtractedItem]
    deadlines: list[ExtractedDeadline]
    responsible_departments: list[ExtractedDepartment]
    policy_changes: list[ExtractedItem]
