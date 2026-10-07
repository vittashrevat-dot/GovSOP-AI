"""Shared FastAPI dependencies.

The ``index_service`` is created in :mod:`app.main`; routers depend on it via
:func:`get_index_service`, which tests can override through
``app.dependency_overrides``.
"""
from __future__ import annotations

from .index_service import IndexService

# Set once by app.main at import time. Kept module-level so the dependency and
# the lifespan handler share the same instance.
_index_service: IndexService | None = None


def set_index_service(service: IndexService) -> None:
    global _index_service
    _index_service = service


def get_index_service() -> IndexService:
    if _index_service is None:  # pragma: no cover - misconfiguration guard
        raise RuntimeError("IndexService has not been initialized")
    return _index_service
