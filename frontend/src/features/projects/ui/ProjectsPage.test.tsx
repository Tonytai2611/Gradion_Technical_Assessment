import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/render";
import { ProjectsPage } from "./ProjectsPage";
import * as projectService from "../services/project.service";
import * as authService from "../../auth/services/auth.service";
import type { Project } from "../types/project.types";

vi.mock("../services/project.service");
vi.mock("../../auth/services/auth.service");

const mockedProjects = vi.mocked(projectService);
const mockedAuth = vi.mocked(authService);

describe("ProjectsPage", () => {
  beforeEach(() => {
    mockedAuth.getSession.mockResolvedValue({
      user: { id: "u1", name: "Tai Truong", email: "tai@example.com", createdAt: "", updatedAt: "" }
    });
  });

  it("renders the empty state", async () => {
    mockedProjects.listProjects.mockResolvedValue({ projects: [] });

    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByText("No projects yet.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "+ New project" }).length).toBeGreaterThan(0);
  });

  it("renders project status and progress", async () => {
    const project: Project = {
      id: "p1",
      userId: "u1",
      title: "Wind in the Willows",
      bookPath: "books/p1.txt",
      status: "IN_PROGRESS",
      currentStep: "PORTRAITS",
      stepState: "READY",
      stepStartedAt: null,
      lastError: null,
      style: "Watercolor",
      createdAt: "2026-08-18T00:00:00.000Z",
      updatedAt: "2026-08-18T00:00:00.000Z"
    };
    mockedProjects.listProjects.mockResolvedValue({ projects: [project] });

    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByText("Wind in the Willows")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByLabelText("2 of 5 steps complete")).toBeInTheDocument();
  });
});
