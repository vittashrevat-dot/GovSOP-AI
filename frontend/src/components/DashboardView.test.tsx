import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ExtractionResponse } from "@/lib/types";

const getExtractionMock = vi.fn();
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getExtraction: (...args: unknown[]) => getExtractionMock(...args),
  };
});

import { DashboardView, buildActionPlan } from "./DashboardView";

const DATA: ExtractionResponse = {
  action_items: [
    { text: "Submit vendor forms", source: { doc_id: "SOP-A", title: "Proc" } },
  ],
  deadlines: [
    {
      label: "Vendor registration",
      date: "2024-06-30",
      source: { doc_id: "SOP-A", title: "Proc" },
    },
    {
      label: "Audit submission",
      date: "2024-12-15",
      source: { doc_id: "SOP-A", title: "Proc" },
    },
  ],
  responsible_departments: [
    {
      department: "Finance",
      sources: [
        { doc_id: "SOP-A", title: "Proc" },
        { doc_id: "MIN-B", title: "Mins" },
      ],
    },
  ],
  policy_changes: [
    {
      text: "Threshold raised to $10,000",
      source: { doc_id: "SOP-A", title: "Proc" },
    },
  ],
};

afterEach(() => vi.clearAllMocks());

describe("DashboardView", () => {
  it("renders all four extraction groups", async () => {
    getExtractionMock.mockResolvedValue(DATA);
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText("Action Items")).toBeInTheDocument();
    });
    expect(screen.getByText("Deadlines")).toBeInTheDocument();
    expect(screen.getByText("Responsible Departments")).toBeInTheDocument();
    expect(screen.getByText("Key Policy Changes")).toBeInTheDocument();

    expect(screen.getByText("Submit vendor forms")).toBeInTheDocument();
    expect(screen.getByText("Threshold raised to $10,000")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
  });

  it("links items back to their source document", async () => {
    getExtractionMock.mockResolvedValue(DATA);
    render(<DashboardView />);

    await waitFor(() => screen.getByText("Submit vendor forms"));

    const links = screen.getAllByRole("link", { name: "SOP-A" });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "/directory?doc=SOP-A");
  });

  it("renders deadlines with their dates", async () => {
    getExtractionMock.mockResolvedValue(DATA);
    render(<DashboardView />);
    await waitFor(() => {
      expect(screen.getByText("2024-06-30")).toBeInTheDocument();
    });
    expect(screen.getByText("2024-12-15")).toBeInTheDocument();
  });

  it("renders an error state on failure", async () => {
    getExtractionMock.mockRejectedValue(new Error("boom"));
    render(<DashboardView />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("enables the Export Action Plan button once data loads", async () => {
    getExtractionMock.mockResolvedValue(DATA);
    render(<DashboardView />);
    const btn = screen.getByRole("button", { name: /export action plan/i });
    // Disabled while loading, enabled after data arrives.
    expect(btn).toBeDisabled();
    await waitFor(() => expect(btn).toBeEnabled());
  });
});

describe("buildActionPlan", () => {
  it("includes action items and deadlines with sources", () => {
    const plan = buildActionPlan(DATA);
    expect(plan).toContain("# GovSOP AI — Action Plan");
    expect(plan).toContain("## Action Items");
    expect(plan).toContain("- [ ] Submit vendor forms  (Source: SOP-A)");
    expect(plan).toContain("## Deadlines");
    expect(plan).toContain("2024-06-30 — Vendor registration  (Source: SOP-A)");
  });

  it("handles empty groups gracefully", () => {
    const plan = buildActionPlan({
      action_items: [],
      deadlines: [],
      responsible_departments: [],
      policy_changes: [],
    });
    expect(plan).toContain("## Action Items");
    expect(plan).toContain("_None._");
  });
});
