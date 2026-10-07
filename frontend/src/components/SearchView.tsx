"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, search } from "@/lib/api";
import type { SearchResponse } from "@/lib/types";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { CitationChip } from "@/components/CitationChip";
import { EmptyState, ErrorState, Spinner } from "@/components/states";

type Status = "idle" | "loading" | "done" | "error";

// Sample prompts shown as clickable chips when the query is empty.
const SUGGESTIONS = [
  "Procurement approval threshold?",
  "Data retention rules?",
  "Remote work policy",
  "Security incident reporting",
];

export function SearchView() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounced = useDebouncedValue(query, 350);
  // Guards against out-of-order responses from overlapping requests.
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = debounced.trim();
    if (!trimmed) {
      setStatus("idle");
      setData(null);
      setError(null);
      return;
    }

    const id = ++requestId.current;
    setStatus("loading");
    setError(null);

    search(trimmed)
      .then((resp) => {
        if (id !== requestId.current) return;
        setData(resp);
        setStatus("done");
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return;
        setError(
          err instanceof ApiError ? err.message : "Search failed. Try again.",
        );
        setStatus("error");
      });
  }, [debounced]);

  return (
    <div className="p-8">
      <label htmlFor="search-input" className="sr-only">
        Search the knowledge base
      </label>
      <input
        id="search-input"
        type="search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search SOPs, policies, circulars… e.g. procurement approval threshold"
        className="w-full rounded-md border border-base-700 bg-base-900 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent/40"
      />

      {status === "idle" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="self-center text-xs text-slate-500">Try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuery(s)}
              className="rounded-full border border-base-700 bg-base-900 px-3 py-1 text-xs text-slate-300 transition hover:border-accent/60 hover:bg-base-800 hover:text-accent"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-6">
        {status === "idle" && (
          <EmptyState
            title="Start typing to search"
            hint="Results are drawn from the local document library with source citations."
          />
        )}

        {status === "loading" && <Spinner label="Searching…" />}

        {status === "error" && error && <ErrorState message={error} />}

        {status === "done" && data && <Results data={data} />}
      </div>
    </div>
  );
}

function Results({ data }: { data: SearchResponse }) {
  if (data.results.length === 0) {
    return (
      <EmptyState
        title={`No matches for “${data.query}”`}
        hint="Try different or broader keywords."
      />
    );
  }

  return (
    <>
      {data.answer && (
        <section className="rounded-md border border-accent/30 bg-base-850 p-5">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            Answer
          </h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">
            {data.answer}
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {data.results.length} result{data.results.length === 1 ? "" : "s"}
        </h2>
        <ol className="space-y-3">
          {data.results.map((r) => (
            <li
              key={`${r.doc_id}-${r.order}`}
              className="rounded-md border border-base-700 bg-base-900 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-100">
                    {r.title}
                  </div>
                  <div className="text-xs text-slate-500">
                    {r.section_title}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-xs text-slate-600">
                  score {r.score.toFixed(3)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {r.snippet}
              </p>
              <div className="mt-3">
                <CitationChip citation={r.citation} />
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
