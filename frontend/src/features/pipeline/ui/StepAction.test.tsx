import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/render";
import { StepAction } from "./StepAction";
import * as pipelineService from "../services/pipeline.service";
import type { ProjectDetail } from "../../projects/types/project.types";

vi.mock("../services/pipeline.service");

const baseProject: ProjectDetail = {
  id: "p1",
  userId: "u1",
  title: "Wind",
  status: "IN_PROGRESS",
  currentStep: "PORTRAITS",
  stepState: "READY",
  stepStartedAt: null,
  lastError: null,
  style: "Watercolor",
  createdAt: "2026-08-18T00:00:00.000Z",
  bookText: "Book text",
  characters: [],
  chapters: [],
  isStale: false
};

describe("StepAction", () => {
  it("displays the exact running step", () => {
    renderWithProviders(<StepAction project={{ ...baseProject, stepState: "RUNNING" }} />);

    expect(screen.getByText("Generating character portraits...")).toBeInTheDocument();
  });

  it("shows failed error and retry action", () => {
    renderWithProviders(<StepAction project={{ ...baseProject, stepState: "FAILED", lastError: "Gemini failed" }} />);

    expect(screen.getByText("Gemini failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry Portraits ->" })).toBeInTheDocument();
  });

  it("shows stale recovery action", () => {
    renderWithProviders(<StepAction project={{ ...baseProject, stepState: "RUNNING", isStale: true }} />);

    expect(screen.getByText("This Portraits step looks interrupted.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Recover Portraits" })).toBeInTheDocument();
  });

  it("does not call pipeline services during render", () => {
    renderWithProviders(<StepAction project={baseProject} />);

    expect(vi.mocked(pipelineService.runStep)).not.toHaveBeenCalled();
    expect(vi.mocked(pipelineService.recoverStep)).not.toHaveBeenCalled();
  });
});
