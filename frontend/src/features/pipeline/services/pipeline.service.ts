import { http } from "../../../shared/api/httpClient";
import type { Project } from "../../projects/types/project.types";

const slug = {
  STYLE: "style",
  CHARACTERS: "characters",
  PORTRAITS: "portraits",
  CHAPTERS: "chapters",
  ILLUSTRATIONS: "illustrations"
} as const;

export function runStep(project: Project, customStyle?: string) {
  return http<{ project: Project }>(`/projects/${project.id}/steps/${slug[project.currentStep]}/run`, {
    method: "POST",
    body: JSON.stringify({ customStyle })
  });
}

export function recoverStep(project: Project) {
  return http<{ project: Project }>(`/projects/${project.id}/steps/${slug[project.currentStep]}/recover`, {
    method: "POST",
    body: JSON.stringify({})
  });
}
