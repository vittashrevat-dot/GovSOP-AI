// Small shared presentational components for loading / empty / error states.

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-3 text-sm text-slate-400"
      role="status"
      aria-live="polite"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-base-600 border-t-accent" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-base-700 bg-base-900/40 p-8 text-center">
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="rounded-md border border-red-900/60 bg-red-950/40 p-4 text-sm text-red-300"
      role="alert"
    >
      {message}
    </div>
  );
}
