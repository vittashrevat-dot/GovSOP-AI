import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { DocumentSummary } from "@/lib/types";
import { ApiError } from "@/lib/api";

const uploadMock = vi.fn();
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    uploadDocument: (...args: unknown[]) => uploadMock(...args),
  };
});

import { UploadPanel } from "./UploadPanel";

const CREATED: DocumentSummary = {
  doc_id: "SOP-NEW",
  title: "New Rules",
  department: "Finance",
  effective_date: "2024-08-01",
  review_status: "needs_review",
  badges: [{ label: "⚠️ Needs Review", severity: "warning" }],
};

function selectFile(name: string) {
  const input = screen.getByTestId("file-input") as HTMLInputElement;
  const file = new File(["content"], name, { type: "text/markdown" });
  fireEvent.change(input, { target: { files: [file] } });
}

afterEach(() => vi.clearAllMocks());

describe("UploadPanel", () => {
  it("shows success feedback and triggers refetch on success", async () => {
    uploadMock.mockResolvedValue(CREATED);
    const onUploaded = vi.fn();
    render(<UploadPanel onUploaded={onUploaded} />);

    selectFile("new.md");

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("SOP-NEW");
    });
    expect(onUploaded).toHaveBeenCalledTimes(1);
    expect(uploadMock).toHaveBeenCalledTimes(1);
  });

  it("shows the backend validation error and does not refetch", async () => {
    uploadMock.mockRejectedValue(
      new ApiError(400, "Only .md files are accepted."),
    );
    const onUploaded = vi.fn();
    render(<UploadPanel onUploaded={onUploaded} />);

    selectFile("notes.txt");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Only .md files are accepted.",
      );
    });
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it("accepts a dropped file", async () => {
    uploadMock.mockResolvedValue(CREATED);
    const onUploaded = vi.fn();
    render(<UploadPanel onUploaded={onUploaded} />);

    const zone = screen.getByRole("button", {
      name: /upload a markdown document/i,
    });
    const file = new File(["content"], "dropped.md", {
      type: "text/markdown",
    });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });

    await waitFor(() => {
      expect(uploadMock).toHaveBeenCalledTimes(1);
    });
  });
});
