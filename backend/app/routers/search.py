"""Search endpoint: TF-IDF ranked section matches with citations."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from ..dependencies import get_index_service
from ..index_service import IndexService
from ..schemas import Citation, SearchResponse, SearchResult

router = APIRouter(tags=["search"])


@router.get("/search", response_model=SearchResponse)
def search(
    q: str = Query(..., description="Natural-language query."),
    limit: int = Query(default=5, ge=1, le=25, description="Max results to return."),
    index: IndexService = Depends(get_index_service),
) -> SearchResponse:
    """Rank document sections against ``q`` and return results with citations.

    A zero-match or empty query yields ``answer: null`` and an empty results
    list rather than an error, so the UI can show an explicit empty state.
    """
    hits = index.search(q, limit=limit)

    results: list[SearchResult] = []
    for hit in hits:
        doc = index.get(hit.doc_id)
        title = doc.title if doc else hit.doc_id
        citation = Citation(
            doc_id=hit.doc_id,
            title=title,
            section_title=hit.section_title,
            order=hit.order,
        )
        results.append(
            SearchResult(
                doc_id=hit.doc_id,
                title=title,
                section_title=hit.section_title,
                order=hit.order,
                snippet=hit.snippet,
                score=hit.score,
                citation=citation,
            )
        )

    answer = _assemble_answer(results)
    return SearchResponse(query=q, answer=answer, results=results)


def _assemble_answer(results: list[SearchResult]) -> str | None:
    """Build a short answer from the top result(s), citing their sources."""
    if not results:
        return None
    top = results[0]
    answer = top.snippet
    cite = f"{top.doc_id} — {top.section_title}"
    return f"{answer}\n\n(Source: {cite})"
