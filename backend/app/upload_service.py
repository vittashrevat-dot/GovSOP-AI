"""Validate and persist uploaded markdown documents, then re-index.

Validation rules (all failures raise :class:`UploadError` with a message):
- filename must end in ``.md`` (case-insensitive)
- filename must be a plain name (no path separators / traversal)
- content must parse as a valid document (frontmatter + required fields)
- the document's ``doc_id`` must not already be indexed

On success the file is written into the documents folder and the index is
reloaded so the new document is immediately searchable.
"""
from __future__ import annotations

import re
from pathlib import Path

from .index_service import IndexService
from .models import Document
from .parser import DocumentParseError, parse_document

# A safe target filename: letters, numbers, dash, underscore, dot.
_SAFE_NAME_RE = re.compile(r"[^A-Za-z0-9._-]+")


class UploadError(ValueError):
    """Raised when an uploaded document is rejected."""


def _validate_filename(filename: str | None) -> str:
    if not filename:
        raise UploadError("A filename is required.")
    # Reject anything that could escape the documents directory.
    if "/" in filename or "\\" in filename or ".." in filename:
        raise UploadError("Filename must not contain path separators.")
    if Path(filename).name != filename:
        raise UploadError("Filename must not contain path components.")
    if not filename.lower().endswith(".md"):
        raise UploadError("Only .md files are accepted.")
    return filename


def _safe_target_name(filename: str, doc: Document) -> str:
    """Prefer a filename derived from the doc_id; fall back to a sanitized name."""
    base = _SAFE_NAME_RE.sub("-", doc.doc_id).strip("-")
    if base:
        return f"{base}.md"
    sanitized = _SAFE_NAME_RE.sub("-", filename).strip("-")
    return sanitized or "document.md"


class UploadService:
    """Handles upload validation, persistence, and re-indexing."""

    def __init__(self, index: IndexService):
        self.index = index

    def save(self, filename: str | None, content: bytes) -> Document:
        """Validate, persist, and index an uploaded markdown file.

        Returns the parsed :class:`Document`. Raises :class:`UploadError` on any
        validation failure (the file is not written in that case).
        """
        _validate_filename(filename)

        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError as exc:
            raise UploadError("File must be UTF-8 encoded text.") from exc

        try:
            doc = parse_document(text, source=filename or "<upload>")
        except DocumentParseError as exc:
            raise UploadError(f"Invalid document: {exc}") from exc

        if self.index.get(doc.doc_id) is not None:
            raise UploadError(f"A document with doc_id {doc.doc_id!r} already exists.")

        target = self.index.docs_dir / _safe_target_name(filename, doc)
        # Guard against an on-disk collision even if it is not yet indexed.
        if target.exists():
            raise UploadError(f"A file named {target.name!r} already exists.")

        self.index.docs_dir.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8")

        self.index.load()
        # Return the freshly indexed instance.
        return self.index.get(doc.doc_id) or doc
