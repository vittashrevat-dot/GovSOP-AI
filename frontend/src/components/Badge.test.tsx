import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, BadgeList } from "./Badge";

describe("Badge", () => {
  it("renders the label", () => {
    render(<Badge badge={{ label: "⚠️ Needs Review", severity: "warning" }} />);
    expect(screen.getByText("⚠️ Needs Review")).toBeInTheDocument();
  });

  it("exposes the severity for styling", () => {
    render(<Badge badge={{ label: "Current", severity: "none" }} />);
    expect(screen.getByText("Current")).toHaveAttribute(
      "data-severity",
      "none",
    );
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<BadgeList badges={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders each badge in a list", () => {
    render(
      <BadgeList
        badges={[
          { label: "Outdated Clause", severity: "warning" },
          { label: "Current", severity: "none" },
        ]}
      />,
    );
    expect(screen.getByText("Outdated Clause")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
  });
});
