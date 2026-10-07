"use client";

import { useEffect, useState } from "react";
import { ApiError, getExtraction } from "@/lib/api";
import type { ExtractionResponse } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { SourceLink } from "@/components/SourceLink";
import { EmptyState, ErrorState, Spinner } from "@/components/states";

type Status = "loading" | "done" | "error";

/** Build a clean markdown action plan from the aggregated extraction data. */
export function buildActionPlan(data: ExtractionResponse): string {
  const stamp = new Date().toISOString().slice(0, 10);
  const lines: string[] = [
    "# GovSOP AI — Action Plan",
    "",
    `Generated: ${stamp}`,
    "",
    "## Action Items",
    "",
  ];

  if (data.action_items.length === 0) {
    lines.push("_None._", "");
  } else {
    for (const item of data.action_items) {
      lines.push(`- [ ] ${item.text}  (Source: ${item.source.doc_id})`);
    }
    lines.push("");
  }

  lines.push("## Deadlines", "");
  if (data.deadlines.length === 0) {
    lines.push("_None._", "");
  } else {
    for (const d of data.deadlines) {
      lines.push(`- ${d.date} — ${d.label}  (Source: ${d.source.doc_id})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function downloadActionPlan(data: ExtractionResponse): void {
  const content = buildActionPlan(data);
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `govsop-action-plan-${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function DashboardView() {
  const [data, setData] = useState<ExtractionResponse | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getExtraction()
      .then((resp) => {
        if (!active) return;
        setData(resp);
        setStatus("done");
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof ApiError ? err.message : "Could not load extraction.",
        );
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  const canExport =
    !!data && (data.action_items.length > 0 || data.deadlines.length > 0);

  return (
    <div>
      <PageHeader
        title="Extraction Dashboard"
        subtitle="Action items, deadlines, departments, and policy changes."
      >
        <button
          type="button"
          disabled={!canExport}
          onClick={() => data && downloadActionPlan(data)}
          className="inline-flex items-center gap-2 rounded-md border border-accent/50 bg-base-800 px-3 py-2 text-sm font-medium text-accent transition hover:bg-base-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span aria-hidden>📥</span>
          Export Action Plan
        </button>
      </PageHeader>

      {status === "loading" && (
        <div className="p-8">
          <Spinner label="Extracting insights…" />
        </div>
      )}
      {status === "error" && error && (
        <div className="p-8">
          <ErrorState message={error} />
        </div>
      )}
      {status === "done" && data && <DashboardGrid data={data} />}
    </div>
  );
}

function DashboardGrid({ data }: { data: ExtractionResponse }) {
  return (
    <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-2">
      <Card title="Action Items" count={data.action_items.length}>
        {data.action_items.length === 0 ? (
          <EmptyState title="No action items" />
        ) : (
          <ul className="space-y-2">
            {data.action_items.map((item, i) => (
              <li
                key={`${item.source.doc_id}-${i}`}
                className="flex items-start justify-between gap-3 rounded border border-base-700 bg-base-900 p-3"
              >
                <span className="text-sm text-slate-200">{item.text}</span>
                <SourceLink source={item.source} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Deadlines" count={data.deadlines.length}>
        {data.deadlines.length === 0 ? (
          <EmptyState title="No deadlines" />
        ) : (
          <ul className="space-y-2">
            {data.deadlines.map((d, i) => (
              <li
                key={`${d.source.doc_id}-${i}`}
                className="flex items-center justify-between gap-3 rounded border border-base-700 bg-base-900 p-3"
              >
                <div className="min-w-0">
                  <div className="text-sm text-slate-200">{d.label}</div>
                  <div className="font-mono text-xs text-warn">{d.date}</div>
                </div>
                <SourceLink source={d.source} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Responsible Departments"
        count={data.responsible_departments.length}
      >
        {data.responsible_departments.length === 0 ? (
          <EmptyState title="No departments" />
        ) : (
          <ul className="space-y-2">
            {data.responsible_departments.map((dept) => (
              <li
                key={dept.department}
                className="rounded border border-base-700 bg-base-900 p-3"
              >
                <div className="mb-1 text-sm font-medium text-slate-100">
                  {dept.department}
                </div>
                <div className="flex flex-wrap gap-2">
                  {dept.sources.map((s, i) => (
                    <SourceLink key={`${s.doc_id}-${i}`} source={s} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Key Policy Changes" count={data.policy_changes.length}>
        {data.policy_changes.length === 0 ? (
          <EmptyState title="No policy changes" />
        ) : (
          <ul className="space-y-2">
            {data.policy_changes.map((item, i) => (
              <li
                key={`${item.source.doc_id}-${i}`}
                className="flex items-start justify-between gap-3 rounded border border-base-700 bg-base-900 p-3"
              >
                <span className="text-sm text-slate-200">{item.text}</span>
                <SourceLink source={item.source} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Card({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-base-700 bg-base-850 p-5">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          {title}
        </h2>
        <span className="rounded-full bg-base-700 px-2 py-0.5 font-mono text-xs text-slate-400">
          {count}
        </span>
      </header>
      {children}
    </section>
  );
}
