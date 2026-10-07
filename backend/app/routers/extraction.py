"""Extraction endpoints: aggregated and per-document structured cards."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from ..dependencies import get_index_service
from ..extraction import build_extraction
from ..index_service import IndexService
from ..schemas import ExtractionResponse

router = APIRouter(tags=["extraction"])


@router.get("/extraction", response_model=ExtractionResponse)
def extraction(
    index: IndexService = Depends(get_index_service),
) -> ExtractionResponse:
    """Aggregate extraction fields across every indexed document."""
    return build_extraction(index.documents)


@router.get("/extraction/{doc_id}", response_model=ExtractionResponse)
def extraction_for_document(
    doc_id: str,
    index: IndexService = Depends(get_index_service),
) -> ExtractionResponse:
    """Return extraction fields for a single document, or 404 if unknown."""
    doc = index.get(doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail=f"Unknown document: {doc_id}")
    return build_extraction([doc])
