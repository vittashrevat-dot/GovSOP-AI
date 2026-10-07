"""Demo: parse one mock document and print its structured form.

Run from the backend directory::

    .\\.venv\\Scripts\\python.exe scripts\\demo_parse.py
    .\\.venv\\Scripts\\python.exe scripts\\demo_parse.py SOP-2024-008-incident-response.md
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

# Allow running as a plain script (add backend/ to the import path).
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.parser import parse_file  # noqa: E402

MOCK_DIR = Path(__file__).resolve().parents[2] / "mock_documents"


def main() -> None:
    filename = sys.argv[1] if len(sys.argv) > 1 else "SOP-2024-014-procurement-approval.md"
    document = parse_file(MOCK_DIR / filename)

    print(f"Parsed {filename}\n")
    print(f"  doc_id:        {document.doc_id}")
    print(f"  title:         {document.title}")
    print(f"  department:    {document.department}")
    print(f"  effective:     {document.effective_date}")
    print(f"  review_status: {document.review_status.value}")
    print(f"  action_items:  {len(document.action_items)}")
    print(f"  deadlines:     {len(document.deadlines)}")
    print(f"  policy_changes:{len(document.policy_changes)}")
    print(f"  sections:      {len(document.sections)}")
    print()
    for section in document.sections:
        preview = section.text[:60].replace("\n", " ")
        print(f"    [{section.order}] {section.section_title!r} -> {preview!r}...")

    print("\nFull JSON:\n")
    print(json.dumps(document.model_dump(mode="json"), indent=2))


if __name__ == "__main__":
    main()
