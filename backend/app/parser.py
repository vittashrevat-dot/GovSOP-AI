"""Parse GovSOP markdown documents (YAML frontmatter + body) into typed models.

A document file looks like::

    ---
    doc_id: SOP-2024-014
    title: Procurement Approval Procedure
    department: Finance
    effective_date: 2024-03-01
    review_status: needs_review
    action_items:
      - "Submit vendor forms before quarter close"
    deadlines:
      - label: "Q2 vendor registration"
        date: 2024-06-30
    responsible_departments:
      - Finance
      - Procurement
    policy_changes:
      - "Approval threshold raised from $5,000 to $10,000"
    ---

    ## Section 1 — Purpose
    ...body text...

The body is split into ordered :class:`Section` chunks on markdown ATX
headings (``#``..``######``). Text that precedes the first heading is captured
under a synthetic ``Preamble`` section so no searchable content is lost.
"""
from __future__ import annotations

import re
from pathlib import Path

import frontmatter

from .models import Deadline, Document, Section

# Fields that must be present (and non-empty) in a document's frontmatter.
REQUIRED_FIELDS = (
    "doc_id",
    "title",
    "department",
    "effective_date",
    "review_status",
)

# Matches an ATX markdown heading line, e.g. "## Section 1 — Purpose".
_HEADING_RE = re.compile(r"^(#{1,6})\s+(.*\S)\s*$")

# Section title used for body text that appears before the first heading.
_PREAMBLE_TITLE = "Preamble"


class DocumentParseError(ValueError):
    """Raised when a document cannot be parsed into a valid :class:`Document`."""


def split_sections(body: str) -> list[Section]:
    """Split a markdown body into ordered heading-delimited sections.

    Content before the first heading is returned as a ``Preamble`` section.
    Sections with no body text still retain their heading (empty text).
    """
    sections: list[Section] = []
    current_title: str | None = None
    current_lines: list[str] = []
    order = 0

    def flush() -> None:
        nonlocal order, current_title, current_lines
        text = "\n".join(current_lines).strip()
        title = current_title if current_title is not None else _PREAMBLE_TITLE
        # Skip an empty preamble (no leading text before the first heading).
        if current_title is None and not text:
            current_lines = []
            return
        sections.append(Section(section_title=title, text=text, order=order))
        order += 1
        current_lines = []

    for line in body.splitlines():
        match = _HEADING_RE.match(line)
        if match:
            flush()
            current_title = match.group(2).strip()
        else:
            current_lines.append(line)
    flush()

    return sections


def _ensure_required(metadata: dict, source: str) -> None:
    missing = [
        field
        for field in REQUIRED_FIELDS
        if metadata.get(field) in (None, "")
    ]
    if missing:
        raise DocumentParseError(
            f"{source}: missing required frontmatter field(s): {', '.join(missing)}"
        )


def _parse_deadlines(raw, source: str) -> list[Deadline]:
    deadlines: list[Deadline] = []
    if raw is None:
        return deadlines
    if not isinstance(raw, list):
        raise DocumentParseError(f"{source}: 'deadlines' must be a list")
    for entry in raw:
        if not isinstance(entry, dict):
            raise DocumentParseError(
                f"{source}: each deadline must be a mapping with 'label' and 'date'"
            )
        try:
            deadlines.append(Deadline(label=entry["label"], date=entry["date"]))
        except KeyError as exc:  # missing label/date key
            raise DocumentParseError(
                f"{source}: deadline missing field {exc}"
            ) from exc
    return deadlines


def parse_document(content: str, source: str = "<string>") -> Document:
    """Parse raw markdown ``content`` into a :class:`Document`.

    ``source`` is used only to produce helpful error messages (e.g. a filename).
    Raises :class:`DocumentParseError` on malformed input.
    """
    try:
        post = frontmatter.loads(content)
    except Exception as exc:  # noqa: BLE001 - surface any YAML/parse failure uniformly
        raise DocumentParseError(f"{source}: could not parse frontmatter: {exc}") from exc

    metadata = post.metadata
    if not metadata:
        raise DocumentParseError(f"{source}: no frontmatter found")

    _ensure_required(metadata, source)

    deadlines = _parse_deadlines(metadata.get("deadlines"), source)
    sections = split_sections(post.content)

    try:
        return Document(
            doc_id=str(metadata["doc_id"]),
            title=str(metadata["title"]),
            department=str(metadata["department"]),
            effective_date=metadata["effective_date"],
            review_status=metadata["review_status"],
            action_items=list(metadata.get("action_items") or []),
            deadlines=deadlines,
            responsible_departments=list(metadata.get("responsible_departments") or []),
            policy_changes=list(metadata.get("policy_changes") or []),
            sections=sections,
        )
    except Exception as exc:  # noqa: BLE001 - validation errors become parse errors
        raise DocumentParseError(f"{source}: invalid document data: {exc}") from exc


def parse_file(path: str | Path) -> Document:
    """Read and parse a markdown document from ``path``."""
    path = Path(path)
    try:
        content = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise DocumentParseError(f"{path}: could not read file: {exc}") from exc
    return parse_document(content, source=path.name)
