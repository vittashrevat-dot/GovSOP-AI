"""Aggregate structured extraction fields across documents.

The extraction data is pre-authored in each document's frontmatter (action
items, deadlines, responsible departments, policy changes). This module reshapes
it for the dashboard: flat item lists carrying a source reference, deadlines
sorted by date, and responsible departments deduplicated with their sources.
"""
from __future__ import annotations

from .models import Document
from .schemas import (
    ExtractedDeadline,
    ExtractedDepartment,
    ExtractedItem,
    ExtractionResponse,
    SourceRef,
)


def build_extraction(documents: list[Document]) -> ExtractionResponse:
    """Aggregate extraction fields from ``documents`` into grouped cards."""
    action_items: list[ExtractedItem] = []
    deadlines: list[ExtractedDeadline] = []
    policy_changes: list[ExtractedItem] = []
    # Preserve first-seen order of departments while collecting their sources.
    dept_sources: dict[str, list[SourceRef]] = {}

    for doc in documents:
        source = SourceRef(doc_id=doc.doc_id, title=doc.title)

        for item in doc.action_items:
            action_items.append(ExtractedItem(text=item, source=source))

        for change in doc.policy_changes:
            policy_changes.append(ExtractedItem(text=change, source=source))

        for deadline in doc.deadlines:
            deadlines.append(
                ExtractedDeadline(
                    label=deadline.label, date=deadline.date, source=source
                )
            )

        for dept in doc.responsible_departments:
            dept_sources.setdefault(dept, []).append(source)

    # Soonest deadlines first; stable on label for equal dates.
    deadlines.sort(key=lambda d: (d.date, d.label))

    responsible_departments = [
        ExtractedDepartment(department=dept, sources=sources)
        for dept, sources in dept_sources.items()
    ]

    return ExtractionResponse(
        action_items=action_items,
        deadlines=deadlines,
        responsible_departments=responsible_departments,
        policy_changes=policy_changes,
    )
