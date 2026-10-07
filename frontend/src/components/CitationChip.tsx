import type { Citation } from "@/lib/types";
import { docKind } from "@/lib/docKind";

/**
 * A compact source citation chip. Shows the document "kind" (SOP, POLICY, …)
 * like a file-type tag, reveals full details on hover, and links to the
 * document's detail drawer (deep-linking to the cited section).
 */
export function CitationChip({ citation }: { citation: Citation }) {
  const href = `/directory?doc=${encodeURIComponent(
    citation.doc_id,
  )}#section-${citation.order}`;
  const kind = docKind(citation.doc_id);

  return (
    <a
      href={href}
      className="group relative inline-flex items-center gap-1.5 rounded border border-base-600 bg-base-800 px-2 py-0.5 font-mono text-xs text-accent transition hover:border-accent/60 hover:bg-base-700"
    >
      <span className="rounded bg-base-700 px-1 text-[10px] font-semibold tracking-wide text-slate-300 group-hover:bg-base-600">
        {kind}
      </span>
      <span className="text-slate-400">{citation.doc_id}</span>
      <span className="text-slate-600">/</span>
      <span>{citation.section_title}</span>

      {/* Hover detail tooltip. */}
      <span className="pointer-events-none absolute bottom-full left-0 z-10 mb-1 hidden w-max max-w-xs rounded-md border border-base-600 bg-base-950 px-3 py-2 text-left font-sans text-xs text-slate-300 shadow-lg group-hover:block">
        <span className="block font-medium text-slate-100">
          {citation.title}
        </span>
        <span className="block text-slate-400">
          Section: {citation.section_title}
        </span>
        <span className="mt-1 block text-[11px] text-accent">
          Click to open the source document →
        </span>
      </span>
    </a>
  );
}
