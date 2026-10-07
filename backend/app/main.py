"""GovSOP AI backend — FastAPI application entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import MOCK_DOCUMENTS_DIR
from .dependencies import set_index_service
from .index_service import IndexService
from .routers import documents as documents_router
from .routers import extraction as extraction_router
from .routers import search as search_router

logging.basicConfig(level=logging.INFO)

# Origins allowed to call this API. The Next.js dev server runs on :3000.
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Shared in-memory index, populated at startup and refreshed after uploads.
index_service = IndexService(MOCK_DOCUMENTS_DIR)
set_index_service(index_service)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the document index when the application starts."""
    index_service.load()
    yield


app = FastAPI(
    title="GovSOP AI",
    description=(
        "Local-first enterprise AI document management and decision support "
        "API. Serves search, directory, extraction, and upload endpoints over "
        "a folder of mock markdown documents."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    """Liveness probe used by the frontend and local tooling."""
    return {"status": "ok"}


app.include_router(documents_router.router)
app.include_router(search_router.router)
app.include_router(extraction_router.router)
