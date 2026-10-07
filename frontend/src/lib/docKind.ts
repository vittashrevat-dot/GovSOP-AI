// Derive a human document "kind" label from a doc_id prefix.
// e.g. SOP-2024-014 -> "SOP", POL-2023-002 -> "POLICY".

const PREFIX_LABELS: Record<string, string> = {
  SOP: "SOP",
  POL: "POLICY",
  CIR: "CIRCULAR",
  GUI: "GUIDELINE",
  REP: "REPORT",
  MIN: "MINUTES",
};

export function docKind(docId: string): string {
  const prefix = docId.split("-")[0]?.toUpperCase() ?? "";
  return PREFIX_LABELS[prefix] ?? "DOC";
}
