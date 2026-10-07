import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("renders the nav items", () => {
    render(<Sidebar />);
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByText("Directory")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
