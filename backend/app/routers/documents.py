"""Directory endpoint: list documents with metadata and compliance badges."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from ..badges import badges_for
from ..dependencies import get_index_service
from ..index_service import IndexService
from ..schemas import DirectoryResponse, DocumentDetail, DocumentSummary
from ..upload_service import UploadError, UploadService

router = APIRouter(tags=["documents"])


@router.get("/documents", response_model=DirectoryResponse)
def list_documents(
    department: str | None = Query(
        default=None, description="Filter to a single department (case-insensitive)."
    ),
    index: IndexService = Depends(get_index_service),
) -> DirectoryResponse:
    """Return all indexed documents with derived compliance badges.

    An optional ``department`` filter narrows the list; departments are matched
    case-insensitively. The response always reports the full set of known
    departments so a UI can render filter options.
    """
    all_docs = index.documents
    departments = sorted({d.department for d in all_docs})

    docs = all_docs
    if department is not None:
        wanted = department.strip().lower()
        docs = [d for d in all_docs if d.department.lower() == wanted]

    summaries = [
        DocumentSummary.from_document(d, badges_for(d.review_status)) for d in docs
    ]

    return DirectoryResponse(
        total=len(summaries),
        departments=departments,
        documents=summaries,
    )


@router.get("/documents/{doc_id}", response_model=DocumentDetail)
def get_document(
    doc_id: str,
    index: IndexService = Depends(get_index_service),
) -> DocumentDetail:
    """Return a single document's metadata, badges, and body sections."""
    doc = index.get(doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail=f"Unknown document: {doc_id}")
    return DocumentDetail.from_document(doc, badges_for(doc.review_status))


@router.post(
    "/documents",
    response_model=DocumentSummary,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    file: UploadFile = File(..., description="A markdown (.md) document to add."),
    index: IndexService = Depends(get_index_service),
) -> DocumentSummary:
    """Upload a markdown document, validate it, persist it, and re-index.

    Returns the created document summary (with badges). Rejects non-``.md``
    files, unparseable content, path traversal, and duplicate ``doc_id`` with
    a 400 response.
    """
    content = await file.read()
    try:
        doc = UploadService(index).save(file.filename, content)
    except UploadError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return DocumentSummary.from_document(doc, badges_for(doc.review_status))
