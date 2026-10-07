"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, getDocuments } from "@/lib/api";
import type { DirectoryResponse, DocumentSummary } from "@/lib/types";
import { BadgeList } from "@/components/Badge";
import { DocumentDrawer } from "@/components/DocumentDrawer";
import { UploadPanel } from "@/components/UploadPanel";
import { EmptyState, ErrorState, Spinner } from "@/components/states";

type Status = "loading" | "done" | "error";

export function DirectoryView() {
  const [data, setData] = useState<DirectoryResponse | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [department, setDepartment] = useState<string>("");
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [scrollTo, setScrollTo] = useState<number | null>(null);

  // Open the drawer from a search citation deep link (?doc=ID#section-N).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const doc = params.get("doc");
    if (doc) {
      setOpenDoc(doc);
      const match = window.location.hash.match(/section-(\d+)/);
      if (match) setScrollTo(Number(match[1]));
    }
  }, []);

  const load = useCallback(() => {
    let active = true;
    setStatus("loading");
    setError(null);
    getDocuments(department || undefined)
      .then((resp) => {
        if (!active) return;
        setData(resp);
        setStatus("done");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof ApiError ? err.message : "Could not load documents.",
        );
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [department]);

  useEffect(() => load(), [load]);

  return (
    <div className="p-8">
      <UploadPanel onUploaded={load} />

      <div className="mb-6 flex items-center gap-3">
        <label htmlFor="dept-filter" className="text-sm text-slate-400">
          Department
        </label>
        <select
          id="dept-filter"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-md border border-base-700 bg-base-900 px-3 py-1.5 text-sm text-slate-200 focus:border-accent/60 focus:outline-none"
        >
          <option value="">All departments</option>
          {data?.departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        {data && (
          <span className="text-xs text-slate-500">
            {data.total} document{data.total === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {status === "loading" && <Spinner label="Loading directory…" />}
      {status === "error" && error && <ErrorState message={error} />}
      {status === "done" && data && (
        <DocumentGrid
          documents={data.documents}
          onOpen={(id) => {
            setScrollTo(null);
            setOpenDoc(id);
          }}
        />
      )}

      {openDoc && (
        <DocumentDrawer
          docId={openDoc}
          scrollToSection={scrollTo}
          onClose={() => {
            setOpenDoc(null);
            setScrollTo(null);
          }}
        />
      )}
    </div>
  );
}

function DocumentGrid({
  documents,
  onOpen,
}: {
  documents: DocumentSummary[];
  onOpen: (docId: string) => void;
}) {
  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents in this view"
        hint="Try a different department filter."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {documents.map((doc) => (
        <button
          key={doc.doc_id}
          onClick={() => onOpen(doc.doc_id)}
          className="flex flex-col gap-3 rounded-md border border-base-700 bg-base-900 p-4 text-left transition hover:border-accent/50 hover:bg-base-850"
        >
          <div>
            <div className="font-mono text-xs text-slate-500">
              {doc.doc_id}
            </div>
            <div className="text-sm font-medium text-slate-100">
              {doc.title}
            </div>
          </div>
          <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <div>
              <dt className="inline text-slate-500">Dept: </dt>
              <dd className="inline">{doc.department}</dd>
            </div>
            <div>
              <dt className="inline text-slate-500">Effective: </dt>
              <dd className="inline">{doc.effective_date}</dd>
            </div>
          </dl>
          <BadgeList badges={doc.badges} />
        </button>
      ))}
    </div>
  );
}
