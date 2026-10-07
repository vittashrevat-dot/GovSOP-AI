import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SearchResponse } from "@/lib/types";

// Mock the API module so the component does not hit the network.
const searchMock = vi.fn();
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, search: (...args: unknown[]) => searchMock(...args) };
});

import { SearchView } from "./SearchView";

const RESULTS: SearchResponse = {
  query: "procurement approval",
  answer: "Purchases above the threshold require review.\n\n(Source: SOP-2024-014 — Approval Thresholds)",
  results: [
    {
      doc_id: "SOP-2024-014",
      title: "Procurement Approval Procedure",
      section_title: "Approval Thresholds",
      order: 2,
      snippet: "Purchases above $10,000 require Finance review.",
      score: 0.109,
      citation: {
        doc_id: "SOP-2024-014",
        title: "Procurement Approval Procedure",
        section_title: "Approval Thresholds",
        order: 2,
      },
    },
  ],
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("SearchView", () => {
  it("shows the idle prompt before any query", () => {
    render(<SearchView />);
    expect(screen.getByText(/start typing to search/i)).toBeInTheDocument();
  });

  it("renders results with answer and a citation chip", async () => {
    searchMock.mockResolvedValue(RESULTS);
    const user = userEvent.setup();
    render(<SearchView />);

    await user.type(screen.getByRole("searchbox"), "procurement approval");

    await waitFor(() => {
      // Title appears in the result card and in the chip's hover tooltip.
      expect(
        screen.getAllByText("Procurement Approval Procedure").length,
      ).toBeGreaterThan(0);
    });
    // Answer section rendered.
    expect(screen.getByText(/require review/i)).toBeInTheDocument();
    // Citation chip links to the directory deep link.
    const chip = screen.getByRole("link");
    expect(chip).toHaveAttribute(
      "href",
      "/directory?doc=SOP-2024-014#section-2",
    );
  });

  it("renders an empty state when there are no results", async () => {
    searchMock.mockResolvedValue({
      query: "zzz",
      answer: null,
      results: [],
    } satisfies SearchResponse);
    const user = userEvent.setup();
    render(<SearchView />);

    await user.type(screen.getByRole("searchbox"), "zzz");

    await waitFor(() => {
      expect(screen.getByText(/no matches for/i)).toBeInTheDocument();
    });
  });

  it("renders an error state when the request fails", async () => {
    searchMock.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    render(<SearchView />);

    await user.type(screen.getByRole("searchbox"), "boom");

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("shows suggestion chips when idle and searches when one is clicked", async () => {
    searchMock.mockResolvedValue(RESULTS);
    const user = userEvent.setup();
    render(<SearchView />);

    const chip = screen.getByRole("button", {
      name: "Procurement approval threshold?",
    });
    await user.click(chip);

    // Input is populated with the chip text.
    expect(screen.getByRole("searchbox")).toHaveValue(
      "Procurement approval threshold?",
    );
    // And the search fires with that query.
    await waitFor(() => {
      expect(searchMock).toHaveBeenCalledWith("Procurement approval threshold?");
    });
  });
});
