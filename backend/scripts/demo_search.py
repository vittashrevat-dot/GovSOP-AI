"""Demo: run a search against the real corpus and print results + citations.

Run from the backend directory::

    .\\.venv\\Scripts\\python.exe scripts\\demo_search.py "procurement approval threshold"
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def main() -> None:
    query = sys.argv[1] if len(sys.argv) > 1 else "procurement approval threshold"
    with TestClient(app) as client:
        body = client.get("/search", params={"q": query}).json()

        print(f"Query: {query!r}\n")
        print("Top results:")
        for r in body["results"][:3]:
            print(f"  {r['score']:.4f}  {r['doc_id']} / {r['section_title']}")
            print(f"           snippet: {r['snippet'][:90]}...")
        print()
        if body["results"]:
            print("Top citation:", body["results"][0]["citation"])

        empty = client.get("/search", params={"q": "zzqxnomatch"}).json()
        print()
        print("Empty-query results:", empty["results"])
        print("Empty-query answer:", empty["answer"])


if __name__ == "__main__":
    main()
