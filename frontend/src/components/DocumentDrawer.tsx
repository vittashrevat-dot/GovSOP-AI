"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, getDocument } from "@/lib/api";
import type { DocumentDetail } from "@/lib/types";
import { BadgeList } from "@/components/Badge";
import { ErrorState, Spinner } from "@/components/states";

/**
 * Slide-over drawer showing a document's metadata, badges, and sections.
 * When `scrollToSection` is set, scrolls to and highlights that section once
 * the document has loaded (used by the search citation deep link).
 */
export function DocumentDrawer({
  docId,
  scrollToSection,
  onClose,
}: {
  docId: string;
  scrollToSection?: number | null;
  onClose: () => void;
}) {
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setDoc(null);
    setError(null);
    getDocument(docId)
      .then((d) => active && setDoc(d))
      .catch((err: unknown) =>
        active &&
        setError(
          err instanceof ApiError ? err.message : "Could not load document.",
        ),
      );
    return () => {
      active = false;
    };
  }, [docId]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Deep-link scroll once sections are rendered.
  useEffect(() => {
    if (doc && scrollToSection != null) {
      const el = panelRef.current?.querySelector(
        `#section-${scrollToSection}`,
      );
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [doc, scrollToSection]);

  return (
    <div className="fixed inset-0 z-20 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Document detail"
        className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-base-700 bg-base-900 shadow-xl"
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-base-700 bg-base-900 px-6 py-4">
          <div className="min-w-0">
            <div className="font-mono text-xs text-slate-500">{docId}</div>
            <h2 className="truncate text-base font-semibold text-slate-100">
              {doc?.title ?? "Loading…"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded border border-base-700 px-2 py-1 text-xs text-slate-400 hover:bg-base-800"
          >
            Close
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          {error && <ErrorState message={error} />}
          {!doc && !error && <Spinner label="Loading document…" />}

          {doc && (
            <>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Department
                  </dt>
                  <dd className="text-slate-200">{doc.department}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    Effective Date
                  </dt>
                  <dd className="text-slate-200">{doc.effective_date}</dd>
                </div>
              </dl>

              <BadgeList badges={doc.badges} />

              <div className="space-y-4">
                {doc.sections.map((s) => (
                  <section
                    key={s.order}
                    id={`section-${s.order}`}
                    className="scroll-mt-20 rounded-md border border-base-700 bg-base-850 p-4"
                  >
                    <h3 className="mb-1 text-sm font-semibold text-slate-100">
                      {s.section_title}
                    </h3>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
                      {s.text}
                    </p>
                  </section>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
