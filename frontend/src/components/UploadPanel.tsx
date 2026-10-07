"use client";

import { useRef, useState } from "react";
import { ApiError, uploadDocument } from "@/lib/api";
import type { DocumentSummary } from "@/lib/types";

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; name: string }
  | { status: "success"; doc: DocumentSummary }
  | { status: "error"; message: string };

/**
 * Drag-and-drop (or click-to-pick) uploader for a single markdown document.
 * On success it calls `onUploaded` so the parent can refetch its data.
 */
export function UploadPanel({ onUploaded }: { onUploaded: () => void }) {
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setState({ status: "uploading", name: file.name });
    try {
      const doc = await uploadDocument(file);
      setState({ status: "success", doc });
      onUploaded();
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof ApiError ? err.message : "Upload failed. Try again.",
      });
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div className="mb-6">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a markdown document"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-6 text-center transition ${
          dragging
            ? "border-accent bg-base-800"
            : "border-base-700 bg-base-900/40 hover:border-accent/50"
        }`}
      >
        <p className="text-sm text-slate-300">
          Drag a <span className="font-mono text-accent">.md</span> document
          here, or click to browse
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Must include valid frontmatter with a unique doc_id.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".md,text/markdown"
          className="hidden"
          data-testid="file-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            // Allow re-selecting the same file after an error.
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-2 min-h-[1.5rem]" aria-live="polite">
        {state.status === "uploading" && (
          <p className="flex items-center gap-2 text-xs text-slate-400">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-base-600 border-t-accent" />
            Uploading {state.name}…
          </p>
        )}
        {state.status === "success" && (
          <p className="text-xs text-emerald-400" role="status">
            ✓ Added {state.doc.doc_id} — {state.doc.title}
          </p>
        )}
        {state.status === "error" && (
          <p className="text-xs text-red-400" role="alert">
            {state.message}
          </p>
        )}
      </div>
    </div>
  );
}
