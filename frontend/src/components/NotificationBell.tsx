"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getDocuments } from "@/lib/api";
import type { DocumentSummary } from "@/lib/types";
import { Badge } from "@/components/Badge";

/** A document is "flagged" if it carries any warning-severity badge. */
function isFlagged(doc: DocumentSummary): boolean {
  return doc.badges.some((b) => b.severity === "warning");
}

export function NotificationBell() {
  const [flagged, setFlagged] = useState<DocumentSummary[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    getDocuments()
      .then((resp) => {
        if (active) setFlagged(resp.documents.filter(isFlagged));
      })
      .catch(() => {
        // Non-critical: a failed fetch simply shows no alerts.
      });
    return () => {
      active = false;
    };
  }, []);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const count = flagged.length;

  function openDocument(docId: string) {
    setOpen(false);
    router.push(`/directory?doc=${encodeURIComponent(docId)}`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Compliance alerts: ${count} item${count === 1 ? "" : "s"} need attention`}
        aria-expanded={open}
        className="relative rounded-md border border-base-700 bg-base-900 px-1.5 py-1 text-slate-300 transition hover:border-accent/50 hover:text-accent"
      >
        <span aria-hidden className="text-sm leading-none">
          🔔
        </span>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-warn px-1 text-[10px] font-bold leading-none text-base-950">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-lg border border-base-700 bg-base-900 shadow-xl">
          <div className="border-b border-base-700 px-4 py-3">
            <div className="text-sm font-semibold text-slate-100">
              Compliance Alerts
            </div>
            <div className="text-xs text-slate-500">
              {count === 0
                ? "Everything looks current."
                : `${count} document${count === 1 ? "" : "s"} need review`}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {count === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                No flagged documents 🎉
              </div>
            ) : (
              <ul>
                {flagged.map((doc) => (
                  <li key={doc.doc_id}>
                    <button
                      onClick={() => openDocument(doc.doc_id)}
                      className="flex w-full flex-col gap-1.5 border-b border-base-800 px-4 py-3 text-left transition hover:bg-base-850"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-slate-100">
                          {doc.title}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs text-slate-500">
                          {doc.doc_id} · {doc.department}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {doc.badges
                          .filter((b) => b.severity === "warning")
                          .map((b, i) => (
                            <Badge key={i} badge={b} />
                          ))}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
