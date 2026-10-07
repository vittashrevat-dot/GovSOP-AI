import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { DirectoryResponse } from "@/lib/types";

const getDocumentsMock = vi.fn();
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getDocuments: (...args: unknown[]) => getDocumentsMock(...args),
  };
});

import { DirectoryView } from "./DirectoryView";

const ALL: DirectoryResponse = {
  total: 3,
  departments: ["Finance", "Legal"],
  documents: [
    {
      doc_id: "DOC-CUR",
      title: "Current Doc",
      department: "Finance",
      effective_date: "2024-01-01",
      review_status: "current",
      badges: [{ label: "Current", severity: "none" }],
    },
    {
      doc_id: "DOC-REV",
      title: "Review Doc",
      department: "Finance",
      effective_date: "2024-02-01",
      review_status: "needs_review",
      badges: [{ label: "⚠️ Needs Review", severity: "warning" }],
    },
    {
      doc_id: "DOC-OLD",
      title: "Outdated Doc",
      department: "Legal",
      effective_date: "2023-01-01",
      review_status: "outdated_clause",
      badges: [{ label: "Outdated Clause", severity: "warning" }],
    },
  ],
};

const FINANCE_ONLY: DirectoryResponse = {
  total: 2,
  departments: ["Finance", "Legal"],
  documents: ALL.documents.filter((d) => d.department === "Finance"),
};

afterEach(() => {
  vi.clearAllMocks();
  window.history.replaceState({}, "", "/directory");
});

describe("DirectoryView", () => {
  it("renders documents with their compliance badges", async () => {
    getDocumentsMock.mockResolvedValue(ALL);
    render(<DirectoryView />);

    await waitFor(() => {
      expect(screen.getByText("Current Doc")).toBeInTheDocument();
    });
    expect(screen.getByText("⚠️ Needs Review")).toHaveAttribute(
      "data-severity",
      "warning",
    );
    expect(screen.getByText("Outdated Clause")).toHaveAttribute(
      "data-severity",
      "warning",
    );
    expect(screen.getByText("Current")).toHaveAttribute(
      "data-severity",
      "none",
    );
  });

  it("filters by department", async () => {
    getDocumentsMock.mockResolvedValueOnce(ALL);
    const user = userEvent.setup();
    render(<DirectoryView />);

    await waitFor(() => screen.getByText("Current Doc"));

    getDocumentsMock.mockResolvedValueOnce(FINANCE_ONLY);
    await user.selectOptions(screen.getByLabelText("Department"), "Finance");

    // Second call carries the department argument.
    await waitFor(() => {
      expect(getDocumentsMock).toHaveBeenLastCalledWith("Finance");
    });
    await waitFor(() => {
      expect(screen.queryByText("Outdated Doc")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Current Doc")).toBeInTheDocument();
  });

  it("shows an empty state when no documents match", async () => {
    getDocumentsMock.mockResolvedValue({
      total: 0,
      departments: ["Finance"],
      documents: [],
    } satisfies DirectoryResponse);
    render(<DirectoryView />);
    await waitFor(() => {
      expect(screen.getByText(/no documents in this view/i)).toBeInTheDocument();
    });
  });

  it("renders an error state when the request fails", async () => {
    getDocumentsMock.mockRejectedValue(new Error("boom"));
    render(<DirectoryView />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
