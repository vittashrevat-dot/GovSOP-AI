import type { SourceRef } from "@/lib/types";

/** Links an extracted item back to its source document in the directory. */
export function SourceLink({ source }: { source: SourceRef }) {
  return (
    <a
      href={`/directory?doc=${encodeURIComponent(source.doc_id)}`}
      className="font-mono text-xs text-accent transition hover:underline"
      title={source.title}
    >
      {source.doc_id}
    </a>
  );
}
