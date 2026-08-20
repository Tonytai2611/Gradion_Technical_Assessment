import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { CharacterCard } from "./CharacterCard";

describe("CharacterCard", () => {
  it("renders completed character data", () => {
    render(
      <CharacterCard
        character={{
          id: "c1",
          projectId: "p1",
          name: "Mole",
          prompt: "A gentle adult mole in watercolor.",
          portraitPath: "/api/images/mole.png",
          portraitMimeType: "image/png",
          portraitSource: "gemini",
          generationState: "COMPLETED"
        }}
      />
    );

    expect(screen.getByText("Mole")).toBeInTheDocument();
    expect(screen.getByText("A gentle adult mole in watercolor.")).toBeInTheDocument();
    expect(screen.getByAltText("Mole portrait")).toBeInTheDocument();
    expect(screen.getByText("gemini")).toBeInTheDocument();
  });
});
