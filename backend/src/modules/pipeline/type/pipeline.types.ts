export const PIPELINE_STEPS = ["STYLE", "CHARACTERS", "PORTRAITS", "CHAPTERS", "ILLUSTRATIONS"] as const;
export type PipelineStep = (typeof PIPELINE_STEPS)[number];

export type StepState = "READY" | "RUNNING" | "FAILED" | "COMPLETED";
export type ProjectStatus = "DRAFT" | "IN_PROGRESS" | "DONE";
export type GenerationState = "PENDING" | "RUNNING" | "FAILED" | "COMPLETED";

export const stepSlugMap = {
  style: "STYLE",
  characters: "CHARACTERS",
  portraits: "PORTRAITS",
  chapters: "CHAPTERS",
  illustrations: "ILLUSTRATIONS"
} as const satisfies Record<string, PipelineStep>;

export function nextStep(step: PipelineStep): PipelineStep | null {
  const index = PIPELINE_STEPS.indexOf(step);
  return PIPELINE_STEPS[index + 1] ?? null;
}
