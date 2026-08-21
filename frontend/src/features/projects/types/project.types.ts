import type { components } from "../../../shared/api/generated-openapi";

export type PipelineStep = components["schemas"]["Project"]["currentStep"];
export type StepState = components["schemas"]["Project"]["stepState"];
export type ProjectStatus = components["schemas"]["Project"]["status"];

export type Character = components["schemas"]["Character"];
export type Chapter = components["schemas"]["Chapter"];
export type Project = components["schemas"]["Project"];
export type ProjectDetail = components["schemas"]["ProjectDetail"];
