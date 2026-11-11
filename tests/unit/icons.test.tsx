import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SearchIcon, ThumbsUpIcon, TrashIcon } from "@/components/icons";

afterEach(cleanup);

describe("components/icons (smoke)", () => {
  it("renderiza un SVG con la clase recibida", () => {
    const { container } = render(<TrashIcon className="w-6 h-6" />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("class")).toBe("w-6 h-6");
  });

  it("usa la clase por defecto y soporta la variante rellena", () => {
    const { container } = render(
      <>
        <SearchIcon />
        <ThumbsUpIcon filled />
      </>,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(2);
    expect(container.querySelector("svg")?.getAttribute("class")).toBe("w-4 h-4");
  });
});
