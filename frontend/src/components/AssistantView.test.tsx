import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SearchResponse } from "@/lib/types";

const searchMock = vi.fn();
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, search: (...args: unknown[]) => searchMock(...args) };
});

import { AssistantView } from "./AssistantView";

const RESP: SearchResponse = {
  query: "procurement approval",
  answer:
    "Purchases above $10,000 require Finance review.\n\n(Source: SOP-2024-014 — Approval Thresholds)",
  results: [
    {
      doc_id: "SOP-2024-014",
      title: "Procurement Approval Procedure",
      section_title: "Approval Thresholds",
      order: 2,
      snippet: "Purchases above $10,000 require Finance review.",
      score: 0.1,
      citation: {
        doc_id: "SOP-2024-014",
        title: "Procurement Approval Procedure",
        section_title: "Approval Thresholds",
        order: 2,
      },
    },
  ],
};

afterEach(() => vi.clearAllMocks());

describe("AssistantView", () => {
  it("shows suggestion prompts before any chat", () => {
    render(<AssistantView />);
    expect(screen.getByText(/ask the knowledge base/i)).toBeInTheDocument();
  });

  it("answers a prompt and renders source citations", async () => {
    searchMock.mockResolvedValue(RESP);
    const user = userEvent.setup();
    render(<AssistantView />);

    await user.type(
      screen.getByLabelText("Message the AI assistant"),
      "procurement approval",
    );
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(
        screen.getByText(/purchases above \$10,000 require finance review/i),
      ).toBeInTheDocument();
    });
    // The "(Source: …)" trailer is stripped; a citation chip is shown instead.
    expect(screen.getByText("Sources")).toBeInTheDocument();
    const chip = screen.getByRole("link");
    expect(chip).toHaveAttribute(
      "href",
      "/directory?doc=SOP-2024-014#section-2",
    );
  });

  it("handles a no-results answer gracefully", async () => {
    searchMock.mockResolvedValue({
      query: "zzz",
      answer: null,
      results: [],
    } satisfies SearchResponse);
    const user = userEvent.setup();
    render(<AssistantView />);

    await user.type(screen.getByLabelText("Message the AI assistant"), "zzz");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText(/couldn't find anything/i)).toBeInTheDocument();
    });
  });
});
