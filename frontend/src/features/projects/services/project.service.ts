import { http } from "../../../shared/api/httpClient";
import type { Project, ProjectDetail } from "../types/project.types";

export function listProjects() {
  return http<{ projects: Project[] }>("/projects");
}

export function createProject(input: { title: string; bookText: string }) {
  return http<{ project: Project }>("/projects", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getProject(projectId: string) {
  return http<{ project: ProjectDetail }>(`/projects/${projectId}`);
}
