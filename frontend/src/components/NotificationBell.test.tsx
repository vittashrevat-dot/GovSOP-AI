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

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

import { NotificationBell } from "./NotificationBell";

const DOCS: DirectoryResponse = {
  total: 3,
  departments: ["Finance", "Legal", "HR"],
  documents: [
    {
      doc_id: "DOC-OK",
      title: "Current Doc",
      department: "HR",
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

afterEach(() => vi.clearAllMocks());

describe("NotificationBell", () => {
  it("shows a badge count of flagged documents only", async () => {
    getDocumentsMock.mockResolvedValue(DOCS);
    render(<NotificationBell />);
    // 2 of 3 docs carry a warning badge.
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("lists flagged documents and opens one on click", async () => {
    getDocumentsMock.mockResolvedValue(DOCS);
    const user = userEvent.setup();
    render(<NotificationBell />);

    await waitFor(() => screen.getByText("2"));
    await user.click(screen.getByRole("button", { name: /compliance alerts/i }));

    expect(screen.getByText("Review Doc")).toBeInTheDocument();
    expect(screen.getByText("Outdated Doc")).toBeInTheDocument();
    expect(screen.queryByText("Current Doc")).not.toBeInTheDocument();

    await user.click(screen.getByText("Review Doc"));
    expect(pushMock).toHaveBeenCalledWith("/directory?doc=DOC-REV");
  });

  it("shows no badge when nothing is flagged", async () => {
    getDocumentsMock.mockResolvedValue({
      total: 1,
      departments: ["HR"],
      documents: [DOCS.documents[0]],
    } satisfies DirectoryResponse);
    render(<NotificationBell />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /0 items/i }),
      ).toBeInTheDocument();
    });
  });
});
