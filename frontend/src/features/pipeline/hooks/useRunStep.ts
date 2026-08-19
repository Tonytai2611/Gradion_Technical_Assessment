import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recoverStep, runStep } from "../services/pipeline.service";
import type { Project } from "../../projects/types/project.types";

export function useRunStep(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ project, customStyle }: { project: Project; customStyle?: string }) => runStep(project, customStyle),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project", projectId] })
  });
}

export function useRecoverStep(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (project: Project) => recoverStep(project),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project", projectId] })
  });
}
