import type { GenerationState, PipelineStep, ProjectStatus, StepState } from "../../pipeline/type/pipeline.types.js";

export interface ProjectModel {
  id: string;
  userId: string;
  title: string;
  bookPath: string;
  status: ProjectStatus;
  currentStep: PipelineStep;
  stepState: StepState;
  stepStartedAt: string | null;
  lastError: string | null;
  style: string | null;
  geminiContextReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterModel {
  id: string;
  projectId: string;
  name: string;
  prompt: string;
  portraitPath: string | null;
  portraitMimeType: string | null;
  portraitSource: "gemini" | "mock" | null;
  generationState: GenerationState;
  createdAt: string;
  updatedAt: string;
}

export interface ChapterModel {
  id: string;
  projectId: string;
  name: string;
  prompt: string;
  illustrationPath: string | null;
  illustrationMimeType: string | null;
  illustrationSource: "gemini" | "mock" | null;
  generationState: GenerationState;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectModel {
  bookText: string;
  characters: CharacterModel[];
  chapters: ChapterModel[];
  isStale: boolean;
}
