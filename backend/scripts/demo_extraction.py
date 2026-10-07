"""Demo: print aggregated extraction across the real corpus."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402


def main() -> None:
    with TestClient(app) as client:
        body = client.get("/extraction").json()
        print("Aggregated extraction:")
        print(f"  action_items:            {len(body['action_items'])}")
        print(f"  deadlines:               {len(body['deadlines'])}")
        print(f"  responsible_departments: {len(body['responsible_departments'])}")
        print(f"  policy_changes:          {len(body['policy_changes'])}")
        print()
        print("Deadlines (sorted):")
        for d in body["deadlines"]:
            print(f"  {d['date']}  {d['label']}  <- {d['source']['doc_id']}")
        print()
        print("Departments:")
        for dept in body["responsible_departments"]:
            ids = ", ".join(s["doc_id"] for s in dept["sources"])
            print(f"  {dept['department']}: {ids}")
        print()
        single = client.get("/extraction/SOP-2024-014").json()
        print("Per-document SOP-2024-014:")
        print(f"  action_items: {len(single['action_items'])}, "
              f"deadlines: {len(single['deadlines'])}, "
              f"policy_changes: {len(single['policy_changes'])}")
        print("404 check:", client.get("/extraction/NOPE").status_code)


if __name__ == "__main__":
    main()
