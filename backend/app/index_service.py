"""In-memory index of GovSOP documents loaded from a markdown folder.

The :class:`IndexService` scans a directory of ``*.md`` files, parses each into
a :class:`~app.models.Document`, and keeps the results in memory. Invalid files
are skipped and reported rather than crashing the load. :meth:`IndexService.load`
can be called again at any time (e.g. after an upload) to refresh the index.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path

from .models import Document, Section
from .parser import DocumentParseError, parse_file
from .search import SearchEngine, SearchHit

logger = logging.getLogger("govsop.index")


@dataclass
class LoadResult:
    """Summary of a load/reload pass."""

    loaded: int = 0
    skipped: list[tuple[str, str]] = field(default_factory=list)  # (filename, reason)


class IndexService:
    """Holds parsed documents and a flat list of their sections in memory."""

    def __init__(self, docs_dir: str | Path):
        self.docs_dir = Path(docs_dir)
        self._documents: dict[str, Document] = {}
        self._sections: list[tuple[str, Section]] = []  # (doc_id, section)
        self._search_engine: SearchEngine = SearchEngine([])

    # -- Accessors -----------------------------------------------------------

    @property
    def documents(self) -> list[Document]:
        """All indexed documents, ordered by doc_id for stable output."""
        return [self._documents[k] for k in sorted(self._documents)]

    @property
    def sections(self) -> list[tuple[str, Section]]:
        """Flat list of (doc_id, section) pairs across all documents."""
        return list(self._sections)

    def get(self, doc_id: str) -> Document | None:
        """Return a document by id, or ``None`` if it is not indexed."""
        return self._documents.get(doc_id)

    def search(self, query: str, limit: int = 5) -> list[SearchHit]:
        """Run a TF-IDF search over indexed sections."""
        return self._search_engine.search(query, limit=limit)

    def __len__(self) -> int:
        return len(self._documents)

    # -- Loading -------------------------------------------------------------

    def load(self) -> LoadResult:
        """(Re)scan the documents folder and rebuild the in-memory index.

        Returns a :class:`LoadResult` describing how many files were loaded and
        which were skipped (with a reason). Never raises for malformed files.
        """
        documents: dict[str, Document] = {}
        sections: list[tuple[str, Section]] = []
        result = LoadResult()

        if not self.docs_dir.exists():
            logger.warning("Documents directory does not exist: %s", self.docs_dir)
            self._documents = documents
            self._sections = sections
            return result

        for path in sorted(self.docs_dir.glob("*.md")):
            try:
                doc = parse_file(path)
            except DocumentParseError as exc:
                result.skipped.append((path.name, str(exc)))
                logger.warning("Skipped %s: %s", path.name, exc)
                continue

            if doc.doc_id in documents:
                reason = f"duplicate doc_id {doc.doc_id!r} (already from another file)"
                result.skipped.append((path.name, reason))
                logger.warning("Skipped %s: %s", path.name, reason)
                continue

            documents[doc.doc_id] = doc
            for section in doc.sections:
                sections.append((doc.doc_id, section))
            result.loaded += 1

        self._documents = documents
        self._sections = sections
        self._search_engine = SearchEngine(sections)
        logger.info(
            "Indexed %d documents, %d sections (%d skipped)",
            result.loaded,
            len(sections),
            len(result.skipped),
        )
        return result
