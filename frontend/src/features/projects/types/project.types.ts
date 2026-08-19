export type PipelineStep = "STYLE" | "CHARACTERS" | "PORTRAITS" | "CHAPTERS" | "ILLUSTRATIONS";
export type StepState = "READY" | "RUNNING" | "FAILED" | "COMPLETED";
export type ProjectStatus = "DRAFT" | "IN_PROGRESS" | "DONE";

export interface Character {
  id: string;
  projectId: string;
  name: string;
  prompt: string;
  portraitPath: string | null;
  portraitMimeType: string | null;
  portraitSource: "gemini" | "mock" | null;
  generationState: string;
}

export interface Chapter {
  id: string;
  projectId: string;
  name: string;
  prompt: string;
  illustrationPath: string | null;
  illustrationMimeType: string | null;
  illustrationSource: "gemini" | "mock" | null;
  generationState: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  status: ProjectStatus;
  currentStep: PipelineStep;
  stepState: StepState;
  stepStartedAt: string | null;
  lastError: string | null;
  style: string | null;
  createdAt: string;
}

export interface ProjectDetail extends Project {
  bookText: string;
  characters: Character[];
  chapters: Chapter[];
  isStale: boolean;
}
